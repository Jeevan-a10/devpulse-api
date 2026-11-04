const mongoose = require('mongoose');

const VALID_CATEGORIES = ['Dev', 'Backend', 'Frontend', 'DevOps', 'Architecture', 'Testing', 'General'];
const VALID_STATUSES = ['pending', 'in-progress', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_ROLES = ['developer', 'lead', 'admin'];
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

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

/**
 * Validates user registration payload.
 */
const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: name is required and must be at least 2 characters',
    });
  }

  if (name.trim().length > 50) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: name cannot exceed 50 characters',
    });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: a valid email address is required',
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: password is required and must be at least 6 characters',
    });
  }

  if (role && !VALID_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Validation failed: invalid role. Allowed values: ${VALID_ROLES.join(', ')}`,
    });
  }

  next();
};

/**
 * Validates user login payload.
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: email is required',
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: password is required',
    });
  }

  next();
};

/**
 * Validates user profile update.
 */
const validateProfileUpdate = (req, res, next) => {
  const { name, bio, role } = req.body;

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: name must be at least 2 characters',
    });
  }

  if (bio !== undefined && typeof bio === 'string' && bio.length > 250) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: bio cannot exceed 250 characters',
    });
  }

  if (role !== undefined && !VALID_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Validation failed: invalid role. Allowed values: ${VALID_ROLES.join(', ')}`,
    });
  }

  next();
};

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  validateId,
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  VALID_CATEGORIES,
  VALID_STATUSES,
  VALID_PRIORITIES,
  VALID_ROLES,
  EMAIL_REGEX,
};
