const express = require('express');
const router = express.Router();
const partyController = require('../controllers/partyController');

// GET /api/parties - List all parties
router.get('/', (req, res, next) => partyController.getParties(req, res, next));

// GET /api/parties/:id - Get single party
router.get('/:id', (req, res, next) => partyController.getPartyById(req, res, next));

// POST /api/parties - Create party
router.post('/', (req, res, next) => partyController.createParty(req, res, next));

// PUT /api/parties/:id - Update party
router.put('/:id', (req, res, next) => partyController.updateParty(req, res, next));

// DELETE /api/parties/:id - Delete party (protected)
router.delete('/:id', (req, res, next) => partyController.deleteParty(req, res, next));

module.exports = router;
