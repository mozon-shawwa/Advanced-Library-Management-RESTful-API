const Review = require('../models/review');
const bookService = require('./bookService');

class ReviewService {
    // 1. جلب المراجعات (تم تعديل الاسم وإضافة دعم الـ Pagination ليتطابق مع الكنترولر)
    async getReviewsByBookId(bookId, options = {}) {
        await bookService.getBookById(bookId);
        
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ bookId })
                                    .skip(skip)
                                    .limit(Number(limit));
                                    
        const total = await Review.countDocuments({ bookId });

        return {
            reviews,
            currentPage: Number(page),
            totalPages: Math.ceil(total / limit),
            totalReviews: total
        };
    }

    // 2. إضافة مراجعة جديدة (تم تعديلها لتستقبل كائن البيانات المدمج وتدعم الـ userId)
    async addReview(reviewData) {
        const { bookId, rating } = reviewData;
        
        // التأكد من أن الكتاب موجود فعلاً
        await bookService.getBookById(bookId);

        // التحقق من صحة التقييم
        if (rating < 1 || rating > 5) {
            const err = new Error('Validation Error: Rating must reside strictly between 1 and 5.');
            err.status = 400;
            throw err;
        }

        return await Review.create(reviewData);
    }

    // 3. تعديل مراجعة مع التحقق من المالك (Ownership Validation)
    async updateReview(id, updates, user) {
        const review = await Review.findById(id);
        if (!review) {
            const err = new Error('Review not found.');
            err.status = 404;
            throw err;
        }

        // التحقق: يجب أن يكون المستخدم هو صاحب المراجعة أو Admin ليعدلها
        if (review.userId && review.userId.toString() !== user.id && user.role !== 'admin') {
            const err = new Error('Access denied. You can only update your own reviews.');
            err.status = 403;
            throw err;
        }

        Object.assign(review, updates);
        return await review.save();
    }

    // 4. حذف مراجعة مع التحقق من المالك أو الـ Admin
    async deleteReview(id, user) {
        const review = await Review.findById(id);
        if (!review) {
            const err = new Error('Review not found.');
            err.status = 404;
            throw err;
        }

        // التحقق: المالك أو الـ Admin فقط من يمكنه الحذف
        if (review.userId && review.userId.toString() !== user.id && user.role !== 'admin') {
            const err = new Error('Access denied. You can only delete your own reviews.');
            err.status = 403;
            throw err;
        }

        await Review.findByIdAndDelete(id);
        return true;
    }
}

module.exports = new ReviewService();
