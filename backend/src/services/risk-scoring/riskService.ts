import { ingestionService } from '../ingestion/ingestionService.js';
import { normalizePhone, normalizeEmail, normalizeAddress } from '../graph-analysis/graphService.js';

export interface RiskSignal {
  ruleId: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  points: number;
  description: string;
}

export interface RiskFinding {
  entityId: string;
  entityType: 'beneficiary';
  name: string;
  riskScore: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
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
  };
}

export const RISK_DISCLAIMER =
  'Risk indicators are automated rule-based flags for forensic audit and require human review. They do not constitute conclusive proof of fraud.';

export class RiskService {
  /**
   * Performs explainable rule-based risk scoring on all ingested beneficiaries.
   */
  public async calculateRisks(): Promise<RiskAnalysisResponseData> {
    const rawBeneficiaries = (await ingestionService.getBeneficiaries()) as any[];
    const rawDisbursements = (await ingestionService.getDisbursements()) as any[];

    // Group beneficiaries by attribute to detect clusters
    const bankAccountMap = new Map<string, any[]>();
    const phoneMap = new Map<string, any[]>();
    const emailMap = new Map<string, any[]>();
    const addressMap = new Map<string, any[]>();
    const identityHashMap = new Map<string, any[]>();

    // Map disbursements to beneficiary IDs
    const disbursementsByBenId = new Map<string, any[]>();
    for (const disb of rawDisbursements) {
      if (!disb.beneficiaryId) continue;
      if (!disbursementsByBenId.has(disb.beneficiaryId)) {
        disbursementsByBenId.set(disb.beneficiaryId, []);
      }
      disbursementsByBenId.get(disb.beneficiaryId)!.push(disb);
    }

    for (const ben of rawBeneficiaries) {
      if (!ben.beneficiaryId) continue;

      if (ben.bankAccountNumber && ben.bankAccountNumber.trim()) {
        const acc = ben.bankAccountNumber.trim();
        if (!bankAccountMap.has(acc)) bankAccountMap.set(acc, []);
        bankAccountMap.get(acc)!.push(ben);
      }

      const phone = normalizePhone(ben.phone);
      if (phone) {
        if (!phoneMap.has(phone)) phoneMap.set(phone, []);
        phoneMap.get(phone)!.push(ben);
      }

      const email = normalizeEmail(ben.email);
      if (email) {
        if (!emailMap.has(email)) emailMap.set(email, []);
        emailMap.get(email)!.push(ben);
      }

      const addr = normalizeAddress(ben.address);
      if (addr) {
        if (!addressMap.has(addr)) addressMap.set(addr, []);
        addressMap.get(addr)!.push(ben);
      }

      if (ben.identityHash && ben.identityHash.trim()) {
        const hash = ben.identityHash.trim();
        if (!identityHashMap.has(hash)) identityHashMap.set(hash, []);
        identityHashMap.get(hash)!.push(ben);
      }
    }

    const findings: RiskFinding[] = [];
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;

    for (const ben of rawBeneficiaries) {
      if (!ben.beneficiaryId) continue;
      const benId = ben.beneficiaryId;
      const signals: RiskSignal[] = [];

      // 1. Shared Payout Account Rule
      if (ben.bankAccountNumber && ben.bankAccountNumber.trim()) {
        const acc = ben.bankAccountNumber.trim();
        const sharedBens = bankAccountMap.get(acc) || [];
        if (sharedBens.length > 1) {
          const otherNames = sharedBens
            .filter((b) => b.beneficiaryId !== benId)
            .map((b) => `${b.name} (${b.beneficiaryId})`);
          const count = sharedBens.length;
          const points = count >= 3 ? 70 : 50;
          signals.push({
            ruleId: 'SHARED_PAYOUT_ACCOUNT',
            severity: 'HIGH',
            points,
            description: `Bank account ${acc} is shared by ${count} distinct beneficiaries: ${otherNames.join(', ')}.`
          });
        }
      }

      // 2. Duplicate Identity Hash Rule
      if (ben.identityHash && ben.identityHash.trim()) {
        const hash = ben.identityHash.trim();
        const sharedHashes = identityHashMap.get(hash) || [];
        if (sharedHashes.length > 1) {
          const otherNames = sharedHashes
            .filter((b) => b.beneficiaryId !== benId)
            .map((b) => `${b.name} (${b.beneficiaryId})`);
          signals.push({
            ruleId: 'DUPLICATE_IDENTITY_HASH',
            severity: 'HIGH',
            points: 40,
            description: `Shares identity hash (${hash}) with beneficiary: ${otherNames.join(', ')}.`
          });
        }
      }

      // 3. Beneficiary Status Rule
      if (ben.status === 'Flagged') {
        signals.push({
          ruleId: 'BENEFICIARY_STATUS_FLAG',
          severity: 'MEDIUM',
          points: 35,
          description: 'Beneficiary account status is marked as Flagged.'
        });
      } else if (ben.status === 'Suspended') {
        signals.push({
          ruleId: 'BENEFICIARY_STATUS_FLAG',
          severity: 'HIGH',
          points: 50,
          description: 'Beneficiary account status is marked as Suspended.'
        });
      }

      // 4. Shared Phone Rule
      const phone = normalizePhone(ben.phone);
      if (phone) {
        const sharedPhones = phoneMap.get(phone) || [];
        if (sharedPhones.length > 1) {
          const otherNames = sharedPhones
            .filter((b) => b.beneficiaryId !== benId)
            .map((b) => `${b.name} (${b.beneficiaryId})`);
          signals.push({
            ruleId: 'SHARED_PHONE_NUMBER',
            severity: 'LOW',
            points: 15,
            description: `Phone number (${ben.phone}) is shared with beneficiary: ${otherNames.join(', ')}.`
          });
        }
      }

      // 5. Shared Address Rule
      const addr = normalizeAddress(ben.address);
      if (addr) {
        const sharedAddrs = addressMap.get(addr) || [];
        if (sharedAddrs.length > 1) {
          const otherNames = sharedAddrs
            .filter((b) => b.beneficiaryId !== benId)
            .map((b) => `${b.name} (${b.beneficiaryId})`);
          signals.push({
            ruleId: 'SHARED_ADDRESS',
            severity: 'LOW',
            points: 10,
            description: `Physical address ("${ben.address}") is shared with beneficiary: ${otherNames.join(', ')}.`
          });
        }
      }

      // 6. Shared Email Rule
      const email = normalizeEmail(ben.email);
      if (email) {
        const sharedEmails = emailMap.get(email) || [];
        if (sharedEmails.length > 1) {
          const otherNames = sharedEmails
            .filter((b) => b.beneficiaryId !== benId)
            .map((b) => `${b.name} (${b.beneficiaryId})`);
          signals.push({
            ruleId: 'SHARED_EMAIL',
            severity: 'LOW',
            points: 10,
            description: `Email address (${ben.email}) is shared with beneficiary: ${otherNames.join(', ')}.`
          });
        }
      }

      // 7. Payment Patterns (Disbursement analysis)
      const benDisbs = disbursementsByBenId.get(benId) || [];
      if (benDisbs.length > 0) {
        const totalAmount = benDisbs.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        const count = benDisbs.length;
        const failedCount = benDisbs.filter((d) => d.status === 'Failed' || d.status === 'Reversed').length;

        if (totalAmount >= 500000) {
          signals.push({
            ruleId: 'HIGH_DISBURSEMENT_VOLUME',
            severity: 'MEDIUM',
            points: 15,
            description: `High cumulative disbursement total of ₹${totalAmount.toLocaleString()} across ${count} payments.`
          });
        }

        if (count >= 3) {
          signals.push({
            ruleId: 'HIGH_DISBURSEMENT_VELOCITY',
            severity: 'LOW',
            points: 15,
            description: `High disbursement frequency: received ${count} separate payments.`
          });
        }

        if (failedCount > 0) {
          signals.push({
            ruleId: 'SUSPICIOUS_PAYMENT_STATUS',
            severity: 'MEDIUM',
            points: 15,
            description: `History contains ${failedCount} failed or reversed disbursement records.`
          });
        }
      }

      // Calculate total raw score and clamp between 0 and 100
      const rawScore = signals.reduce((sum, s) => sum + s.points, 0);
      const riskScore = Math.min(100, Math.max(0, rawScore));

      let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (riskScore >= 70) {
        riskLevel = 'HIGH';
        highRiskCount++;
      } else if (riskScore >= 30) {
        riskLevel = 'MEDIUM';
        mediumRiskCount++;
      } else {
        lowRiskCount++;
      }

      findings.push({
        entityId: benId,
        entityType: 'beneficiary',
        name: ben.name || benId,
        riskScore,
        riskLevel,
        disclaimer: RISK_DISCLAIMER,
        signals,
        explanations: signals.map((s) => s.description)
      });
    }

    // Rank findings by risk score descending
    findings.sort((a, b) => b.riskScore - a.riskScore);

    return {
      findings,
      summary: {
        totalEntitiesAssessed: findings.length,
        highRiskCount,
        mediumRiskCount,
        lowRiskCount
      }
    };
  }
}

export const riskService = new RiskService();
