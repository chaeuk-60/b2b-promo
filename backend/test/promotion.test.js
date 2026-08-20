const test = require('node:test');
const { after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const createApp = require('../src/app');
const pool = require('../src/db/pool');

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

function buildApp() {
  return createApp((app) => {
    app.use('/auth', require('../src/routes/auth.routes'));
    app.use('/promotions', require('../src/routes/promotion.routes'));
    app.use('/applications', require('../src/routes/application.routes'));
  });
}

// 테스트에서 생성한 user_id를 정리(순서 중요: pets는 CASCADE 없음)
async function cleanupUser(userId) {
  if (!userId) return;
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM pets WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

// 테스트에서 생성한 promotion_id를 정리(시드 데이터 3건은 절대 건드리지 않음)
// pets.requested_promotion_id는 ON DELETE SET NULL이라 다른 테스트가 이 프로모션을
// "특식 요청" 대상으로 랜덤 배정해뒀어도 삭제 시 자동으로 NULL 처리된다(수동 정리 불필요).
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

// ADMIN_EMAIL 계정으로 시드 비밀번호 로그인 시도, 실패하면 회원가입 후 로그인 (admin.middleware.test.js와 동일 패턴)
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

test('GET /promotions 목록 조회가 200과 배열을 반환한다(로그인 필요)', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;

  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  const res = await request(app)
    .get('/promotions')
    .set('Authorization', `Bearer ${login.body.accessToken}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test('관리자가 프로모션을 등록하면 201로 생성되고 GET /promotions/:id로 상세 조회된다', async (t) => {
  const app = buildApp();
  let promotionId;

  t.after(() => cleanupPromotion(promotionId));

  const adminToken = await loginAsAdmin(app, t);

  const createRes = await request(app)
    .post('/promotions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: '테스트 프로모션',
      start_date: '2026-08-01',
      end_date: '2026-12-31',
      content: '테스트용 프로모션 내용',
      special_food_id: 'test-food',
    });

  assert.equal(createRes.status, 201);
  assert.equal(createRes.body.title, '테스트 프로모션');
  promotionId = createRes.body.id;

  const detailRes = await request(app)
    .get(`/promotions/${promotionId}`)
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(detailRes.status, 200);
  assert.equal(detailRes.body.id, promotionId);
  assert.equal(detailRes.body.title, '테스트 프로모션');
});

test('관리자가 아닌 일반 사용자가 POST /promotions를 호출하면 403이 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;

  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  const res = await request(app)
    .post('/promotions')
    .set('Authorization', `Bearer ${login.body.accessToken}`)
    .send({
      title: '일반 사용자가 만든 프로모션',
      start_date: '2026-08-01',
      end_date: '2026-12-31',
      content: '내용',
      special_food_id: 'test-food',
    });

  assert.equal(res.status, 403);
});

test('관리자가 PUT /promotions/:id로 수정하면 200과 수정된 내용이 반환된다', async (t) => {
  const app = buildApp();
  let promotionId;

  t.after(() => cleanupPromotion(promotionId));

  const adminToken = await loginAsAdmin(app, t);

  const createRes = await request(app)
    .post('/promotions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: '수정 전 프로모션',
      start_date: '2026-08-01',
      end_date: '2026-12-31',
      content: '수정 전 내용',
      special_food_id: 'test-food',
    });
  promotionId = createRes.body.id;

  const updateRes = await request(app)
    .put(`/promotions/${promotionId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: '수정 후 프로모션',
      start_date: '2026-08-01',
      end_date: '2026-12-31',
      content: '수정 후 내용',
      special_food_id: 'test-food',
    });

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.title, '수정 후 프로모션');
  assert.equal(updateRes.body.content, '수정 후 내용');
});

test('기간이 지난 프로모션에 신청하면 400이 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  let promotionId;

  t.after(async () => {
    await cleanupPromotion(promotionId);
    await cleanupUser(userId);
  });

  const adminToken = await loginAsAdmin(app, t);

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const createRes = await request(app)
    .post('/promotions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: '기간 종료 프로모션',
      start_date: '2026-01-01',
      end_date: yesterday,
      content: '기간이 지난 프로모션',
      special_food_id: 'test-food',
    });
  promotionId = createRes.body.id;

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  const applyRes = await request(app)
    .post(`/promotions/${promotionId}/apply`)
    .set('Authorization', `Bearer ${login.body.accessToken}`);

  assert.equal(applyRes.status, 400);
});

