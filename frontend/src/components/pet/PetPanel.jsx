// 펫 조회 + 상태 표시(FE-7) + 행동 버튼(FE-8)을 한데 묶은 패널. 독립 페이지(PetPage)와
// 공통 네비게이션의 펫 팝업(FE-10, Layout.jsx)에서 그대로 재사용한다.
//
// 행동 성공 시 말풍선에 잠깐 뜨는 반응 이모지(밥=🍚, 쓰다듬기=❤️, 운세=🍀, 목욕=🫧)는
// PetView(말풍선)와 PetActionButtons(행동 버튼) 둘 다에 걸쳐 있어 여기서 상태를 들고 있다가
// 내려준다.
import { useEffect, useRef, useState } from 'react';
import { usePet, useNamePet } from '../../hooks/usePet';
import PetView from './PetView';
import PetActionButtons from './PetActionButtons';

const REACTION_DURATION_MS = 4000; // 운세처럼 긴 문장도 다 읽을 수 있게 넉넉히 잡는다
const DEFAULT_PET_NAME = '김커푸';

// 펫 이름이 아직 없으면(최초 로그인/사망 후 새 알 등) 펫 팝업을 처음 열었을 때 바로 여기서
// 이름을 짓는다(사용자 확인: "펫 이름 짓기를 펫 팝업 처음으로 뜰때 하게 해") - 별도
// 페이지 이동 없이, 이름을 지으면 usePet 캐시가 갱신되며 그 자리에서 평소 펫 화면으로 바뀐다.
function PetNameForm() {
  const [name, setName] = useState('');
  const nameMutation = useNamePet();

  function handleConfirm(e) {
    e.preventDefault();
    nameMutation.mutate({ name: name.trim() || DEFAULT_PET_NAME });
  }

  function handleSkip() {
    nameMutation.mutate({ name: DEFAULT_PET_NAME });
  }

  return (
    <div>
      <h3>펫에게 이름을 지어주세요</h3>
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
        <div className="login-actions-row">
          <button
            type="button"
            className="pixel-btn"
            onClick={handleSkip}
            disabled={nameMutation.isPending}
          >
            건너뛰기
          </button>
          <button type="submit" className="pixel-btn pixel-btn-primary" disabled={nameMutation.isPending}>
            확인
          </button>
        </div>
      </form>
      {nameMutation.isError && <p role="alert">이름 저장에 실패했습니다. 다시 시도해주세요.</p>}
    </div>
  );
}

function PetPanel() {
  const { data: pet, isLoading, isError } = usePet();
  const [reaction, setReaction] = useState(null);
  const timeoutRef = useRef(null);

  function showReaction(emoji) {
    clearTimeout(timeoutRef.current);
    setReaction(emoji);
    timeoutRef.current = setTimeout(() => setReaction(null), REACTION_DURATION_MS);
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  if (isLoading) return <p>불러오는 중...</p>;
  if (isError) return <p>펫 정보를 불러오지 못했습니다.</p>;
  if (!pet.name) return <PetNameForm />;

  return (
    <div>
      <PetView pet={pet} reaction={reaction} />
      <PetActionButtons pet={pet} onAction={showReaction} />
    </div>
  );
}

export default PetPanel;
