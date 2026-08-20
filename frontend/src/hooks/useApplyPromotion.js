// 프로모션 신청 useMutation. 성공 시 상세/목록 쿼리를 무효화해서 재조회로 반영한다.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applyPromotion } from '../api/promotion.api';

export function useApplyPromotion(promotionId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => applyPromotion(promotionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion', promotionId] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
}
