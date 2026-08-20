const createApp = require('./app');
const authRoutes = require('./routes/auth.routes');
const petRoutes = require('./routes/pet.routes');
const promotionRoutes = require('./routes/promotion.routes');
const applicationRoutes = require('./routes/application.routes');

const app = createApp((app) => {
  app.use('/auth', authRoutes);
  app.use('/pet', petRoutes);
  app.use('/promotions', promotionRoutes);
  app.use('/applications', applicationRoutes);
});
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
});
