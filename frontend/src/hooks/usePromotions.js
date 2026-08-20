// 프로모션 목록 useQuery. (10-plan.md FE-4)
import { useQuery } from '@tanstack/react-query';
import { listPromotions } from '../api/promotion.api';

export function usePromotions() {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: listPromotions,
    retry: false,
  });
}
