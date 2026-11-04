const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const activityRoutes = require('./routes/activityRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (with graceful fallback if offline)
connectDB();

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Core Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DevPulse API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/activity', activityRoutes);

// Catch-all 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found - ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DevPulse API server running on port ${PORT}`);
  });
}

module.exports = app;
