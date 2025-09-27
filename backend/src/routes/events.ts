import { Router } from 'express';
import { redisEventBus as eventBus } from '../events/redisEventBus';

const router = Router();

router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (type: string, data: any) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Initial event to confirm connection
  send('connected', { time: Date.now() });

  const onContentUpdated = (payload: any) => send('contentUpdated', payload);
  const onAIGenerationCreated = (payload: any) => send('aiGenerationCreated', payload);
  const onTranslationCreated = (payload: any) => send('translationCreated', payload);
  const onReviewCreated = (payload: any) => send('reviewCreated', payload);
  const onCampaignUpdated = (payload: any) => send('campaignUpdated', payload);

  eventBus.on('contentUpdated', onContentUpdated);
  eventBus.on('aiGenerationCreated', onAIGenerationCreated);
  eventBus.on('translationCreated', onTranslationCreated);
  eventBus.on('reviewCreated', onReviewCreated);
  eventBus.on('campaignUpdated', onCampaignUpdated);

  // Keep-alive ping
  const interval = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(interval);
    eventBus.off('contentUpdated', onContentUpdated);
    eventBus.off('aiGenerationCreated', onAIGenerationCreated);
    eventBus.off('translationCreated', onTranslationCreated);
    eventBus.off('reviewCreated', onReviewCreated);
    eventBus.off('campaignUpdated', onCampaignUpdated);
    res.end();
  });
});

export default router;

