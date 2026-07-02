import { Schema, model } from 'mongoose';
import { IComment } from '../types';

const commentSchema = new Schema<IComment>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    body: {
      type: String,
      required: [true, 'Comment body is required'],
      trim: true,
      maxlength: [1000, 'Comment body cannot exceed 1000 characters'],
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
  },
  {
    timestamps: true,
  }
);

// Index comment lookup by post for retrieval optimization
commentSchema.index({ post: 1, parentComment: 1, createdAt: 1 });

export const Comment = model<IComment>('Comment', commentSchema);
