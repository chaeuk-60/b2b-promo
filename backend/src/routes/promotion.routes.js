// 프로모션 도메인 라우트 (10-plan.md BE-4)
const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const promotionController = require('../controllers/promotion.controller');

const router = express.Router();

router.get('/', authMiddleware, promotionController.list);
router.post('/', authMiddleware, adminMiddleware, promotionController.create);
router.get('/:promotionId', authMiddleware, promotionController.getOne);
router.put('/:promotionId', authMiddleware, adminMiddleware, promotionController.update);
router.post('/:promotionId/apply', authMiddleware, promotionController.apply);
router.post('/:promotionId/favorite', authMiddleware, promotionController.toggleFavorite);

module.exports = router;
