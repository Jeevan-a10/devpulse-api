const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const {
  validateCreateTask,
  validateUpdateTask,
  validateId,
} = require('../middleware/validate');

// Aggregate statistics
router.get('/stats', taskController.getTaskStats);

// Collection operations
router.route('/')
  .get(taskController.getTasks)
  .post(validateCreateTask, taskController.createTask);

// Individual item operations
router.route('/:id')
  .get(validateId, taskController.getTaskById)
  .patch(validateId, validateUpdateTask, taskController.updateTask)
  .delete(validateId, taskController.deleteTask);

module.exports = router;
