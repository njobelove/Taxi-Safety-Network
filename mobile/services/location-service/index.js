/**
 * TSN Location Service
 * Stores real-time driver GPS positions in Redis (TTL = 30s).
 * Reverse-geocodes with Google Maps API.
 * Provides location data to alert and socket services.
 */
require('dotenv').config();
const express = require('express');
const { createClient } = require('redis');
const axios   = require('axios');

const app  = express();
const PORT = process.env.PORT || 3003;
app.use(express.json());

let redis;
(async () => {
  redis = createClient({ url: process.env.REDIS_URL });
  redis.on('error', e => console.error('[Location] Redis error:', e));
  await redis.connect();
  console.log('[Location Service] Redis connected');
})();

app.get('/health', (req, res) =>
  res.json({ status: 'healthy', service: 'location-service', timestamp: new Date().toISOString() })
);

// ── POST /location/update — driver sends GPS every 3 seconds ──────────────────
app.post('/location/update', async (req, res) => {
  const { badgeId, latitude, longitude, accuracy, speed, heading } = req.body;
  if (!badgeId || latitude == null || longitude == null) {
    return res.status(400).json({ error: 'badgeId, latitude, longitude required' });
  }

  try {
    const key  = `driver:location:${badgeId}`;
    const data = JSON.stringify({ badgeId, latitude, longitude, accuracy, speed, heading, ts: Date.now() });

    // Store with 30s TTL — driver is considered offline if no update received
    await redis.set(key, data, { EX: 30 });

    // Publish for Socket.IO fanout to police dashboards
    await redis.publish('tsn:location:update', data);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// ── GET /location/:badgeId — get driver's last known location ─────────────────
app.get('/location/:badgeId', async (req, res) => {
  try {
    const data = await redis.get(`driver:location:${req.params.badgeId}`);
    if (!data) return res.status(404).json({ error: 'Driver location not found or expired' });
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to get location' });
  }
});

// ── GET /location/all/drivers — all active drivers on the map ─────────────────
app.get('/location/all/drivers', async (req, res) => {
  try {
    const keys = await redis.keys('driver:location:*');
    if (!keys.length) return res.json({ drivers: [] });

    const locations = await Promise.all(
      keys.map(async (k) => {
        const d = await redis.get(k);
        return d ? JSON.parse(d) : null;
      })
    );
    res.json({ drivers: locations.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get all locations' });
  }
});

// ── POST /location/geocode — reverse geocode lat/lng to address ───────────────
app.post('/location/geocode', async (req, res) => {
  const { latitude, longitude } = req.body;
  if (!latitude || !longitude) return res.status(400).json({ error: 'latitude and longitude required' });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.json({ address: `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E` });

  try {
    // Cache geocode results in Redis for 1 hour
    const cacheKey = `geocode:${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
    const cached   = await redis.get(cacheKey);
    if (cached) return res.json({ address: cached });

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=fr`;
    const { data } = await axios.get(url, { timeout: 5000 });

    const address = data.results?.[0]?.formatted_address
      || `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`;

    await redis.set(cacheKey, address, { EX: 3600 });
    res.json({ address });
  } catch (err) {
    console.warn('[Location] Geocode error:', err.message);
    res.json({ address: `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E` });
  }
});

app.listen(PORT, () => console.log(`[Location Service] Running on port ${PORT}`));
