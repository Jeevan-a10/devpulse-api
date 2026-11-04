const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'devpulse_jwt_secret_dev_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const isDbConnected = () => mongoose.connection.readyState === 1;

// Sign JWT helper
const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// In-memory user store for zero-database offline operation & standalone tests
const defaultHash = bcrypt.hashSync('Password123', 10);
let inMemoryUsers = [
  {
    _id: 'user_dev_01',
    name: 'Jeevan Developer',
    email: 'dev@devpulse.io',
    password: defaultHash,
    role: 'developer',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dev',
    bio: 'Full-stack MERN builder',
    createdAt: '2026-11-01T20:00:00.000Z',
    updatedAt: '2026-11-01T20:00:00.000Z',
  },
  {
    _id: 'user_lead_02',
    name: 'Sarah Lead',
    email: 'lead@devpulse.io',
    password: defaultHash,
    role: 'lead',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=lead',
    bio: 'Engineering Lead & Architect',
    createdAt: '2026-11-01T20:00:00.000Z',
    updatedAt: '2026-11-01T20:00:00.000Z',
  },
];

const findInMemoryUserById = (id) => {
  return inMemoryUsers.find(u => String(u._id) === String(id));
};

const findInMemoryUserByEmail = (email) => {
  return inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, bio, avatar } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      const user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        role: role || 'developer',
        bio: bio || '',
        avatar: avatar || '',
      });

      const token = user.generateAuthToken();

      return res.status(201).json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          createdAt: user.createdAt,
        },
      });
    }

    // In-memory fallback
    if (findInMemoryUserByEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newId = `user_${Date.now()}`;
    const newUser = {
      _id: newId,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role || 'developer',
      avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanEmail}`,
      bio: bio || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryUsers.push(newUser);

    const token = signToken({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await User.findOne({ email: cleanEmail }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const token = user.generateAuthToken();

      return res.json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
        },
      });
    }

    // In-memory fallback
    const user = findInMemoryUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = signToken({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user profile details
 * @route   PATCH /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar } = req.body;
    const userId = req.user._id || req.user.id;

    if (isDbConnected() && mongoose.isValidObjectId(userId)) {
      const updateFields = {};
      if (name) updateFields.name = name.trim();
      if (bio !== undefined) updateFields.bio = bio.trim();
      if (avatar !== undefined) updateFields.avatar = avatar;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).select('-password');

      return res.json({
        success: true,
        data: updatedUser,
      });
    }

    // In-memory fallback
    const user = findInMemoryUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar !== undefined) user.avatar = avatar;
    user.updatedAt = new Date().toISOString();

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Change user password
 * @route   PATCH /api/auth/password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id || req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    if (isDbConnected() && mongoose.isValidObjectId(userId)) {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match',
        });
      }

      user.password = newPassword;
      await user.save();

      return res.json({
        success: true,
        message: 'Password updated successfully',
      });
    }

    // In-memory fallback
    const user = findInMemoryUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match',
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date().toISOString();

    return res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  findInMemoryUserById,
  findInMemoryUserByEmail,
  signToken,
};
