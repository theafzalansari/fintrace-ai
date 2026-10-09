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

function cleanHeaderKey(key: string): string {
  return key.trim().replace(/^\uFEFF/, '').toLowerCase().replace(/[\s\-_]+/g, '');
}

const BENEFICIARY_HEADER_MAP: Record<string, keyof BeneficiaryInput> = {
  beneficiaryid: 'beneficiaryId',
  beneficiary_id: 'beneficiaryId',
  id: 'beneficiaryId',
  name: 'name',
  beneficiaryname: 'name',
  beneficiary_name: 'name',
  bankaccountnumber: 'bankAccountNumber',
  bank_account_number: 'bankAccountNumber',
  accountnumber: 'bankAccountNumber',
  account_number: 'bankAccountNumber',
  accountno: 'bankAccountNumber',
  account_no: 'bankAccountNumber',
  ifscorroutingcode: 'ifscOrRoutingCode',
  ifsc_or_routing_code: 'ifscOrRoutingCode',
  ifsc: 'ifscOrRoutingCode',
  ifsccode: 'ifscOrRoutingCode',
  ifsc_code: 'ifscOrRoutingCode',
  routingcode: 'ifscOrRoutingCode',
  routing_code: 'ifscOrRoutingCode',
  category: 'category',
  phone: 'phone',
  phonenumber: 'phone',
  phone_number: 'phone',
  mobile: 'phone',
  email: 'email',
  emailaddress: 'email',
  email_address: 'email',
  address: 'address',
  identityhash: 'identityHash',
  identity_hash: 'identityHash',
  aadhaar_hash: 'identityHash',
  pan_hash: 'identityHash',
  status: 'status'
};

const DISBURSEMENT_HEADER_MAP: Record<string, keyof DisbursementInput> = {
  disbursementid: 'disbursementId',
  disbursement_id: 'disbursementId',
  id: 'disbursementId',
  txnid: 'disbursementId',
  txn_id: 'disbursementId',
  beneficiaryid: 'beneficiaryId',
  beneficiary_id: 'beneficiaryId',
  amount: 'amount',
  payoutamount: 'amount',
  payout_amount: 'amount',
  amt: 'amount',
  currency: 'currency',
  disbursementdate: 'disbursementDate',
  disbursement_date: 'disbursementDate',
  date: 'disbursementDate',
  txndate: 'disbursementDate',
  txn_date: 'disbursementDate',
  programcode: 'programCode',
  program_code: 'programCode',
  schemecode: 'programCode',
  scheme_code: 'programCode',
  paymentchannel: 'paymentChannel',
  payment_channel: 'paymentChannel',
  channel: 'paymentChannel',
  status: 'status',
  referencenumber: 'referenceNumber',
  reference_number: 'referenceNumber',
  ref: 'referenceNumber',
  remarks: 'remarks',
  remark: 'remarks',
  description: 'remarks'
};

