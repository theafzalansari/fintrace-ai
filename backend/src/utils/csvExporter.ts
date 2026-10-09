export interface RiskFindingForCsv {
  entityId: string;
  name: string;
  entityType?: string;
  riskScore: number;
  riskLevel: string;
  disclaimer?: string;
  signals?: Array<{ ruleId: string; severity: string; points: number; description: string }>;
  explanations?: string[];
}

/**
 * Escapes a single value for CSV compliance (RFC 4180 style).
 * Wraps in double quotes if it contains commas, quotes, or newlines.
 * Internal quotes are escaped by doubling them.
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates structured CSV string from array of risk findings.
 * Returns valid header-only CSV when input is empty.
 */
export function generateRiskFindingsCsv(findings: RiskFindingForCsv[]): string {
  const headers = [
    'Finding Index',
    'Entity ID',
    'Entity Name',
    'Entity Type',
    'Risk Score',
    'Severity Level',
    'Triggered Rules',
    'Detailed Explanations',
    'Forensic Disclaimer'
  ];

  const headerLine = headers.map(escapeCsvField).join(',');

  if (!findings || findings.length === 0) {
    return headerLine;
  }

  const rows = findings.map((f, idx) => {
    const rules = f.signals
      ? f.signals.map(s => `${s.ruleId} (${s.severity})`).join('; ')
      : '';
    const explanations = f.explanations ? f.explanations.join(' | ') : '';

    return [
      idx + 1,
      f.entityId,
      f.name,
      f.entityType || 'beneficiary',
      f.riskScore,
      f.riskLevel,
      rules,
      explanations,
      f.disclaimer || 'Automated risk indicators require human review and are not proof of fraud.'
    ]
      .map(escapeCsvField)
      .join(',');
  });

  return [headerLine, ...rows].join('\n');
}
