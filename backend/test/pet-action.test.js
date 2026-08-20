// 펫 행동 처리(목욕/밥/특식주기/쓰다듬기, 성장 전이) 테스트 (10-plan.md BE-6)
// 근거: docs/1-domain-definition.md 5.1절(단계별 행동표), 5장(성장 전이/특식 규칙), 6장(자발적 급여 규칙)
//
// 확률 분기가 있는 로직(성장 전이 50%, 자발적 급여 50/50)은 라우트가 random을 주입받을 방법이
// 없으므로 pet.service.js의 applyAction/feedSpecialFood를 직접 require해서 결정론적으로 검증한다.
// 확률과 무관한 상태 변화(비-확률 케이스)와 인증 체크만 HTTP 라우트로 검증한다.
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
  await pool.query('UPDATE pets SET requested_promotion_id = NULL WHERE requested_promotion_id = $1', [promotionId]);
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
      title: '특식 테스트 프로모션',
      start_date: '2026-08-01',
      end_date: '2026-12-31',
      content: '내용',
      special_food_id: 'test-food',
      ...overrides,
    });
  return res.body.id;
}

test('알 단계에서 bathe 행동 시 egg_state가 반질반질로 바뀌고 activity_count가 1 증가한다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  const before = await petService.getPet(userId);
  const after1 = await petService.applyAction(userId, 'bathe');

  assert.equal(after1.egg_state, '반질반질');
  assert.equal(after1.activity_count, before.activity_count + 1);
});

test('알 단계에서 feed/pat 행동 시 activity_count만 증가한다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  const before = await petService.getPet(userId);
  const afterFeed = await petService.applyAction(userId, 'feed');
  assert.equal(afterFeed.activity_count, before.activity_count + 1);

  const afterPat = await petService.applyAction(userId, 'pat');
  assert.equal(afterPat.activity_count, before.activity_count + 2);
});

test('새끼/성체 단계에서 mood가 더러움/배고픔/삐짐일 때 각 행동으로 평범이 된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  await pool.query("UPDATE pets SET stage = '새끼', mood = '더러움' WHERE user_id = $1", [userId]);
  const afterBathe = await petService.applyAction(userId, 'bathe');
  assert.equal(afterBathe.mood, '평범');

  await pool.query("UPDATE pets SET mood = '배고픔' WHERE user_id = $1", [userId]);
  const afterFeed = await petService.applyAction(userId, 'feed');
  assert.equal(afterFeed.mood, '평범');

  await pool.query("UPDATE pets SET mood = '삐짐' WHERE user_id = $1", [userId]);
  const afterPat = await petService.applyAction(userId, 'pat');
  assert.equal(afterPat.mood, '평범');
});

test('성장 전이 조건 충족 + random 낮은 값(50% 미만)이면 알에서 새끼로 진화한다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;
  await pool.query("UPDATE pets SET stage = '알', activity_count = 1 WHERE user_id = $1", [userId]);

  const result = await petService.applyAction(userId, 'bathe', { random: () => 0.1 });

  assert.equal(result.stage, '새끼');
  assert.equal(result.egg_state, null);
  assert.equal(result.mood, '평범');
});

test('성장 전이 조건 충족 + random 높은 값(50% 이상)이면 activity_count만 증가하고 알로 유지된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;
  await pool.query("UPDATE pets SET stage = '알', activity_count = 1 WHERE user_id = $1", [userId]);

  const result = await petService.applyAction(userId, 'bathe', { random: () => 0.9 });

  assert.equal(result.activity_count, 2);
  assert.equal(result.stage, '알');
});

test('보유하지 않은 특식을 급여하려 하면 400 에러가 throw된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  let promotionId;
  t.after(async () => {
    await cleanupPromotion(promotionId);
    await cleanupUser(userId);
  });

  const adminToken = await loginAsAdmin(app, t);
  promotionId = await createPromotion(app, adminToken);

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  await assert.rejects(
    () => petService.feedSpecialFood(userId, promotionId),
    (err) => {
      assert.equal(err.status, 400);
      return true;
    }
  );
});

