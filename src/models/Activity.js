const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      default: 'System',
    },
    action: {
      type: String,
      required: [true, 'Activity action is required'],
      enum: [
        'task_created',
        'task_completed',
        'task_status_changed',
        'task_updated',
        'task_deleted',
        'milestone_created',
        'milestone_completed',
        'milestone_updated',
        'user_registered',
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Task', 'Milestone', 'User'],
    },
    entityId: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast chronological lookups
ActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
