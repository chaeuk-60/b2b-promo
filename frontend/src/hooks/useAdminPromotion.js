// 관리자 프로모션 등록/수정 useMutation. 성공 시 목록 쿼리를 무효화해서 재조회로
// 즉시 반영한다(10-plan.md FE-9).
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPromotion, updatePromotion } from '../api/promotion.api';

export function useCreatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
}
