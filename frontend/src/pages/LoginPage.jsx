// 로그인/회원가입 폼(같은 화면에서 전환, 8-wireframe.md 1번). 로그인 성공 시 항상 목록
// 화면으로 이동한다(회원가입 시에는 실제 로그인까지 이어서 처리해 가입 직후 자동 로그인된
// 것처럼 동작시킨다 - UC1 include UC2, 4-use-case-diagram.md). pet.name이 아직 없으면
// 펫 팝업을 처음 열 때 그 안에서 이름을 짓는다(PetPanel.jsx, 사용자 확인) - 로그인 직후
// 별도 페이지로 강제 이동시키지 않는다.
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

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (mode === 'signup') {
        await signupMutation.mutateAsync({ email, password });
      }
      await loginMutation.mutateAsync({ email, password });
      navigate('/promotions');
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
          {/* 로그인/회원가입 버튼을 한 줄에 두되 라벨/위치는 모드와 무관하게 항상
              "로그인"이 왼쪽, "회원가입"이 오른쪽으로 고정한다(사용자 확인). 현재 모드에
              해당하는 쪽만 실제 제출 버튼(주요색)이고, 나머지는 그 모드로 전환하는 버튼. */}
          <div className="login-actions-row">
            {mode === 'login' ? (
              <button type="submit" className="pixel-btn pixel-btn-primary" disabled={isSubmitting}>
                로그인
              </button>
            ) : (
              <button type="button" className="pixel-btn" onClick={() => setMode('login')}>
                로그인
              </button>
            )}
            {mode === 'signup' ? (
              <button type="submit" className="pixel-btn pixel-btn-primary" disabled={isSubmitting}>
                회원가입
              </button>
            ) : (
              <button type="button" className="pixel-btn" onClick={() => setMode('signup')}>
                회원가입
              </button>
            )}
          </div>
        </form>

        {errorMessage && <p role="alert">{errorMessage}</p>}
      </div>
    </div>
  );
}

export default LoginPage;
