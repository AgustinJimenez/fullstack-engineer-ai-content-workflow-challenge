import { Router } from 'express';
import { ContentController } from '../controllers/contentController';

const router = Router();
const contentController = new ContentController();

router.post('/', contentController.createContent);

// Review workflow - put specific routes first to avoid conflicts
router.get('/for-review', contentController.getContentForReview);
router.post('/reviews', contentController.createReview);
router.get('/:id/status-rollup', contentController.getStatusRollup);
router.post('/:id/submit-for-review', contentController.submitForReview);
router.get('/:contentId/reviews', contentController.getReviews);

// General content routes
router.get('/:id', contentController.getContent);
router.put('/:id', contentController.updateContent);
router.delete('/:id', contentController.deleteContent);

export default router;
