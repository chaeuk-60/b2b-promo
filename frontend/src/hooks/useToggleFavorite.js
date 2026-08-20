// 찜 토글 useMutation. 성공 시 목록 쿼리를 무효화해서(재조회) 화면에 즉시 반영한다.
// (10-plan.md FE-4: "낙관적 갱신 또는 재조회 중 하나로 반영" -> 재조회 방식 선택)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleFavorite } from '../api/promotion.api';

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
}
