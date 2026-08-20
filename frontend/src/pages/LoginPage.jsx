// 로그인/회원가입 폼(같은 화면에서 전환, 8-wireframe.md 1번). 로그인 성공 시 pet.name 유무로
// 펫 이름 짓기 화면 또는 목록 화면으로 이동한다(회원가입 시에는 실제 로그인까지 이어서 처리해
// 가입 직후 자동 로그인된 것처럼 동작시킨다 - UC1 include UC2, 4-use-case-diagram.md).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin, useSignup } from '../hooks/useAuth';

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useLogin();
  const signupMutation = useSignup();

  const isSubmitting = loginMutation.isPending || signupMutation.isPending;
  const errorMessage = loginMutation.isError
    ? loginMutation.error?.response?.data?.error?.message || '로그인에 실패했습니다.'
    : signupMutation.isError
      ? signupMutation.error?.response?.data?.error?.message || '회원가입에 실패했습니다.'
      : null;

  function goAfterLogin(pet) {
    navigate(pet?.name ? '/promotions' : '/pet/name');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (mode === 'signup') {
        await signupMutation.mutateAsync({ email, password });
      }
      const loginResult = await loginMutation.mutateAsync({ email, password });
      goAfterLogin(loginResult.pet);
    } catch {
      // 실패 시 UI 표시는 loginMutation.isError/signupMutation.isError로 처리한다.
    }
  }

  return (
    <div>
      <h1>b2b-promo</h1>
      <div className="pixel-card">
        <form onSubmit={handleSubmit}>
          <label className="pixel-field">
            <span className="pixel-field-label">이메일</span>
            <input
              className="pixel-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="pixel-field">
            <span className="pixel-field-label">비밀번호</span>
            <input
              className="pixel-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="pixel-btn pixel-btn-primary" disabled={isSubmitting}>
            {mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        {errorMessage && <p role="alert">{errorMessage}</p>}

        {mode === 'login' ? (
          <p>
            아직 계정이 없으신가요?{' '}
            <button type="button" className="pixel-btn" onClick={() => setMode('signup')}>
              회원가입
            </button>
          </p>
        ) : (
          <p>
            이미 계정이 있으신가요?{' '}
            <button type="button" className="pixel-btn" onClick={() => setMode('login')}>
              로그인
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
