import { Router } from 'express';
import { reportContent, getStats, getReports, actionReport, toggleUserBan, getAllUsers } from '../controllers/adminController';
import { protect, adminOnly, moderatorOrAdmin } from '../middleware/authMiddleware';

const router = Router();

// Publicly report content (requires student status or higher)
router.post('/reports', protect, reportContent);

// Moderation statistics & queue (Moderator or Admin)
router.get('/stats', protect, moderatorOrAdmin, getStats);
router.get('/reports', protect, moderatorOrAdmin, getReports);
router.put('/reports/:id', protect, moderatorOrAdmin, actionReport);

// User management (Admin Only)
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/users/:id/ban', protect, adminOnly, toggleUserBan);

export default router;
