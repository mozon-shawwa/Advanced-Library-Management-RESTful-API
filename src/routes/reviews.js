const express = require('express');
const router = express.Router({ mergeParams: true });

const reviewController = require('../controllers/reviewController');

const { authenticate, writeLimiter, validateBody, globalLimiter } = require('../middlewares');

// ─── GET /api/v1/books/:bookId/reviews ───────────────────────
router.get('/', globalLimiter, reviewController.getAllByBook);

// ─── POST /api/v1/books/:bookId/reviews ──────────────────────
// إضافة مراجعة: يتطلب تسجيل دخول لمنع التقييمات الوهمية ولربط الـ userId تلقائياً
router.post(
  '/',
  authenticate,      // لفك توكين المستخدم ومعرفة هويته
  writeLimiter,      // حماية ضد التكرار السريع للمراجعات
  validateBody(['rating', 'comment']), // التحقق من الحقول الأساسية (حذفنا user لأنه يؤخذ من التوكين أمنياً)
  reviewController.create
);

module.exports = router;