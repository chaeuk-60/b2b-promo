// 프로모션 카드: 특식 이모지+제목/기간/내용 요약, 찜 토글, 기간종료 안내(8-wireframe.md 3번).
import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';

// 도메인 정의서에 specialFoodId <-> 이모지 매핑이 정의되어 있지 않아, 문자열을 해시해서
// 고정된 이모지 하나를 결정적으로 골라준다(같은 특식은 항상 같은 이모지, 시각적 구분용).
const FOOD_EMOJIS = ['🍖', '🍰', '🍜', '🍎', '🍕', '🍩', '🍇', '🍓'];

function foodEmoji(specialFoodId) {
  if (!specialFoodId) return '🍖';
  let hash = 0;
  for (const ch of specialFoodId) hash = (hash * 31 + ch.charCodeAt(0)) % FOOD_EMOJIS.length;
  return FOOD_EMOJIS[hash];
}

function isEnded(endDate) {
  return new Date(endDate) < new Date(new Date().toDateString());
}

function PromotionCard({ promotion }) {
  const ended = isEnded(promotion.end_date);

  return (
    <div className="pixel-card">
      <h3>
        {foodEmoji(promotion.special_food_id)} {promotion.title}
      </h3>
      <p>
        기간: {promotion.start_date} ~ {promotion.end_date}
      </p>
      <p>{promotion.content}</p>
      <FavoriteButton promotionId={promotion.id} favorited={promotion.favorited} />

      {promotion.applied ? (
        <span>신청 완료</span>
      ) : ended ? (
        <>
          <button type="button" className="pixel-btn" disabled>
            기간 종료 - 신청불가
          </button>
          <p>담당자에게 연락 주세요</p>
        </>
      ) : (
        <Link className="pixel-btn pixel-btn-primary" to={`/promotions/${promotion.id}`}>
          신청하기
        </Link>
      )}
    </div>
  );
}

export default PromotionCard;
