const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect, optionalAuth } = require('../middleware/auth');
const {
  validateCreateTask,
  validateUpdateTask,
  validateId,
} = require('../middleware/validate');

// Aggregate statistics
router.get('/stats', taskController.getTaskStats);

// User-scoped tasks
router.get('/my', protect, taskController.getMyTasks);

// Collection operations (with optional auth for creator tracking)
router.route('/')
  .get(taskController.getTasks)
  .post(optionalAuth, validateCreateTask, taskController.createTask);

// Individual item operations
router.route('/:id')
  .get(validateId, taskController.getTaskById)
  .patch(validateId, validateUpdateTask, taskController.updateTask)
  .delete(validateId, taskController.deleteTask);

module.exports = router;
