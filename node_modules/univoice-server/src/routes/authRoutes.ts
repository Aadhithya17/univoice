import { Router } from 'express';
import { signup, verifyEmail, login, logout, getMe, getProfileByUsername } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/signup', signup);
router.post('/verify', verifyEmail);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/profile/:username', getProfileByUsername);

export default router;
