"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    post: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    parentComment: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isAnonymous: {
        type: Boolean,
        default: false,
    },
    upvotes: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
        default: [],
    },
    downvotes: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
        default: [],
    },
    score: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
// Index comment lookup by post for retrieval optimization
commentSchema.index({ post: 1, parentComment: 1, createdAt: 1 });
exports.Comment = (0, mongoose_1.model)('Comment', commentSchema);
