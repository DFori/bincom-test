const API_BASE = '/api';

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || `HTTP Error ${response.status}: ${response.statusText}`;
    const err = new Error(errorMsg);
    err.statusCode = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const apiClient = {
  // Dashboard
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    const json = await handleResponse(res);
    return json.data;
  },

  // LGAs
  async getDeltaLgas() {
    const res = await fetch(`${API_BASE}/lgas`);
    const json = await handleResponse(res);
    return json.data;
  },

  async getLgaById(lgaId) {
    const res = await fetch(`${API_BASE}/lgas/${lgaId}`);
    const json = await handleResponse(res);
    return json.data;
  },

  async getCalculatedLgaResults(lgaId, includeBreakdown = false) {
    const query = includeBreakdown ? '?includeBreakdown=true' : '';
    const res = await fetch(`${API_BASE}/lgas/${lgaId}/results${query}`);
    const json = await handleResponse(res);
    return json.data;
  },

  // Polling Units
  async getPollingUnits({ lgaId, search, page = 1, limit = 20, hasResultsOnly = false } = {}) {
    const params = new URLSearchParams();
    if (lgaId) params.append('lgaId', lgaId);
    if (search) params.append('search', search);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (hasResultsOnly) params.append('hasResultsOnly', 'true');

    const res = await fetch(`${API_BASE}/polling-units?${params.toString()}`);
    return await handleResponse(res);
  },

  async getPollingUnitById(uniqueid) {
    const res = await fetch(`${API_BASE}/polling-units/${uniqueid}`);
    const json = await handleResponse(res);
    return json.data;
  },

  async getPollingUnitResults(uniqueid) {
    const res = await fetch(`${API_BASE}/polling-units/${uniqueid}/results`);
    const json = await handleResponse(res);
    return json.data;
  },

  async createPollingUnitResults(payload) {
    const res = await fetch(`${API_BASE}/polling-units`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await handleResponse(res);
    return json.data;
  },

  // Parties
  async getParties() {
    const res = await fetch(`${API_BASE}/parties`);
    const json = await handleResponse(res);
    return json.data;
  },

  async getPartyById(id) {
    const res = await fetch(`${API_BASE}/parties/${id}`);
    const json = await handleResponse(res);
    return json.data;
  },

  async createParty(payload) {
    const res = await fetch(`${API_BASE}/parties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await handleResponse(res);
    return json.data;
  },

  async updateParty(id, payload) {
    const res = await fetch(`${API_BASE}/parties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await handleResponse(res);
    return json.data;
  },

  async deleteParty(id) {
    const res = await fetch(`${API_BASE}/parties/${id}`, {
      method: 'DELETE'
    });
    const json = await handleResponse(res);
    return json.data;
  }
};
