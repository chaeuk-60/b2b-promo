// 신청 도메인 라우트 (10-plan.md BE-4)
const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const applicationController = require('../controllers/application.controller');

const router = express.Router();

router.get('/', authMiddleware, applicationController.listMine);

module.exports = router;
