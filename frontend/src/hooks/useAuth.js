// 회원가입/로그인 useMutation. 성공 시 액세스 토큰을 api client에 세팅하고,
// 로그인 사용자 정보는 auth.store(Zustand)에 반영한다. 서버가 내려준 pet은
// 호출부(LoginPage 등)가 이후 이동(라우팅) 판단에 그대로 쓸 수 있도록 결과값에 포함된다.
import { useMutation } from '@tanstack/react-query';
import { signup, login } from '../api/auth.api';
import { setAccessToken } from '../api/client';
import useAuthStore from '../store/auth.store';

export function useSignup() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      setUser(data.user);
    },
  });
}

export function useLogin() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setUser(data.user);
    },
  });
}
