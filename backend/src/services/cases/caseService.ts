import mongoose from 'mongoose';
import { InvestigationCase, IInvestigationCase, CaseStatus, CasePriority, ICaseNote, IAuditLog, IStatusHistory } from '../../models/InvestigationCase.js';
import { Beneficiary } from '../../models/Beneficiary.js';
import { Disbursement } from '../../models/Disbursement.js';
import { logger } from '../../utils/logger.js';

export interface CreateCaseInput {
  entityId: string;
  entityType?: 'beneficiary' | 'payout_account' | 'cluster';
  title?: string;
  description?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  riskScore?: number;
  ruleScore?: number;
  anomalyScore?: number;
  riskSeverity?: 'HIGH' | 'MEDIUM' | 'LOW';
  relatedBeneficiaries?: string[];
  relatedDisbursements?: string[];
  relatedPayoutAccounts?: string[];
  riskSignals?: { ruleId: string; severity: string; points: number; description: string }[];
  explanations?: string[];
  investigator?: string;
}

export interface UpdateCaseInput {
  status?: CaseStatus;
  priority?: CasePriority;
  resolutionSummary?: string;
  investigator?: string;
  reason?: string;
}

// In-memory fallback map for offline/standalone execution without live MongoDB
const memoryCasesStore = new Map<string, any>();

