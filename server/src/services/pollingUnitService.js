const pollingUnitRepository = require('../repositories/pollingUnitRepository');
const partyRepository = require('../repositories/partyRepository');
const lgaRepository = require('../repositories/lgaRepository');

class PollingUnitService {
  /**
   * Retrieves paginated list of polling units with optional search and LGA filter
   */
  async getPollingUnits(queryParams) {
    const { lgaId, search, page = 1, limit = 50, hasResultsOnly } = queryParams;

    let parsedLgaId = undefined;
    if (lgaId !== undefined && lgaId !== '' && lgaId !== null) {
      parsedLgaId = parseInt(lgaId, 10);
      if (isNaN(parsedLgaId)) {
        const error = new Error('lgaId filter must be a valid integer');
        error.statusCode = 400;
        throw error;
      }
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const filterHasResults = hasResultsOnly === 'true' || hasResultsOnly === true;

    const result = await pollingUnitRepository.findPollingUnits({
      lgaId: parsedLgaId,
      search,
      page: parsedPage,
      limit: parsedLimit,
      hasResultsOnly: filterHasResults
    });

    const formattedData = result.data.map(pu => ({
      uniqueId: pu.uniqueid,
      pollingUnitId: pu.polling_unit_id,
      wardId: pu.ward_id,
      lgaId: pu.lga_id,
      uniqueWardId: pu.uniquewardid,
      pollingUnitNumber: pu.polling_unit_number || 'N/A',
      pollingUnitName: pu.polling_unit_name || 'Unnamed Unit',
      description: pu.polling_unit_description,
      lat: pu.lat,
      long: pu.long,
      lgaName: pu.lga_name || `LGA #${pu.lga_id}`,
      wardName: pu.ward_name || `Ward #${pu.ward_id}`,
      resultsCount: Number(pu.results_count || 0),
      totalVotes: Number(pu.total_votes || 0),
      hasResults: Number(pu.results_count || 0) > 0
    }));

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      data: formattedData
    };
  }

