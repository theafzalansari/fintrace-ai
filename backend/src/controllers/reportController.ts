import { Request, Response } from 'express';
import { pdfDossierService } from '../services/pdf/pdfDossierService.js';
import { logger } from '../utils/logger.js';

export async function getCasePdfDossierHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="fintrace-case-dossier-${id}.pdf"`);

    await pdfDossierService.generateCaseDossierStream(id, res);
  } catch (error) {
    logger.error('Error streaming PDF case dossier:', error);

    if (!res.headersSent) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Failed to generate PDF evidence dossier',
          details: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }
}
