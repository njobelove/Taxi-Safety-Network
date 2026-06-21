/**
 * TSN Alert Service
 * Creates, reads, and manages SOS alerts.
 * Publishes alert events to Redis for Socket.IO fanout.
 * Calls SMS Service to notify police stations.
 */
require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const { createClient } = require('redis');
const axios     = require('axios');

const app  = express();
const PORT = process.env.PORT || 3002;
app.use(express.json());

// ── MongoDB ────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('[Alert Service] MongoDB connected'))
  .catch(err => { console.error(err); process.exit(1); });

const alertSchema = new mongoose.Schema({
  badge_id:       { type: String, required: true },
  driver_name:    String,
  driver_phone:   String,
  vehicle_plate:  String,
  alert_type:     { type: String, enum: ['theft','accident','medical','voice'], required: true },
  trigger_method: { type: String, enum: ['manual','voice','hardware'], default: 'manual' },
  latitude:       Number,
  longitude:      Number,
  address:        String,
  network:        String,
  status:         { type: String, enum: ['active','resolved'], default: 'active' },
  resolved_at:    Date,
  resolved_by:    String,
}, { timestamps: true });

alertSchema.index({ status: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ badge_id: 1 });
const Alert = mongoose.model('Alert', alertSchema);

// ── Redis pub/sub ──────────────────────────────────────────────────────────────
let redisPublisher;
(async () => {
  redisPublisher = createClient({ url: process.env.REDIS_URL });
  redisPublisher.on('error', e => console.error('[Alert] Redis error:', e));
  await redisPublisher.connect();
  console.log('[Alert Service] Redis connected');
})();

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'healthy', service: 'alert-service', timestamp: new Date().toISOString() })
);

// ── POST /alerts — create alert ────────────────────────────────────────────────
app.post('/alerts', async (req, res) => {
  const { badgeId, driverName, driverPhone, vehiclePlate,
          alertType, triggerMethod, latitude, longitude, address, network } = req.body;

  if (!badgeId || !alertType) {
    return res.status(400).json({ error: 'badgeId and alertType are required' });
  }

  try {
    const alert = await Alert.create({
      badge_id:      badgeId,
      driver_name:   driverName,
      driver_phone:  driverPhone,
      vehicle_plate: vehiclePlate,
      alert_type:    alertType,
      trigger_method: triggerMethod || 'manual',
      latitude, longitude, address, network,
    });

    // Publish to Redis — Socket.IO picks this up and broadcasts to all police dashboards
    if (redisPublisher) {
      await redisPublisher.publish('tsn:alert:new', JSON.stringify({
        alertId:      alert._id,
        badgeId:      alert.badge_id,
        driverName:   alert.driver_name,
        vehiclePlate: alert.vehicle_plate,
        alertType:    alert.alert_type,
        triggerMethod: alert.trigger_method,
        latitude:     alert.latitude,
        longitude:    alert.longitude,
        address:      alert.address,
        network:      alert.network,
        createdAt:    alert.createdAt,
      }));
    }

    // Notify SMS service to send to all police station emergency lines
    try {
      await axios.post(`${process.env.SMS_SERVICE_URL}/sms/alert-broadcast`, {
        alertId:      alert._id,
        driverName:   alert.driver_name,
        badgeId:      alert.badge_id,
        vehiclePlate: alert.vehicle_plate,
        alertType:    alert.alert_type,
        latitude:     alert.latitude,
        longitude:    alert.longitude,
      }, { timeout: 5000 });
    } catch (smsErr) {
      console.warn('[Alert] SMS notification failed (non-fatal):', smsErr.message);
    }

    res.status(201).json({ success: true, alertId: alert._id, alert });
  } catch (err) {
    console.error('[Alert] Create error:', err);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// ── GET /alerts — all active alerts (for police dashboard) ────────────────────
app.get('/alerts', async (req, res) => {
  try {
    const { status = 'active', limit = 50 } = req.query;
    const alerts = await Alert.find({ status })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json({ alerts, total: alerts.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// ── GET /alerts/driver/:badgeId — driver's own alerts ─────────────────────────
app.get('/alerts/driver/:badgeId', async (req, res) => {
  try {
    const alerts = await Alert.find({ badge_id: req.params.badgeId })
      .sort({ createdAt: -1 }).limit(30);
    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch driver alerts' });
  }
});

// ── PATCH /alerts/:id/resolve ─────────────────────────────────────────────────
app.patch('/alerts/:id/resolve', async (req, res) => {
  const { resolvedBy } = req.body;
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolved_at: new Date(), resolved_by: resolvedBy },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    // Publish resolved event
    if (redisPublisher) {
      await redisPublisher.publish('tsn:alert:resolved', JSON.stringify({
        alertId: alert._id, resolvedBy, resolvedAt: alert.resolved_at
      }));
    }

    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// ── GET /alerts/:id — single alert details ─────────────────────────────────────
app.get('/alerts/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

app.listen(PORT, () => console.log(`[Alert Service] Running on port ${PORT}`));
