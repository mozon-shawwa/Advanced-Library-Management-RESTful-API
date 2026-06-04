const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

const winstonLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    winstonLogger.add(new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple())
    }));
}

const requestId = (req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
};

const requestLogger = (req, res, next) => {
    const startTime = process.hrtime();
    res.on('finish', () => {
        const diff = process.hrtime(startTime);
        const duration = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
        winstonLogger.info('HTTP Request Processed', {
            reqId: req.id,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: duration
        });
    });
    next();
};

module.exports = { requestId, requestLogger, winstonLogger };