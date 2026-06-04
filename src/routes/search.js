const express = require('express');
const router = express.Router();
const bookService = require('../services/bookService');

const { searchLimiter, etagMiddleware } = require('../middlewares'); 

// ─── GET /api/v1/search ───────────────────────────────────────
router.get(
  '/', 
  searchLimiter,   // حماية موارد الـ Database من الاستعلامات المتكررة المجهدة
  etagMiddleware,  // التحقق الفوري بالـ ETag لمنع إعادة إرسال نفس النتائج غير المتغيرة
  async (req, res, next) => {
    try { 
      const results = await bookService.searchBooks(req.query); 
      res.json(results); 
    } catch (e) { 
      next(e); 
    }
  }
);

module.exports = router;