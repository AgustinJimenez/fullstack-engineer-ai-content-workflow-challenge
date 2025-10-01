import { Router } from 'express';
import { langchainController } from '../controllers/langchainController';

const router = Router();

// LangChain workflow routes
router.post('/smart-workflow', langchainController.executeSmartWorkflow.bind(langchainController));
router.post('/enhancement-chain', langchainController.executeEnhancementChain.bind(langchainController));
router.post('/multi-language', langchainController.executeMultiLanguageChain.bind(langchainController));
router.post('/content/:contentId/workflow', langchainController.executeWorkflowForContent.bind(langchainController));

export default router;