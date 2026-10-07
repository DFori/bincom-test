const pollingUnitService = require('../services/pollingUnitService');

class PollingUnitController {
  /**
   * GET /api/polling-units
   * Returns paginated polling units with search and LGA filter
   */
  async getPollingUnits(req, res, next) {
    try {
      const result = await pollingUnitService.getPollingUnits(req.query);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/polling-units/:uniqueid
   * Returns polling unit details
   */
  async getPollingUnitById(req, res, next) {
    try {
      const pu = await pollingUnitService.getPollingUnitByUniqueId(req.params.uniqueid);
      res.json({
        success: true,
        data: pu
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/polling-units/:uniqueid/results
   * Returns election results for a polling unit
   */
  async getPollingUnitResults(req, res, next) {
    try {
      const data = await pollingUnitService.getPollingUnitResults(req.params.uniqueid);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/polling-units
   * Creates a new polling unit with party scores (New Polling System)
   */
  async createPollingUnitResults(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const result = await pollingUnitService.createPollingUnitWithResults({
        ...req.body,
        userIpAddress: ip
      });
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PollingUnitController();
