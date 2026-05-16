const { requestId, requestLogger, winstonLogger } = require('./logger');
const { globalLimiter, searchLimiter, writeLimiter } = require('./rateLimit');
const { notFound, errorHandler, validateBody: validate } = require('./errorHandler');
const authenticate = require('./auth');

module.exports = {
    requestId,
    requestLogger,
    winstonLogger,
    globalLimiter,
    searchLimiter,
    writeLimiter,
    notFound,
    errorHandler,
    validate,
    authenticate,
};