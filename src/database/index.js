const mongoose = require('mongoose');
const config = require('../config');

const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('✅ Connected successfully to MongoDB via Mongoose');
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;