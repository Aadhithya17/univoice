import { Response, NextFunction } from 'express';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { postSchema } from '../utils/validators';
import { AuthRequest } from '../types';

// Helper to get socket instance
const getIo = (req: AuthRequest) => {
  return req.app.get('io');
};

// @desc    Get all posts (with query search, tag filters, pagination)
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { search, sort, author } = req.query;

    const query: any = {};

    // Filter by author username (preserving anonymity)
    if (author) {
      const userObj = await User.findOne({ username: { $regex: new RegExp(`^${author as string}$`, 'i') } });
      if (userObj) {
        query.author = userObj._id;
        query.isAnonymous = false; // strictly hide anonymous posts
      } else {
        query.author = '000000000000000000000000'; // force empty result if user doesn't exist
      }
    }

    // Keyword Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
      ];
    }

    // Sorting definition
    let sortOptions: any = { createdAt: -1 }; // Default new
    if (sort === 'hot') {
      sortOptions = { score: -1, createdAt: -1 };
    } else if (sort === 'top') {
      sortOptions = { score: -1 };
    }

    const posts = await Post.find(query)
      .populate('author', 'username avatar role')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    // Sanitize author names if anonymous
    const sanitizedPosts = posts.map((post) => {
      const p = post.toObject();
      if (p.isAnonymous) {
        p.author = { _id: 'anonymous', username: 'Anonymous Student', avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${post._id}` } as any;
      }
      return p;
    });

    res.status(200).json({
      success: true,
      count: sanitizedPosts.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      posts: sanitizedPosts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username avatar role');
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const sanitizedPost = post.toObject();
    if (sanitizedPost.isAnonymous) {
      sanitizedPost.author = { _id: 'anonymous', username: 'Anonymous Student', avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${post._id}` } as any;
    }

    res.status(200).json({
      success: true,
      post: sanitizedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const validatedData = postSchema.parse(req.body);
    const { title, body, isAnonymous } = validatedData;

    let imageUrl = '';
    if (req.file) {
      // Local serving URL format: /uploads/filename
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const post = await Post.create({
      title,
      body,
      image: imageUrl,
      author: req.user.id,
      isAnonymous: isAnonymous || false,
    });

    const populatedPost = await post.populate('author', 'username avatar role');
    const sanitizedPost = populatedPost.toObject();
    if (sanitizedPost.isAnonymous) {
      sanitizedPost.author = { _id: 'anonymous', username: 'Anonymous Student', avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${post._id}` } as any;
    }

    // Socket.io emission
    const io = getIo(req);
    if (io) {
      io.emit('post:new', sanitizedPost);
    }

    res.status(201).json({
      success: true,
      post: sanitizedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle vote (upvote / downvote)
// @route   PUT /api/posts/:id/vote
// @access  Private
export const votePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const hasUpvoted = post.upvotes.map(id => id.toString()).includes(userId);
    const hasDownvoted = post.downvotes.map(id => id.toString()).includes(userId);

    if (voteType === 'upvote') {
      if (hasUpvoted) {
        // Remove upvote
        post.upvotes = post.upvotes.filter((id) => id.toString() !== userId);
      } else {
        // Add upvote, remove downvote if exists
        post.upvotes.push(userId as any);
        post.downvotes = post.downvotes.filter((id) => id.toString() !== userId);
      }
    } else {
      if (hasDownvoted) {
        // Remove downvote
        post.downvotes = post.downvotes.filter((id) => id.toString() !== userId);
      } else {
        // Add downvote, remove upvote if exists
        post.downvotes.push(userId as any);
        post.upvotes = post.upvotes.filter((id) => id.toString() !== userId);
      }
    }

    // Recalculate score
    post.score = post.upvotes.length - post.downvotes.length;
    await post.save();

    // Socket emission
    const io = getIo(req);
    if (io) {
      io.emit('post:vote', {
        postId: post._id,
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        score: post.score,
      });
    }

    res.status(200).json({
      success: true,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      score: post.score,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle / add emoji reaction
// @route   PUT /api/posts/:id/react
// @access  Private
export const reactPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reactionType } = req.body; // 'like' | 'laugh' | 'sad' | 'angry'
    const validReactions = ['like', 'laugh', 'sad', 'angry'];
    if (!reactionType || !validReactions.includes(reactionType)) {
      res.status(400);
      throw new Error('Invalid reaction type');
    }

    if (!req.user) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const userId = req.user.id;
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    if (!post.reactionUsers) {
      post.reactionUsers = new Map<string, string>();
    }

    const existingReaction = post.reactionUsers.get(userId);

    // If matching existing reaction, remove it (toggle off)
    if (existingReaction === reactionType) {
      post.reactionUsers.delete(userId);
      post.reactions[reactionType as 'like' | 'laugh' | 'sad' | 'angry'] = Math.max(
        0,
        post.reactions[reactionType as 'like' | 'laugh' | 'sad' | 'angry'] - 1
      );
    } else {
      // If user had a different reaction, decrement the old one
      if (existingReaction) {
        post.reactions[existingReaction as 'like' | 'laugh' | 'sad' | 'angry'] = Math.max(
          0,
          post.reactions[existingReaction as 'like' | 'laugh' | 'sad' | 'angry'] - 1
        );
      }
      // Add the new reaction
      post.reactionUsers.set(userId, reactionType);
      post.reactions[reactionType as 'like' | 'laugh' | 'sad' | 'angry'] += 1;
    }

    await post.save();

    // Socket emission
    const io = getIo(req);
    if (io) {
      io.emit('post:react', {
        postId: post._id,
        reactions: post.reactions,
        reactionUsers: Array.from(post.reactionUsers.entries()),
      });
    }

    res.status(200).json({
      success: true,
      reactions: post.reactions,
      reactionUsers: Array.from(post.reactionUsers.entries()),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post (author or moderator/admin)
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    // Check ownership or admin/mod roles
    const isOwner = post.author.toString() === req.user.id;
    const isModOrAdmin = req.user.role === 'admin' || req.user.role === 'moderator';

    if (!isOwner && !isModOrAdmin) {
      res.status(403);
      throw new Error('Access denied. You cannot delete this post.');
    }

    await post.deleteOne();

    // Socket emission
    const io = getIo(req);
    if (io) {
      io.emit('post:delete', post._id);
    }

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
