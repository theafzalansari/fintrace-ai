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
  return key.trim().replace(/^\uFEFF/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const BENEFICIARY_HEADER_MAP: Record<string, keyof BeneficiaryInput> = {
  beneficiaryid: 'beneficiaryId',
  id: 'beneficiaryId',
  benid: 'beneficiaryId',
  recipientid: 'beneficiaryId',
  memberid: 'beneficiaryId',

  name: 'name',
  beneficiaryname: 'name',
  fullname: 'name',
  recipientname: 'name',

  bankaccountnumber: 'bankAccountNumber',
  accountnumber: 'bankAccountNumber',
  accountno: 'bankAccountNumber',
  accno: 'bankAccountNumber',
  bankaccount: 'bankAccountNumber',
  account: 'bankAccountNumber',

  ifscorroutingcode: 'ifscOrRoutingCode',
  ifsc: 'ifscOrRoutingCode',
  ifsccode: 'ifscOrRoutingCode',
  routingcode: 'ifscOrRoutingCode',
  swift: 'ifscOrRoutingCode',
  swiftcode: 'ifscOrRoutingCode',
  bankifsc: 'ifscOrRoutingCode',

  category: 'category',
  type: 'category',
  beneficiarytype: 'category',

  phone: 'phone',
  phonenumber: 'phone',
  mobile: 'phone',
  mobilenumber: 'phone',
  contact: 'phone',
  contactnumber: 'phone',

  email: 'email',
  emailaddress: 'email',

  address: 'address',
  location: 'address',
  fulladdress: 'address',

  identityhash: 'identityHash',
  aadhaarhash: 'identityHash',
  panhash: 'identityHash',
  hash: 'identityHash',
  nationalid: 'identityHash',

  status: 'status',
  accountstatus: 'status'
};

const DISBURSEMENT_HEADER_MAP: Record<string, keyof DisbursementInput> = {
  disbursementid: 'disbursementId',
  id: 'disbursementId',
  txnid: 'disbursementId',
  payoutid: 'disbursementId',
  transactionid: 'disbursementId',
  disbursementnumber: 'disbursementId',
  disbursementno: 'disbursementId',
  refid: 'disbursementId',

  beneficiaryid: 'beneficiaryId',
  benid: 'beneficiaryId',
  recipientid: 'beneficiaryId',
  memberid: 'beneficiaryId',

  amount: 'amount',
  payoutamount: 'amount',
  amt: 'amount',
  disbursementamount: 'amount',
  transactionamount: 'amount',
  totalamount: 'amount',

  currency: 'currency',
  curr: 'currency',

  disbursementdate: 'disbursementDate',
  date: 'disbursementDate',
  txndate: 'disbursementDate',
  payoutdate: 'disbursementDate',
  paymentdate: 'disbursementDate',
  createdat: 'disbursementDate',
  timestamp: 'disbursementDate',

  programcode: 'programCode',
  program: 'programCode',
  programid: 'programCode',
  programname: 'programCode',
  schemecode: 'programCode',
  scheme: 'programCode',
  schemeid: 'programCode',
  schemename: 'programCode',
  projectcode: 'programCode',
  project: 'programCode',
  projectid: 'programCode',
  projectname: 'programCode',
  code: 'programCode',
  grantcode: 'programCode',
  fundcode: 'programCode',
  budgetcode: 'programCode',

  paymentchannel: 'paymentChannel',
  paymentmethod: 'paymentChannel',
  channel: 'paymentChannel',
  paymenttype: 'paymentChannel',
  mode: 'paymentChannel',
  paymentmode: 'paymentChannel',

  status: 'status',
  payoutstatus: 'status',
  state: 'status',

  referencenumber: 'referenceNumber',
  transactionreference: 'referenceNumber',
  ref: 'referenceNumber',
  refno: 'referenceNumber',
  referenceno: 'referenceNumber',
  utr: 'referenceNumber',
  utrnumber: 'referenceNumber',

  remarks: 'remarks',
  remark: 'remarks',
  description: 'remarks',
  note: 'remarks',
  notes: 'remarks',
  memo: 'remarks'
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
    // Default programCode to GENERAL-PROGRAM if missing from CSV headers
    if (!normalized.programCode || normalized.programCode === '') {
      normalized.programCode = 'GENERAL-PROGRAM';
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
  public async ingestBeneficiaries(records: unknown[], reqId = 'sys'): Promise<IngestionResult<BeneficiaryInput>> {
    const acceptedMap = new Map<string, BeneficiaryInput>();
    const rejected: IngestionRowError[] = [];

    // Header validation for beneficiary records
    if (records.length > 0 && typeof records[0] === 'object' && records[0] !== null) {
      const firstRowNormalized = this.normalizeBeneficiaryRawRecord(records[0]);
      const rawHeaderKeys = Object.keys(records[0] as object);
      const mappedHeaderKeys = Object.keys(firstRowNormalized);
      logger.info(`[CSV Ingestion Diagnostic] [${reqId}] Beneficiary Raw Headers: [${rawHeaderKeys.join(', ')}] -> Mapped Canonical Keys: [${mappedHeaderKeys.join(', ')}]`);

      const requiredFields: (keyof BeneficiaryInput)[] = ['beneficiaryId', 'name', 'bankAccountNumber', 'ifscOrRoutingCode'];
      const missingHeaders = requiredFields.filter(f => !(f in firstRowNormalized));
      
      if (missingHeaders.length > 0) {
        throw new Error(`CSV missing required beneficiary headers. Missing: [${missingHeaders.join(', ')}]. Supported IFSC aliases: ifsc, ifscCode, ifsc_code, ifscOrRoutingCode, routing_code.`);
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
  public async ingestDisbursements(records: unknown[], reqId = 'sys'): Promise<IngestionResult<DisbursementInput>> {
    const acceptedMap = new Map<string, DisbursementInput>();
    const rejected: IngestionRowError[] = [];

    // Header validation for disbursement records
    if (records.length > 0 && typeof records[0] === 'object' && records[0] !== null) {
      const firstRowNormalized = this.normalizeDisbursementRawRecord(records[0]);
      const rawHeaderKeys = Object.keys(records[0] as object);
      const mappedHeaderKeys = Object.keys(firstRowNormalized);
      logger.info(`[CSV Ingestion Diagnostic] [${reqId}] Disbursement Raw Headers: [${rawHeaderKeys.join(', ')}] -> Mapped Canonical Keys: [${mappedHeaderKeys.join(', ')}]`);

      const requiredFields: (keyof DisbursementInput)[] = ['disbursementId', 'beneficiaryId', 'amount', 'disbursementDate'];
      const missingHeaders = requiredFields.filter(f => !(f in firstRowNormalized));
      
      if (missingHeaders.length > 0) {
        throw new Error(`CSV missing required disbursement headers. Missing: [${missingHeaders.join(', ')}]. Supported header aliases: disbursementId, beneficiaryId, amount, disbursementDate.`);
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

        // Check if referenced beneficiary exists
        let beneficiaryExists = false;
        if (mongoose.connection.readyState === 1) {
          try {
            const count = await Beneficiary.countDocuments({ beneficiaryId: validatedData.beneficiaryId });
            beneficiaryExists = count > 0;
          } catch {
            beneficiaryExists = false;
          }
        } else {
          beneficiaryExists = memoryBeneficiariesStore.has(validatedData.beneficiaryId);
        }

        if (!beneficiaryExists) {
          rejected.push({
            row: index + 1,
            raw,
            errors: [
              {
                field: 'beneficiaryId',
                message: `Referenced beneficiaryId '${validatedData.beneficiaryId}' does not exist in the database. Upload beneficiaries CSV first.`
              }
            ]
          });
          continue;
        }

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
  public async ingestBeneficiariesCsv(csvContent: string | Buffer, reqId = 'sys'): Promise<IngestionResult<BeneficiaryInput>> {
    const records = this.parseCsv(csvContent);
    return this.ingestBeneficiaries(records, reqId);
  }

  /**
   * Ingest CSV raw text/buffer for disbursements
   */
  public async ingestDisbursementsCsv(csvContent: string | Buffer, reqId = 'sys'): Promise<IngestionResult<DisbursementInput>> {
    const records = this.parseCsv(csvContent);
    return this.ingestDisbursements(records, reqId);
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
   * Clear all stored beneficiary & disbursement records from MongoDB collections
   * and in-memory stores. Preserves collection schemas and indexes.
   */
  public async clearAllData(): Promise<{ beneficiariesDeleted: number; disbursementsDeleted: number }> {
    let beneficiariesDeleted = 0;
    let disbursementsDeleted = 0;

    if (mongoose.connection.readyState === 1) {
      const resBen = await Beneficiary.deleteMany({});
      const resDisb = await Disbursement.deleteMany({});
      beneficiariesDeleted = resBen.deletedCount || 0;
      disbursementsDeleted = resDisb.deletedCount || 0;
    }

    memoryBeneficiariesStore.clear();
    memoryDisbursementsStore.clear();

    return { beneficiariesDeleted, disbursementsDeleted };
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
