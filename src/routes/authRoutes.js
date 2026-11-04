const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
} = require('../middleware/validate');

// Public authentication routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected user routes
router.get('/me', protect, authController.getMe);
router.patch('/profile', protect, validateProfileUpdate, authController.updateProfile);
router.patch('/password', protect, authController.changePassword);

module.exports = router;
