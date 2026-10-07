const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

beforeAll(async () => {
  await db.initDatabase();
});

afterAll(async () => {
  await db.close();
});

describe('Announced LGA Results Independence Verification', () => {
  test('LGA results are computed strictly from polling units and NOT announced_lga_results', async () => {
    // 1. Fetch pre-announced LGA results directly from announced_lga_results for comparison
    const preAnnouncedRows = await db.query(
      `SELECT party_abbreviation, party_score FROM announced_lga_results WHERE lga_name = '19'`
    );

    // If preAnnouncedRows exist, find PDP pre-announced score (which is 20643 in the dump)
    const preAnnouncedPdp = preAnnouncedRows.find(r => r.party_abbreviation === 'PDP');
    const preAnnouncedDpp = preAnnouncedRows.find(r => r.party_abbreviation === 'DPP');

    if (preAnnouncedPdp) {
      expect(preAnnouncedPdp.party_score).toBe(20643);
    }
    if (preAnnouncedDpp) {
      expect(preAnnouncedDpp.party_score).toBe(79141);
    }

    // 2. Call our calculated LGA results endpoint
    const res = await request(app).get('/api/lgas/19/results');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const calculatedResults = res.body.data.results;
    const calcPdp = calculatedResults.find(r => r.partyAbbreviation === 'PDP');
    const calcDpp = calculatedResults.find(r => r.partyAbbreviation === 'DPP');

    // 3. Calculated totals MUST equal the sum of announced_pu_results (PDP = 1082, DPP = 3041)
    expect(calcPdp.totalVotes).toBe(1082);
    expect(calcDpp.totalVotes).toBe(3041);

    // 4. Must NOT equal the pre-announced totals (20643 and 79141)
    if (preAnnouncedPdp) {
      expect(calcPdp.totalVotes).not.toBe(preAnnouncedPdp.party_score);
    }
    if (preAnnouncedDpp) {
      expect(calcDpp.totalVotes).not.toBe(preAnnouncedDpp.party_score);
    }
  });

  test('Modifying announced_lga_results does not alter the calculated LGA results', async () => {
    // Intentionally mutate announced_lga_results to simulate corrupted pre-announced table
    await db.query(`UPDATE announced_lga_results SET party_score = 999999 WHERE lga_name = '19'`);

    // Verify calculated endpoint still calculates strictly from polling units
    const res = await request(app).get('/api/lgas/19/results');
    expect(res.status).toBe(200);

    const calcPdp = res.body.data.results.find(r => r.partyAbbreviation === 'PDP');
    expect(calcPdp.totalVotes).toBe(1082); // Still 1082!
    expect(calcPdp.totalVotes).not.toBe(999999);
  });
});
