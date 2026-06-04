const crypto = require('crypto');

const cacheStore = new Map();
 
/**
 * generateETag(data)
 * ──────────────────
 * يعمل hash (MD5) للـ response body
 * لو الداتا ما تغيرت، الـ hash نفسه → 304 Not Modified
 */
const generateETag = (data) => {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return `"${crypto.createHash('md5').update(str).digest('hex')}"`;
};
 
/**
 * cacheMiddleware(ttlSeconds)
 * ───────────────────────────
 * Factory middleware — تعطيه مدة الـ cache بالثواني
 *
 * كيف يشتغل:
 * 1. يبني cache key من الـ URL + query params
 * 2. لو موجود في الـ cache وما انتهت صلاحيته → يرجعه مباشرة
 * 3. لو مش موجود → يكمل للـ controller، ويحفظ الـ response
 *
 * الاستخدام:
 *   router.get('/', cacheMiddleware(300), bookController.getAll)
 *   // 300 ثانية = 5 دقائق cache
 */
const cacheMiddleware = (ttlSeconds = 60) => {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
 
    const cacheKey = `${req.originalUrl}`;
    const cached = cacheStore.get(cacheKey);
 
    // ─── Cache Hit ─────────────────────────────────────────
    if (cached && Date.now() < cached.expiresAt) {
      const etag = cached.etag;
 
      // ETag Check: هل الـ client عنده نفس النسخة؟
      // الـ client يبعث If-None-Match header فيه الـ ETag اللي عنده
      if (req.headers['if-none-match'] === etag) {
        // الداتا ما تغيرت — ما في داعي ترسل الـ body كامل
        return res.status(304).end();
      }
 
      // كاش hit، بس الـ client ما عنده ETag أو مختلف — ابعث الداتا
      res.set('X-Cache', 'HIT');
      res.set('ETag', etag);
      res.set('Cache-Control', `public, max-age=${ttlSeconds}`);
      return res.json(cached.data);
    }
 
    // ─── Cache Miss ────────────────────────────────────────
    // اعترض الـ res.json الأصلي لتخزين الـ response
    const originalJson = res.json.bind(res);
 
    res.json = (data) => {
      // احسب الـ ETag من الداتا
      const etag = generateETag(data);
 
      // خزّن في الـ cache
      cacheStore.set(cacheKey, {
        data,
        etag,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
 
      // ضع الـ headers على الـ response
      res.set('X-Cache', 'MISS');
      res.set('ETag', etag);
      res.set('Cache-Control', `public, max-age=${ttlSeconds}`);
 
      // ارجع للـ res.json الأصلي لإرسال الـ response
      return originalJson(data);
    };
 
    next();
  };
};
 
/**
 * invalidateCache(pattern)
 * ─────────────────────────
 * لما تعمل POST/PUT/DELETE على كتاب، امسح الـ cache المرتبط فيه
 * حتى الـ request الجاي يجيب داتا fresh من الـ DB
 *
 * الاستخدام في bookController:
 *   invalidateCache('/api/v1/books');
 *   // يمسح كل keys اللي تبدأ بهاد الـ pattern
 */
const invalidateCache = (pattern) => {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(pattern)) {
      cacheStore.delete(key);
    }
  }
};
 
/**
 * etagMiddleware
 * ──────────────
 * للـ routes اللي ما بدنا cache عليها بس بدنا ETag فقط
 * (مثلاً: GET /:id — كتاب واحد، مش قائمة)
 *
 * الاستخدام:
 *   router.get('/:id', etagMiddleware, bookController.getOne)
 */
const etagMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);
 
  res.json = (data) => {
    const etag = generateETag(data);
 
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }
 
    res.set('ETag', etag);
    res.set('Cache-Control', 'no-cache'); // revalidate دايماً، بس استخدم ETag
    return originalJson(data);
  };
 
  next();
};
 
module.exports = {
  cacheMiddleware,
  etagMiddleware,
  invalidateCache,
};