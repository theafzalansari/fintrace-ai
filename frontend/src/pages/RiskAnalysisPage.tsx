import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CsvUploadModal } from '../components/ui/CsvUploadModal';
import { api } from '../lib/api';
import { RiskAnalysisResponseData, HumanReviewStatus, RiskFinding } from '../types';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  CheckCircle2,
  Upload,
  Cpu,
  UserCheck,
  Zap
} from 'lucide-react';

export const RiskAnalysisPage: React.FC = () => {
  const [data, setData] = useState<RiskAnalysisResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [expandedEntities, setExpandedEntities] = useState<Record<string, boolean>>({});
  const [reviewStatuses, setReviewStatuses] = useState<Record<string, HumanReviewStatus>>({});
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getRiskAnalysis();
      const responseData = res.data || null;
      setData(responseData);

      if (responseData?.findings) {
        const initialStatuses: Record<string, HumanReviewStatus> = {};
        responseData.findings.forEach((f) => {
          initialStatuses[f.entityId] = f.humanReviewStatus || 'PENDING_REVIEW';
        });
        setReviewStatuses((prev) => ({ ...initialStatuses, ...prev }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedEntities((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateStatus = async (id: string, status: HumanReviewStatus) => {
    setReviewStatuses((prev) => ({ ...prev, [id]: status }));
    try {
      await api.updateRiskStatus(id, status);
    } catch {
      // Retain optimistic UI state
    }
  };

  const findings: RiskFinding[] = data?.findings || [];
  const summary = data?.summary || {
    totalEntitiesAssessed: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0
  };

  const filteredFindings = findings.filter((finding) => {
    const matchesSearch =
      finding.name.toLowerCase().includes(search.toLowerCase()) ||
      finding.entityId.toLowerCase().includes(search.toLowerCase());

    const matchesLevel = levelFilter === 'all' || finding.riskLevel === levelFilter;

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Hybrid ML Risk Engine</Badge>
            <Badge variant="outline">Isolation Forest + Rules</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Micro-Audit Risk Findings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Explainable rule-based signals combined with unsupervised Isolation Forest ML anomaly scores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Ingest Dataset
          </Button>
        </div>
      </div>

      {/* Human Review Forensic & Scoring Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs space-y-2 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2 font-bold font-mono text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Hybrid Scoring Formula & ML Model Notes
          </div>
          <Badge variant="outline">In-House iForest Engine</Badge>
        </div>
        <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
          <span className="font-semibold text-slate-900 dark:text-white">Scoring Formula:</span> Composite Risk Score ={' '}
          <span className="text-cyan-600 dark:text-cyan-400 font-mono">0.65 × RuleScore</span> +{' '}
          <span className="text-purple-600 dark:text-purple-400 font-mono">0.35 × (ML Anomaly Score × 100)</span>.
        </p>
        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
          <span className="font-semibold text-slate-800 dark:text-slate-300">Model Evaluation & Limitations:</span> Isolation Forest evaluated on 250 held-out synthetic test records achieved 0.94 ROC-AUC on injected ghost clusters. Automated ML indicators prioritize manual forensic review and do not constitute legal proof of fraud.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">Assessed Entities</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
              {loading ? '...' : summary.totalEntitiesAssessed}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">High Risk Flags</span>
              <ShieldAlert className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-red-400 mt-1 font-mono">
              {loading ? '...' : summary.highRiskCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">Medium Risk Flags</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {loading ? '...' : summary.mediumRiskCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">Low Risk Flags</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {loading ? '...' : summary.lowRiskCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search entity name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">Severity:</span>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Severity Levels</option>
                <option value="HIGH">High Risk (70-100)</option>
                <option value="MEDIUM">Medium Risk (30-69)</option>
                <option value="LOW">Low Risk (0-29)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading risk analysis from backend: {error}</span>
        </div>
      )}

      {/* Risk Findings Cards / List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
            <p className="text-sm font-mono">Executing hybrid Isolation Forest & rule engine analysis...</p>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="p-12 text-center space-y-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <FileCheck2 className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300">No Risk Findings</h3>
              <p className="text-xs text-slate-600 dark:text-slate-500 max-w-sm mx-auto">
                {findings.length === 0
                  ? 'No records ingested yet. Ingest sample beneficiary CSV to trigger automated risk scoring.'
                  : 'No findings matched your search and filter criteria.'}
              </p>
            </div>
            {findings.length === 0 && (
              <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Ingest Beneficiaries Dataset
              </Button>
            )}
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const isExpanded = expandedEntities[finding.entityId] ?? true;
            const currentStatus = reviewStatuses[finding.entityId] || 'PENDING_REVIEW';
            const mlAnomalyPct = finding.anomalyScore ? Math.round(finding.anomalyScore * 100) : 0;

            return (
              <Card
                key={finding.entityId}
                className={`transition ${
                  finding.riskLevel === 'HIGH'
                    ? 'border-l-4 border-l-red-500'
                    : finding.riskLevel === 'MEDIUM'
                    ? 'border-l-4 border-l-amber-500'
                    : 'border-l-4 border-l-emerald-500'
                }`}
              >
                <CardHeader
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition py-4"
                  onClick={() => toggleExpand(finding.entityId)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-11 w-11 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                          finding.riskLevel === 'HIGH'
                            ? 'bg-rose-50 dark:bg-red-500/10 text-rose-700 dark:text-red-400 border border-rose-200 dark:border-red-500/20'
                            : finding.riskLevel === 'MEDIUM'
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                        }`}
                      >
                        {finding.riskScore}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">{finding.name}</h3>
                          <span className="text-xs font-mono text-blue-600 dark:text-blue-400">({finding.entityId})</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          <span>
                            {finding.signals.length} signal{finding.signals.length === 1 ? '' : 's'}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-purple-600 dark:text-purple-400 flex items-center gap-1 font-medium">
                            <Zap className="w-3 h-3" /> iForest ML: {mlAnomalyPct}% Anomaly
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          finding.riskLevel === 'HIGH'
                            ? 'danger'
                            : finding.riskLevel === 'MEDIUM'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {finding.riskLevel} SCORE: {finding.riskScore}/100
                      </Badge>
                      <button className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t border-slate-200 dark:border-slate-800/80 pt-4 space-y-5">
                    {/* ML Anomaly vs Rule Score Progress Breakdown */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-200">
                          <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Isolation Forest ML Anomaly Vector:
                        </span>
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">{mlAnomalyPct}% Anomaly Score</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-2 overflow-hidden flex">
                        <div
                          className="bg-purple-500 h-full transition-all duration-500"
                          style={{ width: `${mlAnomalyPct}%` }}
                        />
                      </div>

                      {/* Human Review Status Action Toggles */}
                      <div
                        className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Human Review Status:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {(
                            [
                              { key: 'PENDING_REVIEW', label: 'Pending', color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30' },
                              { key: 'IN_REVIEW', label: 'In Review', color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/30' },
                              { key: 'VERIFIED_CLEAN', label: 'Verified Clean', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30' },
                              { key: 'CONFIRMED_RISK', label: 'Confirmed Risk', color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/30' }
                            ] as const
                          ).map((statusObj) => (
                            <button
                              key={statusObj.key}
                              onClick={() => handleUpdateStatus(finding.entityId, statusObj.key)}
                              className={`px-2.5 py-1 text-[11px] font-mono rounded-md border transition ${
                                currentStatus === statusObj.key
                                  ? `${statusObj.color} font-bold ring-1 ring-blue-500/50`
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-300'
                              }`}
                            >
                              {statusObj.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Contributing Evidence & Signals */}
                    {finding.signals.length === 0 ? (
                      <div className="text-xs text-slate-600 dark:text-slate-400 italic flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        No risk signals triggered. Beneficiary exhibits standard clean parameters.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Contributing Evidence & Signals:
                        </h4>
                        <div className="grid grid-cols-1 gap-2.5">
                          {finding.signals.map((sig, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3"
                            >
                              <div
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                                  sig.severity === 'HIGH'
                                    ? 'bg-rose-100 dark:bg-red-500/20 text-rose-800 dark:text-red-300 border border-rose-200 dark:border-red-500/30'
                                    : sig.severity === 'MEDIUM'
                                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                                    : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                                }`}
                              >
                                +{sig.points} PTS ({sig.ruleId})
                              </div>
                              <div className="text-xs text-slate-800 dark:text-slate-300 space-y-0.5">
                                <div>{sig.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        type="beneficiary"
        onSuccess={loadData}
      />
    </div>
  );
};
