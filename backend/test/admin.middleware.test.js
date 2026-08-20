const test = require('node:test');
const { after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const createApp = require('../src/app');
const pool = require('../src/db/pool'); // dotenv 로드 겸용 (ADMIN_EMAIL 환경변수 세팅)
const authMiddleware = require('../src/middleware/auth.middleware');
const requireAdmin = require('../src/middleware/admin.middleware');

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

function buildApp() {
  return createApp((app) => {
    app.use('/auth', require('../src/routes/auth.routes'));
    app.get('/__admin-only', authMiddleware, requireAdmin, (req, res) => {
      res.status(200).json({ ok: true });
    });
  });
}

// 테스트에서 생성한 user_id를 정리(순서 중요: pets는 CASCADE 없음)
async function cleanupUser(userId) {
  if (!userId) return;
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM pets WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

test('관리자 이메일 계정으로 로그인한 사용자는 requireAdmin 라우트 호출 시 200이 반환된다', async (t) => {
  const app = buildApp();
  const adminEmail = process.env.ADMIN_EMAIL;
  // seed.sql로 심어둔 관리자 계정의 실제 비밀번호(backend/src/db/seed.sql 주석 참고)
  const seedPassword = 'admin1234!';
  const fallbackPassword = 'password123';
  let createdUserId; // 테스트가 새로 만든 경우에만 정리 대상

  assert.ok(adminEmail, 'ADMIN_EMAIL 환경변수가 설정되어 있어야 한다');

  t.after(() => cleanupUser(createdUserId));

  let login = await request(app).post('/auth/login').send({ email: adminEmail, password: seedPassword });
  let password = seedPassword;

  // 시드 데이터가 없는 환경이면(로그인 실패), 회원가입 후 재로그인
  if (login.status !== 200) {
    password = fallbackPassword;
    const signup = await request(app)
      .post('/auth/signup')
      .send({ email: adminEmail, password });
    assert.equal(signup.status, 201, '관리자 이메일 회원가입에 실패했다');
    createdUserId = signup.body.user.id;

    login = await request(app).post('/auth/login').send({ email: adminEmail, password });
  }

  assert.equal(login.status, 200);
  const accessToken = login.body.accessToken;

  const res = await request(app)
    .get('/__admin-only')
    .set('Authorization', `Bearer ${accessToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('관리자가 아닌 일반 사용자가 requireAdmin 라우트를 호출하면 403이 반환된다', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  const password = 'password123';
  let userId;

  t.after(() => cleanupUser(userId));

  const signup = await request(app).post('/auth/signup').send({ email, password });
  userId = signup.body.user.id;

  const login = await request(app).post('/auth/login').send({ email, password });
  const accessToken = login.body.accessToken;

  const res = await request(app)
    .get('/__admin-only')
    .set('Authorization', `Bearer ${accessToken}`);

  assert.equal(res.status, 403);
});

test('토큰 없이 requireAdmin 라우트를 호출하면 401이 반환된다(auth.middleware가 먼저 차단)', async () => {
  const app = buildApp();

  const res = await request(app).get('/__admin-only');

  assert.equal(res.status, 401);
});

after(async () => {
  await pool.end();
});
