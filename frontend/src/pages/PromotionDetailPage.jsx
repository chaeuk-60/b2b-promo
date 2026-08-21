// 프로모션 상세 화면(8-wireframe.md 4번): 제목/기간/내용 + 찜 토글 + 신청 버튼.
import { useParams, Link } from 'react-router-dom';
import { usePromotion } from '../hooks/usePromotion';
import { useApplyPromotion } from '../hooks/useApplyPromotion';
import FavoriteButton from '../components/promotion/FavoriteButton';

function isEnded(endDate) {
  return new Date(endDate) < new Date(new Date().toDateString());
}

function PromotionDetailPage() {
  const { id } = useParams();
  const { data: promotion, isLoading, isError } = usePromotion(id);
  const applyPromotion = useApplyPromotion(id);

  if (isLoading) return <p>불러오는 중...</p>;
  if (isError) return <p>프로모션 정보를 불러오지 못했습니다.</p>;

  const ended = isEnded(promotion.end_date);

  return (
    <div>
      <Link to="/promotions">{'< 목록으로'}</Link>
      <div className="pixel-card">
        {/* 나의 신청 목록 카드와 같은 톤으로(사용자 확인: 제목표시줄 없이 일반 제목).
            목록과 같은 형광펜 하이라이트 + 파란색 대신 일반 잉크색(사용자 확인). */}
        <h2 className="promo-card-title">
          <span className="promo-card-title-highlight">{promotion.title}</span>
        </h2>
        <p>
          기간: {promotion.start_date} ~ {promotion.end_date}
        </p>
        <p>{promotion.content}</p>

        {/* 찜은 신청 상태 버튼 오른쪽에 나란히(사용자 확인: "찜버튼 신청하기 옆에 있어야지"). */}
        <div className="promo-card-actions">
          {promotion.applied ? (
            <button type="button" className="pixel-btn pixel-btn-done" disabled>
              신청 완료
            </button>
          ) : ended ? (
            <button type="button" className="pixel-btn" disabled>
              기간 종료
            </button>
          ) : (
            <button
              type="button"
              className="pixel-btn pixel-btn-primary"
              onClick={() => applyPromotion.mutate()}
              disabled={applyPromotion.isPending}
            >
              신청하기
            </button>
          )}
          <FavoriteButton promotionId={promotion.id} favorited={promotion.favorited} />
        </div>
        {promotion.applied && <p>취소는 담당자에게 연락 주세요</p>}
        {ended && !promotion.applied && <p>담당자에게 연락 주세요</p>}
        {applyPromotion.isError && <p role="alert">신청에 실패했습니다.</p>}
      </div>
    </div>
  );
}

export default PromotionDetailPage;
