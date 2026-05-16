const reviewService = require('../services/reviewService');

class ReviewController {

    async getReviewsByBook(req, res, next) {
        try {
            const reviews = await reviewService.getReviewsByBook(req.params.bookId);
            return res.json(reviews);
        } catch (e) { next(e); }
    }

    async createReview(req, res, next) {
        try {
            const review = await reviewService.addReview(req.params.bookId, req.body);
            return res.status(201).json(review);
        } catch (e) { next(e); }
    }
}

module.exports = new ReviewController();