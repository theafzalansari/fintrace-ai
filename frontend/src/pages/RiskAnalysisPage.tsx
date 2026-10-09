import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CsvUploadModal } from '../components/ui/CsvUploadModal';
import { api } from '../lib/api';
import { RiskAnalysisResponseData } from '../types';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  CheckCircle2,
  Upload
} from 'lucide-react';

export const RiskAnalysisPage: React.FC = () => {
  const [data, setData] = useState<RiskAnalysisResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [expandedEntities, setExpandedEntities] = useState<Record<string, boolean>>({});
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getRiskAnalysis();
      setData(res.data || null);
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

  const findings = data?.findings || [];
  const summary = data?.summary || { totalEntitiesAssessed: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Explainable Forensic Audit</Badge>
            <Badge variant="outline">Rule-Based Vector Scoring</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
            Micro-Audit Risk Findings
          </h1>
          <p className="text-sm text-slate-400">
            Transparent scoring and evidence signals derived from automated ledger analysis.
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

      {/* Human Review Forensic Disclaimer */}
      <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-slate-300 text-xs flex items-start gap-3 shadow-lg">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-blue-300 uppercase font-mono tracking-wider">
            Forensic Audit Standard Disclaimer:
          </span>
          <p className="text-slate-300 leading-relaxed">
            {findings[0]?.disclaimer ||
              'Risk indicators are automated rule-based flags for forensic audit and require human review. They do not constitute conclusive proof of fraud.'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-mono font-medium text-slate-400">Assessed Entities</span>
            <div className="text-2xl font-bold text-white mt-1 font-mono">
              {loading ? '...' : summary.totalEntitiesAssessed}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-slate-400">High Risk Flags</span>
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400 mt-1 font-mono">
              {loading ? '...' : summary.highRiskCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-slate-400">Medium Risk Flags</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
              {loading ? '...' : summary.mediumRiskCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-slate-400">Low Risk Flags</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
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
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search entity name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">Severity:</span>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
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
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading risk analysis from backend: {error}</span>
        </div>
      )}

      {/* Risk Findings Cards / List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400" />
            <p className="text-sm font-mono">Executing risk scoring rules against backend dataset...</p>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="p-12 text-center space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800">
            <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-300">No Risk Findings</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                  className="cursor-pointer hover:bg-slate-900/40 transition py-4"
                  onClick={() => toggleExpand(finding.entityId)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                          finding.riskLevel === 'HIGH'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : finding.riskLevel === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {finding.riskScore}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{finding.name}</h3>
                          <span className="text-xs font-mono text-blue-400">({finding.entityId})</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {finding.signals.length} contributing risk signal{finding.signals.length === 1 ? '' : 's'} detected
                        </p>
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
                        {finding.riskLevel} RISK SCORE: {finding.riskScore}/100
                      </Badge>
                      <button className="text-slate-500 hover:text-white">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t border-slate-800/80 pt-4 space-y-4">
                    {finding.signals.length === 0 ? (
                      <div className="text-xs text-slate-400 italic flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        No risk signals triggered. Beneficiary exhibits standard clean parameters.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                          Contributing Evidence & Signals:
                        </h4>
                        <div className="grid grid-cols-1 gap-2.5">
                          {finding.signals.map((sig, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-3"
                            >
                              <div
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                                  sig.severity === 'HIGH'
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    : sig.severity === 'MEDIUM'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                +{sig.points} PTS ({sig.ruleId})
                              </div>
                              <div className="text-xs text-slate-300 space-y-0.5">
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
