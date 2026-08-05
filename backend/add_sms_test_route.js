/**
 * Adds the /api/sms/test route directly to backend/server.js
 * Run with: node add_sms_test_route.js
 */
const fs = require('fs');
const p  = 'C:/Users/user/Desktop/Final Year/Taxi-Safety-Network/backend/server.js';
let c    = fs.readFileSync(p, 'utf8');

if (c.includes('/api/sms/test')) {
  console.log('Route already exists');
} else {
  const route = `
// ── TEST SMS — send to ONE specific number (for demos/testing) ──────────────
app.post('/api/sms/test', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone is required' });

    const testMessage = message ||
      \`TSN TEST ALERT: This is a test SOS notification from Taxi Safety Network.\`;

    const result = await broadcastSOS(
      { alertType: 'test', driverName: 'Demo Driver', driverId: 'TEST-001', location: { address: 'Yaoundé, Cameroon' }, vehiclePlate: 'DEMO-001' },
      [phone]
    );

    res.json({ success: result.success, sentTo: phone, result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

`;
  // Insert right before app.get('/api/health'
  c = c.replace("app.get('/api/health'", route + "app.get('/api/health'");
  fs.writeFileSync(p, c, 'utf8');
  console.log('✅ Route added!');
}

// Also verify broadcastSOS is imported
if (!c.includes('broadcastSOS')) {
  console.log('⚠ WARNING: broadcastSOS not found - smsHelper.js may not be required correctly');
} else {
  console.log('✅ broadcastSOS is referenced in file');
}