import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import ingestionRoutes from './ingestionRoutes.js';
import recordRoutes from './recordRoutes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/', ingestionRoutes);
router.use('/', recordRoutes);

export default router;
