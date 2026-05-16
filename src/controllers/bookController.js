const bookService = require('../services/bookService');

class BookController {

    async getAllBooks(req, res, next) {
        try {
            const result = await bookService.getAllBooks(req.query);
            return res.json(result);
        } catch (e) { next(e); }
    }

    async getBookById(req, res, next) {
        try {
            const book = await bookService.getBookById(req.params.id);
            return res.json(book);
        } catch (e) { next(e); }
    }

    async createBook(req, res, next) {
        try {
            const book = await bookService.createBook(req.body);
            return res.status(201).json(book);
        } catch (e) { next(e); }
    }

    async updateBook(req, res, next) {
        try {
            const book = await bookService.updateBook(req.params.id, req.body);
            return res.json(book);
        } catch (e) { next(e); }
    }

    async deleteBook(req, res, next) {
        try {
            const result = await bookService.deleteBook(req.params.id);
            return res.json(result);
        } catch (e) { next(e); }
    }

    async searchBooks(req, res, next) {
        try {
            const results = await bookService.searchBooks(req.query);
            return res.json(results);
        } catch (e) { next(e); }
    }

    async getSystemStats(req, res, next) {
        try {
            const stats = await bookService.getSystemStats();
            return res.json(stats);
        } catch (e) { next(e); }
    }
}

module.exports = new BookController();