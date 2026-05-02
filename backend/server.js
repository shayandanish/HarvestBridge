require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const { PrismaClient } = require('@prisma/client');
const logger = require('./src/utils/logger');
const socketInstance = require('./socketInstance');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

const { initHarvestJobs } = require('./src/jobs/harvestJobs');

// Create HTTP server and attach Socket.io
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store io instance globally
socketInstance.setIo(io);

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id || decoded.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  // Join personal room
  socket.join(`user:${userId}`);
  logger.info(`🔌 Socket connected: user ${userId}`);

  socket.on('disconnect', () => {
    logger.info(`🔌 Socket disconnected: user ${userId}`);
  });
});

// Test database connection
async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Initialize scheduled jobs
    initHarvestJobs();
    logger.info('⏰ Scheduled jobs initialized');

    // Sync admin user from .env
    const { syncAdminUser } = require('./src/utils/adminSeeder');
    await syncAdminUser();
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
async function startServer() {
  await connectDatabase();

  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    logger.info(`📡 API available at http://localhost:${PORT}/api/${process.env.API_VERSION}`);
    logger.info(`🔔 Socket.io ready`);
  });
}

startServer();
