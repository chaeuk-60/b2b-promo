// 프로모션 도메인 API 함수(fetch만, 캐싱 없음). FE-4에서 목록/찜부터 시작해
// FE-5/FE-9에서 상세/신청/등록·수정이 이어서 추가된다.
import client from './client';

export function listPromotions() {
  return client.get('/promotions').then((res) => res.data);
}

export function getPromotion(promotionId) {
  return client.get(`/promotions/${promotionId}`).then((res) => res.data);
}

export function toggleFavorite(promotionId) {
  return client.post(`/promotions/${promotionId}/favorite`).then((res) => res.data);
}

export function applyPromotion(promotionId) {
  return client.post(`/promotions/${promotionId}/apply`).then((res) => res.data);
}
