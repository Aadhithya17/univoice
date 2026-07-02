"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    role: {
        type: String,
        enum: ['student', 'moderator', 'admin'],
        default: 'student',
    },
    isBanned: {
        type: Boolean,
        default: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationCode: {
        type: String,
        default: null,
    },
    avatar: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});
// Encrypt password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (err) {
        next(err);
    }
});
// Helper method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
    return bcryptjs_1.default.compare(enteredPassword, this.password);
};
exports.User = (0, mongoose_1.model)('User', userSchema);
