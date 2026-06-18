// MongoDB initialization — runs once when container first starts
db = db.getSiblingDB('tsn_cameroon');

// Create collections with validators
db.createCollection('drivers', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['full_name', 'badge_id', 'phone_number', 'network', 'vehicle_plate', 'city', 'password_hash'],
      properties: {
        full_name:     { bsonType: 'string' },
        badge_id:      { bsonType: 'string' },
        phone_number:  { bsonType: 'string' },
        network:       { bsonType: 'string', enum: ['MTN', 'ORANGE', 'CAMTEL'] },
        vehicle_plate: { bsonType: 'string' },
        city:          { bsonType: 'string' },
        password_hash: { bsonType: 'string' },
      }
    }
  }
});

db.createCollection('police_stations');
db.createCollection('alerts');
db.createCollection('voice_profiles');

// Indexes for fast lookups
db.drivers.createIndex({ badge_id: 1 },       { unique: true });
db.drivers.createIndex({ phone_number: 1 });
db.drivers.createIndex({ city: 1 });

db.police_stations.createIndex({ station_id: 1 }, { unique: true });
db.police_stations.createIndex({ city: 1 });

db.alerts.createIndex({ status: 1 });
db.alerts.createIndex({ created_at: -1 });
db.alerts.createIndex({ badge_id: 1 });
db.alerts.createIndex({ latitude: 1, longitude: 1 }, { sparse: true });

db.voice_profiles.createIndex({ driver_id: 1 }, { unique: true });

// Create app user (less privileged than root)
db.createUser({
  user: 'tsn_app',
  pwd:  'tsn_app_password_2024',
  roles: [{ role: 'readWrite', db: 'tsn_cameroon' }]
});

print('TSN MongoDB initialized successfully');
