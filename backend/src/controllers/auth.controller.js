// 인증 도메인 컨트롤러: req/res 파싱 + 응답, 로직은 auth.service.js에 위임 (10-plan.md BE-2)
const authService = require('../services/auth.service');

const REFRESH_TOKEN_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

// cookie-parser 없이 req.headers.cookie 문자열에서 원하는 쿠키 값만 직접 파싱한다.
function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  for (const pair of cookieHeader.split('; ')) {
    const [key, ...rest] = pair.split('=');
    if (key === name) {
      return rest.join('=');
    }
  }
  return undefined;
}

async function signup(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, pet } = await authService.signup({ email, password });
    res.status(201).json({ user, pet });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user, pet } = await authService.login({ email, password });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });
    res.status(200).json({ accessToken, user, pet });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = getCookie(req, 'refreshToken');
    const { accessToken } = await authService.refreshAccessToken({ refreshToken });
    res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken = getCookie(req, 'refreshToken');
    await authService.logout({ refreshToken });
    res.clearCookie('refreshToken');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, refresh, logout };
