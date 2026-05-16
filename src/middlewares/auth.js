const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // 1. تحقق إن الهيدر موجود وفورماته صح
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const err = new Error('Access denied. No token provided.');
        err.status = 401;
        return next(err);
    }

    // 2. استخرج الـ token
    const token = authHeader.split(' ')[1];

    // 3. تحقق من صحة الـ token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, role, ... }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            const error = new Error('Token expired. Please log in again.');
            error.status = 401;
            return next(error);
        }
        const error = new Error('Invalid token.');
        error.status = 401;
        return next(error);
    }
};

module.exports = authenticate;