import { Request, Response } from 'express';
import { graphService } from '../services/graph-analysis/graphService.js';
import { riskService, HumanReviewStatus } from '../services/risk-scoring/riskService.js';
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

export async function updateRiskStatusHandler(req: Request, res: Response): Promise<void> {
  try {
    const { entityId, status } = req.body || {};
    if (!entityId || !status) {
      res.status(400).json({
        success: false,
        error: { message: 'Missing required parameters "entityId" and "status"' }
      });
      return;
    }

    const validStatuses: HumanReviewStatus[] = [
      'PENDING_REVIEW',
      'IN_REVIEW',
      'VERIFIED_CLEAN',
      'CONFIRMED_RISK'
    ];

    if (!validStatuses.includes(status as HumanReviewStatus)) {
      res.status(400).json({
        success: false,
        error: { message: `Invalid status "${status}". Must be one of ${validStatuses.join(', ')}` }
      });
      return;
    }

    riskService.updateHumanReviewStatus(entityId, status as HumanReviewStatus);

    res.status(200).json({
      success: true,
      message: `Human review status for entity ${entityId} updated to ${status}`
    });
  } catch (error) {
    logger.error('Error updating risk review status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update risk review status',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}
