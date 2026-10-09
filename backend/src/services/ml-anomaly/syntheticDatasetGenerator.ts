import { RawBeneficiaryInput, RawDisbursementInput, GraphEdgeInput } from './anomalyFeatureExtractor.js';

export interface SyntheticBenchmarkDataset {
  beneficiaries: RawBeneficiaryInput[];
  disbursements: RawDisbursementInput[];
  edges: GraphEdgeInput[];
  anomalousEntityIds: Set<string>;
}

export class SyntheticDatasetGenerator {
  /**
   * Generates a reproducible synthetic benchmark dataset containing 250 beneficiaries:
   * - 225 Normal entities (single-owner accounts, modest payout amounts, no suspicious cross-links)
   * - 25 Injected Anomaly entities (shared ghost payout clusters, extreme velocity, high failure rate)
   */
  public generateBenchmarkDataset(): SyntheticBenchmarkDataset {
    const beneficiaries: RawBeneficiaryInput[] = [];
    const disbursements: RawDisbursementInput[] = [];
    const edges: GraphEdgeInput[] = [];
    const anomalousEntityIds = new Set<string>();

    // 1. Generate 225 Normal Beneficiaries
    for (let i = 1; i <= 225; i++) {
      const benId = `BEN-NORM-${String(i).padStart(3, '0')}`;
      beneficiaries.push({
        beneficiaryId: benId,
        name: `Legitimate Beneficiary ${i}`,
        bankAccountNumber: `9182${String(10000000 + i)}`,
        ifscOrRoutingCode: 'SBIN0001234',
        category: i % 4 === 0 ? 'NGO' : i % 3 === 0 ? 'Vendor' : 'Individual',
        phone: `+9198${String(70000000 + i)}`,
        email: `ben${i}@legit.org`,
        address: `Street ${i}, District ${i % 10}, Delhi`,
        status: 'Active'
      });

      // 1 to 2 normal disbursements per beneficiary
      const disbCount = 1 + (i % 2);
      for (let d = 1; d <= disbCount; d++) {
        disbursements.push({
          disbursementId: `DISB-NORM-${i}-${d}`,
          beneficiaryId: benId,
          amount: 5000 + (i * 120) % 25000,
          currency: 'INR',
          disbursementDate: new Date(2024, 2, (d * 5) % 28 + 1).toISOString(),
          programCode: 'SCHEME-AGRI-2024',
          paymentChannel: 'Direct Transfer',
          status: 'Completed'
        });
      }
    }

    // 2. Inject Anomaly Cluster A: Shared Ghost Payout Account (10 Beneficiaries sharing same bank account)
    const sharedAccountNum = '999988887777';
    for (let i = 1; i <= 10; i++) {
      const benId = `BEN-ANOM-GHOST-${i}`;
      anomalousEntityIds.add(benId);
      beneficiaries.push({
        beneficiaryId: benId,
        name: `Ghost Cluster Member ${i}`,
        bankAccountNumber: sharedAccountNum,
        ifscOrRoutingCode: 'HDFC0009999',
        category: 'Individual',
        phone: `+9199900011${i}`,
        status: i > 5 ? 'Flagged' : 'Active'
      });

      // Add shared account edge graph linkages
      for (let j = 1; j < i; j++) {
        edges.push({
          source: `BEN-ANOM-GHOST-${j}`,
          target: benId,
          relation: 'SHARED_BANK_ACCOUNT'
        });
      }

      // High volume disbursements
      disbursements.push({
        disbursementId: `DISB-ANOM-GHOST-${i}`,
        beneficiaryId: benId,
        amount: 350000,
        currency: 'INR',
        disbursementDate: '2024-03-10T12:00:00.000Z',
        programCode: 'SCHEME-EMERGENCY',
        paymentChannel: 'RTGS',
        status: 'Completed'
      });
    }

    // 3. Inject Anomaly Cluster B: High Velocity & Repeated Failed Payments (15 Beneficiaries)
    for (let i = 1; i <= 15; i++) {
      const benId = `BEN-ANOM-VELOCITY-${i}`;
      anomalousEntityIds.add(benId);
      beneficiaries.push({
        beneficiaryId: benId,
        name: `High Risk Vendor ${i}`,
        bankAccountNumber: `7777${String(20000000 + i)}`,
        ifscOrRoutingCode: 'ICIC0008888',
        category: 'Contractor',
        status: 'Suspended'
      });

      // 5 burst transactions with failed/reversed status
      for (let d = 1; d <= 5; d++) {
        disbursements.push({
          disbursementId: `DISB-ANOM-VEL-${i}-${d}`,
          beneficiaryId: benId,
          amount: 600000,
          currency: 'INR',
          disbursementDate: `2024-03-15T14:00:00.000Z`,
          programCode: 'SCHEME-INFRA-2024',
          paymentChannel: 'NEFT',
          status: d % 2 === 0 ? 'Failed' : 'Reversed'
        });
      }
    }

    return {
      beneficiaries,
      disbursements,
      edges,
      anomalousEntityIds
    };
  }
}

export const syntheticGenerator = new SyntheticDatasetGenerator();
