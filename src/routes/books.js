const express = require('express');
const router  = express.Router();
 
const bookController = require('../controllers/bookController');
 
// Middlewares
const { authenticate } = require('../middlewares/auth');
const { writeLimiter, userLimiter, tenantLimiter } = require('../middlewares/rateLimit');
const { validateBody } = require('../middlewares/errorHandler');
const { requireBookOwnership,requireRole } = require('../middlewares/resourceAuth');
const { cacheMiddleware, etagMiddleware } = require('../middlewares/cache');
 
// ─── GET /api/v1/books ────────────────────────────────────────
// قائمة الكتب مع cache 5 دقائق (300 ثانية)
// لو الداتا ما تغيرت، الـ client يستلم 304 بدل قراءة الـ DB
router.get(
  '/',
  cacheMiddleware(300),   // ← cache 5 دقائق
  bookController.getAll
);
 
// ─── GET /api/v1/books/:id ────────────────────────────────────
// كتاب واحد — ETag بدون cache ثقيل
// (الكتاب الواحد ممكن يتغير، الـ ETag بيتحقق بكفاءة)
router.get(
  '/:id',
  etagMiddleware,         // ← ETag فقط، بدون cache
  bookController.getOne
);
 
// ─── POST /api/v1/books ───────────────────────────────────────
// إضافة كتاب: مسجل دخول + role مناسب + rate limit
// لازم authenticate قبل userLimiter/tenantLimiter
// لأنهم يحتاجوا req.user اللي يضيفه authenticate
router.post(
  '/',
  authenticate,
  userLimiter,            // ← بعد authenticate
  tenantLimiter,          // ← بعد authenticate
  writeLimiter,
  requireRole('admin', 'librarian'),  // ← فقط admin و librarian يضيفوا كتب
  validateBody(['title', 'author', 'isbn', 'year', 'genre']),
  bookController.create
);
 
// ─── PUT /api/v1/books/:id ────────────────────────────────────
// تعديل: مسجل دخول + صاحب الكتاب أو admin فقط
router.put(
  '/:id',
  authenticate,
  userLimiter,
  writeLimiter,
  requireBookOwnership,   // ← تحقق من الملكية
  bookController.update
);
 
// ─── DELETE /api/v1/books/:id ─────────────────────────────────
// حذف: مسجل دخول + صاحب الكتاب أو admin فقط
router.delete(
  '/:id',
  authenticate,
  userLimiter,
  writeLimiter,
  requireBookOwnership,   // ← تحقق من الملكية
  bookController.delete
);
 
module.exports = router;