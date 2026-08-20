// 프로모션 상세 useQuery. (10-plan.md FE-5)
import { useQuery } from '@tanstack/react-query';
import { getPromotion } from '../api/promotion.api';

export function usePromotion(promotionId) {
  return useQuery({
    queryKey: ['promotion', promotionId],
    queryFn: () => getPromotion(promotionId),
    retry: false,
  });
}
