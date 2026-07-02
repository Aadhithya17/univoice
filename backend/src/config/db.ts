import mongoose from 'mongoose';
import { User } from '../models/User';
import dns from 'dns';

// Force Google DNS to avoid ENOTFOUND drops on Windows (Node.js v24 compatibility)
dns.setServers(['8.8.8.8', '1.1.1.1']);

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/univoice';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      tls: true,
      tlsAllowInvalidCertificates: true, // Fix for Node.js v24 + OpenSSL TLS alert 80
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed specific Admin user if not exists
    const adminEmail = 'admin@univoice.edu';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: adminEmail,
        password: 'adminpassword123', // Will be hashed by mongoose pre-save hook
        role: 'admin',
        isVerified: true,
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
      });
      console.log(`[Database Seed] Admin account created: ${adminEmail} / adminpassword123`);
    }
  } catch (error: any) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
