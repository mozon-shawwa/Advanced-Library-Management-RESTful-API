const { winstonLogger } = require('./logger');

const notFound = (req, res, next) => {
    res.status(404).json({ error: 'Endpoint route could not be found.', path: req.originalUrl });
};

const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    winstonLogger.error(err.message, { reqId: req.id, stack: err.stack });
    
    res.status(status).json({
        status: 'error',
        statusCode: status,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
};

const validateBody = (requiredFields) => {
    return (req, res, next) => {
        const missing = requiredFields.filter(f => !req.body[f]);
        if (missing.length > 0) {
            const err = new Error(`Validation Missing Fields: ${missing.join(', ')}`);
            err.status = 400;
            return next(err);
        }
        
        for (let key in req.body) {
            if (typeof req.body[key] === 'string') {
                const { sanitizeString } = require('../utils/sanitizer');
                req.body[key] = sanitizeString(req.body[key]);
            }
        }
        next();
    };
};

module.exports = { notFound, errorHandler, validateBody };