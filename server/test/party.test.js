const request = require('supertest');
const app = require('../src/app');
const { initDatabase, close } = require('../src/config/database');

beforeAll(async () => {
  await initDatabase();
});

afterAll(async () => {
  await close();
});

describe('Party Management API Tests', () => {
  test('GET /api/parties returns all political parties', async () => {
    const res = await request(app).get('/api/parties');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.count).toBeGreaterThanOrEqual(9);

    const pdp = res.body.data.find(p => p.partyId === 'PDP');
    expect(pdp).toBeDefined();
    expect(pdp.resultCount).toBeGreaterThan(0);
    expect(pdp.isDeletable).toBe(false);
  });

  test('GET /api/parties/:id returns single party', async () => {
    const res = await request(app).get('/api/parties/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.partyId).toBe('PDP');
  });

  test('POST /api/parties creates a new party', async () => {
    const uniqueCode = `NEW${Date.now().toString().slice(-4)}`;
    const res = await request(app).post('/api/parties').send({
      partyid: uniqueCode,
      partyname: 'New Progressive Coalition'
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.partyId).toBe(uniqueCode);

    // Try creating duplicate party ID
    const dupRes = await request(app).post('/api/parties').send({
      partyid: uniqueCode,
      partyname: 'Another Duplicate'
    });
    expect(dupRes.status).toBe(409);
    expect(dupRes.body.error.message).toContain('already exists');
  });

  test('PUT /api/parties/:id updates party name', async () => {
    // First create a temp party
    const tempCode = `TMP${Date.now().toString().slice(-3)}`;
    const createRes = await request(app).post('/api/parties').send({
      partyid: tempCode,
      partyname: 'Temporary Party'
    });
    const partyId = createRes.body.data.id;

    const updateRes = await request(app).put(`/api/parties/${partyId}`).send({
      partyname: 'Updated Party Name'
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.partyName).toBe('Updated Party Name');
  });

  test('DELETE /api/parties/:id is blocked for parties with historical results', async () => {
    // Party ID 1 is PDP which is heavily referenced
    const res = await request(app).delete('/api/parties/1');
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('historical election result record');
  });

  test('DELETE /api/parties/:id succeeds for unreferenced party', async () => {
    // Create unreferenced party
    const tempCode = `DEL${Date.now().toString().slice(-3)}`;
    const createRes = await request(app).post('/api/parties').send({
      partyid: tempCode,
      partyname: 'Party to Delete'
    });
    const partyId = createRes.body.data.id;

    const deleteRes = await request(app).delete(`/api/parties/${partyId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Verify it is gone
    const checkRes = await request(app).get(`/api/parties/${partyId}`);
    expect(checkRes.status).toBe(404);
  });
});
