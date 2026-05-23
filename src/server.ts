import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes         from './routes/auth';
import healthLogRoutes    from './routes/healthLog';
import symptomRoutes      from './routes/symptom';
import userRoutes         from './routes/user';
import analyticsRoutes    from './routes/analytics';
import aiRoutes           from './routes/ai';
import adminRoutes        from './routes/admin';
import communityRoutes    from './routes/community';
import notificationRoutes from './routes/notifications';
import streakRoutes       from './routes/streak';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS — allow website, APK, and Railway ─────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',                          // website dev
  'http://localhost:5173',                          // vite dev
  'capacitor://localhost',                          // Android APK (Capacitor)
  'ionic://localhost',                              // fallback
  'http://localhost',                               // fallback
  process.env.CLIENT_URL,                           // production website URL
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile APK, Postman, Railway health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any Railway / Render / Vercel deployed URL
    if (
      origin.endsWith('.railway.app') ||
      origin.endsWith('.render.com')  ||
      origin.endsWith('.vercel.app')
    ) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));          // pre-flight for all routes
app.use(express.json({ limit: '10mb' }));     // increased for base64 images (profile photo)
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate Limiting ──────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 500,                    // 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                     // stricter limit for auth routes
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

app.use('/api', apiLimiter);
app.use('/api/v1/auth/login',    authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/health-log',    healthLogRoutes);
app.use('/api/v1/symptoms',      symptomRoutes);
app.use('/api/v1/user',          userRoutes);
app.use('/api/v1/analytics',     analyticsRoutes);
app.use('/api/v1/ai',            aiRoutes);
app.use('/api/v1/admin',         adminRoutes);
app.use('/api/v1/community',     communityRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/streak',        streakRoutes);

// ── Health Check (Railway uses this to verify deployment) ─────────────────────
app.get('/health', (_, res) => res.json({
  status: 'OK',
  version: '2.1.0',
  platform: 'APK + Web',
  timestamp: new Date().toISOString(),
}));

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use('*', (_, res) => res.status(404).json({
  success: false,
  message: 'Route not found.',
}));

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// ── MongoDB + Server Start ────────────────────────────────────────────────────
const connect = (retries = 5) => {
  console.log(`🔄 Connecting to MongoDB... (attempt ${6 - retries}/5)`);
  mongoose.connect(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 10000,
  })
    .then(() => {
      console.log('✅ MongoDB connected');
      app.listen(PORT, () => {
        console.log(`🚀 Server → http://localhost:${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
        console.log('📱 APK CORS: enabled for capacitor://localhost');
        console.log('Routes: auth | health-log | symptoms | user | analytics | ai | admin | community | notifications | streak');
      });
    })
    .catch(err => {
      console.error(`❌ MongoDB failed: ${err.message}`);
      if (retries > 0) {
        console.log(`⏳ Retrying in 5s...`);
        setTimeout(() => connect(retries - 1), 5000);
      } else {
        console.error('💀 Could not connect. Check MongoDB Atlas → Network Access → 0.0.0.0/0');
        process.exit(1);
      }
    });
};

connect();
