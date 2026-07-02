"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Publicly report content (requires student status or higher)
router.post('/reports', authMiddleware_1.protect, adminController_1.reportContent);
// Moderation statistics & queue (Moderator or Admin)
router.get('/stats', authMiddleware_1.protect, authMiddleware_1.moderatorOrAdmin, adminController_1.getStats);
router.get('/reports', authMiddleware_1.protect, authMiddleware_1.moderatorOrAdmin, adminController_1.getReports);
router.put('/reports/:id', authMiddleware_1.protect, authMiddleware_1.moderatorOrAdmin, adminController_1.actionReport);
// User management (Admin Only)
router.get('/users', authMiddleware_1.protect, authMiddleware_1.adminOnly, adminController_1.getAllUsers);
router.put('/users/:id/ban', authMiddleware_1.protect, authMiddleware_1.adminOnly, adminController_1.toggleUserBan);
exports.default = router;
