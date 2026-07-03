require('dotenv').config();

// Prevent SSL/TLS fetch errors from Supabase client background connections
// crashing the process on Node.js 24 (unhandled rejection → crash)
process.on('unhandledRejection', (reason) => {
  const msg = reason?.message || String(reason);
  if (msg.includes('fetch failed') || msg.includes('SSL') || msg.includes('TLS')) {
    console.warn('[warn] Supabase background fetch error (ignored):', msg);
  } else {
    console.error('[error] Unhandled rejection:', reason);
  }
});
process.on('uncaughtException', (err) => {
  console.error('[error] Uncaught exception:', err);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

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
const councilRoutes = require('./routes/councilRoutes');
const minutesRoutes = require('./routes/minutesRoutes');
const assessorRoutes = require('./routes/assessorRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/council', councilRoutes);
app.use('/api/minutes', minutesRoutes);
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
