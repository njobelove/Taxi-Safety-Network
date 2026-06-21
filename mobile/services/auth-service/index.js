/**
 * TSN Auth Service
 * Handles driver + police station registration and login.
 * Issues JWT tokens on success.
 */
require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// ── MongoDB connection ─────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('[Auth Service] MongoDB connected'))
  .catch(err => { console.error('[Auth Service] MongoDB error:', err); process.exit(1); });

// ── Schemas ────────────────────────────────────────────────────────────────────
const driverSchema = new mongoose.Schema({
  full_name:     { type: String, required: true },
  badge_id:      { type: String, required: true, unique: true, uppercase: true },
  phone_number:  { type: String, required: true },
  network:       { type: String, enum: ['MTN','ORANGE','CAMTEL'], default: 'MTN' },
  vehicle_plate: { type: String, required: true, uppercase: true },
  city:          { type: String, required: true, default: 'Yaoundé' },
  password_hash: { type: String, required: true },
  voice_profile: {
    trigger_phrase: String,
    recording_uri:  String,
    updated_at:     Date,
  },
}, { timestamps: true });

const stationSchema = new mongoose.Schema({
  station_name:   { type: String, required: true },
  station_id:     { type: String, required: true, unique: true, uppercase: true },
  district:       { type: String, required: true },
  city:           { type: String, required: true },
  emergency_line: { type: String, required: true },
  secondary_line: { type: String },
  commander_name: { type: String, required: true },
  password_hash:  { type: String, required: true },
}, { timestamps: true });

const Driver         = mongoose.model('Driver',         driverSchema);
const PoliceStation  = mongoose.model('PoliceStation',  stationSchema);

// ── Helpers ────────────────────────────────────────────────────────────────────
const hashPwd  = (pwd)  => bcrypt.hash(pwd, parseInt(process.env.BCRYPT_ROUNDS) || 12);
const checkPwd = (plain, hash) => bcrypt.compare(plain, hash);

const signToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return false;
  }
  return true;
};

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'healthy', service: 'auth-service', timestamp: new Date().toISOString() })
);

// ════════════════════════════════════════════════════════════════════════════════
// DRIVER ROUTES
// ════════════════════════════════════════════════════════════════════════════════

// POST /auth/drivers/register
app.post('/auth/drivers/register', [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('badgeId').matches(/^[A-Z]{2}-[A-Z]{2,4}-\d{3,}$/i).withMessage('Badge ID format: TX-YDE-001'),
  body('phoneNumber').matches(/^\+237/).withMessage('Phone must start with +237'),
  body('vehiclePlate').notEmpty().withMessage('Vehicle plate is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('password').isLength({ min: 6 }).withMessage('Password minimum 6 characters'),
], async (req, res) => {
  if (!validate(req, res)) return;

  const { fullName, badgeId, phoneNumber, network, vehiclePlate, city, password } = req.body;

  try {
    const exists = await Driver.findOne({ badge_id: badgeId.toUpperCase() });
    if (exists) return res.status(409).json({ error: 'BADGE_EXISTS', message: 'This Badge ID is already registered.' });

    const password_hash = await hashPwd(password);
    const driver = await Driver.create({
      full_name: fullName, badge_id: badgeId, phone_number: phoneNumber,
      network: network || 'MTN', vehicle_plate: vehiclePlate, city, password_hash,
    });

    const token = signToken({ id: driver._id, type: 'driver', badge_id: driver.badge_id });
    const { password_hash: _, ...driverData } = driver.toObject();

    res.status(201).json({ token, user: driverData, type: 'driver' });
  } catch (err) {
    console.error('[Auth] Register driver error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/drivers/login
app.post('/auth/drivers/login', [
  body('badgeId').notEmpty().withMessage('Badge ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  if (!validate(req, res)) return;

  const { badgeId, password } = req.body;
  try {
    const driver = await Driver.findOne({ badge_id: badgeId.toUpperCase() });
    if (!driver) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid Badge ID or password.' });

    const match = await checkPwd(password, driver.password_hash);
    if (!match) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid Badge ID or password.' });

    const token = signToken({ id: driver._id, type: 'driver', badge_id: driver.badge_id });
    const { password_hash: _, ...driverData } = driver.toObject();

    res.json({ token, user: driverData, type: 'driver' });
  } catch (err) {
    console.error('[Auth] Login driver error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// PATCH /auth/drivers/:badgeId/voice  — save voice profile
app.patch('/auth/drivers/:badgeId/voice', async (req, res) => {
  const { triggerPhrase, recordingUri } = req.body;
  try {
    await Driver.updateOne(
      { badge_id: req.params.badgeId.toUpperCase() },
      { $set: { voice_profile: { trigger_phrase: triggerPhrase, recording_uri: recordingUri, updated_at: new Date() } } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save voice profile' });
  }
});

// GET /auth/drivers/:badgeId — get driver profile
app.get('/auth/drivers/:badgeId', async (req, res) => {
  try {
    const driver = await Driver.findOne({ badge_id: req.params.badgeId.toUpperCase() }, '-password_hash');
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POLICE STATION ROUTES
// ════════════════════════════════════════════════════════════════════════════════

// POST /auth/stations/register
app.post('/auth/stations/register', [
  body('stationName').notEmpty().withMessage('Station name is required'),
  body('stationId').matches(/^[A-Z]{2,4}-PS-\d{3,}$/i).withMessage('Station ID format: YDE-PS-001'),
  body('district').notEmpty().withMessage('District is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('emergencyLine').matches(/^\+237/).withMessage('Emergency line must start with +237'),
  body('commanderName').notEmpty().withMessage('Commander name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password minimum 6 characters'),
], async (req, res) => {
  if (!validate(req, res)) return;

  const { stationName, stationId, district, city, emergencyLine, secondaryLine, commanderName, password } = req.body;
  try {
    const exists = await PoliceStation.findOne({ station_id: stationId.toUpperCase() });
    if (exists) return res.status(409).json({ error: 'STATION_EXISTS', message: 'This Station ID is already registered.' });

    const password_hash = await hashPwd(password);
    const station = await PoliceStation.create({
      station_name: stationName, station_id: stationId, district, city,
      emergency_line: emergencyLine, secondary_line: secondaryLine || '',
      commander_name: commanderName, password_hash,
    });

    const token = signToken({ id: station._id, type: 'police', station_id: station.station_id });
    const { password_hash: _, ...stationData } = station.toObject();

    res.status(201).json({ token, user: stationData, type: 'police' });
  } catch (err) {
    console.error('[Auth] Register station error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/stations/login
app.post('/auth/stations/login', [
  body('stationId').notEmpty().withMessage('Station ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  if (!validate(req, res)) return;

  const { stationId, password } = req.body;
  try {
    const station = await PoliceStation.findOne({ station_id: stationId.toUpperCase() });
    if (!station) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid Station ID or password.' });

    const match = await checkPwd(password, station.password_hash);
    if (!match) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid Station ID or password.' });

    const token = signToken({ id: station._id, type: 'police', station_id: station.station_id });
    const { password_hash: _, ...stationData } = station.toObject();

    res.json({ token, user: stationData, type: 'police' });
  } catch (err) {
    console.error('[Auth] Login station error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.listen(PORT, () => console.log(`[Auth Service] Running on port ${PORT}`));
