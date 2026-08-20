// 펫 도메인 API 함수(fetch만, 캐싱 없음). FE-3에서 이름 짓기부터 시작해 FE-7/FE-8에서
// 조회/행동 API가 이어서 추가된다.
import client from './client';

export function getPet() {
  return client.get('/pet').then((res) => res.data.pet);
}

export function namePet({ name }) {
  return client.patch('/pet/name', { name }).then((res) => res.data);
}

export function bathePet() {
  return client.post('/pet/bathe').then((res) => res.data);
}

export function feedPet() {
  return client.post('/pet/feed').then((res) => res.data);
}

export function feedSpecialFood({ promotionId }) {
  return client.post('/pet/feed-special-food', { promotionId }).then((res) => res.data);
}

export function patPet() {
  return client.post('/pet/pat').then((res) => res.data);
}

export function fetchFortune() {
  return client.post('/pet/fortune').then((res) => res.data);
}
