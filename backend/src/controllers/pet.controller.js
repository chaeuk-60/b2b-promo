// 펫 도메인 컨트롤러: req/res 파싱 + 응답, 로직은 pet.service.js에 위임 (10-plan.md BE-5)
const petService = require('../services/pet.service');

async function getMyPet(req, res, next) {
  try {
    const pet = await petService.getPet(req.user.id);
    if (!pet) {
      return next(
        Object.assign(new Error('펫을 찾을 수 없습니다.'), { status: 404, code: 'PET_NOT_FOUND' })
      );
    }
    res.status(200).json({ pet });
  } catch (err) {
    next(err);
  }
}

async function nameMyPet(req, res, next) {
  try {
    const { name } = req.body;
    const pet = await petService.nameOwnPet(req.user.id, name);
    res.status(200).json({ pet });
  } catch (err) {
    next(err);
  }
}

async function bathe(req, res, next) {
  try {
    const pet = await petService.applyAction(req.user.id, 'bathe');
    res.status(200).json(pet);
  } catch (err) {
    next(err);
  }
}

async function feed(req, res, next) {
  try {
    const pet = await petService.applyAction(req.user.id, 'feed');
    res.status(200).json(pet);
  } catch (err) {
    next(err);
  }
}

async function pat(req, res, next) {
  try {
    const pet = await petService.applyAction(req.user.id, 'pat');
    res.status(200).json(pet);
  } catch (err) {
    next(err);
  }
}

async function feedSpecialFood(req, res, next) {
  try {
    const { promotionId } = req.body;
    const pet = await petService.feedSpecialFood(req.user.id, promotionId);
    res.status(200).json(pet);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyPet, nameMyPet, bathe, feed, feedSpecialFood, pat };
