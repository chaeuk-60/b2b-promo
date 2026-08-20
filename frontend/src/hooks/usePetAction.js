// 펫 행동(목욕/밥/특식주기/쓰다듬기/운세) useMutation. 성공 시 펫 조회 쿼리를 무효화해서
// 재조회로 최신 상태를 반영한다(10-plan.md FE-8).
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bathePet, feedPet, feedSpecialFood, patPet, fetchFortune } from '../api/pet.api';

function usePetMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet'] });
    },
  });
}

export function useBathePet() {
  return usePetMutation(bathePet);
}

export function useFeedPet() {
  return usePetMutation(feedPet);
}

export function useFeedSpecialFood() {
  return usePetMutation(feedSpecialFood);
}

export function usePatPet() {
  return usePetMutation(patPet);
}

// 운세는 Pet이 아니라 { message }를 반환하므로 펫 쿼리를 무효화할 필요는 없지만(펫 상태
// 자체는 안 바뀜), 통일성을 위해 같은 useMutation 패턴을 그대로 쓴다.
export function useFortune() {
  return useMutation({ mutationFn: fetchFortune });
}
