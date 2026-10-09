import { Request, Response } from 'express';
import { graphService } from '../services/graph-analysis/graphService.js';
import { riskService } from '../services/risk-scoring/riskService.js';
import { logger } from '../utils/logger.js';

export async function getGraphAnalysisHandler(_req: Request, res: Response): Promise<void> {
  try {
    const data = await graphService.buildGraph();
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error generating graph analysis:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate financial web graph analysis',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

export async function getRiskScoringHandler(_req: Request, res: Response): Promise<void> {
  try {
    const data = await riskService.calculateRisks();
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error performing risk scoring analysis:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to perform risk scoring analysis',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}
