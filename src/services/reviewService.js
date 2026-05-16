const Review = require('../models/review');
const bookService = require('./bookService');

class ReviewService {
    async getReviewsByBook(bookId) {
        await bookService.getBookById(bookId);
        return await Review.find({ bookId });
    }

    async addReview(bookId, reviewData) {
        await bookService.getBookById(bookId);

        if (reviewData.rating < 1 || reviewData.rating > 5) {
            const err = new Error('Validation Error: Rating must reside strictly between 1 and 5.');
            err.status = 400;
            throw err;
        }

        const completeData = { bookId, ...reviewData };
        return await Review.create(completeData);
    }
}

module.exports = new ReviewService();