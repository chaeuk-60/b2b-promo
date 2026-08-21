// 프로모션 카드: 특식 이모지+제목/기간/내용 요약, 찜 토글, 기간종료 안내(8-wireframe.md 3번).
import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';
import { useApplyPromotion } from '../../hooks/useApplyPromotion';
import { foodEmoji } from '../../utils/foodEmoji';

function isEnded(endDate) {
  return new Date(endDate) < new Date(new Date().toDateString());
}

function PromotionCard({ promotion }) {
  const ended = isEnded(promotion.end_date);
  const applyPromotion = useApplyPromotion(promotion.id);

  return (
    <div className="pixel-card">
      {/* 목록 카드는 제목표시줄 없이 일반 제목으로(사용자 확인: 파란 상태줄이 목록에서는
          답답해 보임 - 펫 팝업/상세는 그대로 유지). 제목은 더 이상 링크가 아니다(사용자 확인:
          "신청하기 누르면 상세로 들어갈게 아니라 신청이 되야하고, 타이틀이 아니라 상세보기
          버튼을 눌러야 상세로 넘어가게") - 상세 이동은 아래 "상세보기" 버튼 전용. */}
      {/* 제목 밑줄 대신 형광펜으로 칠한 듯한 옅은 하이라이트로 강조(사용자 확인,
          이모지에는 하이라이트를 넣지 않고 제목 글자에만 건다). */}
      <h3 className="promo-card-title">
        {foodEmoji(promotion.special_food_id)} <span className="promo-card-title-highlight">{promotion.title}</span>
      </h3>
      <p>
        기간: {promotion.start_date} ~ {promotion.end_date}
      </p>
      <p>{promotion.content}</p>

      {/* 신청하기는 상세로 이동하지 않고 그 자리에서 바로 신청하며, 상세 이동은 별도
          "상세보기" 버튼으로 분리한다(사용자 확인). 찜은 그 옆에 나란히. */}
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
        <Link className="pixel-btn" to={`/promotions/${promotion.id}`}>
          상세보기
        </Link>
        <FavoriteButton promotionId={promotion.id} favorited={promotion.favorited} />
      </div>
      {ended && !promotion.applied && <p className="promo-card-note">※ 담당자에게 연락 주세요</p>}
      {applyPromotion.isError && <p role="alert">신청에 실패했습니다.</p>}
    </div>
  );
}

export default PromotionCard;
