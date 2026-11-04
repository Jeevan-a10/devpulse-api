const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

// Activity velocity metrics & analytics
router.get('/summary', activityController.getActivitySummary);

// Activity feed
router.get('/', activityController.getActivities);

module.exports = router;
