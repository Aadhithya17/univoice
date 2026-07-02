import { Router } from 'express';
import { getPosts, getPostById, createPost, votePost, reactPost, deletePost } from '../controllers/postController';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', protect, upload.single('image'), createPost);
router.put('/:id/vote', protect, votePost);
router.put('/:id/react', protect, reactPost);
router.delete('/:id', protect, deletePost);

export default router;
