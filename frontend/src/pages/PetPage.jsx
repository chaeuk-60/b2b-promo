// 펫 화면(8-wireframe.md 6번): 상태 표시(FE-7) + 행동 버튼(FE-8).
import { Link } from 'react-router-dom';
import { usePet } from '../hooks/usePet';
import PetView from '../components/pet/PetView';
import PetActionButtons from '../components/pet/PetActionButtons';

function PetPage() {
  const { data: pet, isLoading, isError } = usePet();

  if (isLoading) return <p>불러오는 중...</p>;
  if (isError) return <p>펫 정보를 불러오지 못했습니다.</p>;

  return (
    <div>
      <Link to="/promotions">{'< 프로모션 목록'}</Link>
      <PetView pet={pet} />
      <PetActionButtons pet={pet} />
    </div>
  );
}

export default PetPage;
