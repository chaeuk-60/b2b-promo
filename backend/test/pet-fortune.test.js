// 오늘의 운세 엔드포인트 + 특식 요청 대상 선정 70% 가중치 테스트 (10-plan.md BE-8)
// 근거: docs/1-domain-definition.md 5장(운세), 5.1절(특식 요청 대상 선정 70% 가중치)
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
    app.use('/promotions', require('../src/routes/promotion.routes'));
  });
}

// 테스트에서 생성한 user_id를 정리(순서 중요: pets는 CASCADE 없음)
async function cleanupUser(userId) {
  if (!userId) return;
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM pets WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

// 테스트에서 생성한 promotion_id를 정리(시드 데이터는 건드리지 않음)
async function cleanupPromotion(promotionId) {
  if (!promotionId) return;
  await pool.query('DELETE FROM applications WHERE promotion_id = $1', [promotionId]);
  await pool.query('DELETE FROM favorites WHERE promotion_id = $1', [promotionId]);
  await pool.query('DELETE FROM promotions WHERE id = $1', [promotionId]);
}

async function signupAndLogin(app, email, password) {
  await request(app).post('/auth/signup').send({ email, password });
  return request(app).post('/auth/login').send({ email, password });
}

async function loginAsAdmin(app, t) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const seedPassword = 'admin1234!';
  const fallbackPassword = 'password123';
  let createdUserId;

  assert.ok(adminEmail, 'ADMIN_EMAIL 환경변수가 설정되어 있어야 한다');

  let login = await request(app).post('/auth/login').send({ email: adminEmail, password: seedPassword });

  if (login.status !== 200) {
    const signup = await request(app)
      .post('/auth/signup')
      .send({ email: adminEmail, password: fallbackPassword });
    assert.equal(signup.status, 201, '관리자 이메일 회원가입에 실패했다');
    createdUserId = signup.body.user.id;
    login = await request(app).post('/auth/login').send({ email: adminEmail, password: fallbackPassword });
  }

  assert.equal(login.status, 200);

  if (createdUserId) {
    t.after(() => cleanupUser(createdUserId));
  }

  return login.body.accessToken;
}

async function createPromotion(app, adminToken, overrides = {}) {
  const res = await request(app)
    .post('/promotions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: '운세 테스트 프로모션',
      start_date: '2026-08-01',
      end_date: '2026-12-31',
      content: '내용',
      special_food_id: 'test-food',
      ...overrides,
    });
  return res.body.id;
}

test('알 단계에서 getTodayFortune 호출 시 400 에러가 throw된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  await assert.rejects(
    () => petService.getTodayFortune(userId),
    (err) => {
      assert.equal(err.status, 400);
      return true;
    }
  );
});

test('알 단계에서 POST /pet/fortune 호출 시 400이 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  const res = await request(app)
    .post('/pet/fortune')
    .set('Authorization', `Bearer ${login.body.accessToken}`);

  assert.equal(res.status, 400);
});

test('새끼 단계에서 POST /pet/fortune 호출 시 200과 문자열 message가 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;
  await pool.query("UPDATE pets SET stage = '새끼' WHERE user_id = $1", [userId]);

  const res = await request(app)
    .post('/pet/fortune')
    .set('Authorization', `Bearer ${login.body.accessToken}`);

  assert.equal(res.status, 200);
  assert.equal(typeof res.body.message, 'string');
  assert.ok(res.body.message.length > 0);
});

test('같은 날 재호출 시 이전과 동일한 message가 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;
  await pool.query("UPDATE pets SET stage = '새끼' WHERE user_id = $1", [userId]);

  const first = await request(app)
    .post('/pet/fortune')
    .set('Authorization', `Bearer ${login.body.accessToken}`);
  const second = await request(app)
    .post('/pet/fortune')
    .set('Authorization', `Bearer ${login.body.accessToken}`);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.body.message, first.body.message);
});

