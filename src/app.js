const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const config = require('./config');
const routes = require('./routes');


const {
    requestId,
    requestLogger,
    requestContextMiddleware, // الـ AsyncLocalStorage middleware
    globalLimiter,
    notFound,
    errorHandler
} = require('./middlewares');

const app = express();

// 1. الحماية الأمنية المتقدمة لـ HTTP Headers
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
            },
        },
        hidePoweredBy: true, // إخفاء هوية السيرفر (Express) تلقائياً لمنع الاستهداف
    })
);

// 2. إعدادات الـ CORS الديناميكية والذكية
const allowedOrigins = (config.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

app.use(
    cors({
        origin: (origin, callback) => {
            // السماح للأدوات مثل Postman (بدون origin) والـ origins المصرح بها في الـ .env
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: Origin ${origin} not allowed`));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Tenant-ID'],
        exposedHeaders: ['X-Request-ID', 'RateLimit-Remaining', 'ETag'],
        credentials: true, // السماح بـ Cookies و Authorization headers بين الـ domains
        maxAge: 86400,     // جعل المتصفح يحفظ الـ CORS preflight لـ 24 ساعة لتقليل طلبات الـ OPTIONS الـمجهدة
    })
);

// 3. ضغط حجم البيانات الخارجة لتسريع الاستجابة وتوفير الباندويث
app.use(
    compression({
        threshold: 1024, // لا تضغط أي رد حجمه أقل من 1 كيلوبايت
        level: 6,        // التوازن المثالي بين سرعة المعالجة وقوة الضغط
        filter: (req, res) => {
            if (req.headers['x-no-compression']) return false;
            return compression.filter(req, res);
        },
    })
);

// 4. وضع سقف لحجم البيانات القادمة لحماية الذاكرة من الـ Buffer Overflow
app.use(express.json({ limit: config.JSON_BODY_LIMIT || '10kb' }));
app.use(express.urlencoded({ extended: true, limit: config.JSON_BODY_LIMIT || '10kb' }));

// 5. تفعيل خط التتبع المتقدم وحقن السياق
app.use(requestId);                 // توليد وحقن UUIDv4 فريد لكل طلب
app.use(requestContextMiddleware);  // إنشاء الـ AsyncLocalStorage Context الخاص بالطلب
app.use(requestLogger);             // تسجيل بيانات الـ Request والـ Response ووقت المعالجة بالـ ms

// 6. ربط محدد الطلبات  بالمسارات الأساسية
app.use('/api/v1', globalLimiter);
app.use('/api/v1', routes);

// 7. مسار فحص سلامة النظام والـ Uptime (موضوع خارج الـ rate limit والـ prefix)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// 8. المعالجات الحتمية للأخطاء والـ 404
app.use(notFound);      // لالتقاط أي مسار غير مسجل
app.use(errorHandler);  // معالج الأخطاء المركزي الشامل للمشروع

module.exports = app;