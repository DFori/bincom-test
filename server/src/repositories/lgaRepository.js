const db = require('../config/database');

/**
 * Repository for LGA database operations
 */
class LgaRepository {
  /**
   * Retrieves all Delta State LGAs (state_id = 25)
   */
  async findDeltaLgas() {
    const sql = `
      SELECT uniqueid, lga_id, lga_name, state_id, lga_description
      FROM lga
      WHERE state_id = 25
      ORDER BY lga_name ASC
    `;
    return await db.query(sql);
  }

  /**
   * Retrieves single LGA by business lga_id in Delta State
   */
  async findByLgaId(lgaId) {
    const sql = `
      SELECT uniqueid, lga_id, lga_name, state_id, lga_description
      FROM lga
      WHERE lga_id = ? AND state_id = 25
      LIMIT 1
    `;
    const rows = await db.query(sql, [lgaId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Retrieves polling unit counts for an LGA
   */
  async getPollingUnitStatsByLgaId(lgaId) {
    const sql = `
      SELECT 
        COUNT(DISTINCT pu.uniqueid) AS total_polling_units,
        COUNT(DISTINCT r.polling_unit_uniqueid) AS polling_units_with_results
      FROM polling_unit pu
      LEFT JOIN announced_pu_results r 
        ON CAST(r.polling_unit_uniqueid AS CHAR) = CAST(pu.uniqueid AS CHAR)
      WHERE pu.lga_id = ?
    `;
    const rows = await db.query(sql, [lgaId]);
    return rows.length > 0 ? rows[0] : { total_polling_units: 0, polling_units_with_results: 0 };
  }

  /**
   * Calculates LGA election results by summing polling unit results.
   * ABSOLUTE RULE: Never queries announced_lga_results.
   */
  async calculateLgaResults(lgaId) {
    const sql = `
      SELECT 
        r.party_abbreviation,
        COALESCE(p.partyname, r.party_abbreviation) AS partyname,
        SUM(r.party_score) AS total_votes
      FROM polling_unit pu
      INNER JOIN announced_pu_results r 
        ON CAST(r.polling_unit_uniqueid AS CHAR) = CAST(pu.uniqueid AS CHAR)
      LEFT JOIN party p 
        ON (p.partyid = r.party_abbreviation OR (r.party_abbreviation = 'LABO' AND p.partyid = 'LABOUR'))
      WHERE pu.lga_id = ?
      GROUP BY r.party_abbreviation, COALESCE(p.partyname, r.party_abbreviation)
      ORDER BY total_votes DESC
    `;
    return await db.query(sql, [lgaId]);
  }

  /**
   * Retrieves polling unit breakdowns for an LGA (used for verification)
   */
  async getLgaBreakdownByPollingUnit(lgaId) {
    const sql = `
      SELECT 
        pu.uniqueid AS polling_unit_uniqueid,
        pu.polling_unit_name,
        pu.polling_unit_number,
        r.result_id,
        r.party_abbreviation,
        COALESCE(p.partyname, r.party_abbreviation) AS partyname,
        r.party_score,
        r.entered_by_user,
        r.date_entered
      FROM polling_unit pu
      INNER JOIN announced_pu_results r 
        ON CAST(r.polling_unit_uniqueid AS CHAR) = CAST(pu.uniqueid AS CHAR)
      LEFT JOIN party p 
        ON (p.partyid = r.party_abbreviation OR (r.party_abbreviation = 'LABO' AND p.partyid = 'LABOUR'))
      WHERE pu.lga_id = ?
      ORDER BY pu.uniqueid ASC, r.party_score DESC
    `;
    return await db.query(sql, [lgaId]);
  }
}

module.exports = new LgaRepository();
