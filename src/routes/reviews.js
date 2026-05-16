const express = require('express');
const router = express.Router({ mergeParams: true });

const reviewController = require('../controllers/reviewController');

const { validate, writeLimiter } = require('../middlewares');

router.get('/', reviewController.getReviewsByBook);

router.post('/', writeLimiter, validate(['user', 'rating', 'comment']), reviewController.createReview);

module.exports = router;