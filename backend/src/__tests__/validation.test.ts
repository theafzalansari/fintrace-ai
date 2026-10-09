import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateBeneficiaryRecord } from '../validators/beneficiaryValidator.js';
import { validateDisbursementRecord } from '../validators/disbursementValidator.js';

describe('Zod Record Validators', () => {
  describe('Beneficiary Validator', () => {
    it('should validate a valid beneficiary record', () => {
      const validRecord = {
        beneficiaryId: 'BEN-999',
        name: 'Anita Sharma',
        bankAccountNumber: '987654321098',
        ifscOrRoutingCode: 'SBIN0004321',
        category: 'Individual',
        phone: '+919999988888',
        email: 'anita@example.com',
        address: 'Delhi',
        status: 'Active'
      };

      const result = validateBeneficiaryRecord(validRecord);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.beneficiaryId, 'BEN-999');
        assert.strictEqual(result.data.name, 'Anita Sharma');
      }
    });

    it('should reject a beneficiary with missing required fields', () => {
      const invalidRecord = {
        beneficiaryId: '',
        name: '',
        bankAccountNumber: '',
        ifscOrRoutingCode: ''
      };

      const result = validateBeneficiaryRecord(invalidRecord);
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const paths = result.error.issues.map(i => i.path.join('.'));
        assert.ok(paths.includes('beneficiaryId'));
        assert.ok(paths.includes('name'));
        assert.ok(paths.includes('bankAccountNumber'));
        assert.ok(paths.includes('ifscOrRoutingCode'));
      }
    });

    it('should reject a beneficiary with invalid email format', () => {
      const invalidRecord = {
        beneficiaryId: 'BEN-100',
        name: 'Test User',
        bankAccountNumber: '12345678',
        ifscOrRoutingCode: 'HDFC0001234',
        email: 'not-an-email'
      };

      const result = validateBeneficiaryRecord(invalidRecord);
      assert.strictEqual(result.success, false);
    });
  });

  describe('Disbursement Validator', () => {
    it('should validate a valid disbursement record with string amount and date coercion', () => {
      const validRecord = {
        disbursementId: 'DISB-100',
        beneficiaryId: 'BEN-999',
        amount: '50000.75',
        currency: 'INR',
        disbursementDate: '2024-03-15',
        programCode: 'SCHEME-TEST',
        paymentChannel: 'NEFT',
        status: 'Completed'
      };

      const result = validateDisbursementRecord(validRecord);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.amount, 50000.75);
        assert.ok(result.data.disbursementDate instanceof Date);
      }
    });

    it('should reject negative or zero disbursement amounts', () => {
      const invalidRecord = {
        disbursementId: 'DISB-101',
        beneficiaryId: 'BEN-999',
        amount: -500,
        disbursementDate: '2024-03-15',
        programCode: 'SCHEME-TEST'
      };

      const result = validateDisbursementRecord(invalidRecord);
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const amountIssue = result.error.issues.find(i => i.path.includes('amount'));
        assert.ok(amountIssue);
      }
    });

    it('should reject invalid dates', () => {
      const invalidRecord = {
        disbursementId: 'DISB-102',
        beneficiaryId: 'BEN-999',
        amount: 1000,
        disbursementDate: 'invalid-date-string',
        programCode: 'SCHEME-TEST'
      };

      const result = validateDisbursementRecord(invalidRecord);
      assert.strictEqual(result.success, false);
    });
  });
});
