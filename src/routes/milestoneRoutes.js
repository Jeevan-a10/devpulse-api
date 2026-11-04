const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestoneController');
const { protect, optionalAuth } = require('../middleware/auth');
const {
  validateCreateMilestone,
  validateUpdateMilestone,
  validateId,
} = require('../middleware/validate');

// Aggregate milestone metrics
router.get('/stats', milestoneController.getMilestoneStats);

// Collection operations
router.route('/')
  .get(milestoneController.getMilestones)
  .post(optionalAuth, validateCreateMilestone, milestoneController.createMilestone);

// Individual item operations
router.route('/:id')
  .get(validateId, milestoneController.getMilestoneById)
  .patch(protect, validateId, validateUpdateMilestone, milestoneController.updateMilestone)
  .delete(protect, validateId, milestoneController.deleteMilestone);

module.exports = router;
