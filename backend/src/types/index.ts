import { Document, Types } from 'mongoose';
import { Request } from 'express';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'student' | 'moderator' | 'admin';
  isBanned: boolean;
  isVerified: boolean;
  verificationCode: string | null;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

export interface IPost extends Document {
  title?: string;
  body: string;
  image?: string;
  author: Types.ObjectId | IUser;
  isAnonymous: boolean;
  tags: string[];
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  score: number;
  reactions: {
    like: number;
    laugh: number;
    sad: number;
    angry: number;
  };
  reactionUsers: Map<string, string>; // UserId string -> emoji string ('like' | 'laugh' | 'sad' | 'angry')
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment extends Document {
  post: Types.ObjectId | IPost;
  parentComment?: Types.ObjectId | IComment | null;
  body: string;
  author: Types.ObjectId | IUser;
  isAnonymous: boolean;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReport extends Document {
  reportedBy: Types.ObjectId | IUser;
  contentType: 'post' | 'comment';
  post?: Types.ObjectId | IPost | null;
  comment?: Types.ObjectId | IComment | null;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

// Request extension to include User
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'student' | 'moderator' | 'admin';
    isBanned: boolean;
    email: string;
  };
}
