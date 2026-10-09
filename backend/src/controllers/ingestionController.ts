import { Request, Response } from 'express';
import { ingestionService } from '../services/ingestion/ingestionService.js';
import { logger } from '../utils/logger.js';

export async function ingestBeneficiariesHandler(req: Request, res: Response): Promise<void> {
  try {
    const rawRecords = Array.isArray(req.body) ? req.body : [req.body];
    const result = await ingestionService.ingestBeneficiaries(rawRecords);
    
    res.status(200).json({
      success: true,
      message: `Processed ${result.summary.totalRows} beneficiary records. Accepted: ${result.summary.acceptedCount}, Rejected: ${result.summary.rejectedCount}`,
      ...result
    });
  } catch (error) {
    logger.error('Error in ingestBeneficiariesHandler:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to process beneficiary ingestion request',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

export async function ingestDisbursementsHandler(req: Request, res: Response): Promise<void> {
  try {
    const rawRecords = Array.isArray(req.body) ? req.body : [req.body];
    const result = await ingestionService.ingestDisbursements(rawRecords);

    res.status(200).json({
      success: true,
      message: `Processed ${result.summary.totalRows} disbursement records. Accepted: ${result.summary.acceptedCount}, Rejected: ${result.summary.rejectedCount}`,
      ...result
    });
  } catch (error) {
    logger.error('Error in ingestDisbursementsHandler:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to process disbursement ingestion request',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

export async function ingestBeneficiariesCsvHandler(req: Request, res: Response): Promise<void> {
  try {
    let csvContent: string | Buffer = '';

    if (req.file) {
      csvContent = req.file.buffer;
    } else if (typeof req.body === 'string' && req.body.trim() !== '') {
      csvContent = req.body;
    } else if (req.body && typeof req.body.csv === 'string') {
      csvContent = req.body.csv;
    } else {
      res.status(400).json({
        success: false,
        error: {
          message: 'No CSV content provided. Upload a file field named "file" or send CSV raw text in body.'
        }
      });
      return;
    }

    const result = await ingestionService.ingestBeneficiariesCsv(csvContent);

    res.status(200).json({
      success: true,
      message: `CSV Ingestion Completed. Accepted: ${result.summary.acceptedCount}, Rejected: ${result.summary.rejectedCount}`,
      ...result
    });
  } catch (error) {
    logger.error('Error in ingestBeneficiariesCsvHandler:', error);
    const isClientError = error instanceof Error && (error.message.includes('missing required') || error.message.includes('Invalid CSV syntax'));
    res.status(isClientError ? 400 : 500).json({
      success: false,
      error: {
        message: 'Failed to parse and ingest beneficiary CSV file',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

export async function ingestDisbursementsCsvHandler(req: Request, res: Response): Promise<void> {
  try {
    let csvContent: string | Buffer = '';

    if (req.file) {
      csvContent = req.file.buffer;
    } else if (typeof req.body === 'string' && req.body.trim() !== '') {
      csvContent = req.body;
    } else if (req.body && typeof req.body.csv === 'string') {
      csvContent = req.body.csv;
    } else {
      res.status(400).json({
        success: false,
        error: {
          message: 'No CSV content provided. Upload a file field named "file" or send CSV raw text in body.'
        }
      });
      return;
    }

    const result = await ingestionService.ingestDisbursementsCsv(csvContent);

    res.status(200).json({
      success: true,
      message: `CSV Ingestion Completed. Accepted: ${result.summary.acceptedCount}, Rejected: ${result.summary.rejectedCount}`,
      ...result
    });
  } catch (error) {
    logger.error('Error in ingestDisbursementsCsvHandler:', error);
    const isClientError = error instanceof Error && (error.message.includes('missing required') || error.message.includes('Invalid CSV syntax'));
    res.status(isClientError ? 400 : 500).json({
      success: false,
      error: {
        message: 'Failed to parse and ingest disbursement CSV file',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

export async function unifiedCsvIngestionHandler(req: Request, res: Response): Promise<void> {
  try {
    const type = (req.query.type || req.body?.type || 'beneficiary').toString().toLowerCase();
    
    if (type === 'beneficiary' || type === 'beneficiaries') {
      return ingestBeneficiariesCsvHandler(req, res);
    } else if (type === 'disbursement' || type === 'disbursements') {
      return ingestDisbursementsCsvHandler(req, res);
    } else {
      res.status(400).json({
        success: false,
        error: {
          message: `Invalid record type "${type}". Must be "beneficiary" or "disbursement".`
        }
      });
      return;
    }
  } catch (error) {
    logger.error('Error in unifiedCsvIngestionHandler:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to process CSV ingestion request',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}
