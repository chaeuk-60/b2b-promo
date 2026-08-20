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

// 성체 스프라이트는 얼굴 색(눈 주변 배경)이 동물마다 달라, 눈 깜빡임 오버레이 색을
// 맞추는 데 쓴다(SVG 픽셀을 직접 확인해 얻은 값 - 2-pet-design-guide.md에 색상표 없음).
const FACE_COLOR_BY_ANIMAL = {
  cat: '#e0f2ff',
  dog: '#e0ffe7',
  bear: '#fff3d5',
  cow: '#eee0ff',
  rabbit: '#ffdde0',
};

export function bodySpriteUrl(stage, earType) {
  const animal = EAR_TO_ANIMAL[earType] || 'cat';
  const prefix = stage === '새끼' ? 'baby' : 'adult';
  return `/images/${prefix}-${animal}.svg`;
}

export function faceColorFor(earType) {
  const animal = EAR_TO_ANIMAL[earType] || 'cat';
  return FACE_COLOR_BY_ANIMAL[animal];
}

// 성체는 원본 스프라이트에 이미 그려진 두 다리 중 한쪽의 발끝 픽셀을 지운 변형 2장을
// 만들어 두었다(walk-2/walk-3, 스크립트로 생성). 원본(walk-1) <-> 왼발 듦 <-> 오른발
// 듦을 오가며 걷는 느낌을 낸다. 새끼는 원본 스프라이트에 다리가 따로 그려져 있지 않아
// (몸통 아래가 평평함) 이 애니메이션을 적용할 수 없다.
export function adultWalkFrameUrl(earType, frame) {
  const animal = EAR_TO_ANIMAL[earType] || 'cat';
  if (frame === 0) return `/images/adult-${animal}.svg`;
  return `/images/adult-${animal}-walk-${frame + 1}.svg`;
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

// 일상 대사: 알은 옹알이/의성어 수준, 새끼/성체는 문장 형태, 각 단계마다 여러 개의 목록을
// 갖고 그중에서 랜덤으로 골라 출력한다(1-domain-definition.md 5장 "일상 대사"). 정확한
// 문구 목록이 도메인 문서에 없어 위 규칙에 맞춰 새로 작성한 예시 문구다.
const EGG_DIALOGUE = {
  평범: ['...', '(콩콩)', '음냐음냐'],
  더러움: ['(꾸물꾸물)', '(꼬물꼬물)'],
  반질반질: ['반짝✨', '뽀득뽀득'],
  무지개: ['뿌잉~', '(두근두근)'],
  반짝이: ['초롱초롱', '반짝반짝'],
  '특식 요청': ['(꼼지락꼼지락)', '(꼬르륵)'],
};

// 새끼는 아기 말투로 짧게, 성체는 완전한 문장으로 말한다(사용자 확인).
const BABY_MOOD_DIALOGUE = {
  평범: ['조아', '헤헤', '음냐~'],
  더러움: ['근질근질..', '더러워따'],
  배고픔: ['배고파따', '맘마 조'],
  삐짐: ['삐짐!', '흥이다'],
  행복: ['신나따!', '조아조아'],
  무지개: ['우와아', '예뻐따'],
  반짝이: ['반짝반짝', '나빛나'],
  '특식 요청': ['마시써..', '그거 조'],
};

const ADULT_MOOD_DIALOGUE = {
  평범: ['오늘도 좋은 하루예요', '뭐하고 놀까요?', '(콧노래)'],
  더러움: ['몸이 근질근질해요...', '씻고 싶어요'],
  배고픔: ['꼬르륵... 배고파요', '밥 주세요!'],
  삐짐: ['흥, 아무도 안 놀아줘요', '삐졌어요...'],
  행복: ['신난다!', '오늘 최고예요!'],
  무지개: ['기분이 완전 좋아요!', '완전 무지개 기분!'],
  반짝이: ['반짝반짝 빛나요', '나 좀 반짝이지 않아요?'],
  '특식 요청': ['맛있는 특식이 먹고 싶어요!', '그 특식... 저 주시면 안 돼요?'],
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function eggDialoguePool(eggState) {
  return EGG_DIALOGUE[eggState] || EGG_DIALOGUE['평범'];
}

export function moodDialoguePool(mood, stage) {
  const table = stage === '새끼' ? BABY_MOOD_DIALOGUE : ADULT_MOOD_DIALOGUE;
  return table[mood] || table['평범'];
}

export function pickDialogue(pool) {
  return pickRandom(pool);
}
