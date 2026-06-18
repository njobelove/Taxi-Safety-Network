/**
 * TSN USSD Service
 * Provides a simple USSD endpoint for driver help requests.
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('[USSD Service] MongoDB connected'))
  .catch(err => { console.error('[USSD Service] MongoDB error:', err); process.exit(1); });

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ussd-service', timestamp: new Date().toISOString() });
});

app.post('/ussd', (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  const response = `CON Thank you for contacting TSN. We received your request. A responder will be alerted shortly.`;

  res.type('text/plain');
  res.send(response);
});

app.listen(PORT, () => console.log(`[USSD Service] Running on port ${PORT}`));
