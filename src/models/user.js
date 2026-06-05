const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required.'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required.'],
      unique: true,
      trim: true,
      lowercase: true, 
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address.',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [6, 'Password must be at least 6 characters long.'],
    },
    role: {
      type: String,
      enum: {
         values: ['user', 'admin', 'librarian'],
        message: 'Role must be either user or admin.',
      },
      default: 'user',
    },
    tenantId: {
      type: String,
      required: [true, 'Tenant ID is required for multi-tenancy context.'],
      trim: true,
      default: 'default',
    },
  },
  {
    timestamps: true, 
  }
);

// ⚡ الـ Indexes لتسريع عمليات التحقق وتسجيل الدخول والفرز حسب الشركات
userSchema.index({ email: 1 });
userSchema.index({ tenantId: 1 }); 

module.exports = mongoose.model('User', userSchema);