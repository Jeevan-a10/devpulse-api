const express = require('express');
const router = express.Router();
const { exportWorkspaceBackup, exportTasksCSV } = require('../controllers/exportController');
const { optionalAuth } = require('../middleware/auth');

router.get('/backup', optionalAuth, exportWorkspaceBackup);
router.get('/tasks/csv', optionalAuth, exportTasksCSV);

module.exports = router;
