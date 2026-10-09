import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
import { Beneficiary } from '../../models/Beneficiary.js';
import { Disbursement } from '../../models/Disbursement.js';
import { validateBeneficiaryRecord, BeneficiaryInput } from '../../validators/beneficiaryValidator.js';
import { validateDisbursementRecord, DisbursementInput } from '../../validators/disbursementValidator.js';
import { logger } from '../../utils/logger.js';

export interface IngestionErrorDetail {
  field: string;
  message: string;
}

export interface IngestionRowError {
  row: number;
  raw: unknown;
  errors: IngestionErrorDetail[];
}

export interface IngestionResult<T> {
  summary: {
    totalRows: number;
    acceptedCount: number;
    rejectedCount: number;
    recordType: 'beneficiary' | 'disbursement';
  };
  accepted: T[];
  rejected: IngestionRowError[];
}

// In-memory fallback stores for offline/standalone execution without live MongoDB
const memoryBeneficiariesStore = new Map<string, BeneficiaryInput>();
const memoryDisbursementsStore = new Map<string, DisbursementInput>();

export class IngestionService {
  /**
   * Parse CSV raw text or buffer into javascript objects
   */
  public parseCsv(csvData: string | Buffer): Record<string, string>[] {
    const content = typeof csvData === 'string' ? csvData : csvData.toString('utf-8');
    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  }

  /**
   * Process and ingest beneficiary records (JSON array or objects) idempotently.
   */
  public async ingestBeneficiaries(records: unknown[]): Promise<IngestionResult<BeneficiaryInput>> {
    const acceptedMap = new Map<string, BeneficiaryInput>();
    const rejected: IngestionRowError[] = [];

    for (let index = 0; index < records.length; index++) {
      const raw = records[index];
      const result = validateBeneficiaryRecord(raw);

      if (!result.success) {
        const errors: IngestionErrorDetail[] = result.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'root',
          message: issue.message
        }));
        rejected.push({
          row: index + 1,
          raw,
          errors
        });
      } else {
        const validatedData = result.data;
        acceptedMap.set(validatedData.beneficiaryId, validatedData);

        // Store in memory store
        memoryBeneficiariesStore.set(validatedData.beneficiaryId, validatedData);

        // Idempotent upsert to MongoDB if connected
        if (mongoose.connection.readyState === 1) {
          try {
            await Beneficiary.findOneAndUpdate(
              { beneficiaryId: validatedData.beneficiaryId },
              validatedData,
              { upsert: true, new: true }
            );
          } catch (dbErr) {
            logger.warn(`Failed to persist beneficiary ${validatedData.beneficiaryId} to MongoDB:`, dbErr);
          }
        }
      }
    }

    const accepted = Array.from(acceptedMap.values());

    return {
      summary: {
        totalRows: records.length,
        acceptedCount: accepted.length,
        rejectedCount: rejected.length,
        recordType: 'beneficiary'
      },
      accepted,
      rejected
    };
  }

  /**
   * Process and ingest disbursement records (JSON array or objects) idempotently.
   */
  public async ingestDisbursements(records: unknown[]): Promise<IngestionResult<DisbursementInput>> {
    const acceptedMap = new Map<string, DisbursementInput>();
    const rejected: IngestionRowError[] = [];

    for (let index = 0; index < records.length; index++) {
      const raw = records[index];
      const result = validateDisbursementRecord(raw);

      if (!result.success) {
        const errors: IngestionErrorDetail[] = result.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'root',
          message: issue.message
        }));
        rejected.push({
          row: index + 1,
          raw,
          errors
        });
      } else {
        const validatedData = result.data;
        acceptedMap.set(validatedData.disbursementId, validatedData);

        // Store in memory store
        memoryDisbursementsStore.set(validatedData.disbursementId, validatedData);

        // Idempotent upsert to MongoDB if connected
        if (mongoose.connection.readyState === 1) {
          try {
            await Disbursement.findOneAndUpdate(
              { disbursementId: validatedData.disbursementId },
              validatedData,
              { upsert: true, new: true }
            );
          } catch (dbErr) {
            logger.warn(`Failed to persist disbursement ${validatedData.disbursementId} to MongoDB:`, dbErr);
          }
        }
      }
    }

    const accepted = Array.from(acceptedMap.values());

    return {
      summary: {
        totalRows: records.length,
        acceptedCount: accepted.length,
        rejectedCount: rejected.length,
        recordType: 'disbursement'
      },
      accepted,
      rejected
    };
  }

  /**
   * Ingest CSV raw text/buffer for beneficiaries
   */
  public async ingestBeneficiariesCsv(csvContent: string | Buffer): Promise<IngestionResult<BeneficiaryInput>> {
    const records = this.parseCsv(csvContent);
    return this.ingestBeneficiaries(records);
  }

  /**
   * Ingest CSV raw text/buffer for disbursements
   */
  public async ingestDisbursementsCsv(csvContent: string | Buffer): Promise<IngestionResult<DisbursementInput>> {
    const records = this.parseCsv(csvContent);
    return this.ingestDisbursements(records);
  }

  /**
   * Query stored beneficiaries
   */
  public async getBeneficiaries(): Promise<unknown[]> {
    if (mongoose.connection.readyState === 1) {
      try {
        return await Beneficiary.find().lean();
      } catch (err) {
        logger.warn('Error fetching beneficiaries from MongoDB, returning memory store', err);
      }
    }
    return Array.from(memoryBeneficiariesStore.values());
  }

  /**
   * Query stored disbursements
   */
  public async getDisbursements(): Promise<unknown[]> {
    if (mongoose.connection.readyState === 1) {
      try {
        return await Disbursement.find().lean();
      } catch (err) {
        logger.warn('Error fetching disbursements from MongoDB, returning memory store', err);
      }
    }
    return Array.from(memoryDisbursementsStore.values());
  }

  /**
   * Reset in-memory store (useful for unit tests)
   */
  public clearMemoryStore(): void {
    memoryBeneficiariesStore.clear();
    memoryDisbursementsStore.clear();
  }
}

export const ingestionService = new IngestionService();
