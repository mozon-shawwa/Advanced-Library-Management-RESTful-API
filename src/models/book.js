const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, required: true, unique: true, trim: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);