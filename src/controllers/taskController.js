const mongoose = require('mongoose');
const Task = require('../models/Task');
const { logActivity } = require('./activityController');

// In-memory fallback dataset for seamless offline / zero-database operation
let inMemoryTasks = [
  {
    _id: '1',
    title: 'Setup MERN Project Foundation',
    description: 'Scaffold initial express project and structure',
    category: 'Dev',
    status: 'completed',
    priority: 'high',
    tags: ['mern', 'setup'],
    dueDate: null,
    completedAt: '2026-11-01T20:30:00.000Z',
    createdAt: '2026-11-01T20:00:00.000Z',
    updatedAt: '2026-11-01T20:30:00.000Z',
  },
  {
    _id: '2',
    title: 'Implement Task API Endpoints',
    description: 'Develop REST endpoints with validation and error handlers',
    category: 'Backend',
    status: 'in-progress',
    priority: 'urgent',
    tags: ['api', 'express'],
    dueDate: null,
    completedAt: null,
    createdAt: '2026-11-01T20:30:00.000Z',
    updatedAt: '2026-11-02T10:00:00.000Z',
  },
];

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * @desc    Get all tasks with optional search, filtering, and pagination
 * @route   GET /api/tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const { status, category, priority, q, page = 1, limit = 20 } = req.query;

    if (isDbConnected()) {
      const filter = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;
      if (q) {
        filter.$or = [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
        ];
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const [tasks, total] = await Promise.all([
        Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Task.countDocuments(filter),
      ]);

      return res.json({
        success: true,
        count: tasks.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        data: tasks,
      });
    }

    // In-memory fallback
    let filtered = [...inMemoryTasks];
    if (status) filtered = filtered.filter(t => t.status === status);
    if (category) filtered = filtered.filter(t => t.category === category);
    if (priority) filtered = filtered.filter(t => t.priority === priority);
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(
        t => t.title.toLowerCase().includes(query) || (t.description && t.description.toLowerCase().includes(query))
      );
    }

    return res.json({
      success: true,
      count: filtered.length,
      total: filtered.length,
      page: 1,
      pages: 1,
      data: filtered,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const task = await Task.findById(id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      return res.json({ success: true, data: task });
    }

    const task = inMemoryTasks.find(t => String(t._id || t.id) === String(id));
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    return res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, category, status, priority, tags, dueDate } = req.body;
    const userId = req.user ? (req.user._id || req.user.id) : null;

    const actorName = req.user ? req.user.name : 'Developer';

    if (isDbConnected()) {
      const newTask = await Task.create({
        title,
        description,
        category,
        status,
        priority,
        tags,
        dueDate,
        user: userId,
      });

      await logActivity({
        user: userId,
        userName: actorName,
        action: 'task_created',
        entityType: 'Task',
        entityId: newTask._id,
        details: `Created task: ${newTask.title}`,
      });

      return res.status(201).json({ success: true, data: newTask });
    }

    // In-memory fallback
    const id = String(Date.now());
    const newTask = {
      _id: id,
      id,
      title: title.trim(),
      description: (description || '').trim(),
      category: category || 'General',
      status: status || 'pending',
      priority: priority || 'medium',
      tags: tags || [],
      dueDate: dueDate || null,
      user: userId,
      completedAt: status === 'completed' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryTasks.unshift(newTask);

    await logActivity({
      user: userId,
      userName: actorName,
      action: 'task_created',
      entityType: 'Task',
      entityId: id,
      details: `Created task: ${newTask.title}`,
    });

    return res.status(201).json({ success: true, data: newTask });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update an existing task
 * @route   PATCH /api/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const actorName = req.user ? req.user.name : 'Developer';

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const updateData = { ...req.body };
      if (updateData.status === 'completed') {
        updateData.completedAt = new Date();
      } else if (updateData.status && updateData.status !== 'completed') {
        updateData.completedAt = null;
      }

      const task = await Task.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      const action = updateData.status === 'completed'
        ? 'task_completed'
        : updateData.status
        ? 'task_status_changed'
        : 'task_updated';

      await logActivity({
        user: userId,
        userName: actorName,
        action,
        entityType: 'Task',
        entityId: task._id,
        details: `${action === 'task_completed' ? 'Completed' : 'Updated'} task: ${task.title}`,
      });

      return res.json({ success: true, data: task });
    }

    // In-memory fallback
    const index = inMemoryTasks.findIndex(t => String(t._id || t.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const updated = {
      ...inMemoryTasks[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    if (req.body.status === 'completed' && !updated.completedAt) {
      updated.completedAt = new Date().toISOString();
    } else if (req.body.status && req.body.status !== 'completed') {
      updated.completedAt = null;
    }

    inMemoryTasks[index] = updated;

    const action = req.body.status === 'completed'
      ? 'task_completed'
      : req.body.status
      ? 'task_status_changed'
      : 'task_updated';

    await logActivity({
      user: userId,
      userName: actorName,
      action,
      entityType: 'Task',
      entityId: String(id),
      details: `${action === 'task_completed' ? 'Completed' : 'Updated'} task: ${updated.title}`,
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const actorName = req.user ? req.user.name : 'Developer';

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const task = await Task.findByIdAndDelete(id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      await logActivity({
        user: userId,
        userName: actorName,
        action: 'task_deleted',
        entityType: 'Task',
        entityId: task._id,
        details: `Deleted task: ${task.title}`,
      });

      return res.json({ success: true, message: 'Task removed successfully' });
    }

    const index = inMemoryTasks.findIndex(t => String(t._id || t.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const deleted = inMemoryTasks.splice(index, 1)[0];

    await logActivity({
      user: userId,
      userName: actorName,
      action: 'task_deleted',
      entityType: 'Task',
      entityId: String(id),
      details: `Deleted task: ${deleted ? deleted.title : id}`,
    });

    return res.json({ success: true, message: 'Task removed successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get aggregate task stats for dashboard / milestone reporting
 * @route   GET /api/tasks/stats
 */
const getTaskStats = async (req, res, next) => {
  try {
    const tasks = isDbConnected() ? await Task.find({}) : inMemoryTasks;

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const byCategory = {};
    tasks.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        total,
        completed,
        inProgress,
        pending,
        completionRate: `${completionRate}%`,
        byCategory,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get tasks assigned to or created by current authenticated user
 * @route   GET /api/tasks/my
 */
const getMyTasks = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isDbConnected()) {
      const tasks = await Task.find({ user: userId }).sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: tasks.length,
        data: tasks,
      });
    }

    const filtered = inMemoryTasks.filter(t => String(t.user) === String(userId));
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
 * Internal raw getter for analytics & export
 */
const getRawTasks = async () => {
  if (isDbConnected()) {
    return await Task.find({}).lean();
  }
  return [...inMemoryTasks];
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
  getMyTasks,
  getRawTasks,
};
