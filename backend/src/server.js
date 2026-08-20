const createApp = require('./app');
const authRoutes = require('./routes/auth.routes');

const app = createApp((app) => {
  app.use('/auth', authRoutes);
});
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
});
