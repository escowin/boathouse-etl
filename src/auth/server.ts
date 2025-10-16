import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes';
import { authConfig } from './config';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env['AUTH_PORT'] || '3000', 10);

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
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

// Routes
app.use('/auth', authRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      service: 'Boathouse Authentication Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        login: 'POST /auth/login',
        changePin: 'POST /auth/change-pin',
        verify: 'POST /auth/verify',
        athletes: 'GET /auth/athletes',
        setDefaultPin: 'POST /auth/set-default-pin',
        health: 'GET /auth/health'
      }
    },
    message: 'Authentication service is running'
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'authentication'
    },
    message: 'Service is healthy'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: 'NOT_FOUND',
    data: {
      path: req.originalUrl,
      method: req.method
    }
  });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: 'INTERNAL_ERROR',
    ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  process.exit(0);
};

// Handle different termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log('🚀 Boathouse Authentication Service started');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth`);
      console.log(`⚙️  Environment: ${process.env['NODE_ENV'] || 'development'}`);
      console.log(`🔒 JWT expires in: ${authConfig.jwtExpiresIn}`);
      console.log(`⏰ Rate limit: 100 requests per 15 minutes`);
      resolve();
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        reject(err);
      } else {
        console.error('❌ Server error:', err);
        reject(err);
      }
    });
  });
};

// Start the server
if (require.main === module) {
  startServer().catch((err) => {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  });
}

export default app;
