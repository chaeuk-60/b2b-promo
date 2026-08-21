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

  // 버그: 로그인 실패 후 회원가입 모드로 바꿔 다시 제출하면, 방금 실패한 회원가입 에러가
  // 아니라 이전 로그인 실패 메시지가 계속 표시됐다(loginMutation.isError가 리셋 안 되고
  // 남아있어 항상 우선 표시됨). 모드를 바꿀 때 두 mutation 상태를 모두 리셋해서 고친다.
  function switchMode(nextMode) {
    loginMutation.reset();
    signupMutation.reset();
    setMode(nextMode);
  }

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
            {/* key로 submit/button 버튼을 서로 다른 요소로 강제한다 - 같은 자리라 React가
                기존 DOM 버튼의 type 속성만 바꿔치기하면, 클릭이 끝나기 전에 type이
                button -> submit으로 바뀌어 의도치 않게 폼이 제출되는 브라우저 동작이 있다
                (버그: "회원가입"으로 전환만 했는데 곧바로 제출까지 되던 문제). */}
            {/* 로그인/회원가입 실패 메시지는 아래로 빼지 않고 로그인 버튼 바로 오른쪽에
                붙인다(사용자 확인). 버튼과 한 그룹으로 묶어야 login-actions-row의
                space-between 아래서도 로그인 버튼에 딱 붙어 보인다(회원가입 버튼은
                계속 오른쪽 끝 고정). */}
            <div className="login-button-with-error">
              {mode === 'login' ? (
                <button
                  key="login-submit"
                  type="submit"
                  className="pixel-btn pixel-btn-primary"
                  disabled={isSubmitting}
                >
                  로그인
                </button>
              ) : (
                <button
                  key="login-toggle"
                  type="button"
                  className="pixel-btn"
                  onClick={() => switchMode('login')}
                >
                  로그인
                </button>
              )}
              {errorMessage && (
                <p role="alert" className="login-inline-error">
                  {errorMessage}
                </p>
              )}
            </div>
            {mode === 'signup' ? (
              <button
                key="signup-submit"
                type="submit"
                className="pixel-btn pixel-btn-primary"
                disabled={isSubmitting}
              >
                회원가입
              </button>
            ) : (
              <button
                key="signup-toggle"
                type="button"
                className="pixel-btn"
                onClick={() => switchMode('signup')}
              >
                회원가입
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
