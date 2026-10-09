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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 p-8 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="cyan">Real Backend Integrated</Badge>
              <Badge variant="outline">Live MongoDB Connection</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              FinTrace <span className="text-blue-500">AI</span> Audit Dashboard
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm md:text-base">
              Automated Financial Micro-Audit & Ghost-Beneficiary Detection Engine. Powered by real-time forensic ledger validation, adjacency-list graph construction, and explainable risk scoring.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button variant="outline" size="md" onClick={() => handleOpenUpload('beneficiary')}>
              <Upload className="w-4 h-4 mr-2 text-blue-400" />
              Ingest Beneficiaries
            </Button>
            <Button variant="primary" size="md" onClick={() => handleOpenUpload('disbursement')}>
              Ingest Disbursements
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* Live Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-mono font-medium text-slate-400">Total Beneficiaries</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {loading ? '...' : beneficiaries.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Registered beneficiary records in live database.
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-mono font-medium text-slate-400">Total Payout Volume</CardTitle>
              <IndianRupee className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {loading ? '...' : `₹${totalPayoutVolume.toLocaleString('en-IN')}`}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Across {disbursements.length} disbursement records.
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-mono font-medium text-slate-400">High Risk Flags</CardTitle>
              <ShieldAlert className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400 font-mono">
              {loading ? '...' : highRiskCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              + {mediumRiskCount} medium risk flag{mediumRiskCount === 1 ? '' : 's'}.
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-mono font-medium text-slate-400">Web Graph Matrix</CardTitle>
              <Network className="h-4 w-4 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {loading ? '...' : `${totalNodes} Nodes`}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Linked via {totalEdges} relational edge{totalEdges === 1 ? '' : 's'}.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Backend System Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Backend Health API</CardTitle>
              <Cpu className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              {healthLoading ? (
                <span className="text-slate-500 text-sm">Ping status...</span>
              ) : health?.status === 'ok' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">ONLINE ({health.service})</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-400">OFFLINE</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Uptime: {health ? `${health.uptime.toFixed(1)}s` : 'N/A'} | Environment: {health?.environment || 'development'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Ingestion Pipeline</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-slate-300 font-mono">
              Zod Multi-Field Validation
            </div>
            <p className="text-[11px] text-slate-500">
              CSV file & JSON array ingestion with strict type coercion & line error reporting.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Audit Standard</CardTitle>
              <Database className="h-4 w-4 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-slate-300 font-mono">
              Human Review Protocol
            </div>
            <p className="text-[11px] text-slate-500">
              Scored flags serve as forensic risk indicators and do not constitute legal proof of fraud.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent High Risk Flags Preview */}
      <Card>
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Recent Risk Indicators & Ghost Cluster Flags
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
                className="text-blue-400 hover:text-blue-300 text-xs"
              >
                View All Risks <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              Fetching risk signals...
            </div>
          ) : !riskData || riskData.findings.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs space-y-2">
              <p>No risk findings recorded. Data matrix is clean or no dataset has been ingested yet.</p>
              <Button variant="outline" size="sm" onClick={() => handleOpenUpload('beneficiary')}>
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Ingest Beneficiary Dataset
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {riskData.findings.slice(0, 3).map((finding) => (
                <div key={finding.entityId} className="p-4 hover:bg-slate-900/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{finding.name}</span>
                      <span className="text-xs font-mono text-blue-400">({finding.entityId})</span>
                      <Badge variant={finding.riskLevel === 'HIGH' ? 'danger' : finding.riskLevel === 'MEDIUM' ? 'warning' : 'success'}>
                        {finding.riskLevel} RISK: {finding.riskScore}/100
                      </Badge>
                    </div>
                    {finding.explanations.length > 0 && (
                      <p className="text-xs text-slate-400">
                        • {finding.explanations[0]}
                      </p>
                    )}
                  </div>
                  {onNavigate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate('investigations')}
                      className="shrink-0 text-xs"
                    >
                      Inspect Risk Findings
                    </Button>
                  )}
                </div>
              ))}
            </div>
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
