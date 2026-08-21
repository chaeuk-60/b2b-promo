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

  // 버그: "로그인"/"회원가입" 버튼이 모드 전환과 제출을 겸하고 있어서, 다른 모드
  // 버튼을 누르면 1번째 클릭은 모드만 바뀌고 2번째 클릭에야 실제 제출이 됐다(사용자 확인:
  // "왜 2번씩 눌러야해?"). targetMode를 인자로 받아 모드 전환과 제출을 한 클릭에서
  // 같이 처리하도록 합친다(state가 아니라 인자를 써서, setMode가 아직 반영 안 된 클로저
  // 문제도 피한다).
  //
  // 모드를 바꿀 때는 이전 실패 메시지도 같이 리셋한다 - 안 하면 로그인 실패 후 회원가입
  // 전환 시 방금 실패한 회원가입 에러가 아니라 이전 로그인 실패 메시지가 계속 표시된다.
  async function submit(targetMode) {
    loginMutation.reset();
    signupMutation.reset();
    setMode(targetMode);

    try {
      if (targetMode === 'signup') {
        await signupMutation.mutateAsync({ email, password });
      }
      await loginMutation.mutateAsync({ email, password });
      navigate('/promotions');
    } catch {
      // 실패 시 UI 표시는 loginMutation.isError/signupMutation.isError로 처리한다.
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    submit(mode);
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
              "로그인"이 왼쪽, "회원가입"이 오른쪽으로 고정한다(사용자 확인). 둘 다 클릭 한 번에
              해당 모드로 전환 + 제출까지 같이 한다(모드 전환용 별도 클릭 불필요 - 사용자 확인:
              "왜 2번씩 눌러야해?"). 활성 모드 쪽만 주요색으로 강조. */}
          <div className="login-actions-row">
            {/* 폼 자체 제출(Enter 키)을 위한 숨김 submit 버튼. 보이는 두 버튼은 항상
                type="button"으로 두고 onClick에서 submit()을 직접 호출한다 - type이 클릭
                도중 바뀌는 일이 없어 예전의 의도치 않은 제출 버그도 같이 없앤다. */}
            <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
            {/* 로그인/회원가입 실패 메시지는 아래로 빼지 않고 로그인 버튼 바로 오른쪽에
                붙인다(사용자 확인). 버튼과 한 그룹으로 묶어야 login-actions-row의
                space-between 아래서도 로그인 버튼에 딱 붙어 보인다(회원가입 버튼은
                계속 오른쪽 끝 고정). */}
            <div className="login-button-with-error">
              <button
                type="button"
                className={`pixel-btn${mode === 'login' ? ' pixel-btn-primary' : ''}`}
                onClick={() => submit('login')}
                disabled={isSubmitting}
              >
                로그인
              </button>
              {errorMessage && (
                <p role="alert" className="login-inline-error">
                  {errorMessage}
                </p>
              )}
            </div>
            <button
              type="button"
              className={`pixel-btn${mode === 'signup' ? ' pixel-btn-primary' : ''}`}
              onClick={() => submit('signup')}
              disabled={isSubmitting}
            >
              회원가입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
