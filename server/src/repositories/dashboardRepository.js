const db = require('../config/database');

/**
 * Repository for dashboard and statewide statistics
 */
class DashboardRepository {
  /**
   * Retrieves overall system metrics
   */
  async getOverviewStats() {
    const lgaSql = `SELECT COUNT(*) AS total_lgas FROM lga WHERE state_id = 25`;
    const puSql = `SELECT COUNT(*) AS total_polling_units FROM polling_unit`;
    const partySql = `SELECT COUNT(*) AS total_parties FROM party`;
    const votesSql = `SELECT SUM(party_score) AS total_votes, COUNT(*) AS total_result_records FROM announced_pu_results`;

    const [lgaRes, puRes, partyRes, votesRes] = await Promise.all([
      db.query(lgaSql),
      db.query(puSql),
      db.query(partySql),
      db.query(votesSql)
    ]);

    const totalLgas = lgaRes.length > 0 ? Number(lgaRes[0].total_lgas) : 0;
    const totalPollingUnits = puRes.length > 0 ? Number(puRes[0].total_polling_units) : 0;
    const totalParties = partyRes.length > 0 ? Number(partyRes[0].total_parties) : 0;
    const totalVotes = votesRes.length > 0 ? Number(votesRes[0].total_votes || 0) : 0;
    const totalResultRecords = votesRes.length > 0 ? Number(votesRes[0].total_result_records || 0) : 0;

    return {
      totalLgas,
      totalPollingUnits,
      totalParties,
      totalVotes,
      totalResultRecords
    };
  }

  /**
   * Retrieves statewide party vote breakdown
   */
  async getStatewidePartyLeaderboard() {
    const sql = `
      SELECT 
        r.party_abbreviation,
        COALESCE(p.partyname, r.party_abbreviation) AS partyname,
        SUM(r.party_score) AS total_votes
      FROM announced_pu_results r
      LEFT JOIN party p 
        ON (p.partyid = r.party_abbreviation OR (r.party_abbreviation = 'LABO' AND p.partyid = 'LABOUR'))
      GROUP BY r.party_abbreviation, COALESCE(p.partyname, r.party_abbreviation)
      ORDER BY total_votes DESC
    `;
    return await db.query(sql);
  }

  /**
   * Retrieves LGA list with computed aggregated status
   */
  async getLgasSummary() {
    const sql = `
      SELECT 
        l.lga_id,
        l.lga_name,
        COUNT(DISTINCT pu.uniqueid) AS total_pus,
        COUNT(DISTINCT r.polling_unit_uniqueid) AS pus_with_results,
        COALESCE(SUM(r.party_score), 0) AS total_votes
      FROM lga l
      LEFT JOIN polling_unit pu ON pu.lga_id = l.lga_id
      LEFT JOIN announced_pu_results r ON CAST(r.polling_unit_uniqueid AS CHAR) = CAST(pu.uniqueid AS CHAR)
      WHERE l.state_id = 25
      GROUP BY l.lga_id, l.lga_name
      ORDER BY l.lga_name ASC
    `;
    return await db.query(sql);
  }
}

module.exports = new DashboardRepository();
