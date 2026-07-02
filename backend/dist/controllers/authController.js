"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileByUsername = exports.getMe = exports.logout = exports.login = exports.verifyEmail = exports.signup = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const validators_1 = require("../utils/validators");
const JWT_SECRET = process.env.JWT_SECRET || 'univoice_super_secret_key_13579';
const NODE_ENV = process.env.NODE_ENV || 'development';
const generateToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, JWT_SECRET, {
        expiresIn: '30d',
    });
};
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id, user.role);
    const cookieOptions = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'lax',
    };
    res.cookie('token', token, cookieOptions);
    // Sanitized user object
    const userResponse = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
    };
    res.status(statusCode).json({
        success: true,
        token, // Send token in body as fallback/alternative
        user: userResponse,
    });
};
// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res, next) => {
    try {
        const validatedData = validators_1.signupSchema.parse(req.body);
        const { username, email, password } = validatedData;
        // Check if user already exists
        const userExists = await User_1.User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            res.status(400);
            throw new Error(userExists.email === email ? 'Email already registered' : 'Username is already taken');
        }
        // Determine role: First user is Admin so dashboard is testable out of the box
        const totalUsers = await User_1.User.countDocuments({});
        const role = totalUsers === 0 ? 'admin' : 'student';
        // Avatars: generate a dynamic default based on username
        const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
        const user = await User_1.User.create({
            username,
            email,
            password,
            role,
            verificationCode: null,
            avatar,
            isVerified: true, // Auto-verified
        });
        console.log(`[Auth] User ${user.username} registered successfully.`);
        sendTokenResponse(user, 201, res);
    }
    catch (error) {
        next(error);
    }
};
exports.signup = signup;
// @desc    Verify email with 6-digit code
// @route   POST /api/auth/verify
// @access  Public
const verifyEmail = async (req, res, next) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            res.status(400);
            throw new Error('Email and verification code are required');
        }
        const user = await User_1.User.findOne({ email }).select('+password');
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
        if (user.isVerified) {
            return sendTokenResponse(user, 200, res);
        }
        if (user.verificationCode !== code) {
            res.status(400);
            throw new Error('Invalid verification code');
        }
        user.isVerified = true;
        user.verificationCode = null;
        await user.save();
        console.log(`[Auth] User ${user.username} verified successfully.`);
        sendTokenResponse(user, 200, res);
    }
    catch (error) {
        next(error);
    }
};
exports.verifyEmail = verifyEmail;
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const validatedData = validators_1.loginSchema.parse(req.body);
        const { email, password } = validatedData;
        const user = await User_1.User.findOne({ email }).select('+password');
        if (!user) {
            res.status(401);
            throw new Error('Invalid email or password');
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401);
            throw new Error('Invalid email or password');
        }
        if (user.isBanned) {
            res.status(403);
            throw new Error('Your account has been banned by an administrator');
        }
        sendTokenResponse(user, 200, res);
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
};
exports.logout = logout;
// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401);
            throw new Error('Not authorized');
        }
        const user = await User_1.User.findById(req.user.id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
// @desc    Get user profile by username
// @route   GET /api/auth/profile/:username
// @access  Public
const getProfileByUsername = async (req, res, next) => {
    try {
        const user = await User_1.User.findOne({ username: { $regex: new RegExp(`^${req.params.username}$`, 'i') } });
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                avatar: user.avatar,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProfileByUsername = getProfileByUsername;
