import { Request, Response } from 'express';
import { ingestionService } from '../services/ingestion/ingestionService.js';
import { logger } from '../utils/logger.js';

export async function getBeneficiariesHandler(_req: Request, res: Response): Promise<void> {
  try {
    const data = await ingestionService.getBeneficiaries();
    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    logger.error('Error fetching beneficiaries:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch beneficiaries',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

export async function getDisbursementsHandler(_req: Request, res: Response): Promise<void> {
  try {
    const data = await ingestionService.getDisbursements();
    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    logger.error('Error fetching disbursements:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch disbursements',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}
