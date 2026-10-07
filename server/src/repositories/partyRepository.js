const db = require('../config/database');

/**
 * Repository for Party management operations
 */
class PartyRepository {
  /**
   * Retrieves all registered parties with usage statistics
   */
  async findAll() {
    const sql = `
      SELECT 
        p.id,
        p.partyid,
        p.partyname,
        COUNT(r.result_id) AS result_count
      FROM party p
      LEFT JOIN announced_pu_results r 
        ON (r.party_abbreviation = p.partyid OR (p.partyid = 'LABOUR' AND r.party_abbreviation = 'LABO'))
      GROUP BY p.id, p.partyid, p.partyname
      ORDER BY p.partyid ASC
    `;
    return await db.query(sql);
  }

  /**
   * Finds a party by numerical primary key ID
   */
  async findById(id) {
    const sql = `
      SELECT id, partyid, partyname
      FROM party
      WHERE id = ?
      LIMIT 1
    `;
    const rows = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Finds a party by party abbreviation/code (case-insensitive)
   */
  async findByPartyCode(partyid) {
    const sql = `
      SELECT id, partyid, partyname
      FROM party
      WHERE UPPER(TRIM(partyid)) = UPPER(TRIM(?))
      LIMIT 1
    `;
    const rows = await db.query(sql, [partyid]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Counts how many historical results reference this party
   */
  async countResultReferences(partyid) {
    const sql = `
      SELECT COUNT(*) AS total_references
      FROM announced_pu_results
      WHERE party_abbreviation = ? OR (? = 'LABOUR' AND party_abbreviation = 'LABO')
    `;
    const rows = await db.query(sql, [partyid, partyid]);
    return rows.length > 0 ? Number(rows[0].total_references) : 0;
  }

  /**
   * Creates a new political party
   */
  async create({ partyid, partyname }) {
    const sql = `
      INSERT INTO party (partyid, partyname)
      VALUES (?, ?)
    `;
    const res = await db.query(sql, [partyid.trim().toUpperCase(), partyname.trim()]);
    return res.insertId;
  }

  /**
   * Updates existing party information
   */
  async update(id, { partyid, partyname }) {
    const sql = `
      UPDATE party
      SET partyid = ?, partyname = ?
      WHERE id = ?
    `;
    const res = await db.query(sql, [partyid.trim().toUpperCase(), partyname.trim(), id]);
    return res.affectedRows;
  }

  /**
   * Deletes a party by ID
   */
  async delete(id) {
    const sql = `
      DELETE FROM party
      WHERE id = ?
    `;
    const res = await db.query(sql, [id]);
    return res.affectedRows;
  }
}

module.exports = new PartyRepository();
