const bookService = require('../services/bookService');
const { invalidateCache } = require('../middlewares/cache');
 
// GET /api/v1/books
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, genre } = req.query;
    const result = await bookService.getAllBooks({ page, limit, genre });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
 
// GET /api/v1/books/:id
const getOne = async (req, res, next) => {
  try {
    const book = await bookService.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'The requested book record was not found.',
      });
    }
    res.json(book);
  } catch (err) {
    next(err);
  }
};
 
// POST /api/v1/books
const create = async (req, res, next) => {
  try {
    const book = await bookService.createBook({
      ...req.body,
      createdBy: req.user.id, 
    });
 
    // ← امسح cache الـ books list لأن الداتا تغيرت
    invalidateCache('/api/v1/books');
 
    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
};
 
// PUT /api/v1/books/:id
const update = async (req, res, next) => {
  try {
    const whitelist = ['title', 'author', 'year', 'genre'];
    const updates = {};
    whitelist.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
 
    const book = await bookService.updateBook(req.params.id, updates);
 
    // ← امسح كل الـ cache المرتبط بالكتب
    invalidateCache('/api/v1/books');
 
    res.json(book);
  } catch (err) {
    next(err);
  }
};
 
// DELETE /api/v1/books/:id
const deleteBook = async (req, res, next) => {
  try {
    await bookService.deleteBook(req.params.id);
 
    // ← امسح كل الـ cache المرتبط بالكتب
    invalidateCache('/api/v1/books');
 
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
 
module.exports = { getAll, getOne, create, update, delete: deleteBook };