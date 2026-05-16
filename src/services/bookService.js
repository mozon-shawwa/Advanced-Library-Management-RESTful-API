const Book = require('../models/book');

class BookService {
    async getAllBooks(query) {
        let { page = 1, limit = 2, genre } = query;
        page = parseInt(page);
        limit = parseInt(limit);
        
        let filter = {};
        if (genre) filter.genre = { $regex: genre, $options: 'i' };

        const skip = (page - 1) * limit;
        const data = await Book.find(filter).skip(skip).limit(limit);
        const totalRecords = await Book.countDocuments(filter);

        return {
            page,
            limit,
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            data
        };
    }

    async getBookById(id) {
        const book = await Book.findById(id);
        if (!book) {
            const err = new Error('The requested book record was not found.');
            err.status = 404;
            throw err;
        }
        return book;
    }

    async createBook(bookData) {
        const duplicate = await Book.findOne({ isbn: bookData.isbn });
        if (duplicate) {
            const err = new Error('Conflict: A book with this ISBN already exists.');
            err.status = 409;
            throw err;
        }
        return await Book.create(bookData);
    }

    async updateBook(id, body) {
        await this.getBookById(id);
        
        const allowedFields = ['title', 'author', 'year', 'genre'];
        const updateData = {};
        allowedFields.forEach(field => {
            if (body[field] !== undefined) updateData[field] = body[field];
        });

        return await Book.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }

    async deleteBook(id) {
        await this.getBookById(id);
        await Book.findByIdAndDelete(id);
        return { message: 'Book resource successfully deleted from system.' };
    }

    async searchBooks(query) {
        const { q, genre, year } = query;
        let criteria = {};
        
        if (q) {
            criteria.$or = [
                { title: { $regex: q, $options: 'i' } },
                { author: { $regex: q, $options: 'i' } }
            ];
        }
        if (genre) criteria.genre = { $regex: genre, $options: 'i' };
        if (year) criteria.year = Number(year);
        
        return await Book.find(criteria);
    }

    async getSystemStats() {
        const totalBooks = await Book.countDocuments({});
        const Review = require('../models/review');
        const totalReviews = await Review.countDocuments({});
        
        const stats = await Review.aggregate([
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);
        const avgRating = stats.length > 0 ? stats[0].avgRating : 0;
        const genres = await Book.distinct('genre');

        return {
            totalBooks,
            totalReviews,
            genres,
            avgRating: parseFloat(avgRating.toFixed(2))
        };
    }
}

module.exports = new BookService();