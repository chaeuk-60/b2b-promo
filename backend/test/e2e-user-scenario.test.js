// E2E: docs/4-use-case-diagram.md의 유스케이스 흐름을 실제 사용자 시나리오 순서 그대로 검증한다.
// 회원가입(UC1, include 로그인 UC2) -> 로그인 -> 펫 이름 짓기(UC2b, extend) -> 프로모션 목록
// 조회(UC3) -> 찜하기(UC6, UC3에 include) -> 상세보기(UC4) -> 신청(UC5, UC4에 include) ->
// 나의 신청 목록 조회(UC7) -> 펫 목욕(UC8)/밥주기(UC9)/특식 주기(UC9b, UC5에서 extend)/
// 쓰다듬기(UC10) -> 오늘의 운세(UC11) 순서로 실제 HTTP 엔드포인트를 하나의 플로우로 호출한다.
// (6-project-principle.md 4장: "E2E는 핵심 플로우 1~2개만 커버하면 충분하다")
const test = require('node:test');
const { after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const createApp = require('../src/app');
const pool = require('../src/db/pool');

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

function buildApp() {
  return createApp((app) => {
    app.use('/auth', require('../src/routes/auth.routes'));
    app.use('/pet', require('../src/routes/pet.routes'));
    app.use('/promotions', require('../src/routes/promotion.routes'));
    app.use('/applications', require('../src/routes/application.routes'));
  });
}

async function cleanupUser(userId) {
  if (!userId) return;
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM pets WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

// pets.requested_promotion_id는 ON DELETE SET NULL이라 수동 정리가 필요 없다.
async function cleanupPromotion(promotionId) {
  if (!promotionId) return;
  await pool.query('DELETE FROM applications WHERE promotion_id = $1', [promotionId]);
  await pool.query('DELETE FROM favorites WHERE promotion_id = $1', [promotionId]);
  await pool.query('DELETE FROM promotions WHERE id = $1', [promotionId]);
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
  if (createdUserId) t.after(() => cleanupUser(createdUserId));
  return login.body.accessToken;
}

test('사용자 시나리오 E2E: 가입~로그인~펫 이름 짓기~프로모션 찜/신청~특식 급여~오늘의 운세', async (t) => {
  const app = buildApp();
  const email = uniqueEmail();
  const password = 'password123';
  let userId;
  let promotionId;

  t.after(async () => {
    await cleanupPromotion(promotionId);
    await cleanupUser(userId);
  });

  // 사전 준비: 관리자로 신청 대상 프로모션 하나 등록(신청 기간 내)
  const adminToken = await loginAsAdmin(app, t);
  const createRes = await request(app)
    .post('/promotions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'E2E 시나리오 프로모션',
      start_date: '2026-08-01',
      end_date: '2026-12-31',
      content: 'E2E 테스트용 프로모션 내용입니다.',
      special_food_id: 'e2e-food',
    });
  assert.equal(createRes.status, 201);
  promotionId = createRes.body.id;

  // UC1(회원가입) -- include --> UC2(로그인): 가입 시 펫 1마리(알 상태) 자동 생성
  const signupRes = await request(app).post('/auth/signup').send({ email, password });
  assert.equal(signupRes.status, 201);
  assert.equal(signupRes.body.pet.stage, '알');
  userId = signupRes.body.user.id;

  const loginRes = await request(app).post('/auth/login').send({ email, password });
  assert.equal(loginRes.status, 200);
  assert.equal(loginRes.body.pet.stage, '알');
  let accessToken = loginRes.body.accessToken;
  const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

  // UC2 -- extend --> UC2b(펫 이름 짓기)
  const nameRes = await request(app)
    .patch('/pet/name')
    .set(authHeader())
    .send({ name: '몽실이' });
  assert.equal(nameRes.status, 200);
  assert.equal(nameRes.body.pet.name, '몽실이');

  // UC3(프로모션 목록 조회) -- include --> UC6(찜하기)
  const listRes = await request(app).get('/promotions').set(authHeader());
  assert.equal(listRes.status, 200);
  assert.ok(listRes.body.some((p) => String(p.id) === String(promotionId)));

  const favoriteRes = await request(app)
    .post(`/promotions/${promotionId}/favorite`)
    .set(authHeader());
  assert.equal(favoriteRes.status, 200);
  assert.equal(favoriteRes.body.favorited, true);

  // UC4(프로모션 상세보기) -- include --> UC5(신청)
  const detailRes = await request(app).get(`/promotions/${promotionId}`).set(authHeader());
  assert.equal(detailRes.status, 200);
  assert.equal(detailRes.body.title, 'E2E 시나리오 프로모션');

  const applyRes = await request(app)
    .post(`/promotions/${promotionId}/apply`)
    .set(authHeader());
  assert.equal(applyRes.status, 201);
  assert.equal(String(applyRes.body.promotion_id), String(promotionId));

  // UC7(나의 신청 목록 조회): 방금 신청한 프로모션이 포함되어야 한다
  const myApplicationsRes = await request(app).get('/applications').set(authHeader());
  assert.equal(myApplicationsRes.status, 200);
  assert.ok(myApplicationsRes.body.some((a) => String(a.promotion_id) === String(promotionId)));

  // UC8(펫 목욕시키기)
  const batheRes = await request(app).post('/pet/bathe').set(authHeader());
  assert.equal(batheRes.status, 200);
  assert.equal(batheRes.body.activity_count, 1);

  // UC9(펫 밥주기, 기본 주식) -- 특식 효과 없음
  const feedRes = await request(app).post('/pet/feed').set(authHeader());
  assert.equal(feedRes.status, 200);
  assert.equal(feedRes.body.activity_count, 2);

  // UC5 -- extend --> UC9b(펫 특식 주기): 방금 신청 완료해 보유하게 된 특식을 급여
  const feedSpecialRes = await request(app)
    .post('/pet/feed-special-food')
    .set(authHeader())
    .send({ promotionId: Number(promotionId) });
  assert.equal(feedSpecialRes.status, 200);

  // UC10(펫 쓰다듬기)
  const patRes = await request(app).post('/pet/pat').set(authHeader());
  assert.equal(patRes.status, 200);

  // UC11(오늘의 운세): 알 단계는 이용 불가(도메인 정의서 5장). 앞선 행동들에서 실제 확률로 성장
  // 전이가 이미 일어났을 수도 있으므로(진짜 Math.random 사용, BE-6에서 이미 결정론적으로 검증됨),
  // 현재 stage를 조회해 그에 맞는 기대값으로 확인한다.
  const petBeforeFortune = await request(app).get('/pet').set(authHeader());
  const fortuneBeforeRes = await request(app).post('/pet/fortune').set(authHeader());
  if (petBeforeFortune.body.pet.stage === '알') {
    assert.equal(fortuneBeforeRes.status, 400);
  } else {
    assert.equal(fortuneBeforeRes.status, 200);
  }

  // 아직 알 단계라면, 시나리오상 "새끼 이상 성장한 펫"의 오늘의 운세 흐름을 마저 확인하기 위해
  // 최소한으로 상태만 맞춰준다(성장 전이 확률 자체는 BE-6 테스트가 이미 커버).
  await pool.query("UPDATE pets SET stage = '새끼' WHERE user_id = $1", [userId]);

  const fortuneRes = await request(app).post('/pet/fortune').set(authHeader());
  assert.equal(fortuneRes.status, 200);
  assert.equal(typeof fortuneRes.body.message, 'string');
  assert.ok(fortuneRes.body.message.length > 0);

  // 같은 날 재요청 시 동일한 결과 유지(도메인 정의서 5장)
  const fortuneAgainRes = await request(app).post('/pet/fortune').set(authHeader());
  assert.equal(fortuneAgainRes.status, 200);
  assert.equal(fortuneAgainRes.body.message, fortuneRes.body.message);
});

after(async () => {
  await pool.end();
});
