import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import {
  generateRiskFindingsCsv,
  downloadCsvFile,
  triggerPrintReport
} from '../lib/reportUtils';
import {
  BeneficiaryRecord,
  DisbursementRecord,
  RiskAnalysisResponseData,
  RiskFinding
} from '../types';
import {
  FileText,
  Printer,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Building2,
  FileCode,
  Info
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryRecord[]>([]);
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>([]);
  const [riskData, setRiskData] = useState<RiskAnalysisResponseData | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reportTimestamp, setReportTimestamp] = useState<string>('');
  const [reportId, setReportId] = useState<string>('');

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');

      setReportTimestamp(formattedDate);
      setReportId(`RPT-${dateCode}-${randomSuffix}`);

      const [benRes, disbRes, riskRes] = await Promise.all([
        api.getBeneficiaries().catch(() => ({ success: false, count: 0, data: [] })),
        api.getDisbursements().catch(() => ({ success: false, count: 0, data: [] })),
        api.getRiskAnalysis().catch(() => ({ success: false, data: { findings: [], summary: { totalEntitiesAssessed: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 } } }))
      ]);

      setBeneficiaries(benRes.data || []);
      setDisbursements(disbRes.data || []);
      setRiskData(riskRes.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audit report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const totalBeneficiaries = beneficiaries.length;
  const totalDisbursements = disbursements.length;
  const totalPayoutVolume = disbursements.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const findings: RiskFinding[] = riskData?.findings || [];
  const totalFindings = riskData?.summary?.totalEntitiesAssessed ?? findings.length;
  const highRiskCount = riskData?.summary?.highRiskCount ?? findings.filter(f => f.riskLevel === 'HIGH').length;
  const mediumRiskCount = riskData?.summary?.mediumRiskCount ?? findings.filter(f => f.riskLevel === 'MEDIUM').length;
  const lowRiskCount = riskData?.summary?.lowRiskCount ?? findings.filter(f => f.riskLevel === 'LOW').length;

  const handleExportCsv = () => {
    const csvContent = generateRiskFindingsCsv(findings);
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadCsvFile(csvContent, `fintrace-risk-findings-${dateStamp}.csv`);
  };

  const handleDownloadPdf = () => {
    triggerPrintReport();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto print-only-container">
      {/* Page Header Bar (Hidden during PDF print) */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Milestone: Automated Audit Reports</Badge>
            <Badge variant="outline">PDF & CSV Engine</Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            Automated Audit Reports
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Generate and export forensic audit summaries, severity distributions, and machine-readable risk findings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadReportData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={loading}>
            <FileCode className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
            Export CSV Findings
          </Button>
          <Button variant="primary" size="sm" onClick={handleDownloadPdf} disabled={loading}>
            <Printer className="w-4 h-4 mr-2" />
            Download PDF Report
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="no-print p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadReportData}>
            Retry Loading Data
          </Button>
        </div>
      )}

      {/* Printable PDF Audit Report Banner & Card Container */}
      <div className="space-y-6">
        {!loading && totalBeneficiaries === 0 && totalDisbursements === 0 ? (
          <Card className="p-12 text-center space-y-4 border-dashed border-slate-300 dark:border-slate-800">
            <FileText className="w-12 h-12 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Audit Data Available</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No beneficiary or disbursement records have been ingested into the workspace yet. Ingest CSV records to generate an official forensic audit report.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="primary" size="sm" onClick={loadReportData}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Refresh Telemetry
              </Button>
            </div>
          </Card>
        ) : (
          /* Printable Report Document Card */
          <Card className="print-card border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800/80 pb-6 print:border-slate-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase print-text-dark">
                    FinTrace AI • Forensic Audit Record
                  </span>
                  <Badge variant="outline" className="no-print">Official Summary</Badge>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white print-text-dark">
                  Beneficiary & Disbursement Micro-Audit Report
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-xs print-text-muted">
                  Automated risk indicator analysis generated from live backend database records.
                </CardDescription>
              </div>

              <div className="text-left md:text-right space-y-1 text-xs font-mono text-slate-600 dark:text-slate-400 print-text-muted shrink-0">
                <div><span className="font-semibold text-slate-800 dark:text-slate-300 print-text-dark">Report ID:</span> {reportId || 'RPT-20261009-1001'}</div>
                <div><span className="font-semibold text-slate-800 dark:text-slate-300 print-text-dark">Generated:</span> {reportTimestamp || '2026-10-09 16:46:44 UTC'}</div>
                <div><span className="font-semibold text-slate-800 dark:text-slate-300 print-text-dark">Engine:</span> Rule-Based Adjacency Matrix</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-8">
            {/* Audit Summary Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider font-mono print-text-dark flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Audit Scope & Summary Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 print-card">
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-mono print-text-muted">Beneficiaries</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1 print-text-dark">
                    {loading ? '...' : totalBeneficiaries}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 print-text-muted">Assessed records</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 print-card">
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-mono print-text-muted">Disbursements</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1 print-text-dark">
                    {loading ? '...' : totalDisbursements}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 print-text-muted">Executed transactions</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 print-card">
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-mono print-text-muted">Total Volume</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 print-text-dark">
                    {loading ? '...' : `₹${totalPayoutVolume.toLocaleString('en-IN')}`}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 print-text-muted">Total payout amount</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 print-card">
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-mono print-text-muted">Assessed Findings</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono mt-1 print-text-dark">
                    {loading ? '...' : totalFindings}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 print-text-muted">Risk indicators evaluated</div>
                </div>
              </div>
            </div>

            {/* Risk Severity Distribution */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider font-mono print-text-dark flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-red-400" />
                Risk Finding Severity Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-red-950/30 border border-rose-200 dark:border-red-500/30 print-badge-high">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-rose-700 dark:text-red-400 uppercase">High Risk</span>
                    <Badge variant="danger">{highRiskCount}</Badge>
                  </div>
                  <div className="text-2xl font-extrabold text-rose-700 dark:text-red-400 font-mono mt-2">
                    {loading ? '...' : highRiskCount} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">findings</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Severe anomaly threshold (Score ≥ 70). Shared payout accounts or ghost clusters.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 print-badge-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-800 dark:text-amber-400 uppercase">Medium Risk</span>
                    <Badge variant="warning">{mediumRiskCount}</Badge>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-800 dark:text-amber-400 font-mono mt-2">
                    {loading ? '...' : mediumRiskCount} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">findings</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Moderate risk score (40–69). Shared contact channels or repeated disbursements.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 print-badge-low">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 uppercase">Low / Clear</span>
                    <Badge variant="success">{lowRiskCount}</Badge>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-2">
                    {loading ? '...' : lowRiskCount} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">findings</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Standard risk profile (Score &lt; 40). No suspicious cross-links detected.
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Findings Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider font-mono print-text-dark flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  Detailed Assessed Risk Findings Table
                </h3>
                <span className="text-xs text-slate-600 dark:text-slate-500 font-mono print-text-muted">
                  Showing {findings.length} item{findings.length === 1 ? '' : 's'}
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  Evaluating risk indicators and preparing finding matrix...
                </div>
              ) : findings.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center text-slate-600 dark:text-slate-400 text-xs space-y-2 print-card">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <p className="font-semibold text-slate-800 dark:text-slate-200 print-text-dark">No Risk Findings Recorded</p>
                  <p className="text-slate-500 max-w-md mx-auto print-text-muted">
                    The audit dataset currently contains zero flagged risk indicators or shared-link entities.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 print:border-slate-300">
                  <table className="w-full text-left text-xs font-mono print-table">
                    <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print-text-dark">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Entity ID & Name</th>
                        <th className="py-3 px-4 font-semibold">Score / Level</th>
                        <th className="py-3 px-4 font-semibold">Triggered Rule Signals</th>
                        <th className="py-3 px-4 font-semibold">Forensic Explanations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 print:divide-slate-300 text-slate-800 dark:text-slate-300 print-text-dark">
                      {findings.map((finding) => (
                        <tr key={finding.entityId} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          <td className="py-3.5 px-4 font-sans font-medium">
                            <div className="font-bold text-slate-900 dark:text-white text-sm print-text-dark">{finding.name}</div>
                            <div className="text-xs font-mono text-blue-600 dark:text-blue-400 print-text-muted">{finding.entityId}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={finding.riskLevel === 'HIGH' ? 'danger' : finding.riskLevel === 'MEDIUM' ? 'warning' : 'success'}>
                              {finding.riskLevel} ({finding.riskScore}/100)
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            {finding.signals && finding.signals.length > 0 ? (
                              <div className="space-y-1">
                                {finding.signals.map((sig, sIdx) => (
                                  <div key={sIdx} className="text-[11px] text-slate-700 dark:text-slate-300 print-text-dark">
                                    <span className="font-semibold text-amber-700 dark:text-amber-400 print-text-dark">• {sig.ruleId}</span> ({sig.severity}): +{sig.points} pts
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic print-text-muted">None</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-sans text-slate-600 dark:text-slate-400 print-text-dark">
                            {finding.explanations && finding.explanations.length > 0 ? (
                              <ul className="list-disc list-inside space-y-0.5">
                                {finding.explanations.map((exp, eIdx) => (
                                  <li key={eIdx}>{exp}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-slate-500 italic print-text-muted">No explanatory flags</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Mandatory Forensic Disclaimers & Notes */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3 text-xs print:border-slate-300">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 print-card space-y-1">
                <div className="flex items-center gap-2 font-bold font-mono text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Forensic Review Protocol & Legal Disclaimer
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-200/90 leading-relaxed font-sans print-text-dark">
                  AUTOMATED RISK INDICATORS REQUIRE HUMAN REVIEW AND ARE NOT PROOF OF FRAUD. All scores and signals generated by FinTrace AI serve strictly as risk indicators to prioritize manual investigative review.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 print-card space-y-1">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-300 font-mono print-text-dark">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  Data Source Note
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans print-text-muted">
                  This audit report aggregates active beneficiary and disbursement ledger records stored in the FinTrace database. Synthetic demonstration data is distinguished from real production records where flagged in record metadata.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
};
