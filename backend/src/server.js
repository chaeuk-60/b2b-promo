// 로컬/일반 Node 호스팅용 진입점(app.listen으로 상시 실행). Vercel 서버리스 배포는
// api/index.js가 같은 buildApp()을 재사용해서 별도로 감싼다.
const buildApp = require('./buildApp');

const isProduction = process.env.NODE_ENV === 'production';
const app = buildApp();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
  if (!isProduction) {
    console.log(`API 문서: http://localhost:${port}/api-docs`);
  }
});
