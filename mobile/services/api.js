/**
 * TSN — Backend API Service
 * All calls go through local backend on port 8000
 */

const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tsn-backend-53yj.onrender.com'
  : 'http://localhost:8000';

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  console.log('API Request:', method, BASE_URL + endpoint);

  const res  = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json();

  console.log('API Response:', res.status, JSON.stringify(data).substring(0, 100));

  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── HEALTH ────────────────────────────────────────────────────────────────────
export const checkHealth = () =>
  apiRequest('/api/health');

// ── AUTH — DRIVERS ────────────────────────────────────────────────────────────
export const registerDriver = (data) =>
  apiRequest('/api/auth/drivers/register', 'POST', data);

export const loginDriver = (badgeId, password) =>
  apiRequest('/api/auth/drivers/login', 'POST', { badgeId, password });

// ── AUTH — POLICE STATIONS ────────────────────────────────────────────────────
export const registerPoliceStation = (data) =>
  apiRequest('/api/auth/stations/register', 'POST', data);

export const loginPoliceStation = (stationId, password) =>
  apiRequest('/api/auth/stations/login', 'POST', { stationId, password });

// ── ALERTS ────────────────────────────────────────────────────────────────────
export const getAllAlerts = (token) =>
  apiRequest('/api/alerts', 'GET', null, token);

export const createSOSAlert = (data, token) =>
  apiRequest('/api/alerts/sos', 'POST', data, token);

export const updateAlertStatus = (alertId, status, responderId, token) =>
  apiRequest(`/api/alerts/${alertId}/status`, 'PUT', { status, responderId }, token);

// ── RESPONDERS ────────────────────────────────────────────────────────────────
export const getNearbyResponders = (lat, lng, radius = 5, token) =>
  apiRequest(`/api/responders/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, 'GET', null, token);

// ── DRIVER LOCATION ───────────────────────────────────────────────────────────
export const updateDriverLocation = (driverId, lat, lng, speed) =>
  apiRequest('/api/driver/location', 'POST', { driverId, lat, lng, speed });

// ── STATS ─────────────────────────────────────────────────────────────────────
export const getStats = (token) =>
  apiRequest('/api/stats', 'GET', null, token);


// ── LIVE DRIVER MAP ───────────────────────────────────────────────────────────
export const updateLiveLocation = (data) =>
  apiRequest('/api/drivers/live-location', 'POST', data);

export const getLiveDrivers = () =>
  apiRequest('/api/drivers/live');

// ── POLICE CONTACTS ───────────────────────────────────────────────────────────
export const getPoliceContacts = () =>
  apiRequest('/api/contacts/police');
