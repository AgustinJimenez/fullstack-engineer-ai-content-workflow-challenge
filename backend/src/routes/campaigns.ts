import { Router } from 'express';
import { CampaignController } from '../controllers/campaignController';
import { ContentController } from '../controllers/contentController';

const router = Router();
const campaignController = new CampaignController();
const contentController = new ContentController();

router.post('/', campaignController.createCampaign);
router.get('/stats', campaignController.getCampaignStats.bind(campaignController));
router.get('/', campaignController.getCampaigns);
router.get('/:id', campaignController.getCampaign);
router.put('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);

// Test cleanup route - only works in test environment
router.delete('/', campaignController.deleteAllCampaigns);

// Campaign content routes
router.post('/:id/content', contentController.createContentForCampaign);
router.get('/:id/content', contentController.getCampaignContent);

export default router;