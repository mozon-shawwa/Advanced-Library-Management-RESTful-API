const mongoose = require('mongoose');
 
const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required.'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters.'],
    },
    author: {
      type: String,
      required: [true, 'Author name is required.'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required.'],
      unique: true,
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Publication year is required.'],
      min: [1000, 'Year must be after 1000.'],
      max: [new Date().getFullYear(), 'Year cannot be in the future.'],
    },
    genre: {
      type: String,
      required: [true, 'Genre is required.'],
      trim: true,
    },
 
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: false,
    },
  },
  {
    timestamps: true,  
  }
);
 
// Index لتسريع البحث
bookSchema.index({ title: 'text', author: 'text', genre: 'text' });
bookSchema.index({ genre: 1 });
bookSchema.index({ createdBy: 1 });  // ← index للـ ownership queries
 
module.exports = mongoose.model('Book', bookSchema);
 