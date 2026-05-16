const express = require('express');
const router = express.Router();
const bookService = require('../services/bookService');
const { searchLimiter } = require('../middlewares'); 

router.get('/', searchLimiter, async (req, res, next) => {
    try { res.json(await bookService.searchBooks(req.query)); } catch (e) { next(e); }
});

module.exports = router;