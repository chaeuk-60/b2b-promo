// 펫 조회 + 상태 표시(FE-7) + 행동 버튼(FE-8)을 한데 묶은 패널. 독립 페이지(PetPage)와
// 공통 네비게이션의 펫 팝업(FE-10, Layout.jsx)에서 그대로 재사용한다.
//
// 행동 성공 시 말풍선에 잠깐 뜨는 반응 이모지(밥=🍚, 쓰다듬기=❤️, 운세=🍀, 목욕=🫧)는
// PetView(말풍선)와 PetActionButtons(행동 버튼) 둘 다에 걸쳐 있어 여기서 상태를 들고 있다가
// 내려준다.
import { useEffect, useRef, useState } from 'react';
import { usePet } from '../../hooks/usePet';
import PetView from './PetView';
import PetActionButtons from './PetActionButtons';

const REACTION_DURATION_MS = 4000; // 운세처럼 긴 문장도 다 읽을 수 있게 넉넉히 잡는다

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

  return (
    <div>
      <PetView pet={pet} reaction={reaction} />
      <PetActionButtons pet={pet} onAction={showReaction} />
    </div>
  );
}

export default PetPanel;
