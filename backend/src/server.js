const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const createApp = require('./app');
const authRoutes = require('./routes/auth.routes');
const petRoutes = require('./routes/pet.routes');
const promotionRoutes = require('./routes/promotion.routes');
const applicationRoutes = require('./routes/application.routes');

// docs/swagger.json(프로젝트 루트 기준)을 그대로 읽어서 Swagger UI로 서빙한다.
const swaggerSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'swagger.json'), 'utf8')
);

const app = createApp((app) => {
  app.use('/auth', authRoutes);
  app.use('/pet', petRoutes);
  app.use('/promotions', promotionRoutes);
  app.use('/applications', applicationRoutes);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
});
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`서버가 ${port} 포트에서 실행 중입니다. (API 문서: http://localhost:${port}/api-docs)`);
});
