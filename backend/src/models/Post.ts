import { Schema, model } from 'mongoose';
import { IPost } from '../types';

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    body: {
      type: String,
      required: [true, 'Post body is required'],
      trim: true,
      maxlength: [2000, 'Post body cannot exceed 2000 characters'],
    },
    image: {
      type: String,
      default: '',
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    upvotes: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    downvotes: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
    reactions: {
      like: { type: Number, default: 0 },
      laugh: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
      angry: { type: Number, default: 0 },
    },
    reactionUsers: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index score and tags for fast retrieval/filtering
postSchema.index({ score: -1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ title: 'text', body: 'text' });

export const Post = model<IPost>('Post', postSchema);
