// 프로모션 도메인 컨트롤러: req/res 파싱 + 응답, 로직은 promotion.service.js에 위임 (10-plan.md BE-4)
const promotionService = require('../services/promotion.service');

async function list(req, res, next) {
  try {
    const promotions = await promotionService.listPromotions(req.user.id);
    res.status(200).json(promotions);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const promotion = await promotionService.getPromotionForUser(
      req.params.promotionId,
      req.user.id
    );
    if (!promotion) {
      return next(
        Object.assign(new Error('프로모션을 찾을 수 없습니다.'), {
          status: 404,
          code: 'PROMOTION_NOT_FOUND',
        })
      );
    }
    res.status(200).json(promotion);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, start_date, end_date, content, special_food_id } = req.body;
    const promotion = await promotionService.createPromotion({
      title,
      start_date,
      end_date,
      content,
      special_food_id,
    });
    res.status(201).json(promotion);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const promotion = await promotionService.updatePromotion(req.params.promotionId, req.body);
    if (!promotion) {
      return next(
        Object.assign(new Error('프로모션을 찾을 수 없습니다.'), {
          status: 404,
          code: 'PROMOTION_NOT_FOUND',
        })
      );
    }
    res.status(200).json(promotion);
  } catch (err) {
    next(err);
  }
}

async function apply(req, res, next) {
  try {
    const application = await promotionService.applyToPromotion(
      req.user.id,
      req.params.promotionId
    );
    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
}

async function toggleFavorite(req, res, next) {
  try {
    const result = await promotionService.toggleFavorite(req.user.id, req.params.promotionId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, apply, toggleFavorite };
