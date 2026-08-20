// 관리자 권한 판별: auth.middleware 통과 후 req.user.email이 ADMIN_EMAIL과 일치하는지만 확인 (10-plan.md BE-3)
function requireAdmin(req, res, next) {
  if (!req.user || req.user.email !== process.env.ADMIN_EMAIL) {
    return next(
      Object.assign(new Error('관리자 권한이 필요합니다.'), { status: 403, code: 'FORBIDDEN' })
    );
  }

  next();
}

module.exports = requireAdmin;
