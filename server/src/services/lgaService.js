const lgaRepository = require('../repositories/lgaRepository');

class LgaService {
  /**
   * Returns list of all Delta State LGAs
   */
  async getAllDeltaLgas() {
    const rows = await lgaRepository.findDeltaLgas();
    return rows.map(r => ({
      lgaId: r.lga_id,
      name: r.lga_name,
      uniqueId: r.uniqueid,
      stateId: r.state_id,
      description: r.lga_description
    }));
  }

  /**
   * Returns single LGA by lga_id
   */
  async getLgaById(lgaId) {
    const numericId = parseInt(lgaId, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error('Invalid LGA ID. Must be a positive integer.');
      error.statusCode = 400;
      throw error;
    }

    const row = await lgaRepository.findByLgaId(numericId);
    if (!row) {
      const error = new Error(`Delta State LGA with ID ${numericId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    const stats = await lgaRepository.getPollingUnitStatsByLgaId(numericId);

    return {
      lgaId: row.lga_id,
      name: row.lga_name,
      uniqueId: row.uniqueid,
      stateId: row.state_id,
      description: row.lga_description,
      totalPollingUnits: Number(stats.total_polling_units || 0),
      pollingUnitsWithResults: Number(stats.polling_units_with_results || 0)
    };
  }

  /**
   * Calculates dynamic LGA election results summed strictly from polling units.
   * ABSOLUTE RULE: Never queries announced_lga_results.
   */
  async getCalculatedLgaResults(lgaId, includeBreakdown = false) {
    const numericId = parseInt(lgaId, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error('Invalid LGA ID. Must be a positive integer.');
      error.statusCode = 400;
      throw error;
    }

    // Ensure LGA exists in Delta State
    const lga = await lgaRepository.findByLgaId(numericId);
    if (!lga) {
      const error = new Error(`Delta State LGA with ID ${numericId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    // Get polling unit counts
    const stats = await lgaRepository.getPollingUnitStatsByLgaId(numericId);

    // Sum polling unit results directly from announced_pu_results + polling_unit + party
    const rawResults = await lgaRepository.calculateLgaResults(numericId);

    // Calculate total votes across all parties for this LGA
    const totalVotes = rawResults.reduce((acc, curr) => acc + Number(curr.total_votes || 0), 0);

    // Format results with ranking, percentage, and party metadata
    const results = rawResults.map((row, index) => {
      const votes = Number(row.total_votes || 0);
      const percentage = totalVotes > 0 ? Number(((votes / totalVotes) * 100).toFixed(2)) : 0;

      return {
        rank: index + 1,
        partyAbbreviation: row.party_abbreviation,
        partyName: row.partyname || row.party_abbreviation,
        totalVotes: votes,
        percentage
      };
    });

    const winner = results.length > 0 && results[0].totalVotes > 0 ? results[0] : null;

    const response = {
      lga: {
        lgaId: lga.lga_id,
        name: lga.lga_name,
        description: lga.lga_description,
        stateId: lga.state_id
      },
      pollingUnitsCount: Number(stats.total_polling_units || 0),
      pollingUnitsWithResults: Number(stats.polling_units_with_results || 0),
      totalVotes,
      winner,
      results
    };

    if (includeBreakdown) {
      const breakdownRows = await lgaRepository.getLgaBreakdownByPollingUnit(numericId);
      
      // Group by polling unit
      const puMap = new Map();
      for (const b of breakdownRows) {
        const puid = b.polling_unit_uniqueid;
        if (!puMap.has(puid)) {
          puMap.set(puid, {
            pollingUnitUniqueId: puid,
            pollingUnitName: b.polling_unit_name,
            pollingUnitNumber: b.polling_unit_number,
            totalVotes: 0,
            partyScores: []
          });
        }
        const pu = puMap.get(puid);
        const score = Number(b.party_score || 0);
        pu.totalVotes += score;
        pu.partyScores.push({
          resultId: b.result_id,
          partyAbbreviation: b.party_abbreviation,
          partyName: b.partyname,
          partyScore: score,
          enteredByUser: b.entered_by_user,
          dateEntered: b.date_entered
        });
      }

      response.breakdown = Array.from(puMap.values());
    }

    return response;
  }
}

module.exports = new LgaService();
