import { RiskFinding } from '../types';

/**
 * Escapes a single value for CSV compliance (RFC 4180 style).
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
 * Handles empty arrays cleanly by returning valid headers.
 */
export function generateRiskFindingsCsv(findings: RiskFinding[]): string {
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

/**
 * Triggers a client-side file download of CSV content in the browser.
 */
export function downloadCsvFile(content: string, filename: string = 'fintrace-risk-findings.csv'): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers native browser print dialog for exporting the page to PDF.
 */
export function triggerPrintReport(): void {
  window.print();
}
