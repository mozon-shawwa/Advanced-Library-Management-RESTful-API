const app = require('./src/app');
const config = require('./src/config');
const connectDB = require('./src/database');

const start = async () => {
    await connectDB();
    app.listen(config.PORT, () => {
        console.log(`🚀 Server running on port ${config.PORT} in [${config.NODE_ENV}] mode`);
    });
};

start();