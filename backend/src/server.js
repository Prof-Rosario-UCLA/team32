import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from '../routes/auth.js'
import postRoutes from '../routes/posts.js'
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import helmet from 'helmet';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 1,
  delayMs: () => 2000,
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(limiter);
app.use(speedLimiter);
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  }
}));

// Routes
app.use('/api/users', authRoutes);
app.use('/api/posts', postRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 