test('특식 요청 상태에서 대상 특식을 급여하면 무지개로 바뀌고 requested_promotion_id가 초기화된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  let promotionId;
  t.after(async () => {
    await cleanupPromotion(promotionId);
    await cleanupUser(userId);
  });

  const adminToken = await loginAsAdmin(app, t);
  promotionId = await createPromotion(app, adminToken);

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  await request(app)
    .post(`/promotions/${promotionId}/apply`)
    .set('Authorization', `Bearer ${login.body.accessToken}`);

  await pool.query(
    "UPDATE pets SET stage = '알', egg_state = '특식 요청', requested_promotion_id = $1 WHERE user_id = $2",
    [promotionId, userId]
  );

  const result = await petService.feedSpecialFood(userId, promotionId);

  assert.equal(result.egg_state, '무지개');
  assert.equal(result.requested_promotion_id, null);
});

test('특식 요청 상태가 아닐 때 자발적 급여 + random 높은 값이면 반짝이로 바뀐다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  let promotionId;
  t.after(async () => {
    await cleanupPromotion(promotionId);
    await cleanupUser(userId);
  });

  const adminToken = await loginAsAdmin(app, t);
  promotionId = await createPromotion(app, adminToken);

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  await request(app)
    .post(`/promotions/${promotionId}/apply`)
    .set('Authorization', `Bearer ${login.body.accessToken}`);

  await pool.query("UPDATE pets SET stage = '알', egg_state = '평범' WHERE user_id = $1", [userId]);

  const result = await petService.feedSpecialFood(userId, promotionId, { random: () => 0.9 });

  assert.equal(result.egg_state, '반짝이');
});

test('인증 없이 펫 행동 라우트를 호출하면 401이 반환된다', async () => {
  const app = buildApp();

  const bathe = await request(app).post('/pet/bathe');
  assert.equal(bathe.status, 401);

  const feed = await request(app).post('/pet/feed');
  assert.equal(feed.status, 401);

  const pat = await request(app).post('/pet/pat');
  assert.equal(pat.status, 401);

  const feedSpecial = await request(app).post('/pet/feed-special-food').send({ promotionId: 1 });
  assert.equal(feedSpecial.status, 401);
});

test('HTTP: POST /pet/bathe 성공 시 200과 갱신된 pet이 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  const res = await request(app)
    .post('/pet/bathe')
    .set('Authorization', `Bearer ${login.body.accessToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.egg_state, '반질반질');
});

test('HTTP: POST /pet/feed-special-food에 숫자 promotionId를 보내도(타입 불일치 없이) 요청받은 특식이면 무지개로 바뀐다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  let promotionId;
  t.after(async () => {
    await cleanupPromotion(promotionId);
    await cleanupUser(userId);
  });

  const adminToken = await loginAsAdmin(app, t);
  promotionId = await createPromotion(app, adminToken);

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;
  const accessToken = login.body.accessToken;

  await request(app)
    .post(`/promotions/${promotionId}/apply`)
    .set('Authorization', `Bearer ${accessToken}`);

  await pool.query(
    "UPDATE pets SET stage = '알', egg_state = '특식 요청', requested_promotion_id = $1 WHERE user_id = $2",
    [promotionId, userId]
  );

  // requested_promotion_id는 DB(BIGINT)에서 문자열로 오지만, 실제 클라이언트는 JSON 숫자로 보낸다.
  // 타입이 달라도(문자열 vs 숫자) 정상적으로 일치 판정되는지 HTTP 왕복으로 확인.
  const res = await request(app)
    .post('/pet/feed-special-food')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ promotionId: Number(promotionId) });

  assert.equal(res.status, 200);
  assert.equal(res.body.egg_state, '무지개');
  assert.equal(res.body.requested_promotion_id, null);
});

test('HTTP: 보유하지 않은 특식으로 POST /pet/feed-special-food 호출 시 400이 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  let promotionId;
  t.after(async () => {
    await cleanupPromotion(promotionId);
    await cleanupUser(userId);
  });

  const adminToken = await loginAsAdmin(app, t);
  promotionId = await createPromotion(app, adminToken);

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  const res = await request(app)
    .post('/pet/feed-special-food')
    .set('Authorization', `Bearer ${login.body.accessToken}`)
    .send({ promotionId: Number(promotionId) });

  assert.equal(res.status, 400);
});

after(async () => {
  await pool.end();
});
