// 찜 토글 버튼(목록/상세 어디서나 재사용, 8-wireframe.md). ♡(찜 안 함)/♥(찜 함) 표시.
import { useToggleFavorite } from '../../hooks/useToggleFavorite';

function FavoriteButton({ promotionId, favorited }) {
  const toggleFavorite = useToggleFavorite();

  return (
    <button
      type="button"
      onClick={() => toggleFavorite.mutate(promotionId)}
      disabled={toggleFavorite.isPending}
      aria-pressed={favorited}
    >
      {favorited ? '♥ 찜' : '♡ 찜'}
    </button>
  );
}

export default FavoriteButton;
