const request = require('supertest');
const app = require('../src/app');
const { initDatabase, close } = require('../src/config/database');

beforeAll(async () => {
  await initDatabase();
});

afterAll(async () => {
  await close();
});

describe('Polling Unit API Tests', () => {
  test('GET /api/polling-units returns paginated polling units', async () => {
    const res = await request(app).get('/api/polling-units?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeLessThanOrEqual(10);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.totalPages).toBeGreaterThan(0);

    const first = res.body.data[0];
    expect(first).toHaveProperty('uniqueId');
    expect(first).toHaveProperty('pollingUnitName');
    expect(first).toHaveProperty('lgaName');
  });

  test('GET /api/polling-units supports LGA filtering', async () => {
    // Ughelli North (lga_id = 19)
    const res = await request(app).get('/api/polling-units?lgaId=19');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    for (const pu of res.body.data) {
      expect(pu.lgaId).toBe(19);
    }
  });

  test('GET /api/polling-units supports search query', async () => {
    const res = await request(app).get('/api/polling-units?search=Sapele');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const hasSapeleMatch = res.body.data.some(pu => 
      pu.pollingUnitName.toLowerCase().includes('sapele') || 
      pu.lgaName.toLowerCase().includes('sapele')
    );
    expect(hasSapeleMatch).toBe(true);
  });

  test('GET /api/polling-units/:uniqueid returns single polling unit details', async () => {
    const res = await request(app).get('/api/polling-units/8');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.uniqueId).toBe(8);
    expect(res.body.data.pollingUnitNumber).toBe('DT1708006');
    expect(res.body.data.lgaName).toBe('Sapele');
  });

  test('GET /api/polling-units/:uniqueid returns 404 for non-existent unit', async () => {
    const res = await request(app).get('/api/polling-units/999999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('not found');
  });

  test('GET /api/polling-units/:uniqueid/results returns results from announced_pu_results', async () => {
    // Polling unit uniqueid 8 in SQL dump has PDP 802, DPP 719, ACN 416, PPA 939, CDC 394, JP 99 (Total: 3369)
    const res = await request(app).get('/api/polling-units/8/results');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalVotes).toBe(3369);
    expect(res.body.data.results).toBeInstanceOf(Array);
    expect(res.body.data.results.length).toBe(6);

    const ppa = res.body.data.results.find(r => r.partyAbbreviation === 'PPA');
    expect(ppa).toBeDefined();
    expect(ppa.partyScore).toBe(939);

    const pdp = res.body.data.results.find(r => r.partyAbbreviation === 'PDP');
    expect(pdp).toBeDefined();
    expect(pdp.partyScore).toBe(802);

    expect(res.body.data.winner.partyAbbreviation).toBe('PPA');
  });

  test('POST /api/polling-units creates a new polling unit with party results', async () => {
    const payload = {
      pollingUnitName: 'Asaba Modern Centre',
      pollingUnitNumber: 'DT1501999',
      pollingUnitDescription: 'Test Centre for Elections',
      lgaId: 15,
      wardId: 1,
      results: [
        { partyAbbreviation: 'PDP', partyScore: 350 },
        { partyAbbreviation: 'DPP', partyScore: 210 },
        { partyAbbreviation: 'ACN', partyScore: 120 }
      ]
    };

    const res = await request(app).post('/api/polling-units').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('uniqueId');
    expect(res.body.data.recordedResultsCount).toBe(3);

    // Verify retrieval of the new unit's results
    const createdId = res.body.data.uniqueId;
    const checkRes = await request(app).get(`/api/polling-units/${createdId}/results`);
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.data.totalVotes).toBe(680);
  });
});
