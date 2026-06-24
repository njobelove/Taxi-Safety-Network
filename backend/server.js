require('dotenv').config();
const express   = require('express');
const http      = require('http');
const socketIo  = require('socket.io');
const cors      = require('cors');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const mongoose  = require('mongoose');

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server, {
  cors: { origin: '*', methods: ['GET','POST','PUT','DELETE'] }
});

app.use(cors());
app.use(express.json());

const JWT_SECRET  = process.env.JWT_SECRET || 'tsn_secret_2024';
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected!'))
  .catch(e  => console.log('❌ MongoDB error:', e.message));

// ── MODELS ────────────────────────────────────────────────────────────────────
const DriverSchema = new mongoose.Schema({
  fullName:     { type: String, required: true },
  badgeId:      { type: String, required: true, unique: true, uppercase: true },
  phoneNumber:  { type: String },
  network:      { type: String, default: 'MTN' },
  vehiclePlate: { type: String },
  city:         { type: String, default: 'Yaoundé' },
  password:     { type: String, required: true },
}, { timestamps: true });

const StationSchema = new mongoose.Schema({
  stationName:   { type: String, required: true },
  stationId:     { type: String, required: true, unique: true, uppercase: true },
  district:      { type: String },
  city:          { type: String },
  emergencyLine: { type: String },
  commanderName: { type: String },
  password:      { type: String, required: true },
}, { timestamps: true });

const AlertSchema = new mongoose.Schema({
  driverId:         { type: String },
  driverName:       { type: String },
  phoneNumber:      { type: String },
  network:          { type: String },
  vehiclePlate:     { type: String },
  alertType:        { type: String },
  location:         { type: Object },
  triggerMethod:    { type: String, default: 'manual' },
  hasVoiceNote:     { type: Boolean, default: false },
  status:           { type: String, default: 'pending' },
  credibilityScore: { type: Number, default: 98 },
  responderId:      { type: String },
  resolvedAt:       { type: Date },
}, { timestamps: true });

const ChatSchema = new mongoose.Schema({
  senderId:   { type: String, required: true },
  senderName: { type: String, required: true },
  senderType: { type: String, default: 'driver' },
  message:    { type: String, required: true },
  type:       { type: String, default: 'text' },
  voiceUri:   { type: String },
  likes:      { type: Number, default: 0 },
}, { timestamps: true });

const Driver      = mongoose.model('Driver',      DriverSchema);
const Station     = mongoose.model('Station',     StationSchema);
const Alert       = mongoose.model('Alert',       AlertSchema);
const ChatMessage = mongoose.model('ChatMessage', ChatSchema);

// ── Seed chat with welcome messages if empty ──────────────────────────────────
async function seedChat() {
  try {
    const count = await ChatMessage.countDocuments();
    if (count === 0) {
      await ChatMessage.create([
        {
          senderId:   'TSN-ADMIN',
          senderName: 'TSN Command',
          senderType: 'police',
          message:    '🛡 Welcome to TSN Community Board! This is a shared group for all drivers and police officers across Cameroon. Stay safe on the roads!',
          type:       'tip',
        },
        {
          senderId:   'TSN-ADMIN',
          senderName: 'TSN Command',
          senderType: 'police',
          message:    '⚠ SAFETY TIP: Always lock your doors at traffic lights. Keep windows up in isolated areas. Trust your instincts.',
          type:       'tip',
        },
        {
          senderId:   'TSN-ADMIN',
          senderName: 'TSN Command',
          senderType: 'police',
          message:    '📱 REMINDER: Record your voice note in Profile so police can identify you during SOS alerts. Hold SOS button 3 seconds for instant alert — no selection needed!',
          type:       'tip',
        },
      ]);
      console.log('✅ Chat seeded with welcome messages');
    }
  } catch (e) {
    console.log('Seed error:', e.message);
  }
}
mongoose.connection.once('open', seedChat);

// Live driver locations (in-memory — updates frequently)
let liveDrivers = {};

// ── HEALTH ────────────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const db = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status:    'OK',
    message:   'TSN API running',
    database:  db,
    timestamp: new Date().toISOString(),
  });
});

