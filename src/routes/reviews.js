const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams لوصول :bookId من الـ parent router
 
const reviewController = require('../controllers/reviewController');
 
const {
  authenticate,
  writeLimiter,
  validateBody,
  globalLimiter,
  requireReviewOwnership  
} = require('../middlewares');
 
// ─── GET /api/v1/books/:bookId/reviews ───────────────────────
router.get('/', globalLimiter, reviewController.getAllByBook);
 
// ─── POST /api/v1/books/:bookId/reviews ──────────────────────
router.post(
  '/',
  authenticate,
  writeLimiter,
  validateBody(['rating', 'comment']),
  reviewController.create
);
 
// ─── PUT /api/v1/books/:bookId/reviews/:id ────────────────────
router.put(
  '/:id',
  authenticate,
  writeLimiter,
  requireReviewOwnership,   // يتحقق إن صاحب الـ review هو اللي يعدلها
  validateBody([]),         
  reviewController.update
);
 
// ─── DELETE /api/v1/books/:bookId/reviews/:id ─────────────────
router.delete(
  '/:id',
  authenticate,
  writeLimiter,
  requireReviewOwnership,   // يتحقق إن صاحب الـ review هو اللي يحذفها
  reviewController.delete
);
 
module.exports = router;