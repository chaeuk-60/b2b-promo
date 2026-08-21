// 인증 도메인 컨트롤러: req/res 파싱 + 응답, 로직은 auth.service.js에 위임 (10-plan.md BE-2)
const authService = require('../services/auth.service');

const REFRESH_TOKEN_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

// 프론트/백엔드가 서로 다른 도메인(예: Vercel에 각각 배포)일 때는 sameSite:'lax'로는
// 크로스 오리진 fetch 요청에 쿠키가 실려가지 않는다(브라우저가 차단) - sameSite:'none'
// 이려면 secure:true가 필수다. 로컬 개발은 http라 secure 쿠키가 아예 안 만들어지므로
// production에서만 켠다.
const isProduction = process.env.NODE_ENV === 'production';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
};

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
      ...REFRESH_COOKIE_OPTIONS,
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
    const { accessToken, user } = await authService.refreshAccessToken({ refreshToken });
    res.status(200).json({ accessToken, user });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken = getCookie(req, 'refreshToken');
    await authService.logout({ refreshToken });
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, refresh, logout };
