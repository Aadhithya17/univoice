import { Router } from 'express';
import { getCommentsByPost, createComment, voteComment, deleteComment } from '../controllers/commentController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/post/:postId', getCommentsByPost);
router.post('/', protect, createComment);
router.put('/:id/vote', protect, voteComment);
router.delete('/:id', protect, deleteComment);

export default router;
