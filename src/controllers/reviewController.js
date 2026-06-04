const reviewService = require('../services/reviewService');
const { invalidateCache } = require('../middlewares/cache');

// 1. جلب مراجعات كتاب معين: GET /api/v1/books/:bookId/reviews
const getAllByBook = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const result = await reviewService.getReviewsByBookId(bookId, { page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// 2. إضافة مراجعة جديدة: POST /api/v1/books/:bookId/reviews
const create = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    
    const review = await reviewService.createReview({
      ...req.body,
      bookId,
      userId: req.user.id, // ربط المراجعة بـ ID المستخدم المسجل حالياً من الـ Auth Token
    });

    invalidateCache(`/api/v1/books/${bookId}/reviews`);

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};

// 3. تعديل مراجعة: PUT /api/v1/books/:bookId/reviews/:id
const update = async (req, res, next) => {
  try {
    const { bookId, id } = req.params;
    
    // Whitelisting: مسموح فقط بتعديل التقييم والتعليق
    const whitelist = ['rating', 'comment'];
    const updates = {};
    whitelist.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // تمرير الـ req.user للـ Service للتأكد من الـ Resource ownership (هل هو المالك؟)
    const review = await reviewService.updateReview(id, updates, req.user);

    // تعطيل الـ Cache
    invalidateCache(`/api/v1/books/${bookId}/reviews`);

    res.json(review);
  } catch (err) {
    next(err);
  }
};

// 4. حذف مراجعة: DELETE /api/v1/books/:bookId/reviews/:id
const deleteReview = async (req, res, next) => {
  try {
    const { bookId, id } = req.params;

    // تمرير الـ req.user لضمان أن المالك الفعلي أو الـ Admin فقط من يمكنه الحذف
    await reviewService.deleteReview(id, req.user);

    // تعطيل الـ Cache
    invalidateCache(`/api/v1/books/${bookId}/reviews`);

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllByBook, create, update, delete: deleteReview };