test('기간 내 프로모션에 신청하면 201이 반환되고, 같은 프로모션에 다시 신청하면 400(중복)이 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  let promotionId;

  t.after(async () => {
    await cleanupPromotion(promotionId);
    await cleanupUser(userId);
  });

  const adminToken = await loginAsAdmin(app, t);

  const createRes = await request(app)
    .post('/promotions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: '신청 가능 프로모션',
      start_date: '2026-08-01',
      end_date: '2026-12-31',
      content: '기간 내 프로모션',
      special_food_id: 'test-food',
    });
  promotionId = createRes.body.id;

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  const firstApply = await request(app)
    .post(`/promotions/${promotionId}/apply`)
    .set('Authorization', `Bearer ${login.body.accessToken}`);
  assert.equal(firstApply.status, 201);

  const secondApply = await request(app)
    .post(`/promotions/${promotionId}/apply`)
    .set('Authorization', `Bearer ${login.body.accessToken}`);
  assert.equal(secondApply.status, 400);
});

test('찜 토글: 처음 호출 시 favorited:true, 다시 호출하면 favorited:false가 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  let promotionId;

  t.after(async () => {
    await cleanupPromotion(promotionId);
    await cleanupUser(userId);
  });

  const adminToken = await loginAsAdmin(app, t);

  const createRes = await request(app)
    .post('/promotions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: '찜 테스트 프로모션',
      start_date: '2026-08-01',
      end_date: '2026-12-31',
      content: '찜 테스트',
      special_food_id: 'test-food',
    });
  promotionId = createRes.body.id;

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  const firstToggle = await request(app)
    .post(`/promotions/${promotionId}/favorite`)
    .set('Authorization', `Bearer ${login.body.accessToken}`);
  assert.equal(firstToggle.status, 200);
  assert.equal(firstToggle.body.favorited, true);

  const secondToggle = await request(app)
    .post(`/promotions/${promotionId}/favorite`)
    .set('Authorization', `Bearer ${login.body.accessToken}`);
  assert.equal(secondToggle.status, 200);
  assert.equal(secondToggle.body.favorited, false);
});

test('신청 완료한 프로모션이 GET /applications(나의 신청 목록)에 포함된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  let promotionId;

  t.after(async () => {
    await cleanupPromotion(promotionId);
    await cleanupUser(userId);
  });

  const adminToken = await loginAsAdmin(app, t);

  const createRes = await request(app)
    .post('/promotions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: '나의 신청 목록 테스트 프로모션',
      start_date: '2026-08-01',
      end_date: '2026-12-31',
      content: '나의 신청 목록 테스트',
      special_food_id: 'test-food',
    });
  promotionId = createRes.body.id;

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;

  await request(app)
    .post(`/promotions/${promotionId}/apply`)
    .set('Authorization', `Bearer ${login.body.accessToken}`);

  const myApplications = await request(app)
    .get('/applications')
    .set('Authorization', `Bearer ${login.body.accessToken}`);

  assert.equal(myApplications.status, 200);
  assert.ok(Array.isArray(myApplications.body));
  assert.ok(myApplications.body.some((a) => a.promotion_id === promotionId));
});

test('존재하지 않는 promotionId로 상세 조회/신청/찜 호출 시 404가 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;
  const nonExistentId = 999999999;

  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, 'password123');
  userId = login.body.user.id;
  const accessToken = login.body.accessToken;

  const detailRes = await request(app)
    .get(`/promotions/${nonExistentId}`)
    .set('Authorization', `Bearer ${accessToken}`);
  assert.equal(detailRes.status, 404);

  const applyRes = await request(app)
    .post(`/promotions/${nonExistentId}/apply`)
    .set('Authorization', `Bearer ${accessToken}`);
  assert.equal(applyRes.status, 404);

  const favoriteRes = await request(app)
    .post(`/promotions/${nonExistentId}/favorite`)
    .set('Authorization', `Bearer ${accessToken}`);
  assert.equal(favoriteRes.status, 404);
});

test('인증 없이 GET /promotions 호출 시 401이 반환된다', async () => {
  const app = buildApp();

  const res = await request(app).get('/promotions');

  assert.equal(res.status, 401);
});

after(async () => {
  await pool.end();
});
