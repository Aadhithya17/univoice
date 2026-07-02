"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = void 0;
const mongoose_1 = require("mongoose");
const reportSchema = new mongoose_1.Schema({
    reportedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    contentType: {
        type: String,
        enum: ['post', 'comment'],
        required: true,
    },
    post: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Post',
        default: null,
    },
    comment: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
reportSchema.index({ status: 1, createdAt: -1 });
exports.Report = (0, mongoose_1.model)('Report', reportSchema);
