const partyRepository = require('../repositories/partyRepository');

class PartyService {
  /**
   * Retrieves all parties with reference counts
   */
  async getAllParties() {
    const rows = await partyRepository.findAll();
    return rows.map(r => ({
      id: r.id,
      partyId: r.partyid,
      partyName: r.partyname,
      resultCount: Number(r.result_count || 0),
      isDeletable: Number(r.result_count || 0) === 0
    }));
  }

  /**
   * Retrieves a single party by ID
   */
  async getPartyById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error('Invalid party ID. Must be a positive integer.');
      error.statusCode = 400;
      throw error;
    }

    const party = await partyRepository.findById(numericId);
    if (!party) {
      const error = new Error(`Party with ID ${numericId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    const refCount = await partyRepository.countResultReferences(party.partyid);

    return {
      id: party.id,
      partyId: party.partyid,
      partyName: party.partyname,
      resultCount: refCount,
      isDeletable: refCount === 0
    };
  }

  /**
   * Creates a new political party with duplicate prevention
   */
  async createParty({ partyid, partyname }) {
    if (!partyid || typeof partyid !== 'string' || partyid.trim() === '') {
      const error = new Error('Party ID / abbreviation is required.');
      error.statusCode = 400;
      throw error;
    }

    if (!partyname || typeof partyname !== 'string' || partyname.trim() === '') {
      const error = new Error('Party full name is required.');
      error.statusCode = 400;
      throw error;
    }

    const cleanCode = partyid.trim().toUpperCase();
    const cleanName = partyname.trim();

    // Check duplicate abbreviation
    const existing = await partyRepository.findByPartyCode(cleanCode);
    if (existing) {
      const error = new Error(`A party with abbreviation '${cleanCode}' already exists.`);
      error.statusCode = 409;
      throw error;
    }

    const newId = await partyRepository.create({
      partyid: cleanCode,
      partyname: cleanName
    });

    return {
      id: newId,
      partyId: cleanCode,
      partyName: cleanName,
      message: 'Party created successfully.'
    };
  }

  /**
   * Updates an existing party
   */
  async updateParty(id, { partyid, partyname }) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error('Invalid party ID. Must be a positive integer.');
      error.statusCode = 400;
      throw error;
    }

    const existing = await partyRepository.findById(numericId);
    if (!existing) {
      const error = new Error(`Party with ID ${numericId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    const newCode = partyid ? partyid.trim().toUpperCase() : existing.partyid;
    const newName = partyname ? partyname.trim() : existing.partyname;

    if (!newName) {
      const error = new Error('Party name cannot be empty.');
      error.statusCode = 400;
      throw error;
    }

    // Check duplicate code if changed
    if (newCode !== existing.partyid) {
      const duplicate = await partyRepository.findByPartyCode(newCode);
      if (duplicate && duplicate.id !== numericId) {
        const error = new Error(`Another party with abbreviation '${newCode}' already exists.`);
        error.statusCode = 409;
        throw error;
      }
    }

    await partyRepository.update(numericId, {
      partyid: newCode,
      partyname: newName
    });

    return {
      id: numericId,
      partyId: newCode,
      partyName: newName,
      message: 'Party updated successfully.'
    };
  }

  /**
   * Deletes a party with reference protection
   */
  async deleteParty(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error('Invalid party ID. Must be a positive integer.');
      error.statusCode = 400;
      throw error;
    }

    const existing = await partyRepository.findById(numericId);
    if (!existing) {
      const error = new Error(`Party with ID ${numericId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    // Reference protection check
    const refCount = await partyRepository.countResultReferences(existing.partyid);
    if (refCount > 0) {
      const error = new Error(
        `Cannot delete party '${existing.partyid}' because it has ${refCount} historical election result record(s) attached. Deletion blocked to preserve election integrity.`
      );
      error.statusCode = 409;
      throw error;
    }

    await partyRepository.delete(numericId);

    return {
      id: numericId,
      partyId: existing.partyid,
      message: `Party '${existing.partyid}' deleted successfully.`
    };
  }
}

module.exports = new PartyService();
