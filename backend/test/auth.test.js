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
  return createApp((app) => app.use('/auth', require('../src/routes/auth.routes')));
}

// Set-Cookie 배열에서 refreshToken=... 부분만 추출
function extractRefreshTokenCookie(setCookieHeader) {
  const cookieLine = setCookieHeader.find((c) => c.startsWith('refreshToken='));
  assert.ok(cookieLine, 'Set-Cookie에 refreshToken이 있어야 한다');
  return cookieLine.split(';')[0];
}

// 테스트에서 생성한 user_id를 정리(순서 중요: pets는 CASCADE 없음)
async function cleanupUser(userId) {
  if (!userId) return;
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM pets WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

test('회원가입 시 users와 pets(stage=알) 레코드가 함께 생성된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;

  t.after(() => cleanupUser(userId));

  const res = await request(app).post('/auth/signup').send({ email, password: 'password123' });

  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, email);
  assert.equal(res.body.pet.stage, '알');
  userId = res.body.user.id;

  const userRow = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  assert.equal(userRow.rows.length, 1);

  const petRow = await pool.query('SELECT * FROM pets WHERE user_id = $1', [userId]);
  assert.equal(petRow.rows.length, 1);
  assert.equal(petRow.rows[0].stage, '알');
});

test('이미 가입된 이메일로 재가입 시 400 에러가 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;

  t.after(() => cleanupUser(userId));

  const first = await request(app).post('/auth/signup').send({ email, password: 'password123' });
  userId = first.body.user.id;

  const second = await request(app).post('/auth/signup').send({ email, password: 'password123' });

  assert.equal(second.status, 400);
});

test('로그인 성공 시 accessToken/user와 httpOnly refreshToken 쿠키가 발급되고 refresh_tokens에 1건 저장된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  const password = 'password123';
  let userId;

  t.after(() => cleanupUser(userId));

  const signup = await request(app).post('/auth/signup').send({ email, password });
  userId = signup.body.user.id;

  const res = await request(app).post('/auth/login').send({ email, password });

  assert.equal(res.status, 200);
  assert.equal(typeof res.body.accessToken, 'string');
  assert.equal(res.body.user.email, email);

  const setCookie = res.headers['set-cookie'];
  assert.ok(Array.isArray(setCookie));
  const refreshCookieLine = setCookie.find((c) => c.startsWith('refreshToken='));
  assert.ok(refreshCookieLine);
  assert.match(refreshCookieLine, /HttpOnly/i);

  const tokenRows = await pool.query('SELECT * FROM refresh_tokens WHERE user_id = $1', [userId]);
  assert.equal(tokenRows.rows.length, 1);
});

test('잘못된 비밀번호로 로그인하면 401 에러가 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  let userId;

  t.after(() => cleanupUser(userId));

  const signup = await request(app).post('/auth/signup').send({ email, password: 'password123' });
  userId = signup.body.user.id;

  const res = await request(app).post('/auth/login').send({ email, password: 'wrong-password' });

  assert.equal(res.status, 401);
});

test('로그아웃 시 refresh_tokens 행이 삭제되고, 같은 리프레시 토큰으로 재발급을 시도하면 401이 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  const password = 'password123';
  let userId;

  t.after(() => cleanupUser(userId));

  const signup = await request(app).post('/auth/signup').send({ email, password });
  userId = signup.body.user.id;

  const login = await request(app).post('/auth/login').send({ email, password });
  const accessToken = login.body.accessToken;
  const refreshCookie = extractRefreshTokenCookie(login.headers['set-cookie']);

  const logout = await request(app)
    .post('/auth/logout')
    .set('Authorization', `Bearer ${accessToken}`)
    .set('Cookie', refreshCookie);

  assert.equal(logout.status, 204);

  const tokenRows = await pool.query('SELECT * FROM refresh_tokens WHERE user_id = $1', [userId]);
  assert.equal(tokenRows.rows.length, 0);

  const refreshRes = await request(app).post('/auth/refresh').set('Cookie', refreshCookie);
  assert.equal(refreshRes.status, 401);
});

test('Authorization 헤더 없이 보호된 라우트(로그아웃)를 호출하면 401이 반환된다', async () => {
  const app = buildApp();

  const res = await request(app).post('/auth/logout');

  assert.equal(res.status, 401);
});

test('정상 로그인 후 발급받은 리프레시 토큰 쿠키로 재발급 요청 시 200과 새 accessToken이 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  const password = 'password123';
  let userId;

  t.after(() => cleanupUser(userId));

  const signup = await request(app).post('/auth/signup').send({ email, password });
  userId = signup.body.user.id;

  const login = await request(app).post('/auth/login').send({ email, password });
  const refreshCookie = extractRefreshTokenCookie(login.headers['set-cookie']);

  const res = await request(app).post('/auth/refresh').set('Cookie', refreshCookie);

  assert.equal(res.status, 200);
  assert.equal(typeof res.body.accessToken, 'string');
  // user도 같이 내려줘야 프론트가 새로고침 시 로그인 사용자 정보(관리자 판별 등)를
  // 이 응답만으로 복원할 수 있다.
  assert.equal(res.body.user.id, userId);
  assert.equal(res.body.user.email, email);
});

test('이메일/비밀번호 없이 회원가입하면 400 에러가 반환된다', async () => {
  const app = buildApp();

  const res = await request(app).post('/auth/signup').send({});

  assert.equal(res.status, 400);
});

test('가입하지 않은 이메일로 로그인하면 401 에러가 반환된다', async () => {
  const app = buildApp();

  const res = await request(app)
    .post('/auth/login')
    .send({ email: uniqueEmail(), password: 'password123' });

  assert.equal(res.status, 401);
});

test('이메일/비밀번호 없이 로그인하면 401 에러가 반환된다', async () => {
  const app = buildApp();

  const res = await request(app).post('/auth/login').send({});

  assert.equal(res.status, 401);
});

test('쿠키 없이 재발급 요청하면 401 에러가 반환된다', async () => {
  const app = buildApp();

  const res = await request(app).post('/auth/refresh');

  assert.equal(res.status, 401);
});

test('refreshToken이 아닌 다른 쿠키만 있을 때 재발급 요청하면 401 에러가 반환된다', async () => {
  const app = buildApp();

  const res = await request(app).post('/auth/refresh').set('Cookie', 'foo=bar');

  assert.equal(res.status, 401);
});

test('형식이 잘못된 refreshToken 쿠키로 재발급 요청하면 401 에러가 반환된다', async () => {
  const app = buildApp();

  const res = await request(app).post('/auth/refresh').set('Cookie', 'refreshToken=not-a-real-jwt');

  assert.equal(res.status, 401);
});

test('refreshToken 쿠키 없이 로그아웃해도 204가 반환된다(멱등 처리)', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  const password = 'password123';
  let userId;

  t.after(() => cleanupUser(userId));

  const signup = await request(app).post('/auth/signup').send({ email, password });
  userId = signup.body.user.id;

  const login = await request(app).post('/auth/login').send({ email, password });
  const accessToken = login.body.accessToken;

  const res = await request(app).post('/auth/logout').set('Authorization', `Bearer ${accessToken}`);

  assert.equal(res.status, 204);
});

test('형식이 잘못된 액세스 토큰으로 보호된 라우트를 호출하면 401 에러가 반환된다', async () => {
  const app = buildApp();

  const res = await request(app)
    .post('/auth/logout')
    .set('Authorization', 'Bearer not-a-real-jwt');

  assert.equal(res.status, 401);
});

after(async () => {
  await pool.end();
});
