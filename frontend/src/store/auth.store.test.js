import { describe, it, expect, beforeEach } from 'vitest';
import useAuthStore from './auth.store';

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearUser();
  });

  it('초기 user는 null이다', () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('setUser로 로그인 사용자 정보를 담을 수 있다', () => {
    useAuthStore.getState().setUser({ id: 1, email: 'a@example.com' });
    expect(useAuthStore.getState().user).toEqual({ id: 1, email: 'a@example.com' });
  });

  it('clearUser로 로그아웃 처리(초기화)할 수 있다', () => {
    useAuthStore.getState().setUser({ id: 1, email: 'a@example.com' });
    useAuthStore.getState().clearUser();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
