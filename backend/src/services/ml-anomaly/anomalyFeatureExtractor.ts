export interface RawBeneficiaryInput {
  beneficiaryId: string;
  name?: string;
  bankAccountNumber?: string;
  ifscOrRoutingCode?: string;
  category?: string;
  phone?: string;
  email?: string;
  address?: string;
  identityHash?: string;
  status?: string;
}

export interface RawDisbursementInput {
  disbursementId: string;
  beneficiaryId: string;
  amount: number;
  currency?: string;
  disbursementDate?: string | Date;
  programCode?: string;
  paymentChannel?: string;
  status?: string;
}

export interface GraphEdgeInput {
  source: string;
  target: string;
  relation: string;
}

export interface FeatureVector {
  beneficiaryId: string;
  degreeCentrality: number;
  sharedAccountCount: number;
  totalDisbursementAmount: number;
  disbursementCount: number;
  maxSingleDisbursement: number;
  failedDisbursementRatio: number;
  // Normalized 6D numeric tuple (scaled 0.0 - 1.0) for Isolation Forest input
  features: [number, number, number, number, number, number];
}

export class AnomalyFeatureExtractor {
  /**
   * Extracts scaled 6D numeric feature vectors for all beneficiaries.
   */
  public extractFeatures(
    beneficiaries: RawBeneficiaryInput[],
    disbursements: RawDisbursementInput[],
    edges: GraphEdgeInput[] = []
  ): FeatureVector[] {
    const degreeMap = new Map<string, number>();
    for (const edge of edges) {
      if (edge.source) degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
      if (edge.target) degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
    }

    const bankAccountCountMap = new Map<string, number>();
    for (const ben of beneficiaries) {
      if (ben.bankAccountNumber && ben.bankAccountNumber.trim()) {
        const acc = ben.bankAccountNumber.trim();
        bankAccountCountMap.set(acc, (bankAccountCountMap.get(acc) || 0) + 1);
      }
    }

    const disbursementsByBenId = new Map<string, RawDisbursementInput[]>();
    for (const disb of disbursements) {
      if (!disb.beneficiaryId) continue;
      if (!disbursementsByBenId.has(disb.beneficiaryId)) {
        disbursementsByBenId.set(disb.beneficiaryId, []);
      }
      disbursementsByBenId.get(disb.beneficiaryId)!.push(disb);
    }

    return beneficiaries.map((ben) => {
      const benId = ben.beneficiaryId;
      const degreeCentrality = degreeMap.get(benId) || 0;

      const acc = ben.bankAccountNumber ? ben.bankAccountNumber.trim() : '';
      const sharedAccountCount = acc ? Math.max(0, (bankAccountCountMap.get(acc) || 1) - 1) : 0;

      const benDisbs = disbursementsByBenId.get(benId) || [];
      const disbursementCount = benDisbs.length;

      let totalDisbursementAmount = 0;
      let maxSingleDisbursement = 0;
      let failedCount = 0;

      for (const d of benDisbs) {
        const amt = Number(d.amount) || 0;
        totalDisbursementAmount += amt;
        if (amt > maxSingleDisbursement) maxSingleDisbursement = amt;
        if (d.status === 'Failed' || d.status === 'Reversed') {
          failedCount++;
        }
      }

      const failedDisbursementRatio = disbursementCount > 0 ? failedCount / disbursementCount : 0;

      // Scale each dimension to [0, 1] range to avoid magnitude distortion in decision splits
      const normDegree = Math.min(1.0, degreeCentrality / 10);
      const normSharedAcc = Math.min(1.0, sharedAccountCount / 10);
      const normTotalAmt = Math.min(1.0, totalDisbursementAmount / 1000000);
      const normCount = Math.min(1.0, disbursementCount / 10);
      const normMaxAmt = Math.min(1.0, maxSingleDisbursement / 1000000);
      const normFailedRatio = Math.min(1.0, failedDisbursementRatio);

      const features: [number, number, number, number, number, number] = [
        normDegree,
        normSharedAcc,
        normTotalAmt,
        normCount,
        normMaxAmt,
        normFailedRatio
      ];

      return {
        beneficiaryId: benId,
        degreeCentrality,
        sharedAccountCount,
        totalDisbursementAmount,
        disbursementCount,
        maxSingleDisbursement,
        failedDisbursementRatio,
        features
      };
    });
  }
}

export const featureExtractor = new AnomalyFeatureExtractor();
