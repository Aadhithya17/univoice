import { Response, NextFunction } from 'express';
import { Comment } from '../models/Comment';
import { Post } from '../models/Post';
import { commentSchema } from '../utils/validators';
import { AuthRequest } from '../types';

// Helper to get socket instance
const getIo = (req: AuthRequest) => {
  return req.app.get('io');
};

// @desc    Get comments for a specific post
// @route   GET /api/comments/post/:postId
// @access  Public
export const getCommentsByPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'username avatar role')
      .sort({ createdAt: 1 }); // Sorted chronologically

    // Sanitize anonymous comments
    const sanitizedComments = comments.map((comment) => {
      const c = comment.toObject();
      if (c.isAnonymous) {
        c.author = { _id: 'anonymous', username: 'Anonymous Student', avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${comment._id}` } as any;
      }
      return c;
    });

    res.status(200).json({
      success: true,
      comments: sanitizedComments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a comment or a nested reply
// @route   POST /api/comments
// @access  Private
export const createComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const validatedData = commentSchema.parse(req.body);
    const { postId, parentCommentId, body, isAnonymous } = validatedData;

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    // If it has a parent comment, verify that parent comment exists
    if (parentCommentId) {
      const parent = await Comment.findById(parentCommentId);
      if (!parent) {
        res.status(404);
        throw new Error('Parent comment not found');
      }
    }

    const comment = await Comment.create({
      post: postId,
      parentComment: parentCommentId || null,
      body,
      author: req.user.id,
      isAnonymous: isAnonymous || false,
    });

    const populatedComment = await comment.populate('author', 'username avatar role');
    const sanitizedComment = populatedComment.toObject();
    if (sanitizedComment.isAnonymous) {
      sanitizedComment.author = { _id: 'anonymous', username: 'Anonymous Student', avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${comment._id}` } as any;
    }

    // Socket.io emission
    const io = getIo(req);
    if (io) {
      io.emit('comment:new', sanitizedComment);
    }

    res.status(201).json({
      success: true,
      comment: sanitizedComment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote on a comment (upvote / downvote)
// @route   PUT /api/comments/:id/vote
// @access  Private
export const voteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'
    if (!voteType || (voteType !== 'upvote' && voteType !== 'downvote')) {
      res.status(400);
      throw new Error('Invalid vote type');
    }

    if (!req.user) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const userId = req.user.id;
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }

    const hasUpvoted = comment.upvotes.map(id => id.toString()).includes(userId);
    const hasDownvoted = comment.downvotes.map(id => id.toString()).includes(userId);

    if (voteType === 'upvote') {
      if (hasUpvoted) {
        // Remove upvote
        comment.upvotes = comment.upvotes.filter((id) => id.toString() !== userId);
      } else {
        // Add upvote, remove downvote
        comment.upvotes.push(userId as any);
        comment.downvotes = comment.downvotes.filter((id) => id.toString() !== userId);
      }
    } else {
      if (hasDownvoted) {
        // Remove downvote
        comment.downvotes = comment.downvotes.filter((id) => id.toString() !== userId);
      } else {
        // Add downvote, remove upvote
        comment.downvotes.push(userId as any);
        comment.upvotes = comment.upvotes.filter((id) => id.toString() !== userId);
      }
    }

    // Recalculate score
    comment.score = comment.upvotes.length - comment.downvotes.length;
    await comment.save();

    // Socket emission
    const io = getIo(req);
    if (io) {
      io.emit('comment:vote', {
        commentId: comment._id,
        upvotes: comment.upvotes,
        downvotes: comment.downvotes,
        score: comment.score,
      });
    }

    res.status(200).json({
      success: true,
      upvotes: comment.upvotes,
      downvotes: comment.downvotes,
      score: comment.score,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }

    const isOwner = comment.author.toString() === req.user.id;
    const isModOrAdmin = req.user.role === 'admin' || req.user.role === 'moderator';

    if (!isOwner && !isModOrAdmin) {
      res.status(403);
      throw new Error('Access denied. You cannot delete this comment.');
    }

    // For database integrity, nested comments under this comment should remain but references should be preserved,
    // or we can remove the content and mark it as "[Deleted]". This is how Reddit does it and it prevents broken threads!
    // That is a highly professional detail. Let's do that!
    comment.body = '[Deleted]';
    comment.isAnonymous = true;
    // We can also clear the author reference or keep it. Let's save a placeholder or change the content.
    await comment.save();

    // Socket emission
    const io = getIo(req);
    if (io) {
      io.emit('comment:delete', {
        commentId: comment._id,
        postId: comment.post,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
