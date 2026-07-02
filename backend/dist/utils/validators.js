"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportSchema = exports.commentSchema = exports.postSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'),
    email: zod_1.z
        .string()
        .email('Invalid email address')
        .refine((email) => {
        // Basic check: simulation allows any email for demo, but we can recommend edu domains.
        // We will check if it ends with .edu or is a standard email, showing warning or requirement.
        return email.length > 0;
    }, 'Email is required'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.postSchema = zod_1.z.object({
    title: zod_1.z.string().max(100, 'Title cannot exceed 100 characters').optional(),
    body: zod_1.z.string().min(1, 'Post body cannot be empty').max(2000, 'Post body cannot exceed 2000 characters'),
    isAnonymous: zod_1.z.preprocess((val) => val === 'true' || val === true, zod_1.z.boolean()).optional(),
});
exports.commentSchema = zod_1.z.object({
    postId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Post ID'),
    parentCommentId: zod_1.z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Parent Comment ID')
        .optional()
        .nullable(),
    body: zod_1.z.string().min(1, 'Comment body cannot be empty').max(1000, 'Comment body cannot exceed 1000 characters'),
    isAnonymous: zod_1.z.boolean().optional(),
});
exports.reportSchema = zod_1.z.object({
    contentType: zod_1.z.enum(['post', 'comment']),
    targetId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Target ID'),
    reason: zod_1.z.string().min(3, 'Reason must be at least 3 characters').max(500, 'Reason cannot exceed 500 characters'),
});
