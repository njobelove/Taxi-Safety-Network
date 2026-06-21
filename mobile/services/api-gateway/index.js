/**
 * TSN API Gateway
 * Single entry point for the mobile app.
 * Routes to: auth-service, alert-service, location-service, sms-service, ussd-service
 */
require('dotenv').config();
const express     = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit   = require('express-rate-limit');
const helmet      = require('helmet');
const cors        = require('cors');
const morgan      = require('morgan');
const jwt         = require('jsonwebtoken');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','PATCH'] }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// ── Rate limiting ──────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 300,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,  // strict limit on auth endpoints
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});

const sosLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 min
  max: 10,  // burst allowance for SOS
  message: { error: 'SOS rate limit exceeded.' }
});

app.use(globalLimiter);

// ── JWT verification middleware ────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    req.headers['x-user-id']   = decoded.id;
    req.headers['x-user-type'] = decoded.type;     // 'driver' | 'police'
    req.headers['x-badge-id']  = decoded.badge_id || decoded.station_id;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'healthy',
    service:   'api-gateway',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    routes: {
      auth:     process.env.AUTH_SERVICE_URL,
      alerts:   process.env.ALERT_SERVICE_URL,
      location: process.env.LOCATION_SERVICE_URL,
      sms:      process.env.SMS_SERVICE_URL,
      ussd:     process.env.USSD_SERVICE_URL,
    }
  });
});

// ── PUBLIC routes (no auth required) ──────────────────────────────────────────
// Auth — login, register
app.use('/api/auth', authLimiter, createProxyMiddleware({
  target:      process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
  on: { error: (err, req, res) => res.status(502).json({ error: 'Auth service unavailable' }) }
}));

// USSD — called by Africa's Talking, no JWT
app.use('/api/ussd', createProxyMiddleware({
  target:      process.env.USSD_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/ussd': '/ussd' },
  on: { error: (err, req, res) => res.status(502).json({ error: 'USSD service unavailable' }) }
}));

// ── PROTECTED routes (JWT required) ───────────────────────────────────────────
// Alerts
app.use('/api/alerts', verifyToken, sosLimiter, createProxyMiddleware({
  target:      process.env.ALERT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/alerts': '/alerts' },
  on: { error: (err, req, res) => res.status(502).json({ error: 'Alert service unavailable' }) }
}));

// Location
app.use('/api/location', verifyToken, createProxyMiddleware({
  target:      process.env.LOCATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/location': '/location' },
  on: { error: (err, req, res) => res.status(502).json({ error: 'Location service unavailable' }) }
}));

// SMS (internal — but expose for manual triggers)
app.use('/api/sms', verifyToken, createProxyMiddleware({
  target:      process.env.SMS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/sms': '/sms' },
  on: { error: (err, req, res) => res.status(502).json({ error: 'SMS service unavailable' }) }
}));

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

app.listen(PORT, () => {
  console.log(`[API Gateway] Running on port ${PORT}`);
  console.log(`[API Gateway] Auth:     ${process.env.AUTH_SERVICE_URL}`);
  console.log(`[API Gateway] Alerts:   ${process.env.ALERT_SERVICE_URL}`);
  console.log(`[API Gateway] Location: ${process.env.LOCATION_SERVICE_URL}`);
});
