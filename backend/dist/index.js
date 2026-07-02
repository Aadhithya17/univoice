"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const dns_1 = __importDefault(require("dns"));
// Configure DNS servers for reliable SRV lookup on Windows
dns_1.default.setServers(['8.8.8.8', '1.1.1.1']);
// Load environment variables and reload
dotenv_1.default.config();
const db_1 = require("./config/db");
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const postRoutes_1 = __importDefault(require("./routes/postRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
// Connect to Database
(0, db_1.connectDB)();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Initialize Socket.io
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    },
});
// Expose Socket.io instance on express app object
app.set('io', io);
// Security Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows client to fetch uploaded static files
}));
// CORS configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use((0, cors_1.default)({
    origin: allowedOrigin,
    credentials: true,
}));
// Rate Limiting (Basics)
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per 15 minutes
    message: { message: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// Request Parsing
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Setup image upload directories
const uploadsPath = path_1.default.join(__dirname, '../public/uploads');
if (!fs_1.default.existsSync(uploadsPath)) {
    fs_1.default.mkdirSync(uploadsPath, { recursive: true });
}
// Serve static uploads
app.use('/uploads', express_1.default.static(uploadsPath));
// API Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/posts', postRoutes_1.default);
app.use('/api/comments', commentRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
// Root route placeholder
app.get('/', (req, res) => {
    res.send('UniVoice API is running...');
});
// Error handling middleware
app.use(errorMiddleware_1.errorHandler);
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
