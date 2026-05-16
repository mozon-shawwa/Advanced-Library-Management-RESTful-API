const express = require('express');
const router = express.Router();

const booksRouter = require('./books');
const reviewsRouter = require('./reviews');
const searchRouter = require('./search');
const statsRouter = require('./stats');

router.use('/books', booksRouter);

router.use('/books/:bookId/reviews', reviewsRouter);

router.use('/search', searchRouter);
router.use('/stats', statsRouter);

module.exports = router;