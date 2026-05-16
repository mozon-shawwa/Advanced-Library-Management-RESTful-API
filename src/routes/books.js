const express = require('express');
const router = express.Router();

const bookController = require('../controllers/bookController');

const { validate, writeLimiter, authenticate } = require('../middlewares');

router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);

router.post('/', authenticate, writeLimiter, validate(['title', 'author', 'isbn', 'year', 'genre']), bookController.createBook);
router.put('/:id', authenticate, writeLimiter, bookController.updateBook);
router.delete('/:id', authenticate, writeLimiter, bookController.deleteBook);

module.exports = router;