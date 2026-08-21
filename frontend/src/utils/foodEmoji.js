// 특식 ID는 관리자가 프로모션 등록/수정 화면에서 직접 입력한 이모지 그 자체다(사용자 확인:
// "특식ID는 그냥 입력한 이모지 쓸수 있게, 랜덤 말고" - 이전엔 문자열을 해시해서 8개 후보 중
// 하나를 결정적으로 골라줬는데, 그 간접 매핑을 없애고 입력값을 그대로 보여준다).
export function foodEmoji(specialFoodId) {
  return specialFoodId || '🍖';
}
