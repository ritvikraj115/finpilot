// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://rit:dhoni111@cluster0.lcrcado.mongodb.net/?appName=Cluster0';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// --- Simple Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: Date.now() });
});

// --- Routes
// make sure these files exist: ./routes/transactions, ./routes/insights, ./routes/advisor, ./routes/auth, ./routes/planner
const txns = require('./routes/transactions');
const insights = require('./routes/insights');
const advisor = require('./routes/advisor');
const authRoutes = require('./routes/auth');
const plannerRoutes = require('./routes/planner');

app.use('/api/auth', authRoutes);
app.use('/api/transactions', txns);
app.use('/api/insights', insights);
app.use('/api/advisor', advisor);
app.use('/api/planner', plannerRoutes);

// --- Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// --- Minimal keep-alive ping (pings /api/health every 8 minutes)
const KEEP_ALIVE_URL = 'https://finpilot-suat.onrender.com/api/health' || `http://localhost:${PORT}/api/health`;
const INTERVAL_MS = parseInt(process.env.KEEP_ALIVE_INTERVAL_MS, 10) || 8 * 60 * 1000; // 8 minutes

function ping(url) {
  try {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      console.log(`[keep-alive] ${new Date().toISOString()} ${url} -> ${res.statusCode}`);
      // consume response
      res.resume();
    });
    req.on('error', (err) => {
      console.warn('[keep-alive] error:', err.message);
    });
  } catch (err) {
    console.warn('[keep-alive] invalid URL:', err.message);
  }
}

ping(KEEP_ALIVE_URL);
const keepAliveInterval = setInterval(() => ping(KEEP_ALIVE_URL), INTERVAL_MS);

// --- Graceful shutdown (cleans up interval and mongoose)
function shutdown() {
  console.log('Shutting down...');
  clearInterval(keepAliveInterval);
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Mongoose connection closed.');
      process.exit(0);
    });
  });
  // force exit after 5s
  setTimeout(() => {
    console.warn('Force exiting.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

