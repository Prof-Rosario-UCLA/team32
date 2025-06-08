import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from '../routes/auth.js';
import postRoutes from '../routes/posts.js';
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import helmet from 'helmet';
import { client, initializeRedis } from '../redis/client.js';

import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 1,
  delayMs: () => 1000,
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
// app.use(limiter);
// app.use(speedLimiter);
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      mediaSrc: ["'self'"],
      upgradeInsecureRequests: [],
    },
  })
);
app.use(
  helmet.hsts({
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true,
  })
);

async function startServer() {
  const { redisConnected } = await initializeRedis();

  if (!redisConnected) {
    console.error('Unable to connect to Redis. Continuing without Redis features.');
  }

  // Create HTTP server from Express app
  const httpServer = createServer(app);

  // Attach Socket.IO to HTTP server
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:3000', 
      methods: ['GET', 'POST']
    }
  });

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // emit message to client
    socket.emit('welcome', 'Welcome to Socket.IO server!');

    // listen for events from client
    socket.on('new-post', (post) => {
      // Broadcast new post to all connected clients except sender
      socket.broadcast.emit('new-post', post);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Routes
  app.use('/api/users', authRoutes);
  app.use('/api/posts', postRoutes);

  httpServer.listen(port, () => {
    console.log(`Server with Socket.IO running on port ${port}`);
  });
}

startServer().catch(console.error);
