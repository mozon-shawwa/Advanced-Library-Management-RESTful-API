const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Parent Book reference ID is required.'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer User reference ID is required.'],
    },
    rating: {
      type: Number,
      required: [true, 'Review rating metric integer is required.'],
      min: [1, 'Rating must be at least 1.'],
      max: [5, 'Rating cannot exceed 5.'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment body is required.'],
      trim: true,
      maxlength: [1000, 'Comment text cannot exceed 1000 characters.'],
    },
  },
  {
    timestamps: true,
  }
);

// ⚡ الـ Indexes لتسريع استعلامات الفلترة وحماية الأداء
reviewSchema.index({ bookId: 1 }); // لتسريع جلب مراجعات كتاب معين
reviewSchema.index({ userId: 1 }); // لتسريع جلب مراجعات مستخدم معين للـ Resource-Based Auth

/**
 * هذا السطر يضمن ألا يستطيع المستخدم الواحد إضافة أكثر من مراجعة واحدة لنفس الكتاب!
 * لو حاول إضافة مراجعة ثانية، سيرفض الـ DB فوراً بسبب الـ unique constraint.
 */
reviewSchema.index({ bookId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);