const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard/stats - Overview stats and statewide party breakdown
router.get('/stats', (req, res, next) => dashboardController.getDashboardStats(req, res, next));

module.exports = router;
