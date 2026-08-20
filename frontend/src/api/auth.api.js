// 인증 API 함수(fetch만, 캐싱 없음 - 캐싱/상태 관리는 hooks/useAuth.js가 담당).
import client from './client';

export function signup({ email, password }) {
  return client.post('/auth/signup', { email, password }).then((res) => res.data);
}

export function login({ email, password }) {
  return client.post('/auth/login', { email, password }).then((res) => res.data);
}
