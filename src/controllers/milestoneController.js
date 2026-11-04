const mongoose = require('mongoose');
const Milestone = require('../models/Milestone');
const Task = require('../models/Task');
const { logActivity } = require('./activityController');

const isDbConnected = () => mongoose.connection.readyState === 1;

// In-memory fallback dataset for zero-database offline operation
let inMemoryMilestones = [
  {
    _id: 'm1',
    id: 'm1',
    title: 'v1.0 API Foundation & Architecture',
    description: 'Core Express server, modular routes, and error handling',
    status: 'completed',
    dueDate: '2026-11-02T00:00:00.000Z',
    targetTasks: ['1'],
    user: 'user_dev_01',
    progress: 100,
    completedAt: '2026-11-02T10:00:00.000Z',
    createdAt: '2026-11-01T20:00:00.000Z',
    updatedAt: '2026-11-02T10:00:00.000Z',
  },
  {
    _id: 'm2',
    id: 'm2',
    title: 'v1.1 Authentication & Security Layer',
    description: 'JWT Bearer auth, bcrypt password hashing, and RBAC middleware',
    status: 'completed',
    dueDate: '2026-11-03T00:00:00.000Z',
    targetTasks: ['2'],
    user: 'user_lead_02',
    progress: 100,
    completedAt: '2026-11-03T18:00:00.000Z',
    createdAt: '2026-11-02T12:00:00.000Z',
    updatedAt: '2026-11-03T18:00:00.000Z',
  },
  {
    _id: 'm3',
    id: 'm3',
    title: 'v1.2 Frontend Dashboard & Milestone Tracker',
    description: 'Next.js 16 dashboard with real-time analytics and task management',
    status: 'in-progress',
    dueDate: '2026-11-07T00:00:00.000Z',
    targetTasks: [],
    user: 'user_dev_01',
    progress: 60,
    completedAt: null,
    createdAt: '2026-11-04T09:00:00.000Z',
    updatedAt: '2026-11-04T10:00:00.000Z',
  },
];

/**
 * @desc    Get all milestones
 * @route   GET /api/milestones
 */
const getMilestones = async (req, res, next) => {
  try {
    const { status } = req.query;

    if (isDbConnected()) {
      const filter = {};
      if (status) filter.status = status;

      const milestones = await Milestone.find(filter)
        .sort({ dueDate: 1, createdAt: -1 })
        .populate('targetTasks', 'title status priority category')
        .populate('user', 'name email avatar role');

      return res.json({
        success: true,
        count: milestones.length,
        data: milestones,
      });
    }

    // In-memory fallback
    let filtered = [...inMemoryMilestones];
    if (status) filtered = filtered.filter(m => m.status === status);

    return res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single milestone by ID
 * @route   GET /api/milestones/:id
 */
const getMilestoneById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const milestone = await Milestone.findById(id)
        .populate('targetTasks', 'title status priority category')
        .populate('user', 'name email avatar role');

      if (!milestone) {
        return res.status(404).json({ success: false, message: 'Milestone not found' });
      }
      return res.json({ success: true, data: milestone });
    }

    const milestone = inMemoryMilestones.find(m => String(m._id || m.id) === String(id));
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }
    return res.json({ success: true, data: milestone });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create new milestone
 * @route   POST /api/milestones
 */
