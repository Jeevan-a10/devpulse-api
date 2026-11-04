const mongoose = require('mongoose');
const Activity = require('../models/Activity');

const isDbConnected = () => mongoose.connection.readyState === 1;

// In-memory activity dataset for zero-database offline operation & tests
let inMemoryActivities = [
  {
    _id: 'act_1',
    user: 'user_dev_01',
    userName: 'Jeevan Developer',
    action: 'task_created',
    entityType: 'Task',
    entityId: '1',
    details: 'Created task: Setup MERN Project Foundation',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    _id: 'act_2',
    user: 'user_dev_01',
    userName: 'Jeevan Developer',
    action: 'task_completed',
    entityType: 'Task',
    entityId: '1',
    details: 'Completed task: Setup MERN Project Foundation',
    createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
  {
    _id: 'act_3',
    user: 'user_lead_02',
    userName: 'Sarah Lead',
    action: 'milestone_created',
    entityType: 'Milestone',
    entityId: 'm1',
    details: 'Created milestone: v1.0 API Foundation & Architecture',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

/**
 * Reusable activity logger called by controllers
 */
const logActivity = async ({ user, userName, action, entityType, entityId, details }) => {
  try {
    const actorName = userName || (user && user.name) || 'System';
    const actorId = user ? (user._id || user.id || user) : null;

    if (isDbConnected() && actorId && mongoose.isValidObjectId(actorId)) {
      return await Activity.create({
        user: actorId,
        userName: actorName,
        action,
        entityType,
        entityId: String(entityId),
        details: details || '',
      });
    }

    // In-memory fallback
    const newActivity = {
      _id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user: actorId ? String(actorId) : null,
      userName: actorName,
      action,
      entityType,
      entityId: String(entityId),
      details: details || '',
      createdAt: new Date().toISOString(),
    };

    inMemoryActivities.unshift(newActivity);
    if (inMemoryActivities.length > 200) {
      inMemoryActivities.pop();
    }
    return newActivity;
  } catch (err) {
    // Activity logging should never crash primary operations
    console.warn('Activity logging error:', err.message);
    return null;
  }
};

/**
 * @desc    Get activity feed
 * @route   GET /api/activity
 */
const getActivities = async (req, res, next) => {
  try {
    const { limit = 30, action, entityType, user } = req.query;
    const limitNum = parseInt(limit, 10);

    if (isDbConnected()) {
      const filter = {};
      if (action) filter.action = action;
      if (entityType) filter.entityType = entityType;
      if (user && mongoose.isValidObjectId(user)) filter.user = user;

      const activities = await Activity.find(filter)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .populate('user', 'name email avatar role');

      return res.json({
        success: true,
        count: activities.length,
        data: activities,
      });
    }

    // In-memory fallback
    let filtered = [...inMemoryActivities];
    if (action) filtered = filtered.filter(a => a.action === action);
    if (entityType) filtered = filtered.filter(a => a.entityType === entityType);
    if (user) filtered = filtered.filter(a => String(a.user) === String(user));

    const sliced = filtered.slice(0, limitNum);

    return res.json({
      success: true,
      count: sliced.length,
      data: sliced,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get activity velocity metrics & summary
 * @route   GET /api/activity/summary
 */
const getActivitySummary = async (req, res, next) => {
  try {
    const activities = isDbConnected() ? await Activity.find({}).lean() : inMemoryActivities;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const actionsToday = activities.filter(a => new Date(a.createdAt) >= oneDayAgo).length;

    const byAction = {};
    const uniqueUsers = new Set();

    activities.forEach(a => {
      byAction[a.action] = (byAction[a.action] || 0) + 1;
      if (a.userName) uniqueUsers.add(a.userName);
    });

    return res.json({
      success: true,
      summary: {
        totalActions: activities.length,
        actionsLast24Hours: actionsToday,
        activeContributors: uniqueUsers.size,
        byAction,
        velocity: actionsToday >= 5 ? 'high' : actionsToday >= 2 ? 'moderate' : 'steady',
      },
    });
  } catch (err) {
    next(err);
  }
};

const getInMemoryActivities = () => inMemoryActivities;
const resetInMemoryActivities = () => { inMemoryActivities = []; };

module.exports = {
  logActivity,
  getActivities,
  getActivitySummary,
  getInMemoryActivities,
  resetInMemoryActivities,
};
