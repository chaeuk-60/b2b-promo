// 프로모션 목록 화면(8-wireframe.md 3번).
import { usePromotions } from '../hooks/usePromotions';
import PromotionCard from '../components/promotion/PromotionCard';
import './PromotionListPage.css';

function PromotionListPage() {
  const { data: promotions, isLoading, isError } = usePromotions();

  if (isLoading) return <p>불러오는 중...</p>;
  if (isError) return <p>프로모션 목록을 불러오지 못했습니다.</p>;

  return (
    <div className="promotion-list">
      {promotions.map((promotion) => (
        <PromotionCard key={promotion.id} promotion={promotion} />
      ))}
    </div>
  );
}

export default PromotionListPage;
