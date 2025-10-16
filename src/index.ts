import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { setupAssociations } from './models';

// Import route handlers
import authRoutes from './auth/routes';
import { practiceSessionsRouter } from './routes/practiceSessions';
import { attendanceRouter } from './routes/attendance';
import { gauntletRouter } from './routes/gauntlets';
import { gauntletMatchRouter } from './routes/gauntletMatches';
import { ladderRouter } from './routes/ladders';
import { ladderPositionRouter } from './routes/ladderPositions';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env['PORT'] || '3000', 10);

// Setup model associations
setupAssociations();

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(globalLimiter);
app.use(cors({
  origin: process.env['CORS_ORIGIN'] || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    },
    message: 'Boathouse ETL API is running',
    error: null
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/practice-sessions', practiceSessionsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/gauntlets', gauntletRouter);
app.use('/api/gauntlet-matches', gauntletMatchRouter);
app.use('/api/ladders', ladderRouter);
app.use('/api/ladder-positions', ladderPositionRouter);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Boathouse ETL API',
      version: '1.0.0',
      description: 'Centralized backend hub for rowing club data management',
      endpoints: {
        auth: '/auth',
        practiceSessions: '/api/practice-sessions',
        attendance: '/api/attendance',
        gauntlets: '/api/gauntlets',
        gauntletMatches: '/api/gauntlet-matches',
        ladders: '/api/ladders',
        ladderPositions: '/api/ladder-positions',
        health: '/health'
      }
    },
    message: 'Welcome to Boathouse ETL API',
    error: null
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: 'Endpoint not found',
    error: 'NOT_FOUND'
  });
});

// Global error handler
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    data: null,
    message: error.message || 'Internal server error',
    error: error.name || 'INTERNAL_ERROR'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Boathouse ETL API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth`);
  console.log(`📅 Practice sessions: http://localhost:${PORT}/api/practice-sessions`);
  console.log(`✅ Attendance: http://localhost:${PORT}/api/attendance`);
  console.log(`🏆 Gauntlets: http://localhost:${PORT}/api/gauntlets`);
  console.log(`⚔️ Gauntlet matches: http://localhost:${PORT}/api/gauntlet-matches`);
  console.log(`📈 Ladders: http://localhost:${PORT}/api/ladders`);
  console.log(`🎯 Ladder positions: http://localhost:${PORT}/api/ladder-positions`);
  console.log(`🌐 CORS origin: ${process.env['CORS_ORIGIN'] || '*'}`);
});

export default app;
