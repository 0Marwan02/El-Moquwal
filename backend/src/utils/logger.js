// el logger el asasy lel app — pino structured we mfeesh PII feeh
const pino = require('pino');
const env = require('../config/env');

// fel dev bne3mel pretty logs, we fel prod json ashr3
const logger = pino({
  level: env.IS_PROD ? 'info' : 'debug',
  // el redact da byshel el fields el 7asasa men el logs 3ashan ma netla3sh passwords aw nids
  redact: {
    paths: [
      'password',
      'newPassword',
      'currentPassword',
      'nationalId',
      'token',
      'accessToken',
      'refreshToken',
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.nationalId',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
  transport: env.IS_PROD
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
});

module.exports = logger;
