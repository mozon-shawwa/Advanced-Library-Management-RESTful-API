const express = require('express');
const router = express.Router();

const booksRouter = require('./books');
const reviewsRouter = require('./reviews');
const searchRouter = require('./search');
const statsRouter = require('./stats');
const usersRouter = require('./users'); 

router.use('/books', booksRouter);

router.use('/books/:bookId/reviews', reviewsRouter);

router.use('/search', searchRouter);
router.use('/stats', statsRouter);
router.use('/auth', usersRouter); 

module.exports = router;