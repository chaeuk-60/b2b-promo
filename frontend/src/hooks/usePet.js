// 펫 도메인 훅. FE-3에서 이름 짓기 mutation부터 시작해 FE-7/FE-8에서 조회/행동 훅이 이어서 추가된다.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPet, namePet } from '../api/pet.api';

export function useNamePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: namePet,
    // 펫 팝업이 처음 뜰 때 이름이 없으면 이름 짓기 폼을 보여주는데(PetPanel.jsx), 이름을
    // 지은 뒤 별도 이동 없이 그 자리에서 바로 평소 펫 화면으로 넘어가려면 캐시를 갱신해야 한다.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pet'] }),
  });
}

export function usePet() {
  return useQuery({
    queryKey: ['pet'],
    queryFn: getPet,
    retry: false,
  });
}