function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export class CaseService {
  /**
   * Helper to map legacy HumanReviewStatus to CaseStatus
   */
  public mapReviewStatusToCaseStatus(reviewStatus: string): CaseStatus {
    switch (reviewStatus) {
      case 'IN_REVIEW':
        return 'UNDER_REVIEW';
      case 'VERIFIED_CLEAN':
        return 'DISMISSED';
      case 'CONFIRMED_RISK':
        return 'RESOLVED';
      case 'PENDING_REVIEW':
      default:
        return 'OPEN';
    }
  }

  /**
   * Helper to map CaseStatus to legacy HumanReviewStatus
   */
  public mapCaseStatusToReviewStatus(caseStatus: CaseStatus): string {
    switch (caseStatus) {
      case 'UNDER_REVIEW':
        return 'IN_REVIEW';
      case 'DISMISSED':
        return 'VERIFIED_CLEAN';
      case 'RESOLVED':
        return 'CONFIRMED_RISK';
      case 'OPEN':
      default:
        return 'PENDING_REVIEW';
    }
  }

  /**
   * List all investigation cases with optional status, priority, and search filtering
   */
  public async getCases(filter?: { status?: string; priority?: string; search?: string }): Promise<any[]> {
    if (isMongoConnected()) {
      const query: any = {};
      if (filter?.status && filter.status !== 'all') {
        query.status = filter.status.toUpperCase();
      }
      if (filter?.priority && filter.priority !== 'all') {
        query.priority = filter.priority.toUpperCase();
      }
      if (filter?.search) {
        const regex = new RegExp(filter.search, 'i');
        query.$or = [{ caseId: regex }, { entityId: regex }, { title: regex }, { description: regex }];
      }
      return await InvestigationCase.find(query).sort({ updatedAt: -1 }).lean();
    } else {
      let list = Array.from(memoryCasesStore.values());
      if (filter?.status && filter.status !== 'all') {
        list = list.filter((c) => c.status === filter.status?.toUpperCase());
      }
      if (filter?.priority && filter.priority !== 'all') {
        list = list.filter((c) => c.priority === filter.priority?.toUpperCase());
      }
      if (filter?.search) {
        const s = filter.search.toLowerCase();
        list = list.filter(
          (c) =>
            c.caseId.toLowerCase().includes(s) ||
            c.entityId.toLowerCase().includes(s) ||
            c.title.toLowerCase().includes(s)
        );
      }
      return list;
    }
  }

  /**
   * Get single case by caseId or _id
   */
  public async getCaseById(id: string): Promise<any | null> {
    if (isMongoConnected()) {
      return await InvestigationCase.findOne({
        $or: [{ caseId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
      }).lean();
    } else {
      return memoryCasesStore.get(id) || null;
    }
  }

  /**
   * Get case by entityId
   */
  public async getCaseByEntityId(entityId: string): Promise<any | null> {
    if (isMongoConnected()) {
      return await InvestigationCase.findOne({ entityId }).sort({ updatedAt: -1 }).lean();
    } else {
      const all = Array.from(memoryCasesStore.values());
      return all.find((c) => c.entityId === entityId) || null;
    }
  }

  /**
   * Create a new investigation case
   */
  public async createCase(input: CreateCaseInput): Promise<any> {
    const timestamp = new Date();
    const dateCode = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const caseId = `CASE-${dateCode}-${randomHex}`;

    const priority: CasePriority = input.priority || (input.riskSeverity === 'HIGH' ? 'HIGH' : input.riskSeverity === 'MEDIUM' ? 'MEDIUM' : 'LOW');
    const title = input.title || `Investigation: Flagged Entity ${input.entityId}`;
    const description = input.description || `Automated investigation case opened for ${input.entityType || 'beneficiary'} ${input.entityId}.`;
    const investigator = input.investigator || 'Lead Audit Investigator';

    const initialAuditLog: IAuditLog = {
      logId: `LOG-${Date.now()}-1`,
      action: 'CASE_CREATED',
      details: `Case opened for ${input.entityId} with priority ${priority} and risk score ${input.riskScore || 0}.`,
      performedBy: investigator,
      timestamp
    };

    const initialStatusHistory: IStatusHistory = {
      fromStatus: 'NONE',
      toStatus: 'OPEN',
      changedBy: investigator,
      changedAt: timestamp,
      reason: 'Initial case creation'
    };

    const caseData = {
      caseId,
      entityId: input.entityId,
      entityType: input.entityType || 'beneficiary',
      title,
      description,
      status: 'OPEN' as CaseStatus,
      priority,
      riskScore: input.riskScore || 0,
      ruleScore: input.ruleScore,
      anomalyScore: input.anomalyScore,
      riskSeverity: input.riskSeverity || (priority === 'HIGH' ? 'HIGH' : priority === 'MEDIUM' ? 'MEDIUM' : 'LOW'),
      relatedBeneficiaries: input.relatedBeneficiaries || [input.entityId],
      relatedDisbursements: input.relatedDisbursements || [],
      relatedPayoutAccounts: input.relatedPayoutAccounts || [],
      riskSignals: input.riskSignals || [],
      explanations: input.explanations || [],
      investigator,
      notes: [],
      statusHistory: [initialStatusHistory],
      auditLog: [initialAuditLog],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    if (isMongoConnected()) {
      const created = new InvestigationCase(caseData);
      const saved = await created.save();
      return saved.toObject();
    } else {
      memoryCasesStore.set(caseId, caseData);
      memoryCasesStore.set(input.entityId, caseData);
      return caseData;
    }
  }

  /**
   * Update existing case status, priority, or resolution
   */
  public async updateCase(caseId: string, updates: UpdateCaseInput): Promise<any | null> {
    const timestamp = new Date();

    if (isMongoConnected()) {
      const caseDoc = await InvestigationCase.findOne({
        $or: [{ caseId }, { entityId: caseId }, { _id: mongoose.Types.ObjectId.isValid(caseId) ? caseId : null }]
      });

      if (!caseDoc) return null;

      const performedBy = updates.investigator || caseDoc.investigator || 'Lead Audit Investigator';

      if (updates.status && updates.status !== caseDoc.status) {
        const oldStatus = caseDoc.status;
        caseDoc.status = updates.status;

        caseDoc.statusHistory.push({
          fromStatus: oldStatus,
          toStatus: updates.status,
          changedBy: performedBy,
          changedAt: timestamp,
          reason: updates.reason || 'Manual status update'
        });

        caseDoc.auditLog.push({
          logId: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          action: 'STATUS_CHANGED',
          details: `Status updated from ${oldStatus} to ${updates.status}.`,
          performedBy,
          timestamp
        });

        if (updates.status === 'RESOLVED' || updates.status === 'DISMISSED') {
          caseDoc.resolvedAt = timestamp;
          if (updates.resolutionSummary) {
            caseDoc.resolutionSummary = updates.resolutionSummary;
          }
        }
      }

      if (updates.priority && updates.priority !== caseDoc.priority) {
        const oldPriority = caseDoc.priority;
        caseDoc.priority = updates.priority;

        caseDoc.auditLog.push({
          logId: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          action: 'PRIORITY_CHANGED',
          details: `Priority updated from ${oldPriority} to ${updates.priority}.`,
          performedBy,
          timestamp
        });
      }

      if (updates.resolutionSummary) {
        caseDoc.resolutionSummary = updates.resolutionSummary;
      }

      const saved = await caseDoc.save();
      return saved.toObject();
    } else {
      const caseObj = memoryCasesStore.get(caseId);
      if (!caseObj) return null;

      const performedBy = updates.investigator || caseObj.investigator || 'Lead Audit Investigator';

      if (updates.status && updates.status !== caseObj.status) {
        const oldStatus = caseObj.status;
        caseObj.status = updates.status;
        caseObj.statusHistory.push({
          fromStatus: oldStatus,
          toStatus: updates.status,
          changedBy: performedBy,
          changedAt: timestamp,
          reason: updates.reason || 'Manual status update'
        });
        caseObj.auditLog.push({
          logId: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          action: 'STATUS_CHANGED',
          details: `Status updated from ${oldStatus} to ${updates.status}.`,
          performedBy,
          timestamp
        });
      }

      if (updates.priority && updates.priority !== caseObj.priority) {
        caseObj.priority = updates.priority;
      }

      caseObj.updatedAt = timestamp;
      memoryCasesStore.set(caseId, caseObj);
      return caseObj;
    }
  }

  /**
   * Append timestamped investigator note to case
   */
  public async addNote(caseId: string, content: string, author: string = 'Lead Audit Investigator'): Promise<any | null> {
    const timestamp = new Date();
    const noteId = `NOTE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newNote: ICaseNote = {
      noteId,
      author,
      content: content.trim(),
      createdAt: timestamp
    };

    const auditEntry: IAuditLog = {
      logId: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: 'NOTE_ADDED',
      details: `Investigator note added: "${content.length > 40 ? content.substring(0, 37) + '...' : content}"`,
      performedBy: author,
      timestamp
    };

    if (isMongoConnected()) {
      const caseDoc = await InvestigationCase.findOne({
        $or: [{ caseId }, { entityId: caseId }, { _id: mongoose.Types.ObjectId.isValid(caseId) ? caseId : null }]
      });

      if (!caseDoc) return null;

      caseDoc.notes.push(newNote);
      caseDoc.auditLog.push(auditEntry);
      const saved = await caseDoc.save();
      return saved.toObject();
    } else {
      const caseObj = memoryCasesStore.get(caseId);
      if (!caseObj) return null;

      caseObj.notes.push(newNote);
      caseObj.auditLog.push(auditEntry);
      caseObj.updatedAt = timestamp;
      memoryCasesStore.set(caseId, caseObj);
      return caseObj;
    }
  }

  /**
   * Fetch full linked evidence details for a case from MongoDB
   */
  public async getCaseEvidence(caseId: string): Promise<any | null> {
    const caseObj = await this.getCaseById(caseId);
    if (!caseObj) return null;

    let beneficiaryRecords: any[] = [];
    let disbursementRecords: any[] = [];

    if (isMongoConnected()) {
      const targetBens = caseObj.relatedBeneficiaries && caseObj.relatedBeneficiaries.length > 0
        ? caseObj.relatedBeneficiaries
        : [caseObj.entityId];

      beneficiaryRecords = await Beneficiary.find({ beneficiaryId: { $in: targetBens } }).lean();
      disbursementRecords = await Disbursement.find({ beneficiaryId: { $in: targetBens } }).lean();
    }

    return {
      caseId: caseObj.caseId,
      entityId: caseObj.entityId,
      status: caseObj.status,
      priority: caseObj.priority,
      riskScore: caseObj.riskScore,
      riskSignals: caseObj.riskSignals,
      explanations: caseObj.explanations,
      beneficiaries: beneficiaryRecords,
      disbursements: disbursementRecords,
      auditLog: caseObj.auditLog
    };
  }
}

export const caseService = new CaseService();
