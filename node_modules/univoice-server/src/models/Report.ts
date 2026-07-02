import { Schema, model } from 'mongoose';
import { IReport } from '../types';

const reportSchema = new Schema<IReport>(
  {
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contentType: {
      type: String,
      enum: ['post', 'comment'],
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    reason: {
      type: String,
      required: [true, 'Reason for report is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ status: 1, createdAt: -1 });

export const Report = model<IReport>('Report', reportSchema);
