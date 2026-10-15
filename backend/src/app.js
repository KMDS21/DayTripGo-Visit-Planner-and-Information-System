// DayTripGO - Express Application Entry Point
// 3-Tier Architecture: Application Tier (Routes → Controllers → Services → Models)

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Logging (plan §14.3, Step 10 — Windows-safe: Morgan writes the file itself) ──
const logsDir = path.join(__dirname, '..', 'logs');
fs.mkdirSync(logsDir, { recursive: true });
const accessLogStream = fs.createWriteStream(path.join(logsDir, 'backend.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream })); // file
app.use(morgan('dev'));                                    // console

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/places', require('./routes/placeRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/visit-plans', require('./routes/visitPlanRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'DayTripGO API',
    timestamp: new Date().toISOString()
  });
});

// ─── Central Error Handling ──────────────────────────────────
app.use(require('./middleware/errorHandler'));

module.exports = app;
