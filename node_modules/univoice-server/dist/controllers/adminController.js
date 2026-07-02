"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.toggleUserBan = exports.actionReport = exports.getReports = exports.getStats = exports.reportContent = void 0;
const User_1 = require("../models/User");
const Post_1 = require("../models/Post");
const Comment_1 = require("../models/Comment");
const Report_1 = require("../models/Report");
const validators_1 = require("../utils/validators");
// @desc    Report a post or comment
// @route   POST /api/reports
// @access  Private
const reportContent = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401);
            throw new Error('Unauthorized');
        }
        const validatedData = validators_1.reportSchema.parse(req.body);
        const { contentType, targetId, reason } = validatedData;
        let post = null;
        let comment = null;
        if (contentType === 'post') {
            post = await Post_1.Post.findById(targetId);
            if (!post) {
                res.status(404);
                throw new Error('Post not found');
            }
        }
        else {
            comment = await Comment_1.Comment.findById(targetId);
            if (!comment) {
                res.status(404);
                throw new Error('Comment not found');
            }
        }
        const report = await Report_1.Report.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.reportContent = reportContent;
// @desc    Get dashboard metrics & analytics
// @route   GET /api/admin/stats
// @access  Private (Admin/Moderator Only)
const getStats = async (req, res, next) => {
    try {
        const totalUsers = await User_1.User.countDocuments({});
        const totalPosts = await Post_1.Post.countDocuments({});
        const totalReports = await Report_1.Report.countDocuments({ status: 'pending' });
        // Analytics: post count grouped by date for the last 7 days
        const postsByDate = await Post_1.Post.aggregate([
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
    }
    catch (error) {
        next(error);
    }
};
exports.getStats = getStats;
// @desc    Get all reports (moderation queue)
// @route   GET /api/admin/reports
// @access  Private (Admin/Moderator Only)
const getReports = async (req, res, next) => {
    try {
        const reports = await Report_1.Report.find({})
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
    }
    catch (error) {
        next(error);
    }
};
exports.getReports = getReports;
// @desc    Take action on a report (resolve/dismiss)
// @route   PUT /api/admin/reports/:id
// @access  Private (Admin/Moderator Only)
const actionReport = async (req, res, next) => {
    try {
        const { action } = req.body; // 'resolve' (meaning remove content) or 'dismiss' (keep content)
        if (!action || (action !== 'resolve' && action !== 'dismiss')) {
            res.status(400);
            throw new Error('Invalid action. Must be "resolve" or "dismiss"');
        }
        const report = await Report_1.Report.findById(req.params.id);
        if (!report) {
            res.status(404);
            throw new Error('Report not found');
        }
        if (action === 'resolve') {
            // Delete the reported content
            if (report.contentType === 'post' && report.post) {
                await Post_1.Post.findByIdAndDelete(report.post);
                // Clean up reports for this post
                await Report_1.Report.updateMany({ post: report.post }, { status: 'resolved' });
            }
            else if (report.contentType === 'comment' && report.comment) {
                // Soft delete the comment content to preserve threading
                await Comment_1.Comment.findByIdAndUpdate(report.comment, {
                    body: '[Deleted by moderator]',
                    isAnonymous: true,
                });
                await Report_1.Report.updateMany({ comment: report.comment }, { status: 'resolved' });
            }
            report.status = 'resolved';
        }
        else {
            // Just dismiss the report
            report.status = 'dismissed';
        }
        await report.save();
        res.status(200).json({
            success: true,
            message: `Report has been successfully ${report.status}`,
            report,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.actionReport = actionReport;
// @desc    Ban / Unban a user
// @route   PUT /api/admin/users/:id/ban
// @access  Private (Admin Only)
const toggleUserBan = async (req, res, next) => {
    try {
        const userToBan = await User_1.User.findById(req.params.id);
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
    }
    catch (error) {
        next(error);
    }
};
exports.toggleUserBan = toggleUserBan;
// @desc    Get all users (for user administration)
// @route   GET /api/admin/users
// @access  Private (Admin Only)
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User_1.User.find({}).sort({ createdAt: -1 });
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
    }
    catch (error) {
        next(error);
    }
};
exports.getAllUsers = getAllUsers;
