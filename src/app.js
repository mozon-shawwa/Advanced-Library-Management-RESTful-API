const express = require('express');
const helmet = require('helmet');
const config = require('./config');

const { requestId, requestLogger } = require('./middlewares/logger');
const { globalLimiter } = require('./middlewares/rateLimit');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const apiRouter = require('./routes');

const app = express();


// الحماية الأمنية وتقييد حجم البيانات المدخلة لمنع الـ Buffer Overflow
app.use(helmet());
app.use(express.json({ limit: config.JSON_BODY_LIMIT }));

// تشغيل الـ Request ID واللوجر الذكي لحساب وقت الاستجابة بالـ ms
app.use(requestId);
app.use(requestLogger);

// مسار فحص سلامة النظام والـ Uptime
app.get('/health', (req, res) => res.json({ status: 'UP', uptime: process.uptime() }));

app.use(config.API_PREFIX, globalLimiter, apiRouter);

// المسارات النهائية لمعالجة الـ 404 والأخطاء الحتمية
app.use(notFound);
app.use(errorHandler);

module.exports = app;