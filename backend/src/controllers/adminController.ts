import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { Report } from '../models/Report';
import { reportSchema } from '../utils/validators';
import { AuthRequest } from '../types';

// @desc    Report a post or comment
// @route   POST /api/reports
// @access  Private
export const reportContent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const validatedData = reportSchema.parse(req.body);
    const { contentType, targetId, reason } = validatedData;

    let post = null;
    let comment = null;

    if (contentType === 'post') {
      post = await Post.findById(targetId);
      if (!post) {
        res.status(404);
        throw new Error('Post not found');
      }
    } else {
      comment = await Comment.findById(targetId);
      if (!comment) {
        res.status(404);
        throw new Error('Comment not found');
      }
    }

    const report = await Report.create({
      reportedBy: req.user.id,
      contentType,
      post: contentType === 'post' ? targetId : null,
      comment: contentType === 'comment' ? targetId : null,
      reason,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Community moderators will review it.',
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard metrics & analytics
// @route   GET /api/admin/stats
// @access  Private (Admin/Moderator Only)
export const getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalPosts = await Post.countDocuments({});
    const totalReports = await Report.countDocuments({ status: 'pending' });

    // Analytics: post count grouped by date for the last 7 days
    const postsByDate = await Post.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 7 },
    ]);

    // Format for charts
    const chartData = postsByDate.map((item) => ({
      date: item._id,
      posts: item.count,
    }));

    // If empty chartData, inject today's placeholder
    if (chartData.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      chartData.push({ date: today, posts: 0 });
    }

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalPosts,
        totalReports,
        chartData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports (moderation queue)
// @route   GET /api/admin/reports
// @access  Private (Admin/Moderator Only)
export const getReports = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reports = await Report.find({})
      .populate('reportedBy', 'username email')
      .populate({
        path: 'post',
        populate: { path: 'author', select: 'username' }
      })
      .populate({
        path: 'comment',
        populate: { path: 'author', select: 'username' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Take action on a report (resolve/dismiss)
// @route   PUT /api/admin/reports/:id
// @access  Private (Admin/Moderator Only)
export const actionReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { action } = req.body; // 'resolve' (meaning remove content) or 'dismiss' (keep content)
    if (!action || (action !== 'resolve' && action !== 'dismiss')) {
      res.status(400);
      throw new Error('Invalid action. Must be "resolve" or "dismiss"');
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      res.status(404);
      throw new Error('Report not found');
    }

    if (action === 'resolve') {
      // Delete the reported content
      if (report.contentType === 'post' && report.post) {
        await Post.findByIdAndDelete(report.post);
        // Clean up reports for this post
        await Report.updateMany({ post: report.post }, { status: 'resolved' });
      } else if (report.contentType === 'comment' && report.comment) {
        // Soft delete the comment content to preserve threading
        await Comment.findByIdAndUpdate(report.comment, {
          body: '[Deleted by moderator]',
          isAnonymous: true,
        });
        await Report.updateMany({ comment: report.comment }, { status: 'resolved' });
      }
      report.status = 'resolved';
    } else {
      // Just dismiss the report
      report.status = 'dismissed';
    }

    await report.save();

    res.status(200).json({
      success: true,
      message: `Report has been successfully ${report.status}`,
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ban / Unban a user
// @route   PUT /api/admin/users/:id/ban
// @access  Private (Admin Only)
export const toggleUserBan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userToBan = await User.findById(req.params.id);
    if (!userToBan) {
      res.status(404);
      throw new Error('User not found');
    }

    // Admins cannot ban themselves
    if (userToBan._id.toString() === req.user?.id) {
      res.status(400);
      throw new Error('You cannot ban your own account');
    }

    // Admins cannot ban other admins
    if (userToBan.role === 'admin') {
      res.status(400);
      throw new Error('You cannot ban an administrator');
    }

    // Toggle ban state
    userToBan.isBanned = !userToBan.isBanned;
    await userToBan.save();

    res.status(200).json({
      success: true,
      message: `User ${userToBan.username} has been successfully ${userToBan.isBanned ? 'banned' : 'unbanned'}`,
      user: {
        id: userToBan._id,
        username: userToBan.username,
        isBanned: userToBan.isBanned,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (for user administration)
// @route   GET /api/admin/users
// @access  Private (Admin Only)
export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      users: users.map((u) => ({
        id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        isBanned: u.isBanned,
        isVerified: u.isVerified,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};
