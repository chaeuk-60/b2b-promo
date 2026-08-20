// 사망/성체 순환/선물 지급 로직 테스트 (10-plan.md BE-7)
// 근거: docs/1-domain-definition.md 펫 상태 전이 규칙, docs/9-schema.sql (last_active_at/last_gift_at/stage_changed_at)
//
// 날짜 조건(7일/14일/3일 경과)은 실제 시간을 기다리지 않고 SQL로 타임스탬프를 과거로 직접 UPDATE해서 재현한다.
// 선물 지급 확률(5%)은 pet.service.js를 직접 require해서 random 함수를 주입해 결정론적으로 검증한다.
const test = require('node:test');
const { after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const createApp = require('../src/app');
const pool = require('../src/db/pool');
const petService = require('../src/services/pet.service');

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

function buildApp() {
  return createApp((app) => {
    app.use('/auth', require('../src/routes/auth.routes'));
    app.use('/pet', require('../src/routes/pet.routes'));
  });
}

// 테스트에서 생성한 user_id를 정리(순서 중요: pets는 CASCADE 없음)
async function cleanupUser(userId) {
  if (!userId) return;
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM pets WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

async function signupAndLogin(app, email, password) {
  await request(app).post('/auth/signup').send({ email, password });
  return request(app).post('/auth/login').send({ email, password });
}

test('last_active_at이 8일 전이면 checkDeathOrCycle 호출 시 stage가 묘비로 바뀐다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  await pool.query("UPDATE pets SET last_active_at = now() - interval '8 days' WHERE user_id = $1", [userId]);

  const result = await petService.checkDeathOrCycle(userId);

  assert.equal(result.stage, '묘비');
});

test('이미 묘비 상태에서 checkDeathOrCycle을 다시 호출하면 새 알로 교체된다(activity_count=0, name=null)', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  await pool.query(
    "UPDATE pets SET stage = '묘비', name = '몽실이', activity_count = 5 WHERE user_id = $1",
    [userId]
  );

  const result = await petService.checkDeathOrCycle(userId);

  assert.equal(result.stage, '알');
  assert.equal(result.activity_count, 0);
  assert.equal(result.name, null);
});

test('사망 조건과 성체 순환 조건이 동시에 충족되면 사망이 우선 적용된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  await pool.query(
    `UPDATE pets SET stage = '성체',
       last_active_at = now() - interval '8 days',
       stage_changed_at = now() - interval '20 days'
     WHERE user_id = $1`,
    [userId]
  );

  const result = await petService.checkDeathOrCycle(userId);

  assert.equal(result.stage, '묘비');
});

test('성체가 stage_changed_at 기준 14일 이상 경과하면(사망 조건 없이) 새 알로 순환하고 선물이 100% 지급된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  await pool.query(
    `UPDATE pets SET stage = '성체',
       last_active_at = now(),
       stage_changed_at = now() - interval '20 days',
       last_gift_at = NULL
     WHERE user_id = $1`,
    [userId]
  );

  const result = await petService.checkDeathOrCycle(userId);

  assert.equal(result.stage, '알');
  assert.ok(result.last_gift_at, 'last_gift_at이 갱신되어야 한다');
  // 전체 테스트 스위트가 동시에 여러 DB 커넥션을 쓰는 상황에서 밀리초 단위로 빡빡하게 비교하면
  // 타이밍에 따라 흔들릴 수 있어(실제로는 방금 갱신됐음), 넉넉한 허용 오차(5초)로 확인한다.
  const grantedAt = new Date(result.last_gift_at);
  const diffMs = Math.abs(Date.now() - grantedAt.getTime());
  assert.ok(diffMs < 5000, `last_gift_at이 방금(5초 이내) 갱신된 시각이어야 한다(diff=${diffMs}ms)`);
});

test('성체 상태에서 last_gift_at이 null이고 random이 5% 구간 안이면 선물이 지급된다(last_gift_at 갱신)', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  await pool.query("UPDATE pets SET stage = '성체', last_gift_at = NULL WHERE user_id = $1", [userId]);

  const result = await petService.maybeGrantGift(userId, { random: () => 0.01 });

  assert.ok(result.last_gift_at, 'last_gift_at이 갱신되어야 한다');
  // 동시 실행 중인 다른 테스트로 인한 밀리초 단위 타이밍 흔들림을 피하려 넉넉한 오차(5초)로 확인.
  const grantedAt = new Date(result.last_gift_at);
  assert.ok(Math.abs(Date.now() - grantedAt.getTime()) < 5000);
});

test('성체 상태에서 random이 5% 구간 밖이면 선물이 지급되지 않는다(last_gift_at은 null 그대로)', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  await pool.query("UPDATE pets SET stage = '성체', last_gift_at = NULL WHERE user_id = $1", [userId]);

  const result = await petService.maybeGrantGift(userId, { random: () => 0.9 });

  assert.equal(result.last_gift_at, null);
});

test('마지막 선물 지급 후 3일 이내(쿨다운 중)면 random 값과 무관하게 선물이 지급되지 않는다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  await pool.query(
    "UPDATE pets SET stage = '성체', last_gift_at = now() - interval '1 day' WHERE user_id = $1",
    [userId]
  );
  const before = await petService.getPet(userId);

  const result = await petService.maybeGrantGift(userId, { random: () => 0.01 });

  assert.equal(
    new Date(result.last_gift_at).getTime(),
    new Date(before.last_gift_at).getTime(),
    '쿨다운 중이므로 last_gift_at이 갱신되면 안 된다'
  );
});

test('로그인 연동: last_active_at을 8일 전으로 세팅하고 /auth/login 호출 시 응답의 pet.stage가 묘비다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  const password = 'password123';
  let userId;
  t.after(() => cleanupUser(userId));

  const signup = await signupAndLogin(app, email, password);
  userId = signup.body.user.id;

  await pool.query("UPDATE pets SET last_active_at = now() - interval '8 days' WHERE user_id = $1", [userId]);

  const login = await request(app).post('/auth/login').send({ email, password });

  assert.equal(login.status, 200);
  assert.equal(login.body.pet.stage, '묘비');
});

after(async () => {
  await pool.end();
});
