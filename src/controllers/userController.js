const userService = require('../services/userService');

// 1. إنشاء حساب جديد: POST /api/v1/auth/register
const register = async (req, res, next) => {
  try {
    // تصفية المدخلات وحقن الـ tenantId القادم من الهيدرز أو بشكل افتراضي لدعم الـ Multi-tenancy Context
    const tenantId = req.headers['x-tenant-id'] || 'default';
    
    const user = await userService.registerUser({
      ...req.body,
      tenantId
    });

    // إعادة بيانات المستخدم بعد إنشائه بدون كلمة المرور بالتأكيد للأمان
    res.status(201).json({
      status: 'success',
      data: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
};

// 2. تسجيل الدخول وتوليد الـ Token: POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // استدعاء الخدمة للتحقق من صحة الإيميل وتشفير كلمة المرور وإرجاع الـ JWT Token
    const { user, token } = await userService.loginUser({ email, password });

    res.json({
      status: 'success',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId }
    });
  } catch (err) {
    next(err);
  }
};

// 3. جلب الملف الشخصي للمستخدم الحالي: GET /api/v1/auth/me
const getProfile = async (req, res, next) => {
  try {
    // الـ req.user يتم حشو بياناته تلقائياً بواسطة ميدل وير الـ Authenticate المحمي
    const user = await userService.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'User profile not found.',
      });
    }
    
    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile };