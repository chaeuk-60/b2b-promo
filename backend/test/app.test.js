const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const createApp = require('../src/app');

test('존재하지 않는 라우트는 404와 표준 에러 포맷으로 응답한다', async () => {
  const app = createApp();

  const res = await request(app).get('/__not-exist');

  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
  assert.equal(typeof res.body.error.message, 'string');
});

test('핸들러에서 던진 에러는 기본값(500/INTERNAL_ERROR)으로 응답한다', async () => {
  const app = createApp((app) => {
    app.get('/__boom', () => {
      throw new Error('강제 에러');
    });
  });

  const res = await request(app).get('/__boom');

  assert.deepEqual(res.body, { error: { code: 'INTERNAL_ERROR', message: '강제 에러' } });
  assert.equal(res.status, 500);
});

test('err.status/err.code를 지정해 next(err)하면 그 값이 그대로 응답에 반영된다', async () => {
  const app = createApp((app) => {
    app.get('/__custom-error', (req, res, next) => {
      const err = new Error('권한이 없습니다');
      err.status = 403;
      err.code = 'FORBIDDEN';
      next(err);
    });
  });

  const res = await request(app).get('/__custom-error');

  assert.equal(res.status, 403);
  assert.deepEqual(res.body, { error: { code: 'FORBIDDEN', message: '권한이 없습니다' } });
});

test('registerRoutes로 등록한 정상 라우트는 404/에러 핸들러에 가로채이지 않고 200을 반환한다', async () => {
  const app = createApp((app) => {
    app.get('/__ok', (req, res) => {
      res.status(200).json({ ok: true });
    });
  });

  const res = await request(app).get('/__ok');

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true });
});
