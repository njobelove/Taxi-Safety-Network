const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Store active alerts in memory (in production, use a database)
let activeAlerts = [];
let activeResponders = [];

// ============ API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Taxi Safety Network API is running',
    timestamp: new Date().toISOString()
  });
});

// Get all active alerts
app.get('/api/alerts', (req, res) => {
  res.json({ alerts: activeAlerts });
});

// Create a new SOS alert
app.post('/api/alerts/sos', (req, res) => {
  const alert = {
    id: Date.now().toString(),
    ...req.body,
    status: 'pending',
    credibilityScore: 98,
    timestamp: new Date().toISOString()
  };
  
  activeAlerts.unshift(alert);
  
  // Broadcast to all connected clients via WebSocket
  io.emit('new-alert', alert);
  
  res.status(201).json(alert);
});

// Update alert status
app.put('/api/alerts/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, responderId } = req.body;
  
  const alert = activeAlerts.find(a => a.id === id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  
  alert.status = status;
  if (responderId) alert.responderId = responderId;
  if (status === 'resolved') alert.resolvedAt = new Date().toISOString();
  
  io.emit('alert-updated', alert);
  
  res.json(alert);
});

// Get nearby responders
app.get('/api/responders/nearby', (req, res) => {
  const { lat, lng, radius = 5 } = req.query;
  
  // Mock responders - in production, query from database
  const mockResponders = [
    { id: 'P-09', type: 'patrol', distance: 0.8, eta: '3 mins', lat: 3.8500, lng: 11.5600, status: 'available' },
    { id: 'MED-B', type: 'medical', distance: 2.3, eta: '5 mins', lat: 3.8450, lng: 11.5650, status: 'available' },
    { id: 'R14', type: 'rapid', distance: 0.2, eta: '1 min', lat: 3.8480, lng: 11.5625, status: 'en-route' }
  ];
  
  res.json({ responders: mockResponders });
});

// Driver location tracking
app.post('/api/driver/location', (req, res) => {
  const { driverId, lat, lng, speed } = req.body;
  
  // Broadcast location to all listening clients
  io.emit('driver-location', { driverId, lat, lng, speed, timestamp: new Date().toISOString() });
  
  res.json({ success: true });
});

// Get statistics
app.get('/api/stats', (req, res) => {
  const stats = {
    totalAlerts: activeAlerts.length,
    pendingAlerts: activeAlerts.filter(a => a.status === 'pending').length,
    resolvedAlerts: activeAlerts.filter(a => a.status === 'resolved').length,
    activeResponders: activeResponders.length,
    avgResponseTime: '14.2m'
  };
  
  res.json(stats);
});

// ============ WEB SOCKET EVENTS ============

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Send current alerts to newly connected client
  socket.emit('current-alerts', activeAlerts);
  
  // Handle responder status update
  socket.on('responder-status', (data) => {
    const responder = activeResponders.find(r => r.id === data.id);
    if (responder) {
      responder.status = data.status;
    } else {
      activeResponders.push({ ...data, socketId: socket.id });
    }
    
    io.emit('responder-updated', activeResponders);
  });
  
  // Handle SOS trigger from driver
  socket.on('sos-triggered', (alert) => {
    const newAlert = {
      ...alert,
      id: Date.now().toString(),
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    
    activeAlerts.unshift(newAlert);
    io.emit('new-sos-alert', newAlert);
  });
  
  // Handle responder assignment
  socket.on('assign-responder', ({ alertId, responderId }) => {
    const alert = activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.responderId = responderId;
      alert.status = 'responding';
      io.emit('alert-assigned', { alert, responderId });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    // Remove responder from active list
    const index = activeResponders.findIndex(r => r.socketId === socket.id);
    if (index !== -1) activeResponders.splice(index, 1);
  });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚕 Taxi Safety Network Backend Running`);
  console.log(`📡 API Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`✅ Ready to receive alerts`);
});