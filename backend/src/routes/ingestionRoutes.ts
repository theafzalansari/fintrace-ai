import { Router } from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import {
  ingestBeneficiariesHandler,
  ingestDisbursementsHandler,
  ingestBeneficiariesCsvHandler,
  ingestDisbursementsCsvHandler,
  unifiedCsvIngestionHandler
} from '../controllers/ingestionController.js';

const router = Router();

// JSON ingestion endpoints
router.post('/ingest/beneficiaries', ingestBeneficiariesHandler);
router.post('/ingest/disbursements', ingestDisbursementsHandler);

// CSV upload endpoints (support file field 'file' or raw CSV string)
router.post('/ingest/beneficiaries/csv', upload.single('file'), ingestBeneficiariesCsvHandler);
router.post('/ingest/disbursements/csv', upload.single('file'), ingestDisbursementsCsvHandler);
router.post('/ingest/csv', upload.single('file'), unifiedCsvIngestionHandler);

export default router;
