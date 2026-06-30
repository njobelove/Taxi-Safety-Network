/**
 * TSN SMS Helper - Africa's Talking Integration
 * Sends real SMS to ALL registered drivers + police automatically
 * This requires AFRICAS_TALKING_KEY and AFRICAS_TALKING_USERNAME in .env
 */

const AfricasTalking = require('africastalking');

let africastalking = null;
let sms = null;

function initSMS() {
  if (!process.env.AFRICAS_TALKING_KEY || !process.env.AFRICAS_TALKING_USERNAME) {
    console.log('⚠ Africa\'s Talking not configured - SMS disabled. Add AFRICAS_TALKING_KEY and AFRICAS_TALKING_USERNAME to .env');
    return false;
  }
  africastalking = AfricasTalking({
    apiKey:   process.env.AFRICAS_TALKING_KEY,
    username: process.env.AFRICAS_TALKING_USERNAME, // use 'sandbox' for testing
  });
  sms = africastalking.SMS;
  console.log('✅ Africa\'s Talking SMS initialized');
  return true;
}

// Format Cameroon numbers to international format
function formatPhone(phone) {
  if (!phone) return null;
  let clean = phone.replace(/\s/g, '').replace(/[^0-9+]/g, '');
  if (clean.startsWith('+237')) return clean;
  if (clean.startsWith('237'))  return '+' + clean;
  if (clean.startsWith('6') || clean.startsWith('2')) return '+237' + clean;
  return clean;
}

// Send SOS SMS to ALL registered drivers and police stations
async function broadcastSOS(alertData, allPhoneNumbers) {
  if (!sms) {
    console.log('SMS not initialized - skipping broadcast');
    return { success: false, reason: 'SMS not configured' };
  }

  const message =
    `TSN ALERT: ${alertData.alertType?.toUpperCase() || 'SOS'} reported by ` +
    `${alertData.driverName} (${alertData.driverId}). ` +
    `Location: ${alertData.location?.address || 'unknown'}. ` +
    `Vehicle: ${alertData.vehiclePlate || 'N/A'}. ` +
    `Call 117 if you can assist.`;

  const recipients = allPhoneNumbers
    .filter(Boolean)
    .map(formatPhone)
    .filter(Boolean);

  if (recipients.length === 0) {
    return { success: false, reason: 'No valid phone numbers' };
  }

  try {
    const result = await sms.send({
      to:      recipients,
      message: message,
    });
    console.log(`📱 SMS broadcast sent to ${recipients.length} numbers`);
    return { success: true, recipients: recipients.length, result };
  } catch (e) {
    console.error('SMS broadcast error:', e.message);
    return { success: false, reason: e.message };
  }
}

module.exports = { initSMS, broadcastSOS, formatPhone };