test('fortune_date가 어제로 세팅된 뒤 재요청하면 fortune_date가 오늘 날짜로 갱신된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;
  await pool.query("UPDATE pets SET stage = '새끼' WHERE user_id = $1", [userId]);

  const first = await request(app)
    .post('/pet/fortune')
    .set('Authorization', `Bearer ${login.body.accessToken}`);
  assert.equal(first.status, 200);

  // KST 하루 경계 판정을 위해 어제 날짜로 직접 되돌린다.
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await pool.query('UPDATE pets SET fortune_date = $1 WHERE user_id = $2', [yesterday, userId]);

  const second = await request(app)
    .post('/pet/fortune')
    .set('Authorization', `Bearer ${login.body.accessToken}`);
  assert.equal(second.status, 200);

  const after1 = await pool.query('SELECT fortune_date FROM pets WHERE user_id = $1', [userId]);
  assert.notEqual(after1.rows[0].fortune_date, yesterday);
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  assert.equal(after1.rows[0].fortune_date, today);
});

test('인증 없이 POST /pet/fortune 호출 시 401이 반환된다', async () => {
  const app = buildApp();

  const res = await request(app).post('/pet/fortune');

  assert.equal(res.status, 401);
});

// 특식 요청 대상 선정 70% 가중치(pet.service.js의 pickRequestedPromotionId)는 별도로 export되어 있지 않으므로
// resolveMoodOnLogin을 통해 간접 검증한다. Math.random을 순서대로 모킹해 분기를 결정론적으로 고정한다:
// 1) 평범(70%) 분기를 피해 재추첨으로 진입 2) 재추첨 결과가 "특식 요청"으로 뽑히도록 3) 70% 가중치 분기로
// 찜만 한 프로모션(A) 쪽에서 선택되도록 고정.
test('찜만 하고 미신청인 프로모션이 있을 때, 70% 가중치 분기(random<0.7)면 requested_promotion_id가 그 프로모션이 된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  let promotionAId; // 찜만 함(가중치 대상)
  let promotionBId; // 찜 안 함
  t.after(async () => {
    await cleanupPromotion(promotionAId);
    await cleanupPromotion(promotionBId);
    await cleanupUser(userId);
  });

  const adminToken = await loginAsAdmin(app, t);
  promotionAId = await createPromotion(app, adminToken, { title: '찜만 한 프로모션' });
  promotionBId = await createPromotion(app, adminToken, { title: '찜 안 한 프로모션' });

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;
  const accessToken = login.body.accessToken;

  await request(app)
    .post(`/promotions/${promotionAId}/favorite`)
    .set('Authorization', `Bearer ${accessToken}`);

  // daily_login_count=1, last_active_at=오늘로 세팅해 resolveMoodOnLogin 호출 시 loginCount=2(재추첨 분기) 진입.
  await pool.query(
    "UPDATE pets SET stage = '새끼', mood = '평범', daily_login_count = 1, last_active_at = now() WHERE user_id = $1",
    [userId]
  );

  const originalRandom = Math.random;
  // 순서: (1) 0.99 → 70% 평범 분기(<0.7) 벗어나 재추첨 진입
  //       (2) 0.99 → MOOD_BASE_STATES 6개 중 마지막("특식 요청") 선택
  //       (3) 0.01 → pickRequestedPromotionId 70% 가중치 분기(<0.7) 진입 → favoriteOnlyIds에서 선택
  //       (4) 0.1  → favoriteOnlyIds(길이 1) 중 선택(항상 A)
  const values = [0.99, 0.99, 0.01, 0.1];
  let i = 0;
  Math.random = () => (i < values.length ? values[i++] : 0.5);

  let result;
  try {
    result = await petService.resolveMoodOnLogin(userId);
  } finally {
    Math.random = originalRandom;
  }

  assert.equal(result.mood, '특식 요청');
  assert.equal(String(result.requested_promotion_id), String(promotionAId));
});

after(async () => {
  await pool.end();
});
