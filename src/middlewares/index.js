const { authenticate } = require('./auth');
const { validateBody, notFound, errorHandler }  = require('./errorHandler');
const { requestId, requestLogger } = require('./logger');
const { requestContextMiddleware, getRequestContext, setContextValue } = require('./requestContext');
const { globalLimiter, writeLimiter, searchLimiter, userLimiter,tenantLimiter,
        sensitiveEndpointLimiter }  = require('./rateLimit');
const { requireBookOwnership, requireReviewOwnership, requireRole } = require('./resourceAuth');
const { cacheMiddleware, etagMiddleware, invalidateCache } = require('./cache');
 
module.exports = {
  // Auth
  authenticate,
 
  // Validation & Error handling
  validateBody,
  notFound,
  errorHandler,
 
  // Logging
  requestId,
  requestLogger,
 
  // Request Context
  requestContextMiddleware,
  getRequestContext,
  setContextValue,
 
  // Rate Limiting
  globalLimiter,
  writeLimiter,
  searchLimiter,
  userLimiter,
  tenantLimiter,
  sensitiveEndpointLimiter,
 
  // Resource Authorization
  requireBookOwnership,
  requireReviewOwnership,
  requireRole,
 
  // Caching & ETag
  cacheMiddleware,
  etagMiddleware,
  invalidateCache,
};
 