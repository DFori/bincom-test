const request = require('supertest');
const app = require('../src/app');
const { initDatabase, close } = require('../src/config/database');

beforeAll(async () => {
  await initDatabase();
});

afterAll(async () => {
  await close();
});

describe('LGA API and Aggregation Tests', () => {
  test('GET /api/lgas returns only Delta State LGAs (state_id = 25)', async () => {
    const res = await request(app).get('/api/lgas');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.count).toBe(25);

    for (const lga of res.body.data) {
      expect(lga.stateId).toBe(25);
      expect(lga).toHaveProperty('lgaId');
      expect(lga).toHaveProperty('name');
    }

    // Verify presence of Delta LGAs like Oshimili South, Ughelli North, Warri South
    const names = res.body.data.map(l => l.name);
    expect(names).toContain('Oshimili - South');
    expect(names).toContain('Ughelli North');
    expect(names).toContain('Warri South');
  });

  test('GET /api/lgas/:lgaId returns single LGA metadata', async () => {
    const res = await request(app).get('/api/lgas/15');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lgaId).toBe(15);
    expect(res.body.data.name).toBe('Oshimili - South');
  });

  test('GET /api/lgas/:lgaId/results aggregates polling units in Ughelli North (lga_id = 19)', async () => {
    const res = await request(app).get('/api/lgas/19/results');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lga.lgaId).toBe(19);
    expect(res.body.data.lga.name).toBe('Ughelli North');

    const results = res.body.data.results;
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);

    // Verify DPP total sum (1254 + 482 + 1305 = 3041)
    const dpp = results.find(r => r.partyAbbreviation === 'DPP');
    expect(dpp).toBeDefined();
    expect(dpp.totalVotes).toBe(3041);

    // Verify PDP total sum (285 + 561 + 236 = 1082)
    const pdp = results.find(r => r.partyAbbreviation === 'PDP');
    expect(pdp).toBeDefined();
    expect(pdp.totalVotes).toBe(1082);

    // Verify ACN total sum (1032 + 298 + 567 = 1897)
    const acn = results.find(r => r.partyAbbreviation === 'ACN');
    expect(acn).toBeDefined();
    expect(acn.totalVotes).toBe(1897);

    // Winner should be DPP
    expect(res.body.data.winner.partyAbbreviation).toBe('DPP');

    // Percentage sum should approximate 100%
    const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
    expect(totalPercentage).toBeGreaterThanOrEqual(99.9);
    expect(totalPercentage).toBeLessThanOrEqual(100.1);
  });

  test('GET /api/lgas/:lgaId/results?includeBreakdown=true provides verification breakdown', async () => {
    const res = await request(app).get('/api/lgas/19/results?includeBreakdown=true');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('breakdown');
    expect(res.body.data.breakdown.length).toBeGreaterThan(0);

    const pu9 = res.body.data.breakdown.find(b => Number(b.pollingUnitUniqueId) === 9);
    expect(pu9).toBeDefined();
    expect(pu9.pollingUnitName).toBe('Primary School in Aghara');
  });

  test('GET /api/lgas/:lgaId/results returns 404 for invalid Delta LGA', async () => {
    const res = await request(app).get('/api/lgas/999/results');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
