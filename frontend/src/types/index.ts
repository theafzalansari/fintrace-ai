export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

export interface BeneficiaryRecord {
  beneficiaryId: string;
  name: string;
  bankAccountNumber: string;
  ifscOrRoutingCode: string;
  category: 'Individual' | 'Vendor' | 'NGO' | 'Contractor';
  phone?: string;
  email?: string;
  address?: string;
  identityHash?: string;
  status: 'Active' | 'Suspended' | 'Flagged';
  createdAt?: string;
  updatedAt?: string;
}

export interface DisbursementRecord {
  disbursementId: string;
  beneficiaryId: string;
  amount: number;
  currency: string;
  disbursementDate: string;
  programCode: string;
  paymentChannel: 'Direct Transfer' | 'UPI' | 'NEFT' | 'RTGS' | 'Check';
  status: 'Completed' | 'Pending' | 'Failed' | 'Reversed';
  referenceNumber?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NodeMetadata {
  category?: string;
  status?: string;
  bankAccountNumber?: string;
  ifscOrRoutingCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  identityHash?: string;
  amount?: number;
  currency?: string;
  disbursementDate?: string;
  programCode?: string;
  paymentChannel?: string;
  associatedBeneficiariesCount?: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'beneficiary' | 'payout_account' | 'disbursement';
  metadata: NodeMetadata;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  reason: string;
  sourceAttribute: string;
}

export interface GraphResponseData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: {
    totalNodes: number;
    totalEdges: number;
    beneficiaryCount: number;
    payoutAccountCount: number;
    disbursementCount: number;
  };
}

export interface RiskSignal {
  ruleId: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  points: number;
  description: string;
}

export type HumanReviewStatus = 'PENDING_REVIEW' | 'IN_REVIEW' | 'VERIFIED_CLEAN' | 'CONFIRMED_RISK';

export interface RiskFinding {
  entityId: string;
  entityType: 'beneficiary';
  name: string;
  riskScore: number;
  ruleScore?: number;
  anomalyScore?: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  humanReviewStatus?: HumanReviewStatus;
  disclaimer: string;
  signals: RiskSignal[];
  explanations: string[];
}

export interface RiskAnalysisResponseData {
  findings: RiskFinding[];
  summary: {
    totalEntitiesAssessed: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    pendingReviewCount?: number;
  };
}

export interface IngestionErrorDetail {
  field: string;
  message: string;
}

export interface IngestionRowError {
  row: number;
  raw: unknown;
  errors: IngestionErrorDetail[];
}

export interface IngestionResult {
  success: boolean;
  message: string;
  summary: {
    totalRows: number;
    acceptedCount: number;
    rejectedCount: number;
    recordType: 'beneficiary' | 'disbursement';
  };
  accepted: unknown[];
  rejected: IngestionRowError[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CopilotChatResponseData {
  answer: string;
  citedRecords: string[];
  provider: 'gemini-ai' | 'rule-engine-fallback';
  disclaimer: string;
}

export type CaseStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
export type CasePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CaseNote {
  noteId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface StatusHistoryEntry {
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

export interface AuditLogEntry {
  logId: string;
  action: string;
  details: string;
  performedBy: string;
  timestamp: string;
}

export interface InvestigationCase {
  _id?: string;
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
  riskSignals: RiskSignal[];
  explanations: string[];
  investigator: string;
  notes: CaseNote[];
  statusHistory: StatusHistoryEntry[];
  auditLog: AuditLogEntry[];
  resolutionSummary?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  error?: {
    message: string;
    details?: unknown;
  };
}
