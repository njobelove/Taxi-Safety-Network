const fs = require('fs');
const p  = 'C:/Users/user/Desktop/Final Year/Taxi-Safety-Network/backend/server.js';
let c    = fs.readFileSync(p, 'utf8');

if (c.includes('/api/alerts/history')) {
  console.log('Already exists');
} else {
  const route = `
// ── ALERT HISTORY (all alerts including resolved) ─────────────────────────────
app.get('/api/alerts/history', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(200);
    res.json({ alerts });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
`;
  c = c.replace("app.get('/api/alerts',", route + "\napp.get('/api/alerts',");
  fs.writeFileSync(p, c);
  console.log('History endpoint added!');
}