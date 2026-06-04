const { AsyncLocalStorage } = require('async_hooks');
 
// الصندوق — instance واحد على مستوى التطبيق
const asyncLocalStorage = new AsyncLocalStorage();
 
/**
 * Middleware: يشتغل على كل request،
 * يفتح "context store" جديدة خاصة بهاد الطلب فقط
 */
const requestContextMiddleware = (req, res, next) => {
  const store = {
    requestId: req.id,           // الـ UUID اللي بحطه requestId middleware
    userId: null,                 // يتملى بعد authentication
    tenantId: null,               // يتملى بعد authentication (multi-tenant)
    startTime: process.hrtime(),  // لحساب response time
    method: req.method,
    url: req.originalUrl,
  };
 
  // شغّل باقي الـ request كامل داخل هاد الـ store
  asyncLocalStorage.run(store, () => {
    next();
  });
};
 
/**
 * getRequestContext()
 * استخدمه من أي مكان — service, util, logger — بدون تمرير req
 *
 * مثال في bookService.js:
 *   const ctx = getRequestContext();
 *   logger.info({ reqId: ctx.requestId }, 'Fetching books');
 */
const getRequestContext = () => {
  return asyncLocalStorage.getStore();
};
 
/**
 * setContextValue(key, value)
 * بعد authentication، حط الـ userId في الـ context
 *
 * مثال في auth middleware:
 *   setContextValue('userId', decoded.id);
 *   setContextValue('tenantId', decoded.tenantId);
 */
const setContextValue = (key, value) => {
  const store = asyncLocalStorage.getStore();
  if (store) store[key] = value;
};
 
module.exports = {
  requestContextMiddleware,
  getRequestContext,
  setContextValue,
};