const db = require('../config/database');

/**
 * Repository for Polling Unit database operations
 */
class PollingUnitRepository {
  /**
   * Retrieves polling units with search, LGA filtering, and pagination
   */
  async findPollingUnits({ lgaId, search, page = 1, limit = 50, hasResultsOnly = false } = {}) {
    const offset = (Math.max(1, page) - 1) * limit;
    const whereConditions = [];
    const params = [];

    // Exclude empty/dummy records if they have 0/empty values unless searched
    if (lgaId) {
      whereConditions.push('pu.lga_id = ?');
      params.push(lgaId);
    }

    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      whereConditions.push(`(
        pu.polling_unit_name LIKE ? OR 
        pu.polling_unit_number LIKE ? OR 
        l.lga_name LIKE ? OR 
        w.ward_name LIKE ? OR 
        pu.polling_unit_description LIKE ?
      )`);
      params.push(term, term, term, term, term);
    }

    if (hasResultsOnly) {
      whereConditions.push('res_count.total_results > 0');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count total query
    const countSql = `
      SELECT COUNT(DISTINCT pu.uniqueid) AS total
      FROM polling_unit pu
      LEFT JOIN lga l ON l.lga_id = pu.lga_id AND l.state_id = 25
      LEFT JOIN ward w ON w.ward_id = pu.ward_id AND w.lga_id = pu.lga_id
      LEFT JOIN (
        SELECT polling_unit_uniqueid, COUNT(*) AS total_results 
        FROM announced_pu_results 
        GROUP BY polling_unit_uniqueid
      ) res_count ON CAST(res_count.polling_unit_uniqueid AS CHAR) = CAST(pu.uniqueid AS CHAR)
      ${whereClause}
    `;

    // Data query
    const dataSql = `
      SELECT 
        pu.uniqueid,
        pu.polling_unit_id,
        pu.ward_id,
        pu.lga_id,
        pu.uniquewardid,
        pu.polling_unit_number,
        pu.polling_unit_name,
        pu.polling_unit_description,
        pu.lat,
        pu.long,
        pu.entered_by_user,
        pu.date_entered,
        l.lga_name,
        w.ward_name,
        COALESCE(res_count.total_results, 0) AS results_count,
        COALESCE(res_count.total_votes, 0) AS total_votes
      FROM polling_unit pu
      LEFT JOIN lga l ON l.lga_id = pu.lga_id AND l.state_id = 25
      LEFT JOIN ward w ON w.ward_id = pu.ward_id AND w.lga_id = pu.lga_id
      LEFT JOIN (
        SELECT 
          polling_unit_uniqueid, 
          COUNT(*) AS total_results,
          SUM(party_score) AS total_votes
        FROM announced_pu_results 
        GROUP BY polling_unit_uniqueid
      ) res_count ON CAST(res_count.polling_unit_uniqueid AS CHAR) = CAST(pu.uniqueid AS CHAR)
      ${whereClause}
      ORDER BY 
        CASE WHEN COALESCE(res_count.total_results, 0) > 0 THEN 0 ELSE 1 END,
        pu.uniqueid ASC
      LIMIT ? OFFSET ?
    `;

    const countRows = await db.query(countSql, params);
    const total = countRows.length > 0 ? (countRows[0].total || 0) : 0;

    const dataParams = [...params, limit, offset];
    const rows = await db.query(dataSql, dataParams);

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
      data: rows
    };
  }

  /**
   * Retrieves single polling unit by unique ID
   */
  async findByUniqueId(uniqueid) {
    const sql = `
      SELECT 
        pu.uniqueid,
        pu.polling_unit_id,
        pu.ward_id,
        pu.lga_id,
        pu.uniquewardid,
        pu.polling_unit_number,
        pu.polling_unit_name,
        pu.polling_unit_description,
        pu.lat,
        pu.long,
        pu.entered_by_user,
        pu.date_entered,
        pu.user_ip_address,
        l.lga_name,
        w.ward_name
      FROM polling_unit pu
      LEFT JOIN lga l ON l.lga_id = pu.lga_id AND l.state_id = 25
      LEFT JOIN ward w ON w.ward_id = pu.ward_id AND w.lga_id = pu.lga_id
      WHERE pu.uniqueid = ?
      LIMIT 1
    `;
    const rows = await db.query(sql, [uniqueid]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Retrieves announced results for a specific polling unit
   */
  async getResultsByPollingUnitUniqueId(uniqueid) {
    const sql = `
      SELECT 
        r.result_id,
        r.polling_unit_uniqueid,
        r.party_abbreviation,
        COALESCE(p.partyname, r.party_abbreviation) AS partyname,
        r.party_score,
        r.entered_by_user,
        r.date_entered,
        r.user_ip_address
      FROM announced_pu_results r
      LEFT JOIN party p 
        ON (p.partyid = r.party_abbreviation OR (r.party_abbreviation = 'LABO' AND p.partyid = 'LABOUR'))
      WHERE CAST(r.polling_unit_uniqueid AS CHAR) = CAST(? AS CHAR)
      ORDER BY r.party_score DESC
    `;
    return await db.query(sql, [uniqueid]);
  }

  /**
   * Creates a new polling unit
   */
  async createPollingUnit({
    polling_unit_id = 1,
    ward_id,
    lga_id,
    uniquewardid = null,
    polling_unit_number,
    polling_unit_name,
    polling_unit_description = '',
    lat = null,
    long = null,
    entered_by_user = 'Admin',
    user_ip_address = '127.0.0.1'
  }) {
    const dateEntered = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sql = `
      INSERT INTO polling_unit (
        polling_unit_id, ward_id, lga_id, uniquewardid, 
        polling_unit_number, polling_unit_name, polling_unit_description,
        lat, long, entered_by_user, date_entered, user_ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const res = await db.query(sql, [
      polling_unit_id,
      ward_id,
      lga_id,
      uniquewardid,
      polling_unit_number,
      polling_unit_name,
      polling_unit_description,
      lat,
      long,
      entered_by_user,
      dateEntered,
      user_ip_address
    ]);

    return res.insertId;
  }

  /**
   * Inserts a polling unit result record
   */
  async insertPuResult({
    polling_unit_uniqueid,
    party_abbreviation,
    party_score,
    entered_by_user = 'Admin',
    user_ip_address = '127.0.0.1'
  }) {
    const dateEntered = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sql = `
      INSERT INTO announced_pu_results (
        polling_unit_uniqueid, party_abbreviation, party_score,
        entered_by_user, date_entered, user_ip_address
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const res = await db.query(sql, [
      String(polling_unit_uniqueid),
      party_abbreviation,
      Number(party_score),
      entered_by_user,
      dateEntered,
      user_ip_address
    ]);
    return res.insertId;
  }
}

module.exports = new PollingUnitRepository();
