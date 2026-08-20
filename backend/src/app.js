const express = require('express');
const cors = require('cors');
const errorMiddleware = require('./middleware/error.middleware');

// 프론트엔드(Vite dev 서버 등)에서 쿠키 기반 리프레시 토큰을 쓰려면 credentials 허용이
// 필요하고, credentials:true일 때는 origin을 '*'로 둘 수 없어 명시적으로 지정한다.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

function createApp(registerRoutes) {
  const app = express();
  app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json());

  if (typeof registerRoutes === 'function') {
    registerRoutes(app);
  }

  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    next(err);
  });

  app.use(errorMiddleware);

  return app;
}

module.exports = createApp;
