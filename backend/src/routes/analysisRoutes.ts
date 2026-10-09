import { Router } from 'express';
import { getGraphAnalysisHandler, getRiskScoringHandler } from '../controllers/analysisController.js';

const router = Router();

router.get('/analysis/graph', getGraphAnalysisHandler);
router.get('/analysis/risks', getRiskScoringHandler);

export default router;
