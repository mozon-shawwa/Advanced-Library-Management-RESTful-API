const express = require('express');
const router = express.Router();
const bookService = require('../services/bookService');

router.get('/', async (req, res, next) => {
    try { res.json(await bookService.getSystemStats()); } catch (e) { next(e); }
});

module.exports = router;