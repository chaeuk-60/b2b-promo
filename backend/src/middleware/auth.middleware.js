// Authorization: Bearer 액세스 토큰 검증, req.user 세팅 (10-plan.md BE-2)
const authService = require('../services/auth.service');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(
      Object.assign(new Error('인증이 필요합니다.'), { status: 401, code: 'UNAUTHORIZED' })
    );
  }

  try {
    const payload = authService.verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(
      Object.assign(new Error('액세스 토큰이 유효하지 않거나 만료되었습니다.'), {
        status: 401,
        code: 'UNAUTHORIZED',
      })
    );
  }
}

module.exports = authMiddleware;
