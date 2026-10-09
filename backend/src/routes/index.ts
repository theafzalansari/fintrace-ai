import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import ingestionRoutes from './ingestionRoutes.js';
import recordRoutes from './recordRoutes.js';
import analysisRoutes from './analysisRoutes.js';
import copilotRoutes from './copilotRoutes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/', ingestionRoutes);
router.use('/', recordRoutes);
router.use('/', analysisRoutes);
router.use('/', copilotRoutes);

export default router;
