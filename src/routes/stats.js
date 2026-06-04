const express = require('express');
const router = express.Router();
const bookService = require('../services/bookService');

const { cacheMiddleware, globalLimiter } = require('../middlewares');

// ─── GET /api/v1/stats ────────────────────────────────────────
router.get(
  '/', 
  globalLimiter,
  cacheMiddleware(300), // كاش لمدة 5 دقائق كاملة لحماية السيرفر من حساب الإحصائيات الثقيلة بشكل متكرر
  async (req, res, next) => {
    try { 
      const stats = await bookService.getSystemStats(); 
      res.json(stats); 
    } catch (e) { 
      next(e); 
    }
  }
);

module.exports = router;