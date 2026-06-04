const Book = require('../models/book');
const Review = require('../models/review');
 
/**
 * requireBookOwnership
 * ────────────────────
 * يتأكد إن الـ user اللي بعمل PUT/DELETE هو نفس اللي أضاف الكتاب
 * أو إنه admin (يتجاوز الفحص)
 *
 * الاستخدام في books.js:
 *   router.put('/:id', authenticate, requireBookOwnership, ...)
 *   router.delete('/:id', authenticate, requireBookOwnership, ...)
 */
const requireBookOwnership = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).select('createdBy');
 
    if (!book) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'The requested book record was not found.',
      });
    }
 
    // الـ admin يتجاوز الفحص — يقدر يعدل أي شي
    if (req.user.role === 'admin') {
      req.resource = book;  // نحط الـ resource على req لاستخدامه في الـ controller
      return next();
    }
 
    // تحقق: هل الـ user اللي طالب التعديل هو نفسه اللي أنشأ الكتاب؟
    if (book.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        status: 'error',
        statusCode: 403,
        message: 'You are not authorized to modify this resource.',
      });
    }
 
    req.resource = book;
    next();
  } catch (err) {
    next(err);
  }
};
 
/**
 * requireReviewOwnership
 * ──────────────────────
 * نفس المفهوم للـ reviews — مش للكتب
 * User بس يقدر يحذف review كتبها هو
 */
const requireReviewOwnership = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId).select('userId');
 
    if (!review) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Review not found.',
      });
    }
 
    if (req.user.role === 'admin') {
      req.resource = review;
      return next();
    }
 
    if (review.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        status: 'error',
        statusCode: 403,
        message: 'You can only delete your own reviews.',
      });
    }
 
    req.resource = review;
    next();
  } catch (err) {
    next(err);
  }
};
 
/**
 * requireRole(...roles)
 * ─────────────────────
 * Role-Based للـ endpoints اللي محتاجة صلاحية خاصة
 *
 * مثال: إضافة كتاب للـ admins و librarians فقط
 *   router.post('/', authenticate, requireRole('admin', 'librarian'), ...)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        statusCode: 403,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};
 
module.exports = {
  requireBookOwnership,
  requireReviewOwnership,
  requireRole,
};
 