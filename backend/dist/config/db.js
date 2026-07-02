"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/univoice';
        const conn = await mongoose_1.default.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        // Seed specific Admin user if not exists
        const adminEmail = 'admin@univoice.edu';
        const adminExists = await User_1.User.findOne({ email: adminEmail });
        if (!adminExists) {
            await User_1.User.create({
                username: 'admin',
                email: adminEmail,
                password: 'adminpassword123', // Will be hashed by mongoose pre-save hook
                role: 'admin',
                isVerified: true,
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
            });
            console.log(`[Database Seed] Admin account created: ${adminEmail} / adminpassword123`);
        }
    }
    catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
