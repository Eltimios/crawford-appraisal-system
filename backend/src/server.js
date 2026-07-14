require('dotenv').config();

process.on('unhandledRejection', (reason) => {
  console.error('[error] Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[error] Uncaught exception:', err);
});

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { UPLOADS_ROOT } = require('./config/storage');

const authRoutes = require('./routes/authRoutes');
const appraisalRoutes = require('./routes/appraisalRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const publicationRoutes = require('./routes/publicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const registryRoutes = require('./routes/registryRoutes');
const hrRoutes = require('./routes/hrRoutes');
// Council portal is temporarily hidden — progress now terminates at A&PC.
// const councilRoutes = require('./routes/councilRoutes');
const minutesRoutes = require('./routes/minutesRoutes');
const minutesDownloadRoutes = require('./routes/minutesDownloadRoutes');
const assessorRoutes = require('./routes/assessorRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Two of helmet's defaults block the frontend (a different origin — different
// port in dev, likely a different subdomain in production) from embedding files
// served here (e.g. publication PDFs in an <iframe>): crossOriginResourcePolicy
// ('same-origin') and CSP's frame-ancestors ('self'). This app is cross-origin
// by design, and file access is already gated appropriately (public uploads are
// meant to be public; private ones go through the token-gated minutes download
// route) — CORS already covers the API, so we just need to let the known
// frontend origin frame this server's responses.
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'frame-ancestors': ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
    },
  },
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Publicly-servable uploaded files (e.g. staff publications) — needed unauthenticated
// by the external assessor portal. Meeting minutes are NOT served here; they go
// through an authenticated streaming route instead (see minutesRoutes.js).
app.use('/uploads/publications', express.static(path.join(UPLOADS_ROOT, 'publications')));
app.use('/uploads/assessor-reports', express.static(path.join(UPLOADS_ROOT, 'assessor-reports')));

// Disable browser caching for all API responses
app.use('/api/', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const limiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 2000 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/appraisals', appraisalRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/publications', publicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/registry', registryRoutes);
app.use('/api/hr', hrRoutes);
// app.use('/api/council', councilRoutes);
app.use('/api/minutes', minutesRoutes);
app.use('/api/minutes-download', minutesDownloadRoutes);
app.use('/api/assessors', assessorRoutes);
app.use('/api/public', publicRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

const shutdown = () => {
  server.closeAllConnections();
  server.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
