import mongoose, { Schema, Document } from 'mongoose';

export type CaseStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
export type CasePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ICaseNote {
  noteId: string;
  author: string;
  content: string;
  createdAt: Date;
}

export interface IStatusHistory {
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}

export interface IAuditLog {
  logId: string;
  action: string;
  details: string;
  performedBy: string;
  timestamp: Date;
}

export interface IRiskSignalSnapshot {
  ruleId: string;
  severity: string;
  points: number;
  description: string;
}

export interface IInvestigationCase extends Document {
  caseId: string;
  entityId: string;
  entityType: 'beneficiary' | 'payout_account' | 'cluster';
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  riskScore: number;
  ruleScore?: number;
  anomalyScore?: number;
  riskSeverity: 'HIGH' | 'MEDIUM' | 'LOW';
  relatedBeneficiaries: string[];
  relatedDisbursements: string[];
  relatedPayoutAccounts: string[];
  riskSignals: IRiskSignalSnapshot[];
  explanations: string[];
  investigator: string;
  notes: ICaseNote[];
  statusHistory: IStatusHistory[];
  auditLog: IAuditLog[];
  resolutionSummary?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CaseNoteSchema = new Schema<ICaseNote>(
  {
    noteId: { type: String, required: true },
    author: { type: String, required: true, default: 'System Investigator' },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    changedBy: { type: String, required: true, default: 'System Investigator' },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, default: '' }
  },
  { _id: false }
);

const AuditLogSchema = new Schema<IAuditLog>(
  {
    logId: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    performedBy: { type: String, required: true, default: 'System Investigator' },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const RiskSignalSnapshotSchema = new Schema<IRiskSignalSnapshot>(
  {
    ruleId: { type: String, required: true },
    severity: { type: String, required: true },
    points: { type: Number, required: true },
    description: { type: String, required: true }
  },
  { _id: false }
);

const InvestigationCaseSchema: Schema = new Schema<IInvestigationCase>(
  {
    caseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    entityId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    entityType: {
      type: String,
      enum: ['beneficiary', 'payout_account', 'cluster'],
      default: 'beneficiary'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'],
      default: 'OPEN',
      index: true
    },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
      index: true
    },
    riskScore: {
      type: Number,
      default: 0
    },
    ruleScore: {
      type: Number
    },
    anomalyScore: {
      type: Number
    },
    riskSeverity: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM'
    },
    relatedBeneficiaries: [{ type: String }],
    relatedDisbursements: [{ type: String }],
    relatedPayoutAccounts: [{ type: String }],
    riskSignals: [RiskSignalSnapshotSchema],
    explanations: [{ type: String }],
    investigator: {
      type: String,
      default: 'Lead Audit Investigator'
    },
    notes: [CaseNoteSchema],
    statusHistory: [StatusHistorySchema],
    auditLog: [AuditLogSchema],
    resolutionSummary: {
      type: String,
      default: ''
    },
    resolvedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const InvestigationCase = mongoose.model<IInvestigationCase>('InvestigationCase', InvestigationCaseSchema);
