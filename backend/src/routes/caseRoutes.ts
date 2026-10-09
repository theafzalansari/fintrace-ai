import { Router } from 'express';
import {
  getCasesHandler,
  getCaseByIdHandler,
  createCaseHandler,
  updateCaseHandler,
  addCaseNoteHandler,
  getCaseEvidenceHandler
} from '../controllers/caseController.js';

const router = Router();

router.get('/cases', getCasesHandler);
router.get('/cases/:id', getCaseByIdHandler);
router.post('/cases', createCaseHandler);
router.patch('/cases/:id', updateCaseHandler);
router.post('/cases/:id/notes', addCaseNoteHandler);
router.get('/cases/:id/evidence', getCaseEvidenceHandler);

export default router;
