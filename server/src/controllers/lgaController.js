const lgaService = require('../services/lgaService');

class LgaController {
  /**
   * GET /api/lgas
   * Returns list of Delta State LGAs (state_id = 25)
   */
  async getDeltaLgas(req, res, next) {
    try {
      const lgas = await lgaService.getAllDeltaLgas();
      res.json({
        success: true,
        count: lgas.length,
        data: lgas
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lgas/:lgaId
   * Returns single LGA details
   */
  async getLgaById(req, res, next) {
    try {
      const lga = await lgaService.getLgaById(req.params.lgaId);
      res.json({
        success: true,
        data: lga
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lgas/:lgaId/results
   * Returns calculated LGA election results aggregated from polling units
   */
  async getLgaResults(req, res, next) {
    try {
      const includeBreakdown = req.query.includeBreakdown === 'true';
      const results = await lgaService.getCalculatedLgaResults(req.params.lgaId, includeBreakdown);
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LgaController();
