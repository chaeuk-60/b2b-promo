// 펫 이름 짓기 화면(선택 입력 + 건너뛰기/확인, 8-wireframe.md 2번).
// 최초 로그인/사망 후 새 알/성체 순환 후 새 알 상황에서 LoginPage(및 이후 로그인 흐름)가
// pet.name이 없을 때 이 경로로 보낸다. 건너뛰면 이미 null로 저장된 기본 이름을 그대로 둔다
// (API 호출 없이 바로 이동 - 도메인 정의서 6장: 건너뛰면 기본 이름 사용).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNamePet } from '../hooks/usePet';

function PetNamePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const nameMutation = useNamePet();

  async function handleConfirm(e) {
    e.preventDefault();
    try {
      await nameMutation.mutateAsync({ name });
    } catch {
      return; // 실패 시 화면에 머물러 재시도할 수 있게 한다.
    }
    navigate('/promotions');
  }

  function handleSkip() {
    navigate('/promotions');
  }

  return (
    <div>
      <h1>펫에게 이름을 지어주세요</h1>
      <div className="pixel-card">
        <form onSubmit={handleConfirm}>
          <label className="pixel-field">
            <span className="pixel-field-label">이름</span>
            <input
              className="pixel-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
            />
          </label>
          <button type="button" className="pixel-btn" onClick={handleSkip}>
            건너뛰기
          </button>
          <button type="submit" className="pixel-btn pixel-btn-primary" disabled={nameMutation.isPending}>
            확인
          </button>
        </form>
        {nameMutation.isError && <p role="alert">이름 저장에 실패했습니다. 다시 시도해주세요.</p>}
      </div>
    </div>
  );
}

export default PetNamePage;
