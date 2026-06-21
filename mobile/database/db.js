/**
 * TSN Database — SQLite via expo-sqlite
 * Tables: drivers, police_stations, alerts, voice_profiles
 */
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

let db;

export async function getDB() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('tsn.db');
    await initTables();
  }
  return db;
}

async function initTables() {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS drivers (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name       TEXT    NOT NULL,
      badge_id        TEXT    NOT NULL UNIQUE,
      phone_number    TEXT    NOT NULL,
      network         TEXT    NOT NULL DEFAULT 'MTN',
      vehicle_plate   TEXT    NOT NULL,
      city            TEXT    NOT NULL DEFAULT 'Yaoundé',
      password_hash   TEXT    NOT NULL,
      voice_profile   TEXT,
      created_at      TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS police_stations (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      station_name    TEXT    NOT NULL,
      station_id      TEXT    NOT NULL UNIQUE,
      district        TEXT    NOT NULL,
      city            TEXT    NOT NULL,
      emergency_line  TEXT    NOT NULL,
      secondary_line  TEXT,
      commander_name  TEXT    NOT NULL,
      password_hash   TEXT    NOT NULL,
      created_at      TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id       INTEGER,
      badge_id        TEXT,
      driver_name     TEXT,
      driver_phone    TEXT,
      vehicle_plate   TEXT,
      alert_type      TEXT    NOT NULL,
      trigger_method  TEXT    DEFAULT 'manual',
      latitude        REAL,
      longitude       REAL,
      address         TEXT,
      status          TEXT    DEFAULT 'active',
      network         TEXT,
      created_at      TEXT    DEFAULT (datetime('now')),
      resolved_at     TEXT,
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS voice_profiles (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id       INTEGER NOT NULL UNIQUE,
      trigger_phrase  TEXT    NOT NULL DEFAULT 'Mbolo Police',
      recording_uri   TEXT,
      created_at      TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );
  `);
}

// ── Hash password ─────────────────────────────────────────────────────────────
export async function hashPassword(password) {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + 'TSN_SALT_2024'
  );
  return hash;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRIVER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function registerDriver({ fullName, badgeId, phoneNumber, network, vehiclePlate, city, password }) {
  const db = await getDB();

  // Check if badge already exists
  const existing = await db.getFirstAsync(
    'SELECT id FROM drivers WHERE badge_id = ?', [badgeId.toUpperCase()]
  );
  if (existing) throw new Error('BADGE_EXISTS');

  const passwordHash = await hashPassword(password);

  const result = await db.runAsync(
    `INSERT INTO drivers (full_name, badge_id, phone_number, network, vehicle_plate, city, password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [fullName, badgeId.toUpperCase(), phoneNumber, network, vehiclePlate.toUpperCase(), city, passwordHash]
  );

  return result.lastInsertRowId;
}

export async function loginDriver(badgeId, password) {
  const db = await getDB();
  const passwordHash = await hashPassword(password);

  const driver = await db.getFirstAsync(
    'SELECT * FROM drivers WHERE badge_id = ? AND password_hash = ?',
    [badgeId.toUpperCase(), passwordHash]
  );

  if (!driver) throw new Error('INVALID_CREDENTIALS');
  return driver;
}

export async function getDriver(driverId) {
  const db = await getDB();
  return db.getFirstAsync('SELECT * FROM drivers WHERE id = ?', [driverId]);
}

export async function saveVoiceProfile(driverId, triggerPhrase, recordingUri) {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO voice_profiles (driver_id, trigger_phrase, recording_uri)
     VALUES (?, ?, ?)
     ON CONFLICT(driver_id) DO UPDATE SET
       trigger_phrase = excluded.trigger_phrase,
       recording_uri  = excluded.recording_uri`,
    [driverId, triggerPhrase, recordingUri]
  );
}

export async function getVoiceProfile(driverId) {
  const db = await getDB();
  return db.getFirstAsync('SELECT * FROM voice_profiles WHERE driver_id = ?', [driverId]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// POLICE STATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function registerPoliceStation({ stationName, stationId, district, city, emergencyLine, secondaryLine, commanderName, password }) {
  const db = await getDB();

  const existing = await db.getFirstAsync(
    'SELECT id FROM police_stations WHERE station_id = ?', [stationId.toUpperCase()]
  );
  if (existing) throw new Error('STATION_EXISTS');

  const passwordHash = await hashPassword(password);

  const result = await db.runAsync(
    `INSERT INTO police_stations (station_name, station_id, district, city, emergency_line, secondary_line, commander_name, password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [stationName, stationId.toUpperCase(), district, city, emergencyLine, secondaryLine || '', commanderName, passwordHash]
  );

  return result.lastInsertRowId;
}

export async function loginPoliceStation(stationId, password) {
  const db = await getDB();
  const passwordHash = await hashPassword(password);

  const station = await db.getFirstAsync(
    'SELECT * FROM police_stations WHERE station_id = ? AND password_hash = ?',
    [stationId.toUpperCase(), passwordHash]
  );

  if (!station) throw new Error('INVALID_CREDENTIALS');
  return station;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function createAlert({ driverId, badgeId, driverName, driverPhone, vehiclePlate, alertType, triggerMethod, latitude, longitude, address, network }) {
  const db = await getDB();

  const result = await db.runAsync(
    `INSERT INTO alerts (driver_id, badge_id, driver_name, driver_phone, vehicle_plate, alert_type, trigger_method, latitude, longitude, address, network)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [driverId, badgeId, driverName, driverPhone, vehiclePlate, alertType, triggerMethod, latitude, longitude, address || '', network]
  );

  return result.lastInsertRowId;
}

export async function getAllActiveAlerts() {
  const db = await getDB();
  return db.getAllAsync(
    `SELECT * FROM alerts WHERE status = 'active' ORDER BY created_at DESC`
  );
}

export async function getAllAlerts() {
  const db = await getDB();
  return db.getAllAsync(`SELECT * FROM alerts ORDER BY created_at DESC LIMIT 100`);
}

export async function resolveAlert(alertId) {
  const db = await getDB();
  await db.runAsync(
    `UPDATE alerts SET status = 'resolved', resolved_at = datetime('now') WHERE id = ?`,
    [alertId]
  );
}

export async function getDriverAlerts(driverId) {
  const db = await getDB();
  return db.getAllAsync(
    `SELECT * FROM alerts WHERE driver_id = ? ORDER BY created_at DESC`,
    [driverId]
  );
}