  /**
   * Retrieves single polling unit details
   */
  async getPollingUnitByUniqueId(uniqueid) {
    const numericId = parseInt(uniqueid, 10);
    if (isNaN(numericId)) {
      const error = new Error('Invalid Polling Unit ID. Must be a valid integer.');
      error.statusCode = 400;
      throw error;
    }

    const pu = await pollingUnitRepository.findByUniqueId(numericId);
    if (!pu) {
      const error = new Error(`Polling Unit with Unique ID ${numericId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    return {
      uniqueId: pu.uniqueid,
      pollingUnitId: pu.polling_unit_id,
      wardId: pu.ward_id,
      lgaId: pu.lga_id,
      uniqueWardId: pu.uniquewardid,
      pollingUnitNumber: pu.polling_unit_number || 'N/A',
      pollingUnitName: pu.polling_unit_name || 'Unnamed Unit',
      description: pu.polling_unit_description || '',
      lat: pu.lat,
      long: pu.long,
      enteredByUser: pu.entered_by_user,
      dateEntered: pu.date_entered,
      lgaName: pu.lga_name || `LGA #${pu.lga_id}`,
      wardName: pu.ward_name || `Ward #${pu.ward_id}`
    };
  }

  /**
   * Retrieves election results for a single polling unit from announced_pu_results
   */
  async getPollingUnitResults(uniqueid) {
    const numericId = parseInt(uniqueid, 10);
    if (isNaN(numericId)) {
      const error = new Error('Invalid Polling Unit ID. Must be a valid integer.');
      error.statusCode = 400;
      throw error;
    }

    // Check PU existence
    const pu = await pollingUnitRepository.findByUniqueId(numericId);
    if (!pu) {
      const error = new Error(`Polling Unit with Unique ID ${numericId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    const rawResults = await pollingUnitRepository.getResultsByPollingUnitUniqueId(numericId);
    const totalVotes = rawResults.reduce((acc, curr) => acc + Number(curr.party_score || 0), 0);

    const results = rawResults.map((r, index) => {
      const score = Number(r.party_score || 0);
      const percentage = totalVotes > 0 ? Number(((score / totalVotes) * 100).toFixed(2)) : 0;

      return {
        rank: index + 1,
        resultId: r.result_id,
        partyAbbreviation: r.party_abbreviation,
        partyName: r.partyname || r.party_abbreviation,
        partyScore: score,
        percentage,
        enteredByUser: r.entered_by_user,
        dateEntered: r.date_entered,
        userIpAddress: r.user_ip_address
      };
    });

    const winner = results.length > 0 && results[0].partyScore > 0 ? results[0] : null;

    return {
      pollingUnit: {
        uniqueId: pu.uniqueid,
        pollingUnitId: pu.polling_unit_id,
        wardId: pu.ward_id,
        lgaId: pu.lga_id,
        pollingUnitNumber: pu.polling_unit_number || 'N/A',
        pollingUnitName: pu.polling_unit_name || 'Unnamed Unit',
        description: pu.polling_unit_description || '',
        lgaName: pu.lga_name || `LGA #${pu.lga_id}`,
        wardName: pu.ward_name || `Ward #${pu.ward_id}`,
        lat: pu.lat,
        long: pu.long
      },
      totalVotes,
      totalPartiesContested: results.length,
      winner,
      results
    };
  }

  /**
   * Creates a new Polling Unit and records initial party scores (New Polling System)
   */
  async createPollingUnitWithResults({
    pollingUnitNumber,
    pollingUnitName,
    pollingUnitDescription = '',
    lgaId,
    wardId = 1,
    lat = null,
    long = null,
    enteredByUser = 'Officer',
    userIpAddress = '127.0.0.1',
    results = []
  }) {
    if (!pollingUnitName || pollingUnitName.trim() === '') {
      const error = new Error('Polling unit name is required.');
      error.statusCode = 400;
      throw error;
    }

    const numericLgaId = parseInt(lgaId, 10);
    if (isNaN(numericLgaId) || numericLgaId <= 0) {
      const error = new Error('Valid Delta LGA ID is required.');
      error.statusCode = 400;
      throw error;
    }

    // Verify LGA exists in Delta
    const lga = await lgaRepository.findByLgaId(numericLgaId);
    if (!lga) {
      const error = new Error(`LGA ID ${numericLgaId} does not belong to Delta State.`);
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(results) || results.length === 0) {
      const error = new Error('At least one party result score must be provided.');
      error.statusCode = 400;
      throw error;
    }

    // Validate party scores
    for (const item of results) {
      if (!item.partyAbbreviation) {
        const error = new Error('Each result entry must specify a partyAbbreviation.');
        error.statusCode = 400;
        throw error;
      }
      const score = Number(item.partyScore);
      if (isNaN(score) || score < 0 || !Number.isInteger(score)) {
        const error = new Error(`Score for party ${item.partyAbbreviation} must be a non-negative integer.`);
        error.statusCode = 400;
        throw error;
      }
    }

    // Create Polling Unit
    const newUniqueId = await pollingUnitRepository.createPollingUnit({
      polling_unit_id: 1,
      ward_id: parseInt(wardId, 10) || 1,
      lga_id: numericLgaId,
      polling_unit_number: pollingUnitNumber || `DT${numericLgaId}01999`,
      polling_unit_name: pollingUnitName.trim(),
      polling_unit_description: pollingUnitDescription.trim(),
      lat,
      long,
      entered_by_user: enteredByUser,
      user_ip_address: userIpAddress
    });

    // Insert results for each party
    const recordedResults = [];
    for (const item of results) {
      const resultId = await pollingUnitRepository.insertPuResult({
        polling_unit_uniqueid: newUniqueId,
        party_abbreviation: item.partyAbbreviation.trim().toUpperCase(),
        party_score: Number(item.partyScore),
        entered_by_user: enteredByUser,
        user_ip_address: userIpAddress
      });
      recordedResults.push({
        resultId,
        partyAbbreviation: item.partyAbbreviation,
        partyScore: Number(item.partyScore)
      });
    }

    return {
      message: 'Polling unit and results recorded successfully.',
      uniqueId: newUniqueId,
      lgaId: numericLgaId,
      pollingUnitName,
      recordedResultsCount: recordedResults.length,
      results: recordedResults
    };
  }
}

module.exports = new PollingUnitService();
