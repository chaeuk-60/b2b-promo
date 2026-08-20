// FE-2: 로그인 성공 시 액세스 토큰이 api client에 세팅되고 auth.store에 사용자 정보가 반영되는지.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin, useSignup } from './useAuth';
import useAuthStore from '../store/auth.store';
import { getAccessToken, setAccessToken } from '../api/client';

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

import { login, signup } from '../api/auth.api';

function wrapper({ children }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAccessToken(null);
    useAuthStore.getState().clearUser();
  });

  it('로그인 성공 시 accessToken이 api client에 세팅되고 user가 store에 반영된다', async () => {
    login.mockResolvedValue({
      accessToken: 'token-123',
      user: { id: 1, email: 'a@example.com' },
      pet: { name: null },
    });

    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ email: 'a@example.com', password: 'pw' });
    });

    expect(getAccessToken()).toBe('token-123');
    expect(useAuthStore.getState().user).toEqual({ id: 1, email: 'a@example.com' });
  });

  it('로그인 실패 시 accessToken/user가 갱신되지 않는다', async () => {
    login.mockRejectedValue(new Error('invalid credentials'));

    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ email: 'a@example.com', password: 'wrong' })
      ).rejects.toThrow();
    });

    expect(getAccessToken()).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('회원가입 성공 시 user가 store에 반영된다(토큰은 아직 없음, 로그인 API가 별도로 발급)', async () => {
    signup.mockResolvedValue({
      user: { id: 2, email: 'b@example.com' },
      pet: { name: null },
    });

    const { result } = renderHook(() => useSignup(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ email: 'b@example.com', password: 'pw' });
    });

    expect(useAuthStore.getState().user).toEqual({ id: 2, email: 'b@example.com' });
  });
});