export class IngestionService {
  /**
   * Normalize beneficiary row keys & trim values
   */
  public normalizeBeneficiaryRawRecord(rawRecord: unknown): Record<string, unknown> {
    if (!rawRecord || typeof rawRecord !== 'object') return {};
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawRecord as Record<string, unknown>)) {
      const cleanKey = cleanHeaderKey(key);
      const mappedField = BENEFICIARY_HEADER_MAP[cleanKey];
      const cleanValue = typeof value === 'string' ? value.trim() : value;
      if (mappedField) {
        normalized[mappedField] = cleanValue;
      } else {
        normalized[key.trim().replace(/^\uFEFF/, '')] = cleanValue;
      }
    }
    return normalized;
  }

  /**
   * Normalize disbursement row keys & trim values
   */
  public normalizeDisbursementRawRecord(rawRecord: unknown): Record<string, unknown> {
    if (!rawRecord || typeof rawRecord !== 'object') return {};
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawRecord as Record<string, unknown>)) {
      const cleanKey = cleanHeaderKey(key);
      const mappedField = DISBURSEMENT_HEADER_MAP[cleanKey];
      const cleanValue = typeof value === 'string' ? value.trim() : value;
      if (mappedField) {
        normalized[mappedField] = cleanValue;
      } else {
        normalized[key.trim().replace(/^\uFEFF/, '')] = cleanValue;
      }
    }
    return normalized;
  }

  /**
   * Parse CSV raw text or buffer into javascript objects with BOM & header trimming
   */
  public parseCsv(csvData: string | Buffer): Record<string, string>[] {
    let content = typeof csvData === 'string' ? csvData : csvData.toString('utf-8');
    content = content.replace(/^\uFEFF/, '').trim();
    if (!content) return [];
    try {
      return parse(content, {
        columns: (header: string[]) => {
          return header.map(h => h.trim().replace(/^\uFEFF/, ''));
        },
        skip_empty_lines: true,
        trim: true,
        bom: true
      });
    } catch (err) {
      throw new Error(`Invalid CSV syntax or malformed structure: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Process and ingest beneficiary records (JSON array or objects) idempotently.
   */
  public async ingestBeneficiaries(records: unknown[]): Promise<IngestionResult<BeneficiaryInput>> {
    const acceptedMap = new Map<string, BeneficiaryInput>();
    const rejected: IngestionRowError[] = [];

    // Header validation for beneficiary records
    if (records.length > 0 && typeof records[0] === 'object' && records[0] !== null) {
      const firstRowNormalized = this.normalizeBeneficiaryRawRecord(records[0]);
      const requiredFields: (keyof BeneficiaryInput)[] = ['beneficiaryId', 'name', 'bankAccountNumber', 'ifscOrRoutingCode'];
      const missingFields = requiredFields.filter(f => !(f in firstRowNormalized) || firstRowNormalized[f] === undefined || firstRowNormalized[f] === '');
      
      if (missingFields.length === requiredFields.length) {
        throw new Error(`CSV missing required beneficiary headers. Missing: [${missingFields.join(', ')}]. Supported IFSC aliases: ifsc, ifscCode, ifsc_code, ifscOrRoutingCode, routing_code.`);
      }
    }

    for (let index = 0; index < records.length; index++) {
      const raw = records[index];
      const normalizedRaw = this.normalizeBeneficiaryRawRecord(raw);
      const result = validateBeneficiaryRecord(normalizedRaw);

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
        let isPersisted = true;

        // Idempotent upsert to MongoDB if connected
        if (mongoose.connection.readyState === 1) {
          try {
            const doc = await Beneficiary.findOneAndUpdate(
              { beneficiaryId: validatedData.beneficiaryId },
              validatedData,
              { upsert: true, new: true, runValidators: true }
            );
            if (!doc) {
              throw new Error('Database insertion returned null');
            }
          } catch (dbErr) {
            logger.error(`Failed to persist beneficiary ${validatedData.beneficiaryId} to MongoDB:`, dbErr);
            isPersisted = false;
            rejected.push({
              row: index + 1,
              raw,
              errors: [
                {
                  field: 'database',
                  message: `Database persistence failed: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`
                }
              ]
            });
          }
        }

        if (isPersisted) {
          acceptedMap.set(validatedData.beneficiaryId, validatedData);
          memoryBeneficiariesStore.set(validatedData.beneficiaryId, validatedData);
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

    // Header validation for disbursement records
    if (records.length > 0 && typeof records[0] === 'object' && records[0] !== null) {
      const firstRowNormalized = this.normalizeDisbursementRawRecord(records[0]);
      const requiredFields: (keyof DisbursementInput)[] = ['disbursementId', 'beneficiaryId', 'amount', 'disbursementDate', 'programCode'];
      const missingFields = requiredFields.filter(f => !(f in firstRowNormalized) || firstRowNormalized[f] === undefined || firstRowNormalized[f] === '');
      
      if (missingFields.length === requiredFields.length) {
        throw new Error(`CSV missing required disbursement headers. Missing: [${missingFields.join(', ')}].`);
      }
    }

    for (let index = 0; index < records.length; index++) {
      const raw = records[index];
      const normalizedRaw = this.normalizeDisbursementRawRecord(raw);
      const result = validateDisbursementRecord(normalizedRaw);

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
        let isPersisted = true;

        // Idempotent upsert to MongoDB if connected
        if (mongoose.connection.readyState === 1) {
          try {
            const doc = await Disbursement.findOneAndUpdate(
              { disbursementId: validatedData.disbursementId },
              validatedData,
              { upsert: true, new: true, runValidators: true }
            );
            if (!doc) {
              throw new Error('Database insertion returned null');
            }
          } catch (dbErr) {
            logger.error(`Failed to persist disbursement ${validatedData.disbursementId} to MongoDB:`, dbErr);
            isPersisted = false;
            rejected.push({
              row: index + 1,
              raw,
              errors: [
                {
                  field: 'database',
                  message: `Database persistence failed: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`
                }
              ]
            });
          }
        }

        if (isPersisted) {
          acceptedMap.set(validatedData.disbursementId, validatedData);
          memoryDisbursementsStore.set(validatedData.disbursementId, validatedData);
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
        const dbRecords = await Beneficiary.find().lean();
        if (dbRecords && dbRecords.length > 0) {
          return dbRecords;
        }
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
        const dbRecords = await Disbursement.find().lean();
        if (dbRecords && dbRecords.length > 0) {
          return dbRecords;
        }
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
