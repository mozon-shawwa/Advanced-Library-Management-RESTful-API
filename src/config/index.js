module.exports = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/library_db',
    API_PREFIX: '/api/v1',
    JSON_BODY_LIMIT: '10kb'
};