// el file da mas2ool 3an el connection lel MongoDB we by3mel retry lo el connection we2e3
const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

// options el mongoose el 7adesa
mongoose.set('strictQuery', true);

// el function dy bet3ml connect lel mongo we bet3mel retry lo fashal
async function connectDB(retries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10,
      });
      logger.info({ attempt }, 'MongoDB connected');
      return mongoose.connection;
    } catch (err) {
      logger.error({ err: err.message, attempt }, 'MongoDB connection failed');
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

// byshoof law el connection et2ta3 fel mongo we bysajel el 7aga
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

module.exports = { connectDB };
