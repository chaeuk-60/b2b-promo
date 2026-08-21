// Vercel 서버리스 진입점: Express 앱은 그 자체로 (req, res) => {} 형태 함수라, 인스턴스를
// 그대로 내보내면 @vercel/node가 요청 핸들러로 감싸 실행한다(app.listen 없이). server.js와
// 같은 buildApp()을 써서 라우트 등록이 두 곳에서 어긋나지 않게 한다.
module.exports = require('../src/buildApp')();
