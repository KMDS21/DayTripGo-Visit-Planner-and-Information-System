// DayTripGO - Express Application Entry Point
// 3-Tier Architecture: Application Tier (Controller + Service + Model)

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── API Routes ──────────────────────────────────────────────
// Routes will be added as implemented:
// app.use('/api/places', require('./routes/placeRoutes'));
// app.use('/api/categories', require('./routes/categoryRoutes'));
// app.use('/api/visit-plans', require('./routes/visitPlanRoutes'));
// app.use('/api/auth', require('./routes/authRoutes'));

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'DayTripGO API',
    timestamp: new Date().toISOString()
  });
});

// ─── Error Handling Middleware ────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
