// 인증 API 함수(fetch만, 캐싱 없음 - 캐싱/상태 관리는 hooks/useAuth.js가 담당).
import client from './client';

export function signup({ email, password }) {
  return client.post('/auth/signup', { email, password }).then((res) => res.data);
}

export function login({ email, password }) {
  return client.post('/auth/login', { email, password }).then((res) => res.data);
}

// 새로고침/재방문 시 로그인 사용자 정보를 복원하기 위한 호출(App.jsx 최초 마운트).
// httpOnly 리프레시 토큰 쿠키가 유효하면 accessToken과 user를 다시 내려준다.
export function refresh() {
  return client.post('/auth/refresh').then((res) => res.data);
}
