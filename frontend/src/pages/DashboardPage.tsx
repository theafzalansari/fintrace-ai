import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CsvUploadModal } from '../components/ui/CsvUploadModal';
import { useHealth } from '../hooks/useHealth';
import { api } from '../lib/api';
import {
  BeneficiaryRecord,
  DisbursementRecord,
  GraphResponseData,
  RiskAnalysisResponseData
} from '../types';
import {
  ShieldAlert,
  Network,
  Cpu,
  FileSpreadsheet,
  ArrowUpRight,
  Database,
  CheckCircle2,
  AlertCircle,
  Users,
  IndianRupee,
  Upload,
  ChevronRight
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate?: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { health, loading: healthLoading } = useHealth();

  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryRecord[]>([]);
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>([]);
  const [graphData, setGraphData] = useState<GraphResponseData | null>(null);
  const [riskData, setRiskData] = useState<RiskAnalysisResponseData | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadType, setUploadType] = useState<'beneficiary' | 'disbursement'>('beneficiary');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [benRes, disbRes, graphRes, riskRes] = await Promise.all([
        api.getBeneficiaries().catch(() => ({ success: false, count: 0, data: [] })),
        api.getDisbursements().catch(() => ({ success: false, count: 0, data: [] })),
        api.getGraphAnalysis().catch(() => ({ success: false, data: { nodes: [], edges: [], summary: { totalNodes: 0, totalEdges: 0, beneficiaryCount: 0, payoutAccountCount: 0, disbursementCount: 0 } } })),
        api.getRiskAnalysis().catch(() => ({ success: false, data: { findings: [], summary: { totalEntitiesAssessed: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 } } }))
      ]);

      setBeneficiaries(benRes.data || []);
      setDisbursements(disbRes.data || []);
      setGraphData(graphRes.data || null);
      setRiskData(riskRes.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalPayoutVolume = disbursements.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const highRiskCount = riskData?.summary?.highRiskCount || 0;
  const mediumRiskCount = riskData?.summary?.mediumRiskCount || 0;
  const totalNodes = graphData?.summary?.totalNodes || 0;
  const totalEdges = graphData?.summary?.totalEdges || 0;

  const handleOpenUpload = (type: 'beneficiary' | 'disbursement') => {
    setUploadType(type);
    setIsUploadOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Clean Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Audit Workspace Overview
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Real-time forensic ledger validation, adjacency-list graph construction, and explainable risk scoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleOpenUpload('beneficiary')}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Ingest Beneficiaries
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleOpenUpload('disbursement')}>
            Ingest Disbursements
            <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">Beneficiary Registry</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-2">
            {loading ? '...' : beneficiaries.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Ingested beneficiary records
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">Total Payout Volume</span>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-2">
            {loading ? '...' : `₹${totalPayoutVolume.toLocaleString('en-IN')}`}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Across {disbursements.length} disbursement records
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">High Risk Flags</span>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-2">
            {loading ? '...' : highRiskCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            + {mediumRiskCount} medium risk flags
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">Adjacency Graph</span>
            <Network className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-2">
            {loading ? '...' : `${totalNodes} Nodes`}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Connected by {totalEdges} edges
          </p>
        </Card>
      </div>

      {/* Backend Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">Backend API Status</span>
            <Cpu className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            {healthLoading ? (
              <span className="text-slate-500 text-xs">Checking...</span>
            ) : health?.status === 'ok' ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">ONLINE</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-500">OFFLINE</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Environment: {health?.environment || 'development'}
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">Ingestion Pipeline</span>
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-mono">
            Zod Multi-Field Validation
          </div>
          <p className="text-[11px] text-slate-500">
            CSV & JSON parsing with line error reporting.
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">Audit Disclaimer</span>
            <Database className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-mono">
            Human Review Required
          </div>
          <p className="text-[11px] text-slate-500">
            Risk scores serve as indicators and require auditor sign-off.
          </p>
        </Card>
      </div>

      {/* Recent High Risk Findings Table */}
      <Card>
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Recent High Risk Findings
              </CardTitle>
              <CardDescription>
                Top rule-based risk findings requiring forensic human review.
              </CardDescription>
            </div>
            {onNavigate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('investigations')}
                className="text-xs text-blue-500"
              >
                View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              Loading risk findings...
            </div>
          ) : !riskData || riskData.findings.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs space-y-2">
              <p>No risk findings recorded. Ingest a CSV dataset to analyze beneficiary risk signals.</p>
              <Button variant="outline" size="sm" onClick={() => handleOpenUpload('beneficiary')}>
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Ingest Beneficiaries CSV
              </Button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-mono">
                  <th className="py-2.5 px-4 font-semibold">ENTITY ID</th>
                  <th className="py-2.5 px-4 font-semibold">NAME</th>
                  <th className="py-2.5 px-4 font-semibold">RISK SCORE</th>
                  <th className="py-2.5 px-4 font-semibold">EXPLANATION</th>
                  <th className="py-2.5 px-4 font-semibold">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-300">
                {riskData.findings.slice(0, 5).map((finding) => (
                  <tr key={finding.entityId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{finding.entityId}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">{finding.name}</td>
                    <td className="py-2.5 px-4">
                      <Badge variant={finding.riskLevel === 'HIGH' ? 'danger' : finding.riskLevel === 'MEDIUM' ? 'warning' : 'success'}>
                        {finding.riskLevel}: {finding.riskScore}/100
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 truncate max-w-xs">
                      {finding.explanations[0] || 'Flagged for review'}
                    </td>
                    <td className="py-2.5 px-4">
                      {onNavigate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigate('investigations')}
                          className="text-[11px] py-1 px-2"
                        >
                          Inspect
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        type={uploadType}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};
