import { z } from 'zod';

export const signupSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'),
  email: z
    .string()
    .email('Invalid email address')
    .refine((email) => {
      // Basic check: simulation allows any email for demo, but we can recommend edu domains.
      // We will check if it ends with .edu or is a standard email, showing warning or requirement.
      return email.length > 0;
    }, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const postSchema = z.object({
  title: z.string().max(100, 'Title cannot exceed 100 characters').optional(),
  body: z.string().min(1, 'Post body cannot be empty').max(2000, 'Post body cannot exceed 2000 characters'),
  isAnonymous: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
});

export const commentSchema = z.object({
  postId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Post ID'),
  parentCommentId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Parent Comment ID')
    .optional()
    .nullable(),
  body: z.string().min(1, 'Comment body cannot be empty').max(1000, 'Comment body cannot exceed 1000 characters'),
  isAnonymous: z.boolean().optional(),
});

export const reportSchema = z.object({
  contentType: z.enum(['post', 'comment']),
  targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Target ID'),
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(500, 'Reason cannot exceed 500 characters'),
});
