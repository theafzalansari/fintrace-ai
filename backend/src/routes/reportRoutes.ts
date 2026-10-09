import { Router } from 'express';
import { getCasePdfDossierHandler } from '../controllers/reportController.js';

const router = Router();

router.get('/reports/cases/:id/pdf', getCasePdfDossierHandler);

export default router;
