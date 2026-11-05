const express = require('express');
const router = express.Router();
const { getVelocityMetrics } = require('../controllers/analyticsController');
const { optionalAuth } = require('../middleware/auth');

router.get('/velocity', optionalAuth, getVelocityMetrics);

module.exports = router;
