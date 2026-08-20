const test = require('node:test');
const { after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const createApp = require('../src/app');
const pool = require('../src/db/pool');

// 도메인 정의서 3장(펫 엔티티) eggState enum 전체 (9-schema.sql CHECK 제약과 동일)
const VALID_EGG_STATES = ['평범', '더러움', '반질반질', '무지개', '반짝이', '특식 요청'];

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

test('회원가입 후 첫 로그인 시 daily_login_count가 1이고 egg_state가 유효한 값으로 재계산된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  const password = 'password123';
  let userId;

  t.after(() => cleanupUser(userId));

  const signup = await request(app).post('/auth/signup').send({ email, password });
  userId = signup.body.user.id;

  const login = await request(app).post('/auth/login').send({ email, password });

  assert.equal(login.status, 200);
  assert.equal(login.body.pet.stage, '알');
  assert.equal(login.body.pet.daily_login_count, 1);
  assert.ok(
    VALID_EGG_STATES.includes(login.body.pet.egg_state),
    `egg_state(${login.body.pet.egg_state})는 도메인 정의서 3장 enum 중 하나여야 한다`
  );
});

test('같은 날 두 번째 로그인 시 daily_login_count가 2로 증가하고, Math.random을 낮은 값으로 고정하면 egg_state가 평범으로 재계산된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  const password = 'password123';
  let userId;

  t.after(() => cleanupUser(userId));

  await request(app).post('/auth/signup').send({ email, password });
  const first = await request(app).post('/auth/login').send({ email, password });
  userId = first.body.user.id;
  assert.equal(first.body.pet.daily_login_count, 1);

  const originalRandom = Math.random;
  // 도메인 정의서 5.1절: 2회차 이상 로그인은 70% 확률로 "평범" 재계산.
  // 낮은 값(0.01)을 반환시켜 70% 구간 안에 확실히 들어가게 한다.
  Math.random = () => 0.01;
  let second;
  try {
    second = await request(app).post('/auth/login').send({ email, password });
  } finally {
    Math.random = originalRandom;
  }

  assert.equal(second.status, 200);
  assert.equal(second.body.pet.daily_login_count, 2);
  assert.equal(second.body.pet.egg_state, '평범');
});

test('GET /pet은 로그인한 본인의 펫 정보만 반환한다(다른 사용자 정보와 섞이지 않는다)', async (t) => {
  const app = buildApp();
  const emailA = uniqueEmail();
  const emailB = uniqueEmail();
  const password = 'password123';
  let userIdA;
  let userIdB;

  t.after(async () => {
    await cleanupUser(userIdA);
    await cleanupUser(userIdB);
  });

  const loginA = await signupAndLogin(app, emailA, password);
  const loginB = await signupAndLogin(app, emailB, password);
  userIdA = loginA.body.user.id;
  userIdB = loginB.body.user.id;

  const petAId = loginA.body.pet.id;

  const res = await request(app).get('/pet').set('Authorization', `Bearer ${loginA.body.accessToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.pet.id, petAId);
  assert.equal(res.body.pet.user_id, userIdA);
  assert.notEqual(res.body.pet.user_id, userIdB);
});

test('PATCH /pet/name으로 이름을 설정하면 반영되고, 이후 GET /pet 조회 시에도 유지된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  const password = 'password123';
  let userId;

  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, password);
  userId = login.body.user.id;
  const accessToken = login.body.accessToken;

  const patchRes = await request(app)
    .patch('/pet/name')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: '몽실이' });

  assert.equal(patchRes.status, 200);
  assert.equal(patchRes.body.pet.name, '몽실이');

  const getRes = await request(app).get('/pet').set('Authorization', `Bearer ${accessToken}`);

  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.pet.name, '몽실이');
});

test('인증 없이 GET /pet을 호출하면 401이 반환된다', async () => {
  const app = buildApp();

  const res = await request(app).get('/pet');

  assert.equal(res.status, 401);
});

test('로그인 응답 자체에 pet 필드가 포함된다(BE-2 계약 확장 확인)', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  const password = 'password123';
  let userId;

  t.after(() => cleanupUser(userId));

  await request(app).post('/auth/signup').send({ email, password });
  const login = await request(app).post('/auth/login').send({ email, password });
  userId = login.body.user.id;

  assert.equal(login.status, 200);
  assert.ok(login.body.pet, '로그인 응답에 pet이 포함되어야 한다');
  assert.equal(login.body.pet.user_id, userId);
});

test('새끼 단계에서는 mood가 재계산되고(eggState 아님), 2회차 로그인은 70% 분기로 평범이 된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  const password = 'password123';
  let userId;

  t.after(() => cleanupUser(userId));

  const login1 = await signupAndLogin(app, email, password);
  userId = login1.body.user.id;

  // 성장 전이(BE-6)가 아직 없으므로, mood 분기를 테스트하기 위해 stage만 직접 새끼로 바꿔둔다.
  await pool.query("UPDATE pets SET stage = '새끼' WHERE user_id = $1", [userId]);

  const originalRandom = Math.random;
  Math.random = () => 0.01; // 70% 평범 구간
  let login2;
  try {
    login2 = await request(app).post('/auth/login').send({ email, password });
  } finally {
    Math.random = originalRandom;
  }

  assert.equal(login2.status, 200);
  assert.equal(login2.body.pet.stage, '새끼');
  assert.equal(login2.body.pet.daily_login_count, 2);
  assert.equal(login2.body.pet.mood, '평범');
});

test('펫이 없는 사용자가 GET /pet을 호출하면 404가 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  const password = 'password123';
  let userId;

  t.after(() => cleanupUser(userId));

  const login = await signupAndLogin(app, email, password);
  userId = login.body.user.id;

  // pets 레코드를 강제로 지워서 "펫이 없는" 상태를 재현
  await pool.query('DELETE FROM pets WHERE user_id = $1', [userId]);

  const res = await request(app).get('/pet').set('Authorization', `Bearer ${login.body.accessToken}`);

  assert.equal(res.status, 404);
});

test('오늘 mood가 행복이 된 적 있으면, 같은 날 재로그인해도 재계산되지 않고 유지된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  const password = 'password123';
  let userId;

  t.after(() => cleanupUser(userId));

  const login1 = await signupAndLogin(app, email, password);
  userId = login1.body.user.id;
  await pool.query("UPDATE pets SET stage = '새끼', mood = '행복' WHERE user_id = $1", [userId]);

  const originalRandom = Math.random;
  Math.random = () => 0.01; // 재계산됐다면 확실히 '평범'/다른 값으로 바뀌었을 값
  let login2;
  try {
    login2 = await request(app).post('/auth/login').send({ email, password });
  } finally {
    Math.random = originalRandom;
  }

  assert.equal(login2.status, 200);
  assert.equal(login2.body.pet.mood, '행복');
});

after(async () => {
  await pool.end();
});
