const express = require('express');
const router = express.Router();
const lgaController = require('../controllers/lgaController');

// GET /api/lgas - Get Delta State LGAs
router.get('/', (req, res, next) => lgaController.getDeltaLgas(req, res, next));

// GET /api/lgas/:lgaId - Get specific LGA details
router.get('/:lgaId', (req, res, next) => lgaController.getLgaById(req, res, next));

// GET /api/lgas/:lgaId/results - Get calculated LGA election results
router.get('/:lgaId/results', (req, res, next) => lgaController.getLgaResults(req, res, next));

module.exports = router;
