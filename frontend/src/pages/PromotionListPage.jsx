// 프로모션 목록 화면(8-wireframe.md 3번).
import { usePromotions } from '../hooks/usePromotions';
import PromotionCard from '../components/promotion/PromotionCard';
import './PromotionListPage.css';

function PromotionListPage() {
  const { data: promotions, isLoading, isError } = usePromotions();

  if (isLoading) return <p>불러오는 중...</p>;
  if (isError) return <p>프로모션 목록을 불러오지 못했습니다.</p>;

  return (
    <div>
      {/* 나의 신청 목록 화면과 같은 톤으로 페이지 제목을 넣는다(사용자 확인). */}
      <h2>프로모션 목록</h2>
      <div className="promotion-list">
        {promotions.map((promotion) => (
          <PromotionCard key={promotion.id} promotion={promotion} />
        ))}
      </div>
    </div>
  );
}

export default PromotionListPage;
