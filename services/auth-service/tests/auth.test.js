/**
 * TSN Auth Service — Jest Unit Tests
 * These tests are picked up by SonarQube for code coverage analysis.
 *
 * Install: npm install --save-dev jest supertest mongodb-memory-server
 * Run:     npm test
 */
const request  = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock the app without starting the real server
let app, mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI     = mongod.getUri();
  process.env.JWT_SECRET    = 'test_secret_123';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.BCRYPT_ROUNDS  = '4';  // fast for tests

  // Require app AFTER setting env vars
  app = require('../index');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// ── Driver Registration Tests ──────────────────────────────────────────────────
describe('POST /auth/drivers/register', () => {

  const validDriver = {
    fullName:     'Jean-Paul Nguemo',
    badgeId:      'TX-YDE-001',
    phoneNumber:  '+237 6XX XXX XXX',
    network:      'MTN',
    vehiclePlate: 'CE 482 XY',
    city:         'Yaoundé',
    password:     'securepass123',
  };

  test('registers a new driver successfully', async () => {
    const res = await request(app)
      .post('/auth/drivers/register')
      .send(validDriver);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('type', 'driver');
    expect(res.body.user.badge_id).toBe('TX-YDE-001');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  test('rejects duplicate badge ID', async () => {
    const res = await request(app)
      .post('/auth/drivers/register')
      .send(validDriver);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('BADGE_EXISTS');
  });

  test('rejects invalid badge ID format', async () => {
    const res = await request(app)
      .post('/auth/drivers/register')
      .send({ ...validDriver, badgeId: 'INVALID123', phoneNumber: '+237612345678' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Badge ID format');
  });

  test('rejects short password', async () => {
    const res = await request(app)
      .post('/auth/drivers/register')
      .send({ ...validDriver, badgeId: 'TX-YDE-002', password: '123' });

    expect(res.status).toBe(400);
  });

  test('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/auth/drivers/register')
      .send({ fullName: 'Test Driver' });

    expect(res.status).toBe(400);
  });
});

// ── Driver Login Tests ─────────────────────────────────────────────────────────
describe('POST /auth/drivers/login', () => {

  test('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/auth/drivers/login')
      .send({ badgeId: 'TX-YDE-001', password: 'securepass123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.type).toBe('driver');
  });

  test('rejects wrong password', async () => {
    const res = await request(app)
      .post('/auth/drivers/login')
      .send({ badgeId: 'TX-YDE-001', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  test('rejects non-existent badge ID', async () => {
    const res = await request(app)
      .post('/auth/drivers/login')
      .send({ badgeId: 'TX-YDE-999', password: 'anypassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  test('is case-insensitive for badge ID', async () => {
    const res = await request(app)
      .post('/auth/drivers/login')
      .send({ badgeId: 'tx-yde-001', password: 'securepass123' });

    expect(res.status).toBe(200);
  });
});

// ── Police Station Tests ───────────────────────────────────────────────────────
describe('POST /auth/stations/register', () => {

  const validStation = {
    stationName:   'Commissariat Central de Yaoundé',
    stationId:     'YDE-PS-001',
    district:      'Centre-ville',
    city:          'Yaoundé',
    emergencyLine: '+237 222 221 234',
    commanderName: 'Commissaire Jean Mballa',
    password:      'station_secure_2024',
  };

  test('registers a police station successfully', async () => {
    const res = await request(app)
      .post('/auth/stations/register')
      .send(validStation);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.type).toBe('police');
    expect(res.body.user.station_id).toBe('YDE-PS-001');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  test('rejects duplicate station ID', async () => {
    const res = await request(app)
      .post('/auth/stations/register')
      .send(validStation);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('STATION_EXISTS');
  });

  test('rejects invalid station ID format', async () => {
    const res = await request(app)
      .post('/auth/stations/register')
      .send({ ...validStation, stationId: 'INVALID' });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/stations/login', () => {

  test('logs in police station with correct credentials', async () => {
    const res = await request(app)
      .post('/auth/stations/login')
      .send({ stationId: 'YDE-PS-001', password: 'station_secure_2024' });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('police');
    expect(res.body).toHaveProperty('token');
  });

  test('rejects wrong station password', async () => {
    const res = await request(app)
      .post('/auth/stations/login')
      .send({ stationId: 'YDE-PS-001', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });
});

// ── Health check ───────────────────────────────────────────────────────────────
describe('GET /health', () => {
  test('returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('auth-service');
  });
});
