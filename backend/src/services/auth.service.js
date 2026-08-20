// 인증 도메인 서비스: 회원가입/로그인/토큰 재발급/로그아웃 (10-plan.md BE-2)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db/pool');
const petService = require('./pet.service');

// 도메인 정의서 2장의 귀 타입 5종. 알 단계에서는 시각적으로 쓰이지 않지만
// pets.ear_type 컬럼이 NOT NULL이라 가입 시점에 미리 랜덤 배정해둔다.
const EAR_TYPES = ['위로 곧게', '앞으로 접힘', '옆으로 처짐', '뒤로 말림', '아래로 늘어짐'];

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function signup({ email, password }) {
  if (!email || !password) {
    throw Object.assign(new Error('이메일과 비밀번호를 입력해주세요.'), {
      status: 400,
      code: 'INVALID_INPUT',
    });
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw Object.assign(new Error('이미 가입된 이메일입니다.'), {
      status: 400,
      code: 'EMAIL_TAKEN',
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash]
    );
    const user = userResult.rows[0];

    const earType = EAR_TYPES[Math.floor(Math.random() * EAR_TYPES.length)];
    const petResult = await client.query(
      'INSERT INTO pets (user_id, ear_type) VALUES ($1, $2) RETURNING *',
      [user.id, earType]
    );
    const pet = petResult.rows[0];

    await client.query('COMMIT');

    return { user: { id: user.id, email: user.email }, pet };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function login({ email, password }) {
  const invalidCredentialsError = Object.assign(
    new Error('이메일 또는 비밀번호가 올바르지 않습니다.'),
    { status: 401, code: 'INVALID_CREDENTIALS' }
  );

  if (!email || !password) {
    throw invalidCredentialsError;
  }

  const result = await pool.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email]
  );
  const user = result.rows[0];
  if (!user) {
    throw invalidCredentialsError;
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw invalidCredentialsError;
  }

  const accessToken = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
  // jti(무작위 토큰 ID)를 넣지 않으면 같은 초 안에 재로그인 시 payload/발급시각/만료시각이 모두 같아
  // 리프레시 토큰 JWT 문자열이 완전히 동일해지고, token_hash UNIQUE 제약을 위반한다.
  const refreshToken = jwt.sign(
    { sub: user.id, jti: crypto.randomBytes(16).toString('hex') },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '14d' }
  );

  const tokenHash = hashToken(refreshToken);
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '14 days')",
    [user.id, tokenHash]
  );

  await petService.checkDeathOrCycle(user.id);
  await petService.resolveMoodOnLogin(user.id);
  const pet = await petService.maybeGrantGift(user.id);

  return { accessToken, refreshToken, user: { id: user.id, email: user.email }, pet };
}

async function refreshAccessToken({ refreshToken }) {
  if (!refreshToken) {
    throw Object.assign(new Error('리프레시 토큰이 없습니다.'), {
      status: 401,
      code: 'UNAUTHORIZED',
    });
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw Object.assign(new Error('리프레시 토큰이 유효하지 않습니다.'), {
      status: 401,
      code: 'UNAUTHORIZED',
    });
  }

  const tokenHash = hashToken(refreshToken);
  const tokenResult = await pool.query(
    'SELECT user_id FROM refresh_tokens WHERE token_hash = $1 AND expires_at > now()',
    [tokenHash]
  );
  const tokenRow = tokenResult.rows[0];
  if (!tokenRow) {
    throw Object.assign(new Error('리프레시 토큰을 찾을 수 없습니다.'), {
      status: 401,
      code: 'UNAUTHORIZED',
    });
  }

  const userResult = await pool.query('SELECT id, email FROM users WHERE id = $1', [
    tokenRow.user_id,
  ]);
  const user = userResult.rows[0];

  const accessToken = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });

  return { accessToken };
}

async function logout({ refreshToken }) {
  if (!refreshToken) {
    return;
  }
  const tokenHash = hashToken(refreshToken);
  await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

module.exports = { signup, login, refreshAccessToken, logout, verifyAccessToken };
