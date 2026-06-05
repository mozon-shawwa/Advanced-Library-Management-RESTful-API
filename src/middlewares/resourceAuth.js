const Book = require('../models/book');
const Review = require('../models/review');
 
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
 
    if (req.user.role === 'admin') {
      req.resource = book;
      return next();
    }
 
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
 
const requireReviewOwnership = async (req, res, next) => {
  try {
    const reviewId = req.params.id || req.params.reviewId;
    const review = await Review.findById(reviewId).select('userId');
 
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
        message: 'You can only modify your own reviews.',
      });
    }
 
    req.resource = review;
    next();
  } catch (err) {
    next(err);
  }
};
 
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