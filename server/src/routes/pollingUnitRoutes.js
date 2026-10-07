const express = require('express');
const router = express.Router();
const pollingUnitController = require('../controllers/pollingUnitController');

// GET /api/polling-units - Get paginated polling units with search & LGA filters
router.get('/', (req, res, next) => pollingUnitController.getPollingUnits(req, res, next));

// GET /api/polling-units/:uniqueid - Get polling unit details
router.get('/:uniqueid', (req, res, next) => pollingUnitController.getPollingUnitById(req, res, next));

// GET /api/polling-units/:uniqueid/results - Get announced results for polling unit
router.get('/:uniqueid/results', (req, res, next) => pollingUnitController.getPollingUnitResults(req, res, next));

// POST /api/polling-units - Create polling unit with results (New Polling System)
router.post('/', (req, res, next) => pollingUnitController.createPollingUnitResults(req, res, next));

module.exports = router;
