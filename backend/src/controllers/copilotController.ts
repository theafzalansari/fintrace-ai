import { Request, Response } from 'express';
import { validateCopilotChatRequest } from '../validators/copilotValidator.js';
import { copilotService } from '../services/copilot/copilotService.js';
import { logger } from '../utils/logger.js';

export async function copilotChatHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateCopilotChatRequest(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid copilot chat request body',
          details: validation.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
        }
      });
      return;
    }

    const { message, history } = validation.data;
    const result = await copilotService.chat(message, history);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in copilotChatHandler:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to process audit copilot chat query',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}
