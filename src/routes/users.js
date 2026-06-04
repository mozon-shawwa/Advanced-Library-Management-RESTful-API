const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

const {
  authenticate,
  globalLimiter,
  writeLimiter,
  sensitiveEndpointLimiter,
  validateBody
} = require('../middlewares');

// ─── POST /api/v1/auth/register ─────────────────────────────
router.post(
  '/register',
  globalLimiter,
  writeLimiter,
  validateBody(['name', 'email', 'password']),
  userController.register
);

// ─── POST /api/v1/auth/login ────────────────────────────────
router.post(
  '/login',
  sensitiveEndpointLimiter,
  validateBody(['email', 'password']),
  userController.login
);

// ─── GET /api/v1/auth/me ────────────────────────────────────
router.get(
  '/me',
  authenticate,
  userController.getProfile
);

module.exports = router;