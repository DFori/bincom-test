const partyService = require('../services/partyService');

class PartyController {
  /**
   * GET /api/parties
   * Returns all political parties
   */
  async getParties(req, res, next) {
    try {
      const parties = await partyService.getAllParties();
      res.json({
        success: true,
        count: parties.length,
        data: parties
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/parties/:id
   * Returns single party details
   */
  async getPartyById(req, res, next) {
    try {
      const party = await partyService.getPartyById(req.params.id);
      res.json({
        success: true,
        data: party
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/parties
   * Creates a new political party
   */
  async createParty(req, res, next) {
    try {
      const { partyid, partyname } = req.body;
      const result = await partyService.createParty({ partyid, partyname });
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/parties/:id
   * Updates an existing political party
   */
  async updateParty(req, res, next) {
    try {
      const { partyid, partyname } = req.body;
      const result = await partyService.updateParty(req.params.id, { partyid, partyname });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/parties/:id
   * Deletes a political party (protected against referenced records)
   */
  async deleteParty(req, res, next) {
    try {
      const result = await partyService.deleteParty(req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PartyController();
