const rateLimit = require('express-rate-limit');

// ─── مساعد: يرجع response موحد لكل الـ limiters ─────────────
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    status: 'error',
    statusCode: 429,
    message: 'Too many requests. Please slow down.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// ─── 1. IP-Based Global Limiter ───────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 دقيقة
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: rateLimitHandler,
  validate: { xForwardedForHeader: false },
});

// ─── 2. Write Operations Limiter (IP-based) ───────────────────
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,  // دقيقة
  max: 10,
  keyGenerator: (req) => req.ip,
  handler: rateLimitHandler,
  skip: (req) => req.method === 'GET',
  validate: { xForwardedForHeader: false },
});

// ─── 3. Search Limiter (IP-based) ─────────────────────────────
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.ip,
  handler: rateLimitHandler,
  validate: { xForwardedForHeader: false },
});

// ─── 4. User-Based Limiter ─────────────────────────────────────
const userLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // ساعة
  max: 200,
  keyGenerator: (req) => {
    return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'You have exceeded your hourly request limit.',
    });
  },
  validate: { xForwardedForHeader: false },
});

// ─── 5. Tenant-Based Limiter (Multi-tenant apps) ──────────────
const tenantLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // ساعة
  max: 1000,
  keyGenerator: (req) => {
    const tenantId = req.user?.tenantId || 'default';
    return `tenant:${tenantId}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Your organization has exceeded its API quota for this hour.',
    });
  },
  validate: { xForwardedForHeader: false },
});

// ─── 6. Sensitive Endpoint Limiter ────────────────────────────
const sensitiveEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 دقيقة
  max: 5,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Too many attempts. Account access temporarily locked.',
      retryAfter: '15 minutes',
    });
  },
  skipSuccessfulRequests: true,
  validate: { xForwardedForHeader: false },
});

module.exports = {
  globalLimiter,
  writeLimiter,
  searchLimiter,
  userLimiter,
  tenantLimiter,
  sensitiveEndpointLimiter, //  تأكدي أن هذا الاسم مطابق تماماً للاستدعاء في مسار الـ Login (sensitiveWriteLimiter سابقاً)
};