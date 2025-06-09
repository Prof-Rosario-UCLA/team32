import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from '../routes/auth.js';
import postRoutes from '../routes/posts.js';
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import helmet from 'helmet';
import { client, initializeRedis } from './redis/client.js';
import { createServer } from 'http';
import { initializeWebSocket } from '../websocket/client.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const allowedOrigins = isDevelopment 
  ? ['http://localhost:3000']
  : ['https://bruinhottake.brandonle.dev'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Slow down
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // allow 100 requests per 15 minutes, then...
  delayMs: () => 500 // begin adding 500ms of delay per request above 100
});

app.use(limiter);
app.use(speedLimiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

async function startServer() {
  const { redisConnected } = await initializeRedis();

  if (!redisConnected) {
    console.error('Unable to connect to Redis. Continuing without Redis features.');
  }

  // Create HTTP server from Express app
  const httpServer = createServer(app);

  // Initialize WebSocket
  initializeWebSocket(httpServer);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Routes
  app.use('/api/users', authRoutes);
  app.use('/api/posts', postRoutes);

  httpServer.listen(port, () => {
    console.log(`Server with WebSocket running on port ${port}`);
    console.log('Allowed origins:', allowedOrigins);
  });
}

startServer().catch(console.error);
