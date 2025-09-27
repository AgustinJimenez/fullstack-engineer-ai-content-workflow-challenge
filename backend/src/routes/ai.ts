import { Router } from 'express';
import { AIController } from '../controllers/aiController';
import { AIComparisonController } from '../controllers/aiComparisonController';

const router = Router();
const aiController = new AIController();
const aiComparisonController = new AIComparisonController();

router.post('/generate/:contentId', aiController.generateContent);
router.post('/translate/:contentId', aiController.translateContent);
router.post('/analyze/:contentId', aiController.analyzeContent);
router.get('/generations/:contentId', aiController.getGenerations);

// AI Model Comparison
router.post('/compare/:contentId', aiComparisonController.compareModels.bind(aiComparisonController));

export default router;