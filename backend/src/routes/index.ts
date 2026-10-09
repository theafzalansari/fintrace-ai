import { Router } from 'express';
import healthRoutes from './healthRoutes.js';

const router = Router();

router.use('/', healthRoutes);

export default router;
