const mongoose = require('mongoose');

const VALID_CATEGORIES = ['Dev', 'Backend', 'Frontend', 'DevOps', 'Architecture', 'Testing', 'General'];
const VALID_STATUSES = ['pending', 'in-progress', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * Validates task creation payload.
 */
const validateCreateTask = (req, res, next) => {
  const { title, category, status, priority, dueDate } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: task title is required',
    });
  }

  if (title.trim().length > 120) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: task title cannot exceed 120 characters',
    });
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      success: false,
      message: `Validation failed: invalid category. Allowed values: ${VALID_CATEGORIES.join(', ')}`,
    });
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Validation failed: invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
    });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Validation failed: invalid priority. Allowed values: ${VALID_PRIORITIES.join(', ')}`,
    });
  }

  if (dueDate && isNaN(Date.parse(dueDate))) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: dueDate must be a valid ISO date string',
    });
  }

  next();
};

/**
 * Validates task update payload.
 */
const validateUpdateTask = (req, res, next) => {
  const { title, category, status, priority, dueDate } = req.body;

  if (title !== undefined && (!title || typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: title cannot be empty',
    });
  }

  if (title && title.trim().length > 120) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: task title cannot exceed 120 characters',
    });
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      success: false,
      message: `Validation failed: invalid category. Allowed values: ${VALID_CATEGORIES.join(', ')}`,
    });
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Validation failed: invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
    });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Validation failed: invalid priority. Allowed values: ${VALID_PRIORITIES.join(', ')}`,
    });
  }

  if (dueDate && isNaN(Date.parse(dueDate))) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: dueDate must be a valid ISO date string',
    });
  }

  next();
};

/**
 * Validates ID format (accepts 24-char Mongo ObjectId or integer/string fallback).
 */
const validateId = (req, res, next) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Task ID parameter is required',
    });
  }
  next();
};

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  validateId,
  VALID_CATEGORIES,
  VALID_STATUSES,
  VALID_PRIORITIES,
};
