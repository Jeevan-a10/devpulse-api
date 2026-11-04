const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Milestone title is required'],
      trim: true,
      maxlength: [100, 'Milestone title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['planning', 'in-progress', 'completed'],
        message: '{VALUE} is not a valid milestone status',
      },
      default: 'planning',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    targetTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

MilestoneSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
      this.progress = 100;
    } else if (this.status !== 'completed') {
      this.completedAt = null;
    }
  }
  next();
});

module.exports = mongoose.models.Milestone || mongoose.model('Milestone', MilestoneSchema);
