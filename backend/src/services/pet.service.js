// 펫 조회/이름짓기/로그인 연동 mood·eggState 재계산 서비스 (10-plan.md BE-5)
// 근거: docs/1-domain-definition.md 3장(Pet), 5장(mood/eggState 전이), docs/11-pet-state-diagram.md
const pool = require('../db/pool');

// "무지개"/"반짝이" 제외한 나머지 상태(1회차 균등 랜덤·2회차 이상 재추첨 후보)
const MOOD_BASE_STATES = ['더러움', '배고픔', '삐짐', '평범', '행복', '특식 요청'];
const EGG_BASE_STATES = ['평범', '더러움', '반질반질', '특식 요청'];

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

module.exports = { getPet, nameOwnPet, resolveMoodOnLogin };
