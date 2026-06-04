const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 3000,

  MONGO_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/library_db',

  API_PREFIX: process.env.API_PREFIX || '/api/v1',

  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_enterprise_fallback_key_dont_use_in_production',

  JSON_BODY_LIMIT: process.env.JSON_BODY_LIMIT || '10kb'
};