const createMilestone = async (req, res, next) => {
  try {
    const { title, description, status, dueDate, targetTasks, progress } = req.body;
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user ? req.user.name : 'Developer';

    const calculatedProgress = status === 'completed' ? 100 : (progress !== undefined ? Number(progress) : 0);
    const completedAt = status === 'completed' ? new Date() : null;

    if (isDbConnected()) {
      const milestone = await Milestone.create({
        title: title.trim(),
        description: (description || '').trim(),
        status: status || 'planning',
        dueDate: dueDate || null,
        targetTasks: targetTasks || [],
        user: userId,
        progress: calculatedProgress,
        completedAt,
      });

      await logActivity({
        user: userId,
        userName,
        action: 'milestone_created',
        entityType: 'Milestone',
        entityId: milestone._id,
        details: `Created milestone: ${milestone.title}`,
      });

      return res.status(201).json({ success: true, data: milestone });
    }

    // In-memory fallback
    const newId = `m_${Date.now()}`;
    const newMilestone = {
      _id: newId,
      id: newId,
      title: title.trim(),
      description: (description || '').trim(),
      status: status || 'planning',
      dueDate: dueDate || null,
      targetTasks: targetTasks || [],
      user: userId,
      progress: calculatedProgress,
      completedAt: completedAt ? completedAt.toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryMilestones.unshift(newMilestone);

    await logActivity({
      user: userId,
      userName,
      action: 'milestone_created',
      entityType: 'Milestone',
      entityId: newId,
      details: `Created milestone: ${newMilestone.title}`,
    });

    return res.status(201).json({ success: true, data: newMilestone });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update milestone
 * @route   PATCH /api/milestones/:id
 */
const updateMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user ? req.user.name : 'Developer';

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const updateData = { ...req.body };
      if (updateData.status === 'completed') {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      } else if (updateData.status && updateData.status !== 'completed') {
        updateData.completedAt = null;
      }

      const milestone = await Milestone.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!milestone) {
        return res.status(404).json({ success: false, message: 'Milestone not found' });
      }

      const action = updateData.status === 'completed' ? 'milestone_completed' : 'milestone_updated';
      await logActivity({
        user: userId,
        userName,
        action,
        entityType: 'Milestone',
        entityId: milestone._id,
        details: `${action === 'milestone_completed' ? 'Completed' : 'Updated'} milestone: ${milestone.title}`,
      });

      return res.json({ success: true, data: milestone });
    }

    // In-memory fallback
    const index = inMemoryMilestones.findIndex(m => String(m._id || m.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const current = inMemoryMilestones[index];
    const updated = {
      ...current,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    if (req.body.status === 'completed') {
      updated.completedAt = new Date().toISOString();
      updated.progress = 100;
    } else if (req.body.status && req.body.status !== 'completed') {
      updated.completedAt = null;
    }

    inMemoryMilestones[index] = updated;

    const action = req.body.status === 'completed' ? 'milestone_completed' : 'milestone_updated';
    await logActivity({
      user: userId,
      userName,
      action,
      entityType: 'Milestone',
      entityId: String(id),
      details: `${action === 'milestone_completed' ? 'Completed' : 'Updated'} milestone: ${updated.title}`,
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete milestone
 * @route   DELETE /api/milestones/:id
 */
const deleteMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const milestone = await Milestone.findByIdAndDelete(id);
      if (!milestone) {
        return res.status(404).json({ success: false, message: 'Milestone not found' });
      }
      return res.json({ success: true, message: 'Milestone removed successfully' });
    }

    const index = inMemoryMilestones.findIndex(m => String(m._id || m.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    inMemoryMilestones.splice(index, 1);
    return res.json({ success: true, message: 'Milestone removed successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get aggregate stats for milestones
 * @route   GET /api/milestones/stats
 */
const getMilestoneStats = async (req, res, next) => {
  try {
    const milestones = isDbConnected() ? await Milestone.find({}) : inMemoryMilestones;

    const total = milestones.length;
    const completed = milestones.filter(m => m.status === 'completed').length;
    const inProgress = milestones.filter(m => m.status === 'in-progress').length;
    const planning = milestones.filter(m => m.status === 'planning').length;

    const totalProgress = milestones.reduce((sum, m) => sum + (m.progress || 0), 0);
    const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0;

    return res.json({
      success: true,
      stats: {
        total,
        completed,
        inProgress,
        planning,
        averageProgress: `${avgProgress}%`,
        completionRate: `${total > 0 ? Math.round((completed / total) * 100) : 0}%`,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getInMemoryMilestones = () => inMemoryMilestones;

module.exports = {
  getMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getMilestoneStats,
  getInMemoryMilestones,
};
