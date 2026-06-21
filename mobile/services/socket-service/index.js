/**
 * TSN Socket Service — Real-Time Event Hub
 * Subscribes to Redis channels and broadcasts to all connected clients.
 * Uses Socket.IO Redis adapter for horizontal scaling across K8s pods.
 */
require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server }  = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient }  = require('redis');
const jwt      = require('jsonwebtoken');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 3006;

// ── Socket.IO with Redis adapter (scales across K8s replicas) ─────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] },
  transports: ['websocket', 'polling'],   // fallback to polling on 2G
});

// ── Redis clients ──────────────────────────────────────────────────────────────
async function setupRedis() {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  pubClient.on('error', e => console.error('[Socket] Redis pub error:', e));
  subClient.on('error', e => console.error('[Socket] Redis sub error:', e));

  await Promise.all([pubClient.connect(), subClient.connect()]);
  console.log('[Socket Service] Redis connected');

  // Attach Redis adapter — all Socket.IO pods share the same rooms
  io.adapter(createAdapter(pubClient, subClient));

  // Subscribe to alert events from Alert Service
  await subClient.subscribe('tsn:alert:new', (message) => {
    const alert = JSON.parse(message);
    io.to('police').emit('alert:new', alert);        // all police dashboards
    io.to('drivers').emit('alert:network', alert);  // driver network feed
    console.log(`[Socket] Broadcast alert:new — ${alert.alertType} by ${alert.badgeId}`);
  });

  await subClient.subscribe('tsn:alert:resolved', (message) => {
    const data = JSON.parse(message);
    io.to('police').emit('alert:resolved', data);
    io.to('drivers').emit('alert:resolved', data);
  });

  // Subscribe to location updates
  await subClient.subscribe('tsn:location:update', (message) => {
    const loc = JSON.parse(message);
    io.to('police').emit('location:update', loc);
  });

  return pubClient;
}

// ── JWT auth for Socket.IO connections ────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// ── Connection handler ─────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  const { type, badge_id, station_id } = socket.user;
  console.log(`[Socket] Connected — ${type}: ${badge_id || station_id}`);

  // Join appropriate room
  if (type === 'police') {
    socket.join('police');
    socket.emit('connected', { message: 'Connected to TSN Command Network', room: 'police' });
  } else if (type === 'driver') {
    socket.join('drivers');
    socket.join(`driver:${badge_id}`);  // personal room for direct messages
    socket.emit('connected', { message: 'Connected to TSN Driver Network', room: 'drivers' });
  }

  // Driver sends chat to network
  socket.on('driver:broadcast', (data) => {
    io.to('drivers').emit('driver:message', { ...data, from: badge_id, ts: Date.now() });
  });

  // Driver location ping (lightweight — avoid REST call)
  socket.on('location:ping', (coords) => {
    socket.to('police').emit('location:update', { badgeId: badge_id, ...coords, ts: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected — ${type}: ${badge_id || station_id}`);
  });
});

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({
    status:      'healthy',
    service:     'socket-service',
    connections: io.engine.clientsCount,
    timestamp:   new Date().toISOString(),
  })
);

// ── Start ──────────────────────────────────────────────────────────────────────
setupRedis().then(() => {
  server.listen(PORT, () => console.log(`[Socket Service] Running on port ${PORT}`));
}).catch(err => { console.error('[Socket] Startup error:', err); process.exit(1); });
