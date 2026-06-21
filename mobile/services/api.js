/**
 * TSN — MongoDB Atlas Data API
 * All database calls go through here.
 * Replace ATLAS_APP_ID and API_KEY with your own from MongoDB Atlas.
 */

// ── CONFIG — replace these with your Atlas values ─────────────────────────────
const ATLAS_APP_ID  = 'YOUR_ATLAS_APP_ID';       // e.g. "tsn-abcde"
const API_KEY       = 'YOUR_ATLAS_API_KEY';       // Data API key from Atlas
const CLUSTER_NAME  = 'Cluster0';                 // your cluster name
const DATABASE      = 'tsn_cameroon';             // your database name

const BASE_URL = `https://data.mongodb-api.com/app/${ATLAS_APP_ID}/endpoint/data/v1`;

// ── Generic request ────────────────────────────────────────────────────────────
async function atlasRequest(action, collection, body = {}) {
  const res = await fetch(`${BASE_URL}/action/${action}`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'api-key':        API_KEY,
    },
    body: JSON.stringify({
      dataSource: CLUSTER_NAME,
      database:   DATABASE,
      collection,
      ...body,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Atlas request failed');
  return data;
}

// ── Password hash (SHA-256 via Web Crypto) ─────────────────────────────────────
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data    = encoder.encode(password + 'TSN_SALT_CMR_2024');
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRIVER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Register a new taxi driver.
 * Returns the inserted driver document.
 */
export async function registerDriver({
  fullName, badgeId, phoneNumber, network,
  vehiclePlate, city, password,
}) {
  // Check duplicate badge
  const check = await atlasRequest('findOne', 'drivers', {
    filter: { badge_id: badgeId.toUpperCase() },
  });
  if (check.document) throw new Error('BADGE_EXISTS');

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  const result = await atlasRequest('insertOne', 'drivers', {
    document: {
      full_name:     fullName.trim(),
      badge_id:      badgeId.toUpperCase().trim(),
      phone_number:  phoneNumber.trim(),
      network,
      vehicle_plate: vehiclePlate.toUpperCase().trim(),
      city,
      password_hash: passwordHash,
      voice_profile: null,   // set later via saveVoiceProfile
      created_at:    now,
    },
  });

  return result.insertedId;
}

/**
 * Login a driver by badge_id + password.
 * Returns full driver document on success.
 * Throws INVALID_CREDENTIALS if no match.
 */
export async function loginDriver(badgeId, password) {
  const passwordHash = await hashPassword(password);

  const result = await atlasRequest('findOne', 'drivers', {
    filter: {
      badge_id:      badgeId.toUpperCase().trim(),
      password_hash: passwordHash,
    },
  });

  if (!result.document) throw new Error('INVALID_CREDENTIALS');
  return result.document;
}

/**
 * Save / update voice trigger phrase and recording URI for a driver.
 */
export async function saveVoiceProfile(badgeId, triggerPhrase, recordingUri) {
  await atlasRequest('updateOne', 'drivers', {
    filter: { badge_id: badgeId.toUpperCase() },
    update: {
      $set: {
        voice_profile: {
          trigger_phrase: triggerPhrase,
          recording_uri:  recordingUri,
          updated_at:     new Date().toISOString(),
        },
      },
    },
  });
}

/**
 * Get a single driver by badge_id.
 */
export async function getDriverByBadge(badgeId) {
  const result = await atlasRequest('findOne', 'drivers', {
    filter: { badge_id: badgeId.toUpperCase() },
  });
  return result.document;
}

// ═══════════════════════════════════════════════════════════════════════════════
// POLICE STATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Register a police station (not individual officers).
 * station_id is the unique identifier (e.g. YDE-001, DLA-003).
 */
export async function registerPoliceStation({
  stationName, stationId, district, city,
  emergencyLine, secondaryLine, commanderName, password,
}) {
  // Check duplicate station ID
  const check = await atlasRequest('findOne', 'police_stations', {
    filter: { station_id: stationId.toUpperCase() },
  });
  if (check.document) throw new Error('STATION_EXISTS');

  const passwordHash = await hashPassword(password);

  const result = await atlasRequest('insertOne', 'police_stations', {
    document: {
      station_name:    stationName.trim(),
      station_id:      stationId.toUpperCase().trim(),
      district:        district.trim(),
      city:            city.trim(),
      emergency_line:  emergencyLine.trim(),   // primary emergency contact
      secondary_line:  secondaryLine?.trim() || '',
      commander_name:  commanderName.trim(),
      password_hash:   passwordHash,
      created_at:      new Date().toISOString(),
    },
  });

  return result.insertedId;
}

/**
 * Login a police station by station_id + password.
 */
export async function loginPoliceStation(stationId, password) {
  const passwordHash = await hashPassword(password);

  const result = await atlasRequest('findOne', 'police_stations', {
    filter: {
      station_id:    stationId.toUpperCase().trim(),
      password_hash: passwordHash,
    },
  });

  if (!result.document) throw new Error('INVALID_CREDENTIALS');
  return result.document;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new alert — visible to ALL police stations.
 */
export async function createAlert({
  badgeId, driverName, driverPhone, vehiclePlate,
  alertType, triggerMethod, latitude, longitude,
  address, network,
}) {
  const result = await atlasRequest('insertOne', 'alerts', {
    document: {
      badge_id:       badgeId,
      driver_name:    driverName,
      driver_phone:   driverPhone,
      vehicle_plate:  vehiclePlate,
      alert_type:     alertType,       // 'theft' | 'accident' | 'medical' | 'voice'
      trigger_method: triggerMethod,   // 'manual' | 'voice' | 'hardware'
      latitude,
      longitude,
      address:        address || '',
      network,
      status:         'active',
      created_at:     new Date().toISOString(),
      resolved_at:    null,
      resolved_by:    null,            // station_id of who resolved it
    },
  });

  return result.insertedId;
}

/**
 * Get all ACTIVE alerts (for police dashboard — all stations see all alerts).
 */
export async function getAllActiveAlerts() {
  const result = await atlasRequest('find', 'alerts', {
    filter: { status: 'active' },
    sort:   { created_at: -1 },
    limit:  50,
  });
  return result.documents || [];
}

/**
 * Get all alerts (active + resolved) for history view.
 */
export async function getAllAlerts() {
  const result = await atlasRequest('find', 'alerts', {
    filter: {},
    sort:   { created_at: -1 },
    limit:  100,
  });
  return result.documents || [];
}

/**
 * Get alerts for a specific driver by badge_id.
 */
export async function getDriverAlerts(badgeId) {
  const result = await atlasRequest('find', 'alerts', {
    filter: { badge_id: badgeId },
    sort:   { created_at: -1 },
    limit:  30,
  });
  return result.documents || [];
}

/**
 * Mark an alert as resolved by a police station.
 */
export async function resolveAlert(alertId, stationId) {
  await atlasRequest('updateOne', 'alerts', {
    filter: { _id: { $oid: alertId } },
    update: {
      $set: {
        status:      'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: stationId,
      },
    },
  });
}
