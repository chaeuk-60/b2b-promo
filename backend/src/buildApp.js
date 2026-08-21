// Express 앱 조립(라우트 등록 + 로컬 전용 Swagger UI). server.js(로컬 상시 실행)와
// api/index.js(Vercel 서버리스 진입점) 둘 다 이 함수로 만든 같은 앱을 재사용한다
// (라우트 등록을 두 곳에 중복해서 적어두면 나중에 하나만 고치고 잊어버리기 쉬움).
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const createApp = require('./app');
const authRoutes = require('./routes/auth.routes');
const petRoutes = require('./routes/pet.routes');
const promotionRoutes = require('./routes/promotion.routes');
const applicationRoutes = require('./routes/application.routes');

const isProduction = process.env.NODE_ENV === 'production';

function buildApp() {
  return createApp((app) => {
    // 배포/모니터링용 헬스체크: 인증/DB 조회 없이 서버 프로세스가 떠 있는지만 확인한다.
    app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

    app.use('/auth', authRoutes);
    app.use('/pet', petRoutes);
    app.use('/promotions', promotionRoutes);
    app.use('/applications', applicationRoutes);

    // 운영 환경(NODE_ENV=production)에서는 API 스펙 노출을 막기 위해 Swagger UI를 켜지 않는다.
    if (!isProduction) {
      // docs/swagger.json(프로젝트 루트 기준)을 그대로 읽어서 Swagger UI로 서빙한다.
      const swaggerSpec = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'swagger.json'), 'utf8')
      );
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    }
  });
}

module.exports = buildApp;
