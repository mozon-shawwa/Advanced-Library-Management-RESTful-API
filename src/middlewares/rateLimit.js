const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests from this IP, please try again later.' }
});

const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: 'High-frequency search threshold reached. Limited to 20/min.' }
});

const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Mutation operations limit hit. Limited to 10/min.' }
});

module.exports = { globalLimiter, searchLimiter, writeLimiter };