import { ingestionService } from '../ingestion/ingestionService.js';

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
  disbursementDate?: Date | string;
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

// Helpers for normalizing attributes
export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^\d]/g, '');
  return cleaned.length >= 7 ? cleaned : '';
}

export function normalizeEmail(email?: string): string {
  if (!email) return '';
  const cleaned = email.trim().toLowerCase();
  return cleaned.includes('@') ? cleaned : '';
}

export function normalizeAddress(address?: string): string {
  if (!address) return '';
  const cleaned = address.trim().toLowerCase().replace(/\s+/g, ' ');
  return cleaned.length >= 5 ? cleaned : '';
}

export class GraphService {
  /**
   * Constructs graph nodes and edges from ingested beneficiaries and disbursements.
   */
  public async buildGraph(): Promise<GraphResponseData> {
    const rawBeneficiaries = (await ingestionService.getBeneficiaries()) as any[];
    const rawDisbursements = (await ingestionService.getDisbursements()) as any[];

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeIds = new Set<string>();
    const edgeKeys = new Set<string>();

    let edgeCounter = 1;
    const addEdge = (source: string, target: string, relation: string, reason: string, sourceAttribute: string) => {
      // Avoid duplicate directed/undirected edges for the same relation & pair
      const key1 = `${source}->${target}:${relation}`;
      const key2 = `${target}->${source}:${relation}`;
      if (edgeKeys.has(key1) || edgeKeys.has(key2)) return;
      edgeKeys.add(key1);
      edgeKeys.add(key2);

      edges.push({
        id: `edge-${edgeCounter++}`,
        source,
        target,
        relation,
        reason,
        sourceAttribute
      });
    };

    // Maps for attribute-based relationship creation between beneficiaries
    const bankAccountMap = new Map<string, any[]>();
    const phoneMap = new Map<string, any[]>();
    const emailMap = new Map<string, any[]>();
    const addressMap = new Map<string, any[]>();
    const identityHashMap = new Map<string, any[]>();

    // 1. Process Beneficiary Nodes
    let beneficiaryCount = 0;
    for (const ben of rawBeneficiaries) {
      if (!ben.beneficiaryId) continue;
      beneficiaryCount++;
      const benId = ben.beneficiaryId;

      if (!nodeIds.has(benId)) {
        nodeIds.add(benId);
        nodes.push({
          id: benId,
          label: ben.name || benId,
          type: 'beneficiary',
          metadata: {
            category: ben.category,
            status: ben.status,
            bankAccountNumber: ben.bankAccountNumber,
            ifscOrRoutingCode: ben.ifscOrRoutingCode,
            phone: ben.phone,
            email: ben.email,
            address: ben.address,
            identityHash: ben.identityHash
          }
        });
      }

      // 2. Process Payout Account Node & Beneficiary -> Payout Account Edge
      if (ben.bankAccountNumber) {
        const accNo = ben.bankAccountNumber.trim();
        const accNodeId = `ACC-${accNo}`;

        if (!bankAccountMap.has(accNo)) {
          bankAccountMap.set(accNo, []);
        }
        bankAccountMap.get(accNo)!.push(ben);

        // Add payout account node if not added yet
        if (!nodeIds.has(accNodeId)) {
          nodeIds.add(accNodeId);
          nodes.push({
            id: accNodeId,
            label: `Account ${accNo}`,
            type: 'payout_account',
            metadata: {
              bankAccountNumber: accNo,
              ifscOrRoutingCode: ben.ifscOrRoutingCode
            }
          });
        }

        // Add Beneficiary -> Payout Account edge
        addEdge(
          benId,
          accNodeId,
          'BENEFICIARY_PAYOUT_ACCOUNT',
          `Beneficiary ${ben.name || benId} uses payout account ${accNo}`,
          'bankAccountNumber'
        );
      }

      // Group by phone
      const normPhone = normalizePhone(ben.phone);
      if (normPhone) {
        if (!phoneMap.has(normPhone)) phoneMap.set(normPhone, []);
        phoneMap.get(normPhone)!.push(ben);
      }

      // Group by email
      const normEmail = normalizeEmail(ben.email);
      if (normEmail) {
        if (!emailMap.has(normEmail)) emailMap.set(normEmail, []);
        emailMap.get(normEmail)!.push(ben);
      }

      // Group by address
      const normAddr = normalizeAddress(ben.address);
      if (normAddr) {
        if (!addressMap.has(normAddr)) addressMap.set(normAddr, []);
        addressMap.get(normAddr)!.push(ben);
      }

      // Group by identityHash
      if (ben.identityHash && ben.identityHash.trim()) {
        const normHash = ben.identityHash.trim();
        if (!identityHashMap.has(normHash)) identityHashMap.set(normHash, []);
        identityHashMap.get(normHash)!.push(ben);
      }
    }

    // Update payout account nodes with associated beneficiaries count
    for (const node of nodes) {
      if (node.type === 'payout_account' && node.metadata.bankAccountNumber) {
        const bens = bankAccountMap.get(node.metadata.bankAccountNumber) || [];
        node.metadata.associatedBeneficiariesCount = bens.length;
      }
    }

    // 3. Process Shared Attribute Edges (Beneficiary <-> Beneficiary)
    const createSharedEdges = (map: Map<string, any[]>, relation: string, sourceAttr: string, reasonPrefix: string) => {
      for (const [key, benList] of map.entries()) {
        if (benList.length > 1) {
          for (let i = 0; i < benList.length; i++) {
            for (let j = i + 1; j < benList.length; j++) {
              const benA = benList[i];
              const benB = benList[j];
              addEdge(
                benA.beneficiaryId,
                benB.beneficiaryId,
                relation,
                `${reasonPrefix} "${key}" shared between ${benA.name || benA.beneficiaryId} and ${benB.name || benB.beneficiaryId}`,
                sourceAttr
              );
            }
          }
        }
      }
    };

    createSharedEdges(bankAccountMap, 'SHARED_BANK_ACCOUNT', 'bankAccountNumber', 'Shared bank account');
    createSharedEdges(phoneMap, 'SHARED_PHONE', 'phone', 'Shared phone number');
    createSharedEdges(emailMap, 'SHARED_EMAIL', 'email', 'Shared email address');
    createSharedEdges(addressMap, 'SHARED_ADDRESS', 'address', 'Shared physical address');
    createSharedEdges(identityHashMap, 'SHARED_IDENTITY_HASH', 'identityHash', 'Shared identity hash');

    // 4. Process Disbursement Nodes & Disbursement -> Beneficiary Link Edges
    let disbursementCount = 0;
    for (const disb of rawDisbursements) {
      if (!disb.disbursementId) continue;
      disbursementCount++;
      const disbId = disb.disbursementId;

      if (!nodeIds.has(disbId)) {
        nodeIds.add(disbId);
        nodes.push({
          id: disbId,
          label: `Disbursement ${disbId} (${disb.currency || 'INR'} ${disb.amount})`,
          type: 'disbursement',
          metadata: {
            amount: disb.amount,
            currency: disb.currency,
            disbursementDate: disb.disbursementDate,
            programCode: disb.programCode,
            paymentChannel: disb.paymentChannel,
            status: disb.status
          }
        });
      }

      if (disb.beneficiaryId) {
        addEdge(
          disbId,
          disb.beneficiaryId,
          'DISBURSED_TO',
          `Disbursement ${disbId} made to beneficiary ${disb.beneficiaryId}`,
          'beneficiaryId'
        );
      }
    }

    const payoutAccountCount = nodes.filter((n) => n.type === 'payout_account').length;

    return {
      nodes,
      edges,
      summary: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        beneficiaryCount,
        payoutAccountCount,
        disbursementCount
      }
    };
  }
}

export const graphService = new GraphService();
