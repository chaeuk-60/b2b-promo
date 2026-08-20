// 프로모션 도메인 로직: 목록/상세/등록/수정/신청/찜 (10-plan.md BE-4)
const pool = require('../db/pool');

async function listPromotions() {
  const { rows } = await pool.query('SELECT * FROM promotions ORDER BY id');
  return rows;
}

async function getPromotion(promotionId) {
  const { rows } = await pool.query('SELECT * FROM promotions WHERE id = $1', [promotionId]);
  return rows[0] || null;
}

async function createPromotion({ title, start_date, end_date, content, special_food_id }) {
  const { rows } = await pool.query(
    `INSERT INTO promotions (title, start_date, end_date, content, special_food_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, start_date, end_date, content, special_food_id]
  );
  return rows[0];
}

async function updatePromotion(promotionId, fields) {
  const { title, start_date, end_date, content, special_food_id } = fields;
  const { rows } = await pool.query(
    `UPDATE promotions
     SET title = COALESCE($1, title),
         start_date = COALESCE($2, start_date),
         end_date = COALESCE($3, end_date),
         content = COALESCE($4, content),
         special_food_id = COALESCE($5, special_food_id)
     WHERE id = $6
     RETURNING *`,
    [title, start_date, end_date, content, special_food_id, promotionId]
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

async function listMyApplications(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM applications WHERE user_id = $1 ORDER BY applied_at DESC',
    [userId]
  );
  return rows;
}

module.exports = {
  listPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  applyToPromotion,
  toggleFavorite,
  listMyApplications,
};
