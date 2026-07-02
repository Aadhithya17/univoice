"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderatorOrAdmin = exports.adminOnly = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const JWT_SECRET = process.env.JWT_SECRET || 'univoice_super_secret_key_13579';
// Parse cookie value manually
const getCookieValue = (cookieHeader, name) => {
    if (!cookieHeader)
        return null;
    const match = cookieHeader.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
};
const protect = async (req, res, next) => {
    let token = getCookieValue(req.headers.cookie, 'token');
    // Also support Authorization header for flexibility
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, login required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Fetch user from DB to verify they still exist and aren't banned
        const user = await User_1.User.findById(decoded.id).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }
        if (user.isBanned) {
            return res.status(403).json({ message: 'Your account has been banned by an administrator' });
        }
        req.user = {
            id: user.id,
            role: user.role,
            isBanned: user.isBanned,
            email: user.email,
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};
exports.protect = protect;
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin' && req.user.email === 'admin@univoice.edu') {
        next();
    }
    else {
        res.status(403).json({ message: 'Access denied, administrator role required' });
    }
};
exports.adminOnly = adminOnly;
const moderatorOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'moderator' || req.user.role === 'admin') && req.user.email === 'admin@univoice.edu') {
        next();
    }
    else {
        res.status(403).json({ message: 'Access denied, moderator or administrator role required' });
    }
};
exports.moderatorOrAdmin = moderatorOrAdmin;
