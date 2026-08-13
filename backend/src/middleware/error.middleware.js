// 공통 에러 핸들러: 모든 에러 응답을 { error: { code, message } } 형태로 통일한다.
function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal Server Error';

  console.error(`[${req.method}] ${req.originalUrl} -> ${status} ${message}`);

  res.status(status).json({ error: { code, message } });
}

module.exports = errorMiddleware;
