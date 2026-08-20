// 펫 도메인 라우트 (10-plan.md BE-5)
const express = require('express');
const petController = require('../controllers/pet.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, petController.getMyPet);
router.patch('/name', authMiddleware, petController.nameMyPet);

module.exports = router;
