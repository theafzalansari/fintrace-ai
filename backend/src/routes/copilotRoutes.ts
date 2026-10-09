import { Router } from 'express';
import { copilotChatHandler } from '../controllers/copilotController.js';

const router = Router();

router.post('/copilot/chat', copilotChatHandler);

export default router;
