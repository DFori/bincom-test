const dashboardRepository = require('../repositories/dashboardRepository');

class DashboardController {
  /**
   * GET /api/dashboard/stats
   * Returns overview metrics and leaderboard
   */
  async getDashboardStats(req, res, next) {
    try {
      const [overview, leaderboard, lgasSummary] = await Promise.all([
        dashboardRepository.getOverviewStats(),
        dashboardRepository.getStatewidePartyLeaderboard(),
        dashboardRepository.getLgasSummary()
      ]);

      const formattedLeaderboard = leaderboard.map(l => ({
        partyAbbreviation: l.party_abbreviation,
        partyName: l.partyname || l.party_abbreviation,
        totalVotes: Number(l.total_votes || 0)
      }));

      const formattedLgasSummary = lgasSummary.map(l => ({
        lgaId: l.lga_id,
        lgaName: l.lga_name,
        totalPus: Number(l.total_pus || 0),
        pusWithResults: Number(l.pus_with_results || 0),
        totalVotes: Number(l.total_votes || 0)
      }));

      res.json({
        success: true,
        data: {
          overview,
          leaderboard: formattedLeaderboard,
          lgasSummary: formattedLgasSummary
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
