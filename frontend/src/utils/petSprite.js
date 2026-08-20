// 펫 스프라이트/대사 매핑(2-pet-design-guide.md, 8-wireframe.md 6번).
// 애셋은 frontend/public/images/에 있다(레포 루트 images/ 원본을 그대로 복사).
//
// ear_type <-> 동물 스프라이트 매핑은 도메인 문서에 명시돼 있지 않아, 실제 SVG의 귀 픽셀
// 모양(위치/방향)을 보고 판단한 결정적 매핑이다(예: cat은 위로 뾰족, dog는 옆면을 따라
// 길게 늘어짐, cow는 머리 밖으로 옆으로 뻗음). 나중에 다른 매핑이 맞다고 확인되면 이 표만
// 바꾸면 된다.
const EAR_TO_ANIMAL = {
  '위로 곧게': 'cat',
  '앞으로 접힘': 'rabbit',
  '옆으로 처짐': 'cow',
  '뒤로 말림': 'bear',
  '아래로 늘어짐': 'dog',
};

export function bodySpriteUrl(stage, earType) {
  const animal = EAR_TO_ANIMAL[earType] || 'cat';
  const prefix = stage === '새끼' ? 'baby' : 'adult';
  return `/images/${prefix}-${animal}.svg`;
}

export function eggSpriteUrl(eggState) {
  return `/images/egg-${(eggState || '평범').replace(' ', '')}.svg`;
}

export function moodOverlayUrl(mood) {
  if (!mood || mood === '행복') return null; // 행복은 정적 오버레이 대신 걷기 애니메이션으로 표현
  return `/images/mood-${mood.replace(' ', '')}.svg`;
}

export const HAPPY_WALK_FRAMES = ['/images/happy-walk-1.svg', '/images/happy-walk-2.svg', '/images/happy-walk-3.svg'];

export const TOMBSTONE_SPRITE_URL = '/images/tombstone.svg';
export const TOMBSTONE_MESSAGE = '자주 오세요...';

// 일상 대사: 알은 옹알이/의성어 수준, 새끼/성체는 문장 형태(1-domain-definition.md 5장).
// 정확한 문구 목록이 도메인 문서에 없어 위 규칙에 맞춰 새로 작성한 예시 문구다.
const EGG_DIALOGUE = {
  평범: '...',
  더러움: '(꾸물꾸물)',
  반질반질: '반짝✨',
  무지개: '뿌잉~',
  반짝이: '초롱초롱',
  '특식 요청': '(꼼지락꼼지락)',
};

const MOOD_DIALOGUE = {
  평범: '오늘도 좋은 하루예요',
  더러움: '몸이 근질근질해요...',
  배고픔: '꼬르륵... 배고파요',
  삐짐: '흥, 아무도 안 놀아줘요',
  행복: '신난다!',
  무지개: '기분이 완전 좋아요!',
  반짝이: '반짝반짝 빛나요',
  '특식 요청': '맛있는 특식이 먹고 싶어요!',
};

export function eggDialogue(eggState) {
  return EGG_DIALOGUE[eggState] || EGG_DIALOGUE['평범'];
}

export function moodDialogue(mood) {
  return MOOD_DIALOGUE[mood] || MOOD_DIALOGUE['평범'];
}
