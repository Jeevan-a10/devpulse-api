const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (with graceful fallback if offline)
connectDB();

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
app.use('/api/tasks', taskRoutes);

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
