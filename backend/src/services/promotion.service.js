// 프로모션 도메인 로직: 목록/상세/등록/수정/신청/찜 (10-plan.md BE-4)
const pool = require('../db/pool');

// 목록/상세 조회는 프론트에서 찜(♡/♥)·신청 완료 상태를 바로 표시할 수 있도록
// favorited/applied를 함께 내려준다(해당 사용자 기준). 내부 존재 확인용(getPromotion)은
// 이 두 필드가 필요 없는 호출부(applyToPromotion/toggleFavorite/updatePromotion)에서 계속 쓴다.
async function listPromotions(userId) {
  const { rows } = await pool.query(
    `SELECT p.*,
            EXISTS(SELECT 1 FROM favorites f WHERE f.promotion_id = p.id AND f.user_id = $1) AS favorited,
            EXISTS(SELECT 1 FROM applications a WHERE a.promotion_id = p.id AND a.user_id = $1) AS applied
       FROM promotions p
      ORDER BY p.id`,
    [userId]
  );
  return rows;
}

async function getPromotion(promotionId) {
  const { rows } = await pool.query('SELECT * FROM promotions WHERE id = $1', [promotionId]);
  return rows[0] || null;
}

async function getPromotionForUser(promotionId, userId) {
  const { rows } = await pool.query(
    `SELECT p.*,
            EXISTS(SELECT 1 FROM favorites f WHERE f.promotion_id = p.id AND f.user_id = $2) AS favorited,
            EXISTS(SELECT 1 FROM applications a WHERE a.promotion_id = p.id AND a.user_id = $2) AS applied
       FROM promotions p
      WHERE p.id = $1`,
    [promotionId, userId]
  );
  return rows[0] || null;
}

async function createPromotion({
  title,
  start_date,
  end_date,
  content,
  detail_content,
  special_food_id,
}) {
  const { rows } = await pool.query(
    `INSERT INTO promotions (title, start_date, end_date, content, detail_content, special_food_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title, start_date, end_date, content, detail_content || '', special_food_id]
  );
  return rows[0];
}

async function updatePromotion(promotionId, fields) {
  const { title, start_date, end_date, content, detail_content, special_food_id } = fields;
  const { rows } = await pool.query(
    `UPDATE promotions
     SET title = COALESCE($1, title),
         start_date = COALESCE($2, start_date),
         end_date = COALESCE($3, end_date),
         content = COALESCE($4, content),
         detail_content = COALESCE($5, detail_content),
         special_food_id = COALESCE($6, special_food_id)
     WHERE id = $7
     RETURNING *`,
    [title, start_date, end_date, content, detail_content, special_food_id, promotionId]
  );
  return rows[0] || null;
}

async function applyToPromotion(userId, promotionId) {
  const promotion = await getPromotion(promotionId);
  if (!promotion) {
    throw Object.assign(new Error('프로모션을 찾을 수 없습니다.'), {
      status: 404,
      code: 'PROMOTION_NOT_FOUND',
    });
  }

  // pg가 DATE 컬럼을 Date 객체로 파싱해도, 문자열로 와도 안전하게 비교되도록 YYYY-MM-DD로 정규화한다.
  const endDate =
    promotion.end_date instanceof Date
      ? promotion.end_date.toISOString().slice(0, 10)
      : String(promotion.end_date).slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  if (endDate < today) {
    throw Object.assign(
      new Error('신청 기간이 종료된 프로모션입니다. 담당자에게 연락 주세요.'),
      { status: 400, code: 'PROMOTION_ENDED' }
    );
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO applications (user_id, promotion_id) VALUES ($1, $2) RETURNING *',
      [userId, promotionId]
    );
    return rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw Object.assign(new Error('이미 신청한 프로모션입니다.'), {
        status: 400,
        code: 'DUPLICATE_APPLICATION',
      });
    }
    throw err;
  }
}

async function toggleFavorite(userId, promotionId) {
  const promotion = await getPromotion(promotionId);
  if (!promotion) {
    throw Object.assign(new Error('프로모션을 찾을 수 없습니다.'), {
      status: 404,
      code: 'PROMOTION_NOT_FOUND',
    });
  }

  const { rows } = await pool.query(
    'SELECT 1 FROM favorites WHERE user_id = $1 AND promotion_id = $2',
    [userId, promotionId]
  );

  if (rows.length > 0) {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND promotion_id = $2', [
      userId,
      promotionId,
    ]);
    return { favorited: false };
  }

  await pool.query('INSERT INTO favorites (user_id, promotion_id) VALUES ($1, $2)', [
    userId,
    promotionId,
  ]);
  return { favorited: true };
}

// 나의 신청 목록 화면(8-wireframe.md 5번)은 제목/신청일/기간을 카드로 보여줘야 해서
// applications 원본 행만으로는 부족하다 - promotions를 조인해 필요한 필드를 함께 내려준다.
async function listMyApplications(userId) {
  const { rows } = await pool.query(
    `SELECT a.id, a.promotion_id, a.applied_at, a.special_food_used_at,
            p.title, p.start_date, p.end_date, p.special_food_id
       FROM applications a
       JOIN promotions p ON p.id = a.promotion_id
      WHERE a.user_id = $1
      ORDER BY a.applied_at DESC`,
    [userId]
  );
  return rows;
}

module.exports = {
  listPromotions,
  getPromotion,
  getPromotionForUser,
  createPromotion,
  updatePromotion,
  applyToPromotion,
  toggleFavorite,
  listMyApplications,
};
