// 신청 도메인 컨트롤러: 나의 신청 목록 조회 (10-plan.md BE-4)
const promotionService = require('../services/promotion.service');

async function listMine(req, res, next) {
  try {
    const applications = await promotionService.listMyApplications(req.user.id);
    res.status(200).json(applications);
  } catch (err) {
    next(err);
  }
}

module.exports = { listMine };
