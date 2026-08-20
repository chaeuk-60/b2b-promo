// 펫 조회/이름짓기/로그인 연동 mood·eggState 재계산 서비스 (10-plan.md BE-5)
// 근거: docs/1-domain-definition.md 3장(Pet), 5장(mood/eggState 전이), docs/11-pet-state-diagram.md
const pool = require('../db/pool');

// "무지개"/"반짝이" 제외한 나머지 상태(1회차 균등 랜덤·2회차 이상 재추첨 후보)
const MOOD_BASE_STATES = ['더러움', '배고픔', '삐짐', '평범', '행복', '특식 요청'];
const EGG_BASE_STATES = ['평범', '더러움', '반질반질', '특식 요청'];

// 도메인 정의서 2장의 귀 타입 5종(auth.service.js의 signup과 동일)
const EAR_TYPES = ['위로 곧게', '앞으로 접힘', '옆으로 처짐', '뒤로 말림', '아래로 늘어짐'];

// 오늘의 운세 문구(도메인 정의서 5장): 특정 종교/미신/의학적 표현 없이 가벼운 응원 톤.
const FORTUNE_MESSAGES = [
  '오늘은 평소보다 조금 더 용기를 내도 좋은 날이에요.',
  '생각지도 못한 곳에서 좋은 소식이 들려올 거예요.',
  '작은 습관 하나가 오늘 큰 변화를 만들어줄 수 있어요.',
  '미뤄뒀던 일을 시작하기에 딱 좋은 타이밍이에요.',
  '주변 사람에게 건넨 따뜻한 말 한마디가 오늘의 행운을 부를 거예요.',
  '오늘 하루는 무리하지 말고 나를 먼저 챙겨보세요.',
  '꾸준함이 빛을 발하는 하루가 될 거예요.',
  '뜻밖의 기회가 찾아올 수 있으니 주변을 잘 살펴보세요.',
  '오늘의 작은 성취가 내일의 큰 자신감이 될 거예요.',
];

// KST(UTC+9) 기준 날짜 문자열(YYYY-MM-DD). 하루 경계 판정에 사용(도메인 정의서 1장 "하루" 기준).
function toKstDateString(date) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// 1회차/재추첨 공통: 특수 고정 상태를 제외한 목록 중 균등 랜덤. "특식 요청"은 후보가 있을 때만 포함.
function rollBaseState(baseStates, includeRequestState) {
  const candidates = includeRequestState
    ? baseStates
    : baseStates.filter((s) => s !== '특식 요청');
  return pickRandom(candidates);
}

// 새끼/성체 mood 재계산: 3회차 이상 70% 행복 덮어씀 → 2회차 이상 70% 평범/30% 재추첨 → 1회차 균등 랜덤
function rollMood(loginCount, includeRequestState) {
  if (loginCount >= 3 && Math.random() < 0.7) {
    return '행복';
  }
  if (loginCount >= 2) {
    if (Math.random() < 0.7) return '평범';
    return rollBaseState(MOOD_BASE_STATES, includeRequestState);
  }
  return rollBaseState(MOOD_BASE_STATES, includeRequestState);
}

// 알 eggState 재계산: mood와 동일 패턴이나 "행복 3회차 덮어쓰기"는 없음
function rollEggState(loginCount, includeRequestState) {
  if (loginCount >= 2) {
    if (Math.random() < 0.7) return '평범';
    return rollBaseState(EGG_BASE_STATES, includeRequestState);
  }
  return rollBaseState(EGG_BASE_STATES, includeRequestState);
}

// 특식 요청 대상 선정: 찜만 하고 미신청인 프로모션이 있으면 70% 확률로 그중 하나, 나머지는 전체 후보 중 랜덤
function pickRequestedPromotionId(candidateIds, favoriteOnlyIds) {
  if (candidateIds.length === 0) return null;
  if (favoriteOnlyIds.length > 0 && Math.random() < 0.7) {
    return pickRandom(favoriteOnlyIds);
  }
  return pickRandom(candidateIds);
}

// 특식 요청 후보(신청 완료·기간 종료 제외한 나머지 프로모션)와, 그중 찜만 하고 미신청인 것을 함께 조회
async function getRequestCandidates(userId) {
  const result = await pool.query(
    `SELECT p.id,
            EXISTS(
              SELECT 1 FROM favorites f WHERE f.promotion_id = p.id AND f.user_id = $1
            ) AS is_favorited
       FROM promotions p
      WHERE p.end_date >= CURRENT_DATE
        AND NOT EXISTS (
          SELECT 1 FROM applications a WHERE a.promotion_id = p.id AND a.user_id = $1
        )`,
    [userId]
  );
  const candidateIds = result.rows.map((r) => r.id);
  const favoriteOnlyIds = result.rows.filter((r) => r.is_favorited).map((r) => r.id);
  return { candidateIds, favoriteOnlyIds };
}

