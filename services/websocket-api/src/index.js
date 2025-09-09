const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const AppDataSource = require('./config/database');
const swaggerSpecs = require('./config/swagger');
const websocketRoutes = require('./routes/websocket');

// Import event handlers
const chatEvents = require('./events/chatEvents');
const userEvents = require('./events/userEvents');
const roomEvents = require('./events/roomEvents');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3004;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'WebSocket API Documentation',
}));

// WebSocket documentation routes
app.use('/websocket', websocketRoutes);

// Create Socket.IO instance
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Register event handlers
  chatEvents(io, socket);
  userEvents(io, socket);
  roomEvents(io, socket);

  // Debug: Log when user joins a room
  socket.on('join_room', (data) => {
    console.log(`User ${socket.id} joined room: ${data.roomId}`);
  });

  // Debug: Log when user sends a message
  socket.on('send_message', (data) => {
    console.log(`User ${socket.id} sent message to room ${data.roomId}: "${data.content}"`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`Socket error:`, error);
  });
});

// REST API endpoints for WebSocket service
app.get('/', (req, res) => {
  res.json({
    message: 'WebSocket API Service',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      websocket: '/socket.io/',
      health: '/websocket/health',
      events: {
        chat: '/websocket/events/chat',
        rooms: '/websocket/events/rooms',
        users: '/websocket/events/users',
        notifications: '/websocket/events/notifications',
        received: '/websocket/events/received'
      }
    },
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'WebSocket API',
    connectedUsers: io.engine.clientsCount,
  });
});

app.get('/stats', (req, res) => {
  const rooms = Array.from(io.sockets.adapter.rooms.keys());
  const connectedUsers = io.engine.clientsCount;
  
  res.json({
    connectedUsers,
    activeRooms: rooms.length,
    rooms: rooms.map(room => ({
      name: room,
      memberCount: io.sockets.adapter.rooms.get(room)?.size || 0,
    })),
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Start server function
const startServer = async () => {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🔍 Swagger documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🌐 Server running on: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/socket.io/`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  io.close();
  server.close();
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  io.close();
  server.close();
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

// Start the server
startServer();

module.exports = { app, server, io };
