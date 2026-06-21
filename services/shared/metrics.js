/**
 * TSN Prometheus Metrics — add to every microservice
 * Usage: const { register, httpMetrics } = require('../shared/metrics')('service-name')
 *
 * Install: npm install prom-client
 */
const promClient = require('prom-client');

module.exports = function createMetrics(serviceName) {
  // Create a new registry per service
  const register = new promClient.Registry();

  // Default Node.js metrics (CPU, memory, event loop lag, GC)
  promClient.collectDefaultMetrics({ register, prefix: 'tsn_node_' });

  // ── HTTP metrics ───────────────────────────────────────────────────────────
  const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request duration in milliseconds',
    labelNames: ['method', 'route', 'status', 'service'],
    buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
    registers: [register],
  });

  const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status', 'service'],
    registers: [register],
  });

  const httpRequestsActive = new promClient.Gauge({
    name: 'http_requests_active',
    help: 'Number of active HTTP requests',
    labelNames: ['service'],
    registers: [register],
  });

  // ── TSN business metrics ───────────────────────────────────────────────────
  const sosAlertsTotal = new promClient.Counter({
    name: 'tsn_sos_alerts_total',
    help: 'Total number of SOS alerts created',
    labelNames: ['alert_type', 'trigger_method', 'network', 'city'],
    registers: [register],
  });

  const activeAlertsGauge = new promClient.Gauge({
    name: 'tsn_active_alerts_total',
    help: 'Number of currently active SOS alerts',
    registers: [register],
  });

  const connectedDrivers = new promClient.Gauge({
    name: 'tsn_connected_drivers_total',
    help: 'Number of drivers currently connected via Socket.IO',
    registers: [register],
  });

  const connectedStations = new promClient.Gauge({
    name: 'tsn_connected_stations_total',
    help: 'Number of police stations currently connected',
    registers: [register],
  });

  const smsSentTotal = new promClient.Counter({
    name: 'tsn_sms_sent_total',
    help: 'Total SMS messages sent',
    labelNames: ['network', 'status'],
    registers: [register],
  });

  const socketConnections = new promClient.Gauge({
    name: 'tsn_socket_connections_total',
    help: 'Total active Socket.IO connections',
    labelNames: ['room'],
    registers: [register],
  });

  const authAttemptsTotal = new promClient.Counter({
    name: 'tsn_auth_attempts_total',
    help: 'Total authentication attempts',
    labelNames: ['type', 'result'], // type: driver|police, result: success|failure
    registers: [register],
  });

  const locationUpdatesTotal = new promClient.Counter({
    name: 'tsn_location_updates_total',
    help: 'Total GPS location updates received',
    labelNames: ['network'],
    registers: [register],
  });

  // ── Express middleware ─────────────────────────────────────────────────────
  const httpMetrics = (req, res, next) => {
    const start = Date.now();
    httpRequestsActive.inc({ service: serviceName });

    res.on('finish', () => {
      const duration = Date.now() - start;
      const route    = req.route?.path || req.path || 'unknown';
      const labels   = { method: req.method, route, status: res.statusCode, service: serviceName };

      httpRequestDuration.observe(labels, duration);
      httpRequestsTotal.inc(labels);
      httpRequestsActive.dec({ service: serviceName });
    });

    next();
  };

  return {
    register,
    httpMetrics,
    // Business metrics — export for use in route handlers
    metrics: {
      sosAlertsTotal,
      activeAlertsGauge,
      connectedDrivers,
      connectedStations,
      smsSentTotal,
      socketConnections,
      authAttemptsTotal,
      locationUpdatesTotal,
    },
    // Expose /metrics endpoint
    metricsRoute: async (req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    },
  };
};