async function getPet(userId) {
  const result = await pool.query('SELECT * FROM pets WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
}

async function nameOwnPet(userId, name) {
  const result = await pool.query(
    'UPDATE pets SET name = $1 WHERE user_id = $2 RETURNING *',
    [name || null, userId]
  );
  return result.rows[0] || null;
}

// 로그인 시 호출: KST 기준 하루가 바뀌었으면 daily_login_count를 1로 리셋, 아니면 +1 하고
// 그 값(이번 로그인이 몇 번째 접속인지)을 기준으로 mood(새끼/성체) 또는 eggState(알)를 재계산한다.
async function resolveMoodOnLogin(userId) {
  const pet = await getPet(userId);
  if (!pet) return null;
  if (pet.stage === '묘비') return pet; // 사망/부활 로직은 BE-7 범위, 건드리지 않음

  const now = new Date();
  const isNewDay = toKstDateString(new Date(pet.last_active_at)) !== toKstDateString(now);
  const loginCount = isNewDay ? 1 : pet.daily_login_count + 1;

  let mood = pet.mood;
  let eggState = pet.egg_state;
  let requestedPromotionId = pet.requested_promotion_id;

  if (pet.stage === '알') {
    const isFixed = !isNewDay && (eggState === '무지개' || eggState === '반짝이');
    if (!isFixed) {
      const { candidateIds, favoriteOnlyIds } = await getRequestCandidates(userId);
      eggState = rollEggState(loginCount, candidateIds.length > 0);
      requestedPromotionId =
        eggState === '특식 요청' ? pickRequestedPromotionId(candidateIds, favoriteOnlyIds) : null;
    }
  } else if (pet.stage === '새끼' || pet.stage === '성체') {
    const isFixed = !isNewDay && (mood === '행복' || mood === '무지개' || mood === '반짝이');
    if (!isFixed) {
      const { candidateIds, favoriteOnlyIds } = await getRequestCandidates(userId);
      mood = rollMood(loginCount, candidateIds.length > 0);
      requestedPromotionId =
        mood === '특식 요청' ? pickRequestedPromotionId(candidateIds, favoriteOnlyIds) : null;
    }
  }

  const result = await pool.query(
    `UPDATE pets
        SET mood = $1,
            egg_state = $2,
            requested_promotion_id = $3,
            daily_login_count = $4,
            last_active_at = now()
      WHERE user_id = $5
      RETURNING *`,
    [mood, eggState, requestedPromotionId, loginCount, userId]
  );
  return result.rows[0];
}

// 성장 전이 시도(알→새끼, 새끼→성체): activityCount 임계치 충족 시 50% 확률 판정.
// 실패/미충족이면 UPDATE 없이 pet 그대로 반환.
async function checkStageTransition(pet, random) {
  if (pet.stage === '알' && pet.activity_count >= 2) {
    if (random() < 0.5) {
      const result = await pool.query(
        `UPDATE pets
            SET stage = '새끼', egg_state = NULL, mood = '평범', stage_changed_at = now()
          WHERE user_id = $1
          RETURNING *`,
        [pet.user_id]
      );
      return result.rows[0];
    }
    return pet;
  }
  if (pet.stage === '새끼' && pet.activity_count >= 5) {
    if (random() < 0.5) {
      const result = await pool.query(
        `UPDATE pets
            SET stage = '성체', stage_changed_at = now()
          WHERE user_id = $1
          RETURNING *`,
        [pet.user_id]
      );
      return result.rows[0];
    }
    return pet;
  }
  return pet;
}

// 목욕/밥/쓰다듬기 공통 처리: 도메인 정의서 5.1절 단계별 행동표 그대로.
async function applyAction(userId, action, { random = Math.random } = {}) {
  let pet = await getPet(userId);
  if (!pet || pet.stage === '묘비') return pet;

  let mood = pet.mood;
  let eggState = pet.egg_state;

  if (pet.stage === '알') {
    if (action === 'bathe') eggState = '반질반질';
    // feed/pat: eggState 변경 없음
  } else {
    if (action === 'bathe' && mood === '더러움') mood = '평범';
    if (action === 'feed' && mood === '배고픔') mood = '평범';
    if (action === 'pat' && mood === '삐짐') mood = '평범';
  }

  const result = await pool.query(
    `UPDATE pets
        SET mood = $1, egg_state = $2, activity_count = activity_count + 1
      WHERE user_id = $3
      RETURNING *`,
    [mood, eggState, userId]
  );
  pet = result.rows[0];

  return checkStageTransition(pet, random);
}

// 특식 급여: 요청받은 특식과 일치하면 무지개, 그 외(자발적 급여)는 50% 진화 시도/50% 반짝이.
async function feedSpecialFood(userId, promotionId, { random = Math.random } = {}) {
  let pet = await getPet(userId);
  if (!pet || pet.stage === '묘비') return pet;

  const owned = await pool.query(
    'SELECT 1 FROM applications WHERE user_id = $1 AND promotion_id = $2',
    [userId, promotionId]
  );
  if (owned.rows.length === 0) {
    throw Object.assign(new Error('보유하지 않은 특식입니다.'), {
      status: 400,
      code: 'SPECIAL_FOOD_NOT_OWNED',
    });
  }

  const field = pet.stage === '알' ? 'egg_state' : 'mood';
  // pg는 BIGINT(requested_promotion_id)를 문자열로 반환하는데 promotionId는 JSON에서 숫자로 오므로,
  // 문자열로 정규화해서 비교해야 한다(그냥 === 비교하면 타입이 달라 항상 false가 된다).
  const isRequested =
    pet[field] === '특식 요청' &&
    pet.requested_promotion_id != null &&
    String(pet.requested_promotion_id) === String(promotionId);

  if (isRequested) {
    const result = await pool.query(
      `UPDATE pets
          SET ${field} = '무지개', requested_promotion_id = NULL, activity_count = activity_count + 1
        WHERE user_id = $1
        RETURNING *`,
      [userId]
    );
    return result.rows[0];
  }

  // 자발적 급여: activityCount 증가 후 50/50으로 진화 시도 또는 반짝이 부여
  const incremented = await pool.query(
    `UPDATE pets SET activity_count = activity_count + 1 WHERE user_id = $1 RETURNING *`,
    [userId]
  );
  pet = incremented.rows[0];

  if (random() < 0.5) {
    return checkStageTransition(pet, random);
  }

  const result = await pool.query(
    `UPDATE pets SET ${field} = '반짝이' WHERE user_id = $1 RETURNING *`,
    [userId]
  );
  return result.rows[0];
}

// 새 알로 리셋할 때 공통으로 SET할 컬럼(부활/성체 순환 공용). extraSet은 추가 컬럼(선물 지급 등).
async function resetToNewEgg(userId, extraSet = '') {
  const earType = pickRandom(EAR_TYPES);
  const result = await pool.query(
    `UPDATE pets
        SET stage = '알', name = NULL, mood = NULL, egg_state = '평범',
            requested_promotion_id = NULL, activity_count = 0,
            ear_type = $1, stage_changed_at = now()${extraSet}
      WHERE user_id = $2
      RETURNING *`,
    [earType, userId]
  );
  return result.rows[0];
}

// 로그인 시 호출: 사망(7일 미접속) 우선 판정 → 이미 죽어있었다면 부활(새 알) → 성체 순환(2주 경과, 선물 100%) 순으로 확인.
async function checkDeathOrCycle(userId) {
  const pet = await getPet(userId);
  if (!pet) return null;

  if (pet.stage !== '묘비') {
    const deadResult = await pool.query(
      `UPDATE pets SET stage = '묘비'
        WHERE user_id = $1 AND last_active_at <= now() - interval '7 days'
        RETURNING *`,
      [userId]
    );
    if (deadResult.rows.length > 0) return deadResult.rows[0];
  }

  if (pet.stage === '묘비') {
    return resetToNewEgg(userId);
  }

  if (pet.stage === '성체') {
    const cycleResult = await pool.query(
      `SELECT 1 FROM pets WHERE user_id = $1 AND stage_changed_at <= now() - interval '14 days'`,
      [userId]
    );
    if (cycleResult.rows.length > 0) {
      return resetToNewEgg(userId, ', last_gift_at = now()');
    }
  }

  return pet;
}

// 성체 상태에서 3일 쿨다운 후 5% 확률로 선물(last_gift_at 갱신) 지급.
async function maybeGrantGift(userId, { random = Math.random } = {}) {
  const pet = await getPet(userId);
  if (!pet || pet.stage !== '성체') return pet;

  if (pet.last_gift_at) {
    const cooldownResult = await pool.query(
      `SELECT 1 FROM pets WHERE user_id = $1 AND last_gift_at > now() - interval '3 days'`,
      [userId]
    );
    if (cooldownResult.rows.length > 0) return pet;
  }

  if (random() < 0.05) {
    const result = await pool.query(
      `UPDATE pets SET last_gift_at = now() WHERE user_id = $1 RETURNING *`,
      [userId]
    );
    return result.rows[0];
  }

  return pet;
}

// 오늘의 운세: 새끼/성체 전용, 하루 1회 랜덤 문구 뽑기(같은 날 재요청 시 저장된 결과 유지).
async function getTodayFortune(userId) {
  const pet = await getPet(userId);
  if (!pet || pet.stage === '알' || pet.stage === '묘비') {
    throw Object.assign(new Error('오늘의 운세는 새끼/성체 단계에서만 이용할 수 있습니다.'), {
      status: 400,
      code: 'FORTUNE_NOT_AVAILABLE',
    });
  }

  const today = toKstDateString(new Date());
  if (pet.fortune_date === today) {
    return pet.fortune_message;
  }

  const message = pickRandom(FORTUNE_MESSAGES);
  await pool.query(
    'UPDATE pets SET fortune_message = $1, fortune_date = $2 WHERE user_id = $3',
    [message, today, userId]
  );
  return message;
}

module.exports = {
  getPet,
  nameOwnPet,
  resolveMoodOnLogin,
  applyAction,
  feedSpecialFood,
  checkDeathOrCycle,
  maybeGrantGift,
  getTodayFortune,
};
