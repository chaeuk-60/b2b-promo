// 펫 도메인 API 함수(fetch만, 캐싱 없음). FE-3에서 이름 짓기부터 시작해 FE-7/FE-8에서
// 조회/행동 API가 이어서 추가된다.
import client from './client';

export function namePet({ name }) {
  return client.patch('/pet/name', { name }).then((res) => res.data);
}
