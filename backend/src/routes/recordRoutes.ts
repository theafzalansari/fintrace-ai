import { Router } from 'express';
import { getBeneficiariesHandler, getDisbursementsHandler } from '../controllers/recordController.js';

const router = Router();

router.get('/beneficiaries', getBeneficiariesHandler);
router.get('/disbursements', getDisbursementsHandler);

export default router;
