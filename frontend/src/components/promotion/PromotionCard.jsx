// 프로모션 카드: 특식 이모지+제목/기간/내용 요약, 찜 토글, 기간종료 안내(8-wireframe.md 3번).
import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';
import { foodEmoji } from '../../utils/foodEmoji';

function isEnded(endDate) {
  return new Date(endDate) < new Date(new Date().toDateString());
}

function PromotionCard({ promotion }) {
  const ended = isEnded(promotion.end_date);

  return (
    <div className="pixel-card">
      {/* 창 제목표시줄(pixel-titlebar) - 펫 팝업과 같은 톤으로 통일. 제목을 눌러도
          상세로 갈 수 있게 링크로 둔다(기간 종료 카드는 목록에 다른 링크가 없어
          상세 화면 자체에 도달할 방법이 없었던 문제도 같이 해결됨). */}
      <div className="pixel-titlebar">
        <Link className="pixel-titlebar-title" to={`/promotions/${promotion.id}`}>
          {foodEmoji(promotion.special_food_id)} {promotion.title}
        </Link>
      </div>
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
          <Link className="pixel-btn pixel-btn-primary" to={`/promotions/${promotion.id}`}>
            신청하기
          </Link>
        )}
        <FavoriteButton promotionId={promotion.id} favorited={promotion.favorited} />
      </div>
      {ended && !promotion.applied && <p>담당자에게 연락 주세요</p>}
    </div>
  );
}

export default PromotionCard;
