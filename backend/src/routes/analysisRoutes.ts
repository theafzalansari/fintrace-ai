import { Router } from 'express';
import {
  getGraphAnalysisHandler,
  getRiskScoringHandler,
  updateRiskStatusHandler
} from '../controllers/analysisController.js';

const router = Router();

router.get('/analysis/graph', getGraphAnalysisHandler);
router.get('/analysis/risks', getRiskScoringHandler);
router.post('/analysis/risks/status', updateRiskStatusHandler);

export default router;