// ── REGISTER DRIVER ───────────────────────────────────────────────────────────
app.post('/api/auth/drivers/register', async (req, res) => {
  try {
    const { fullName, badgeId, phoneNumber, network, vehiclePlate, city, password } = req.body;
    if (!fullName || !badgeId || !password)
      return res.status(400).json({ error: 'fullName, badgeId and password are required' });
    if (await Driver.findOne({ badgeId: badgeId.toUpperCase() }))
      return res.status(409).json({ error: 'BADGE_EXISTS' });
    const driver = await Driver.create({
      fullName, badgeId, phoneNumber, network, vehiclePlate, city,
      password: await bcrypt.hash(password, 10),
    });
    const token = jwt.sign(
      { id: driver._id, badgeId: driver.badgeId, type: 'driver' },
      JWT_SECRET, { expiresIn: '7d' }
    );
    const { password: _, ...data } = driver.toObject();
    console.log('✅ Driver registered:', driver.badgeId);
    res.status(201).json({ token, type: 'driver', user: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── LOGIN DRIVER ──────────────────────────────────────────────────────────────
app.post('/api/auth/drivers/login', async (req, res) => {
  try {
    const { badgeId, password } = req.body;
    if (!badgeId || !password)
      return res.status(400).json({ error: 'badgeId and password are required' });
    const driver = await Driver.findOne({ badgeId: badgeId.toUpperCase() });
    if (!driver || !await bcrypt.compare(password, driver.password)) {
      console.log('❌ Invalid credentials for:', badgeId);
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }
    const token = jwt.sign(
      { id: driver._id, badgeId: driver.badgeId, type: 'driver' },
      JWT_SECRET, { expiresIn: '7d' }
    );
    const { password: _, ...data } = driver.toObject();
    console.log('✅ Driver logged in:', driver.badgeId);
    res.json({ token, type: 'driver', user: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── REGISTER STATION ──────────────────────────────────────────────────────────
app.post('/api/auth/stations/register', async (req, res) => {
  try {
    const { stationName, stationId, district, city, emergencyLine, commanderName, password } = req.body;
    if (!stationName || !stationId || !password)
      return res.status(400).json({ error: 'stationName, stationId and password are required' });
    if (await Station.findOne({ stationId: stationId.toUpperCase() }))
      return res.status(409).json({ error: 'STATION_EXISTS' });
    const station = await Station.create({
      stationName, stationId, district, city, emergencyLine, commanderName,
      password: await bcrypt.hash(password, 10),
    });
    const token = jwt.sign(
      { id: station._id, stationId: station.stationId, type: 'police' },
      JWT_SECRET, { expiresIn: '7d' }
    );
    const { password: _, ...data } = station.toObject();
    console.log('✅ Station registered:', station.stationId);
    res.status(201).json({ token, type: 'police', user: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── LOGIN STATION ─────────────────────────────────────────────────────────────
app.post('/api/auth/stations/login', async (req, res) => {
  try {
    const { stationId, password } = req.body;
    if (!stationId || !password)
      return res.status(400).json({ error: 'stationId and password are required' });
    const station = await Station.findOne({ stationId: stationId.toUpperCase() });
    if (!station || !await bcrypt.compare(password, station.password)) {
      console.log('❌ Invalid credentials for station:', stationId);
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }
    const token = jwt.sign(
      { id: station._id, stationId: station.stationId, type: 'police' },
      JWT_SECRET, { expiresIn: '7d' }
    );
    const { password: _, ...data } = station.toObject();
    console.log('✅ Station logged in:', station.stationId);
    res.json({ token, type: 'police', user: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ALERTS ────────────────────────────────────────────────────────────────────
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find({ status: { $ne: 'resolved' } })
      .sort({ createdAt: -1 }).limit(50);
    res.json({ alerts });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/alerts/sos', async (req, res) => {
  try {
    const alert = await Alert.create({
      ...req.body,
      status:           'pending',
      credibilityScore: 98,
    });
    io.emit('new-alert', alert);
    console.log('🚨 SOS:', alert.alertType, 'from', alert.driverId);
    res.status(201).json(alert);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/alerts/:id/status', async (req, res) => {
  try {
    const update = { status: req.body.status };
    if (req.body.responderId) update.responderId = req.body.responderId;
    if (req.body.status === 'resolved') update.resolvedAt = new Date();
    const alert = await Alert.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    io.emit('alert-updated', alert);
    res.json(alert);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── RESPONDERS ────────────────────────────────────────────────────────────────
app.get('/api/responders/nearby', (req, res) => {
  res.json({ responders: [
    { id: 'P-09',  type: 'patrol',  distance: 0.8, eta: '3 mins', lat: 3.8500, lng: 11.5600, status: 'available' },
    { id: 'MED-B', type: 'medical', distance: 2.3, eta: '5 mins', lat: 3.8450, lng: 11.5650, status: 'available' },
    { id: 'R14',   type: 'rapid',   distance: 0.2, eta: '1 min',  lat: 3.8480, lng: 11.5625, status: 'en-route'  },
  ]});
});

// ── DRIVER LOCATION ───────────────────────────────────────────────────────────
app.post('/api/driver/location', (req, res) => {
  const { driverId, lat, lng, speed } = req.body;
  io.emit('driver-location', { driverId, lat, lng, speed, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// ── LIVE DRIVER MAP ───────────────────────────────────────────────────────────
app.post('/api/drivers/live-location', (req, res) => {
  const { driverId, driverName, lat, lng, speed, heading, vehiclePlate, network } = req.body;
  if (!driverId || !lat || !lng)
    return res.status(400).json({ error: 'driverId, lat, lng required' });
  liveDrivers[driverId] = {
    driverId, driverName, lat, lng,
    speed: speed || 0, heading: heading || 0,
    vehiclePlate, network,
    lastSeen: new Date().toISOString(),
    active: true,
  };
  io.emit('driver-location-update', liveDrivers[driverId]);
  res.json({ success: true });
});

app.get('/api/drivers/live', (req, res) => {
  const cutoff = Date.now() - 2 * 60 * 1000;
  Object.keys(liveDrivers).forEach(id => {
    if (new Date(liveDrivers[id].lastSeen).getTime() < cutoff)
      liveDrivers[id].active = false;
  });
  res.json({ drivers: Object.values(liveDrivers) });
});

// ── STATS ─────────────────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const [total, pending, resolved, drivers, stations] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ status: 'pending' }),
      Alert.countDocuments({ status: 'resolved' }),
      Driver.countDocuments(),
      Station.countDocuments(),
    ]);
    res.json({
      totalAlerts:       total,
      pendingAlerts:     pending,
      resolvedAlerts:    resolved,
      registeredDrivers: drivers,
      policeStations:    stations,
      avgResponseTime:   '14.2m',
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POLICE CONTACTS ───────────────────────────────────────────────────────────
app.get('/api/contacts/police', async (req, res) => {
  try {
    const stations = await Station.find({}, 'stationName stationId emergencyLine city');
    res.json({ stations });
  } catch (e) {
    res.json({ stations: [
      { stationName: 'Commissariat Central Yaoundé', stationId: 'YDE-PS-001', emergencyLine: '+237222221234', city: 'Yaoundé' },
      { stationName: 'Commissariat Douala',          stationId: 'DLA-PS-001', emergencyLine: '+237233456789', city: 'Douala'  },
    ]});
  }
});

// ── CHAT MESSAGES — saved permanently in MongoDB ──────────────────────────────
app.get('/api/chat/messages', async (req, res) => {
  try {
    const msgs = await ChatMessage.find().sort({ createdAt: 1 }).limit(200);
    res.json({ messages: msgs.map(m => ({
      id:         m._id,
      senderId:   m.senderId,
      senderName: m.senderName,
      senderType: m.senderType,
      message:    m.message,
      type:       m.type,
      voiceUri:   m.voiceUri,
      likes:      m.likes,
      timestamp:  m.createdAt,
    }))});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/chat/messages', async (req, res) => {
  try {
    const { senderId, senderName, senderType, message, type = 'text', voiceUri } = req.body;
    if (!senderId || !senderName || !message)
      return res.status(400).json({ error: 'senderId, senderName and message required' });
    const msg = await ChatMessage.create({
      senderId, senderName, senderType, message, type, voiceUri,
    });
    const out = {
      id:         msg._id,
      senderId:   msg.senderId,
      senderName: msg.senderName,
      senderType: msg.senderType,
      message:    msg.message,
      type:       msg.type,
      voiceUri:   msg.voiceUri,
      likes:      msg.likes,
      timestamp:  msg.createdAt,
    };
    io.emit('new-chat-message', out);
    console.log('💬 Chat saved from ' + senderName + ': ' + message.substring(0, 40));
    res.status(201).json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/chat/messages/:id/like', async (req, res) => {
  try {
    const msg = await ChatMessage.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    io.emit('message-liked', { id: msg._id, likes: msg.likes });
    res.json({ id: msg._id, likes: msg.likes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SAFETY TIPS ───────────────────────────────────────────────────────────────
app.get('/api/chat/tips', (req, res) => {
  res.json({ tips: [
    { id: '1', category: 'Vehicle Safety',     tip: 'Always lock doors at traffic lights. Keep windows up in isolated areas.',         ico: '🔒' },
    { id: '2', category: 'Route Safety',       tip: 'Avoid dark isolated roads at night. Use well-lit main roads even if longer.',     ico: '🛣'  },
    { id: '3', category: 'Passenger Awareness',tip: 'Trust your instincts. If uncomfortable, drive to the nearest police post.',       ico: '👁'  },
    { id: '4', category: 'Communication',      tip: 'Keep phone charged. Inform someone of your route on night shifts.',               ico: '📱' },
    { id: '5', category: 'Emergency Protocol', tip: 'In robbery: comply, do not resist. Activate SOS as soon as it is safe to do so.',ico: '🚨' },
    { id: '6', category: 'Health & Fatigue',   tip: 'Do not drive more than 8 hours without rest. Fatigue causes accidents.',         ico: '😴' },
  ]});
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route ' + req.method + ' ' + req.path + ' not found' });
});

// ── SOCKET.IO ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Send pending alerts to new client
  Alert.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(20)
    .then(alerts => socket.emit('current-alerts', alerts));

  // Send recent chat history to new client
  ChatMessage.find().sort({ createdAt: 1 }).limit(50)
    .then(msgs => socket.emit('chat-history', msgs.map(m => ({
      id:         m._id,
      senderId:   m.senderId,
      senderName: m.senderName,
      senderType: m.senderType,
      message:    m.message,
      type:       m.type,
      voiceUri:   m.voiceUri,
      likes:      m.likes,
      timestamp:  m.createdAt,
    }))));

  socket.on('sos-triggered', async (data) => {
    const alert = await Alert.create({ ...data, status: 'pending', credibilityScore: 98 });
    io.emit('new-sos-alert', alert);
  });

  socket.on('assign-responder', async ({ alertId, responderId }) => {
    const alert = await Alert.findByIdAndUpdate(
      alertId, { responderId, status: 'responding' }, { new: true }
    );
    if (alert) io.emit('alert-assigned', { alert, responderId });
  });

  socket.on('disconnect', () => {
    console.log('🔌 Disconnected:', socket.id);
  });
});

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log('\n🚕 TSN Backend running on http://localhost:' + PORT);
  console.log('🗄️  MongoDB: ' + (MONGODB_URI ? 'configured' : 'NOT SET'));
  console.log('\n📋 Routes:');
  console.log('   GET  /api/health');
  console.log('   POST /api/auth/drivers/register');
  console.log('   POST /api/auth/drivers/login');
  console.log('   POST /api/auth/stations/register');
  console.log('   POST /api/auth/stations/login');
  console.log('   GET  /api/alerts');
  console.log('   POST /api/alerts/sos');
  console.log('   PUT  /api/alerts/:id/status');
  console.log('   GET  /api/responders/nearby');
  console.log('   POST /api/driver/location');
  console.log('   GET  /api/stats');
  console.log('   GET  /api/chat/messages');
  console.log('   POST /api/chat/messages');
  console.log('   POST /api/chat/messages/:id/like');
  console.log('   GET  /api/chat/tips');
  console.log('   GET  /api/drivers/live');
  console.log('   POST /api/drivers/live-location');
  console.log('   GET  /api/contacts/police');
  console.log('\n✅ Ready!\n');
});