// 펫 도메인 훅. FE-3에서 이름 짓기 mutation부터 시작해 FE-7/FE-8에서 조회/행동 훅이 이어서 추가된다.
import { useMutation } from '@tanstack/react-query';
import { namePet } from '../api/pet.api';

export function useNamePet() {
  return useMutation({ mutationFn: namePet });
}
