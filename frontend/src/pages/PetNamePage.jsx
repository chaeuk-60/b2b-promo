// 펫 이름 짓기 화면(선택 입력 + 건너뛰기/확인, 8-wireframe.md 2번).
// 최초 로그인/사망 후 새 알/성체 순환 후 새 알 상황에서 LoginPage(및 이후 로그인 흐름)가
// pet.name이 없을 때 이 경로로 보낸다.
//
// 건너뛰거나 빈 이름으로 확인해도 반드시 DEFAULT_PET_NAME을 실제로 저장해야 한다(API 호출
// 없이 이동 X). pet.name을 null로 남겨두면 LoginPage.goAfterLogin이 "이름 미설정"으로 계속
// 오인해 재로그인마다 이 화면으로 되돌아오는 무한 루프가 생긴다(도메인 정의서 6장의 "건너뛰면
// 기본 이름 사용"은 화면에 기본값을 채워 넣으라는 뜻이지, 이름짓기를 매번 다시 물어보라는
// 뜻이 아니다).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNamePet } from '../hooks/usePet';

const DEFAULT_PET_NAME = '몽실이';

function PetNamePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const nameMutation = useNamePet();

  async function saveNameAndLeave(nameToSave) {
    try {
      await nameMutation.mutateAsync({ name: nameToSave });
    } catch {
      return; // 실패 시 화면에 머물러 재시도할 수 있게 한다.
    }
    navigate('/promotions');
  }

  function handleConfirm(e) {
    e.preventDefault();
    return saveNameAndLeave(name.trim() || DEFAULT_PET_NAME);
  }

  function handleSkip() {
    return saveNameAndLeave(DEFAULT_PET_NAME);
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
          <button type="button" className="pixel-btn" onClick={handleSkip} disabled={nameMutation.isPending}>
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
