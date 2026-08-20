// 도메인 정의서에 specialFoodId <-> 이모지 매핑이 정의되어 있지 않아, 문자열을 해시해서
// 고정된 이모지 하나를 결정적으로 골라준다(같은 특식은 항상 같은 이모지, 시각적 구분용).
// 프로모션 카드(FE-4)와 나의 신청 목록(FE-6)에서 공통으로 쓴다.
const FOOD_EMOJIS = ['🍖', '🍰', '🍜', '🍎', '🍕', '🍩', '🍇', '🍓'];

export function foodEmoji(specialFoodId) {
  if (!specialFoodId) return '🍖';
  let hash = 0;
  for (const ch of specialFoodId) hash = (hash * 31 + ch.charCodeAt(0)) % FOOD_EMOJIS.length;
  return FOOD_EMOJIS[hash];
}
