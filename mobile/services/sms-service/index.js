/**
 * TSN SMS Service
 * Sends SMS alerts to all registered police station emergency lines.
 * Uses Africa's Talking as primary gateway (covers MTN + Orange Cameroon).
 */
require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const AT       = require('africastalking');

const app  = express();
const PORT = process.env.PORT || 3004;
app.use(express.json());

// ── Africa's Talking client ────────────────────────────────────────────────────
const africastalking = AT({
  apiKey:   process.env.AFRICAS_TALKING_KEY     || 'sandbox',
  username: process.env.AFRICAS_TALKING_USERNAME || 'sandbox',
});
const smsClient = africastalking.SMS;

// ── MongoDB — to look up all police station emergency lines ───────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('[SMS Service] MongoDB connected'))
  .catch(err => console.error('[SMS Service] MongoDB error:', err));

const PoliceStation = mongoose.model('PoliceStation', new mongoose.Schema({
  station_name:   String,
  station_id:     String,
  emergency_line: String,
  secondary_line: String,
  city:           String,
}));

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'healthy', service: 'sms-service', timestamp: new Date().toISOString() })
);

// ── Build SMS message ──────────────────────────────────────────────────────────
function buildAlertSMS({ driverName, badgeId, vehiclePlate, alertType, latitude, longitude }) {
  const mapsLink = latitude && longitude
    ? `https://maps.google.com/?q=${latitude},${longitude}`
    : 'Location unavailable';

  const typeLabels = {
    theft:    '🔴 THEFT/AGGRESSION',
    accident: '🚗 ACCIDENT',
    medical:  '🏥 MEDICAL EMERGENCY',
    voice:    '🎙 VOICE TRIGGER ALERT',
  };

  return [
    `🚨 TSN ALERT — ${typeLabels[alertType] || 'SOS'}`,
    `Driver: ${driverName || 'Unknown'} (${badgeId})`,
    `Vehicle: ${vehiclePlate || '—'}`,
    `Location: ${mapsLink}`,
    `Time: ${new Date().toLocaleTimeString('fr-CM')}`,
    `Reply RESOLVED to confirm intervention.`,
  ].join('\n');
}

// ── POST /sms/alert-broadcast — send SMS to ALL police station emergency lines ─
app.post('/sms/alert-broadcast', async (req, res) => {
  const { alertId, driverName, badgeId, vehiclePlate, alertType, latitude, longitude } = req.body;

  try {
    // Fetch all registered police station emergency numbers
    const stations = await PoliceStation.find({}, 'station_id emergency_line secondary_line city');

    if (!stations.length) {
      console.warn('[SMS] No police stations registered — skipping SMS broadcast');
      return res.json({ success: true, sent: 0, message: 'No stations registered' });
    }

    // Collect all emergency numbers
    const recipients = [];
    stations.forEach(st => {
      if (st.emergency_line) recipients.push(st.emergency_line);
      if (st.secondary_line) recipients.push(st.secondary_line);
    });

    const message = buildAlertSMS({ driverName, badgeId, vehiclePlate, alertType, latitude, longitude });

    // Africa's Talking accepts up to 100 recipients per request
    const batchSize = 100;
    const results   = [];
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      try {
        const result = await smsClient.send({
          to:      batch,
          message,
          from:    'TSN-CMR',
        });
        results.push(result);
        console.log(`[SMS] Batch ${Math.floor(i/batchSize)+1} sent to ${batch.length} stations`);
      } catch (batchErr) {
        console.error(`[SMS] Batch failed:`, batchErr.message);
      }
    }

    // Also send to national emergency line 117
    try {
      await smsClient.send({ to: ['+237117'], message, from: 'TSN-CMR' });
    } catch (_) { /* 117 may not accept SMS — non-fatal */ }

    res.json({ success: true, sent: recipients.length, alertId });
  } catch (err) {
    console.error('[SMS] Broadcast error:', err);
    res.status(500).json({ error: 'SMS broadcast failed' });
  }
});

// ── POST /sms/send — send a single SMS (for offline fallback) ─────────────────
app.post('/sms/send', async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ error: 'to and message required' });

  try {
    const result = await smsClient.send({ to: Array.isArray(to) ? to : [to], message, from: 'TSN-CMR' });
    res.json({ success: true, result });
  } catch (err) {
    console.error('[SMS] Send error:', err);
    res.status(500).json({ error: 'SMS send failed' });
  }
});

app.listen(PORT, () => console.log(`[SMS Service] Running on port ${PORT}`));
