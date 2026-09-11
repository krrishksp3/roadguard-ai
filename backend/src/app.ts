import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import reportRoutes from './routes/reportRoutes';
import uploadRoutes from './routes/uploadRoutes';
import roadHealthRoutes from './routes/roadHealthRoutes';
import tenderRoutes from './routes/tenderRoutes';
import verificationRoutes from './routes/verificationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import departmentRoutes from './routes/departmentRoutes';
import adminRoutes from './routes/adminRoutes';
import { errorHandler } from './middleware/errorHandler';
import { aiService } from './services/ai/AIService';

dotenv.config();

const app = express();

// Static uploads directory
const uploadDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Middleware
const isProd = process.env.NODE_ENV === 'production';
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, mobile native, curl, or same-origin requests with no origin header
      if (!origin) return callback(null, true);

      if (!isProd) {
        // In development, allow localhost, LAN IPs, and loopbacks
        return callback(null, true);
      }

      // In production, check explicitly against configured origins, wildcard, or any onrender.com origin
      if (
        configuredOrigins.length === 0 ||
        configuredOrigins.includes('*') ||
        configuredOrigins.includes(origin) ||
        origin.endsWith('.onrender.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy violation: Origin ${origin} not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'ROADGUARD AI Platform API',
    timestamp: new Date().toISOString(),
    aiProvider: aiService.getProviderName(),
    version: '1.0.0-sih2026',
  });
});

// API Documentation summary endpoint
app.get('/api/docs', (req, res) => {
  res.status(200).json({
    platform: 'ROADGUARD AI',
    tagline: 'From Road Complaints to Intelligent, Accountable Road Action',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/profile'],
      reports: [
        'GET /api/reports',
        'POST /api/reports',
        'GET /api/reports/my-reports',
        'GET /api/reports/:id',
        'PATCH /api/reports/:id/status',
        'POST /api/reports/:id/escalate',
      ],
      roadHealth: [
        'GET /api/road-health',
        'GET /api/road-health/hotspots',
        'GET /api/road-health/:id',
      ],
      tenders: ['GET /api/tenders', 'GET /api/tenders/:id'],
      verification: ['POST /api/verification/run', 'POST /api/verification/:reportId/decision'],
      admin: ['GET /api/admin/overview', 'POST /api/admin/action'],
      analytics: ['GET /api/analytics/summary'],
      notifications: ['GET /api/notifications', 'PATCH /api/notifications/:id/read'],
      departments: ['GET /api/departments'],
    },
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/road-health', roadHealthRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/departments', departmentRoutes);

// Centralized error handler
app.use(errorHandler);

export default app;
