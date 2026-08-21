const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const createApp = require('./app');
const authRoutes = require('./routes/auth.routes');
const petRoutes = require('./routes/pet.routes');
const promotionRoutes = require('./routes/promotion.routes');
const applicationRoutes = require('./routes/application.routes');

// 운영 환경(NODE_ENV=production)에서는 API 스펙 노출을 막기 위해 Swagger UI를 켜지 않는다.
const isProduction = process.env.NODE_ENV === 'production';

const app = createApp((app) => {
  // 배포/모니터링용 헬스체크: 인증/DB 조회 없이 서버 프로세스가 떠 있는지만 확인한다.
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

  app.use('/auth', authRoutes);
  app.use('/pet', petRoutes);
  app.use('/promotions', promotionRoutes);
  app.use('/applications', applicationRoutes);

  if (!isProduction) {
    // docs/swagger.json(프로젝트 루트 기준)을 그대로 읽어서 Swagger UI로 서빙한다.
    const swaggerSpec = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'swagger.json'), 'utf8')
    );
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }
});
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
  if (!isProduction) {
    console.log(`API 문서: http://localhost:${port}/api-docs`);
  }
});
