// el entry point bta3 el server — byzabat kol el middlewares we el routes
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const pinoHttp = require('pino-http');

const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const logger = require('./src/utils/logger');

const authRoutes = require('./src/routes/auth.routes');
const adminRoutes = require('./src/routes/admin.routes');
const healthRoutes = require('./src/routes/health.routes');
const projectRoutes = require('./src/routes/project.routes');
const bidRoutes = require('./src/routes/bid.routes');
const uploadRoutes = require('./src/routes/upload.routes');

const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { generalLimiter } = require('./src/middleware/rateLimit');

// ================================================
// APP SETUP
// ================================================

const app = express();

// byshel el header bta3 express (security)
app.disable('x-powered-by');

// trust proxy — lo wara nginx aw cloudflare
if (env.TRUST_PROXY > 0) {
  app.set('trust proxy', env.TRUST_PROXY);
}

// helmet — byzabat headers amena
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.IS_PROD ? undefined : false, // fel prod bs 3ashan ma yekhaba2sh el dev
  })
);

// compression
app.use(compression());

// cors — whitelist men el env
app.use(
  cors({
    origin: (origin, callback) => {
      // ay request men file:// aw curl ma3ando origin, nsm7 beh fel dev bs
      if (!origin) return callback(null, true);
      if (env.CORS_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS not allowed for ${origin}`));
    },
    credentials: true,
  })
);

// body parsers — limit osayar 3ashwn ma 7adesh ye3ml flood
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// mongo sanitize — byshel el operators el fel body (zy $gt)
app.use(mongoSanitize());

// structured logging 3ala kol request
app.use(
  pinoHttp({
    logger,
    customLogLevel: (req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      req: (req) => ({ method: req.method, url: req.url, id: req.id }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  })
);

// general rate limit 3ala el API kolo
app.use('/api', generalLimiter);

// ================================================
// ROUTES
// ================================================

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Nesting Bids inside Projects for clean routing
projectRoutes.use('/:id/bids', bidRoutes);
app.use('/api/projects', projectRoutes);

app.use('/api/uploads', uploadRoutes);

// صور المشاريع المخزنة على القرص — للعرض في الواجهة
app.use('/uploads', express.static(path.resolve(env.UPLOADS_DIR)));

// ================================================
// FRONTEND STATIC FILES — serve the whole project from port 4000
// ================================================
const frontendRoot = path.resolve(__dirname, '..');
app.use(express.static(frontendRoot));

// أي مسار مش API ومش ملف موجود — يرجّع index.html
app.use((req, res, next) => {
  // لو المسار بيبدأ بـ /api يبقى 404 API
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendRoot, 'index.html'));
});

// 404 + error handler fel akher
app.use(notFound);
app.use(errorHandler);

// ================================================
// STARTUP
// ================================================

async function start() {
  try {
    await connectDB();
    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to start server');
    process.exit(1);
  }
}

// byms3k ay unhandled rejection 3ashn ma el app ma tet2felsh b shakl gharib
process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled rejection');
});

start();
