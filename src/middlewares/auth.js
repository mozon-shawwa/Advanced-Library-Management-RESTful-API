const jwt = require('jsonwebtoken');
const { setContextValue } = require('./requestContext');
const config = require('../config');
 
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
 
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Authorization token is required.',
    });
  }
 
  const token = authHeader.split(' ')[1];
 
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
 
    // ← الجديد: نحط بيانات الـ user في الـ async context
    //  أي كود في هاد الـ request يقدر يجيب
    // الـ userId بـ getRequestContext().userId بدون req
    setContextValue('userId', decoded.id);
    setContextValue('tenantId', decoded.tenantId || 'default');
    setContextValue('userRole', decoded.role || 'user');
 
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Token has expired.'
        : 'Invalid or malformed token.';
 
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message,
    });
  }
};
 
module.exports = { authenticate };
 