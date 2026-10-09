import { describe, it } from 'node:test';
import assert from 'node:assert';
import { escapeCsvField, generateRiskFindingsCsv, RiskFindingForCsv } from '../utils/csvExporter.js';

describe('CSV Report Exporter', () => {
  describe('escapeCsvField', () => {
    it('should return empty string for null and undefined', () => {
      assert.strictEqual(escapeCsvField(null), '');
      assert.strictEqual(escapeCsvField(undefined), '');
    });

    it('should return simple text unquoted', () => {
      assert.strictEqual(escapeCsvField('BEN-001'), 'BEN-001');
      assert.strictEqual(escapeCsvField(95), '95');
    });

    it('should escape strings containing commas', () => {
      assert.strictEqual(escapeCsvField('NGO, Inc.'), '"NGO, Inc."');
    });

    it('should double-escape internal quotes and wrap in quotes', () => {
      assert.strictEqual(escapeCsvField('John "Johnny" Doe'), '"John ""Johnny"" Doe"');
    });

    it('should escape strings containing newlines', () => {
      assert.strictEqual(escapeCsvField('Line 1\nLine 2'), '"Line 1\nLine 2"');
    });
  });

  describe('generateRiskFindingsCsv', () => {
    it('should handle empty findings array without crashing and return headers', () => {
      const result = generateRiskFindingsCsv([]);
      assert.strictEqual(typeof result, 'string');
      const lines = result.trim().split('\n');
      assert.strictEqual(lines.length, 1);
      assert.ok(lines[0].startsWith('Finding Index,Entity ID,Entity Name'));
    });

    it('should format populated findings into CSV with headers and escaped fields', () => {
      const sampleFindings: RiskFindingForCsv[] = [
        {
          entityId: 'BEN-001',
          name: 'Apex Global, LLC',
          entityType: 'beneficiary',
          riskScore: 85,
          riskLevel: 'HIGH',
          signals: [
            { ruleId: 'R01_SHARED_BANK', severity: 'HIGH', points: 40, description: 'Shared Bank Account' },
            { ruleId: 'R02_SHARED_PHONE', severity: 'MEDIUM', points: 25, description: 'Shared Phone' }
          ],
          explanations: [
            'Shared payout account with BEN-002',
            'Phone number shared with 2 other entities'
          ],
          disclaimer: 'Automated risk indicators require human review and are not proof of fraud.'
        }
      ];

      const csv = generateRiskFindingsCsv(sampleFindings);
      const lines = csv.split('\n');
      assert.strictEqual(lines.length, 2);

      // Check header row
      assert.ok(lines[0].includes('Entity ID'));

      // Check data row
      assert.ok(lines[1].includes('BEN-001'));
      assert.ok(lines[1].includes('"Apex Global, LLC"')); // comma escaped
      assert.ok(lines[1].includes('R01_SHARED_BANK (HIGH)'));
      assert.ok(lines[1].includes('Shared payout account with BEN-002 | Phone number shared with 2 other entities'));
    });
  });
});
