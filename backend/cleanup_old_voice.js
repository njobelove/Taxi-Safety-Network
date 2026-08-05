/**
 * One-time cleanup: deletes chat messages with broken blob: voice URIs
 * Run this against your MongoDB to remove old unplayable test recordings
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const ChatSchema = new mongoose.Schema({}, { strict: false });
const ChatMessage = mongoose.model('ChatMessage', ChatSchema, 'chatmessages');

async function cleanup() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const result = await ChatMessage.deleteMany({
    type: 'voice',
    voiceUri: { $regex: '^blob:' },
  });

  console.log(`Deleted ${result.deletedCount} broken voice messages`);
  await mongoose.disconnect();
}

cleanup().catch(console.error);