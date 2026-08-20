// 펫 화면(8-wireframe.md 6번): 상태 표시(FE-7) + 행동 버튼(FE-8)는 PetPanel에 있다.
// 공통 네비게이션(FE-10)의 "펫 보기" 버튼은 보통 팝업으로 PetPanel을 띄우지만, 이
// 라우트는 팝업을 거치지 않고 직접 진입(북마크/새로고침 등)할 때를 위해 유지한다.
import { Link } from 'react-router-dom';
import PetPanel from '../components/pet/PetPanel';

function PetPage() {
  return (
    <div>
      <Link to="/promotions">{'< 프로모션 목록'}</Link>
      <PetPanel />
    </div>
  );
}

export default PetPage;
