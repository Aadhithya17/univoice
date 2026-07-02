import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import dns from 'dns';

// Configure DNS servers for reliable SRV lookup on Windows
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Load environment variables and reload
dotenv.config();

import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorMiddleware';
import authRoutes from './routes/authRoutes';
import postRoutes from './routes/postRoutes';
import commentRoutes from './routes/commentRoutes';
import adminRoutes from './routes/adminRoutes';

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Expose Socket.io instance on express app object
app.set('io', io);

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows client to fetch uploaded static files
  })
);

// CORS configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// Rate Limiting (Basics)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 minutes
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup image upload directories
const uploadsPath = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve static uploads
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// Root route placeholder
app.get('/', (req, res) => {
  res.send('UniVoice API is running...');
});

// Error handling middleware
app.use(errorHandler);

// Socket.io event handling
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Server] running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
