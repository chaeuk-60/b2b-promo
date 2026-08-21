// 찜 토글 useMutation. 성공 시 목록 쿼리를 무효화해서(재조회) 화면에 즉시 반영한다.
// (10-plan.md FE-4: "낙관적 갱신 또는 재조회 중 하나로 반영" -> 재조회 방식 선택)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleFavorite } from '../api/promotion.api';

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleFavorite,
    // 버그: 목록 쿼리(['promotions'])만 무효화해서 상세 화면(['promotion', id])은 API가
    // 성공해도 찜 상태가 화면에 반영되지 않았다(사용자 확인: "상세페이지 찜 잘 안된다").
    // id 타입이 호출부마다 문자열/숫자로 섞여 들어올 수 있어(useParams는 문자열, 목록
    // 응답은 DB bigint 문자열) queryKey 완전 일치 대신 predicate로 'promotion' 상세
    // 쿼리를 전부 무효화한다.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'promotion',
      });
    },
  });
}
