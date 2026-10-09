import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CsvUploadModal } from '../components/ui/CsvUploadModal';
import { api } from '../lib/api';
import { GraphResponseData, RiskAnalysisResponseData, RiskFinding } from '../types';
import {
  GitFork,
  RefreshCw,
  AlertCircle,
  Building2,
  Users,
  Filter,
  Info,
  Upload,
  Link,
  Search,
  ShieldAlert,
  Target,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { InteractiveForceGraph } from '../components/ui/InteractiveForceGraph';

export const NetworkGraphPage: React.FC = () => {
  const [data, setData] = useState<GraphResponseData | null>(null);
  const [riskData, setRiskData] = useState<RiskAnalysisResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Mode & Filter States
  const [viewMode, setViewMode] = useState<'risk' | 'all'>('risk'); // Default: Risk Investigation View
  const [severityFilter, setSeverityFilter] = useState<'all' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string>('all');
  const [relationFilter, setRelationFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [graphRes, riskRes] = await Promise.all([
        api.getGraphAnalysis().catch(() => ({ success: false, data: { nodes: [], edges: [], summary: { totalNodes: 0, totalEdges: 0, beneficiaryCount: 0, payoutAccountCount: 0, disbursementCount: 0 } } })),
        api.getRiskAnalysis().catch(() => ({ success: false, data: { findings: [], summary: { totalEntitiesAssessed: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0, pendingReviewCount: 0 } } }))
      ]);

      setData(graphRes.data || null);
      setRiskData(riskRes.data || null);

      // Deterministic Initial Focus: Select highest risk finding on initial load
      const findings = riskRes.data?.findings || [];
      const highRisk = findings.filter((f) => f.riskLevel === 'HIGH').sort((a, b) => b.riskScore - a.riskScore);
      const medRisk = findings.filter((f) => f.riskLevel === 'MEDIUM').sort((a, b) => b.riskScore - a.riskScore);
      
      const topRiskEntityId = highRisk[0]?.entityId || medRisk[0]?.entityId || (graphRes.data?.nodes[0]?.id || null);

      if (topRiskEntityId && !selectedNodeId) {
        setSelectedNodeId(topRiskEntityId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch network graph telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const nodes = data?.nodes || [];
  const edges = data?.edges || [];
  const findings = riskData?.findings || [];

  // Map of entityId -> RiskFinding for fast lookup
  const riskFindingMap = useMemo(() => {
    const map = new Map<string, RiskFinding>();
    findings.forEach((f) => {
      map.set(f.entityId, f);
    });
    return map;
  }, [findings]);

  // Compute summary statistics
  const summary = useMemo(() => {
    const highCount = findings.filter((f) => f.riskLevel === 'HIGH').length;
    const medCount = findings.filter((f) => f.riskLevel === 'MEDIUM').length;
    const benCount = nodes.filter((n) => n.type === 'beneficiary').length;
    const accCount = nodes.filter((n) => n.type === 'payout_account').length;
    const disbCount = nodes.filter((n) => n.type === 'disbursement').length;

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      beneficiaryCount: benCount,
      payoutAccountCount: accCount,
      disbursementCount: disbCount,
      highRiskCount: highCount,
      mediumRiskCount: medCount,
    };
  }, [nodes, edges, findings]);

  // Build Sub-graph Nodes and Edges based on View Mode and Severity Filters
  const { filteredNodes, filteredEdges } = useMemo(() => {
    if (nodes.length === 0) return { filteredNodes: [], filteredEdges: [] };

    if (viewMode === 'risk') {
      // 1. Filter Risk Findings by Severity Filter
      let targetFindings = findings;
      if (severityFilter === 'HIGH') {
        targetFindings = findings.filter((f) => f.riskLevel === 'HIGH');
      } else if (severityFilter === 'MEDIUM') {
        targetFindings = findings.filter((f) => f.riskLevel === 'MEDIUM');
      } else if (severityFilter === 'LOW') {
        targetFindings = findings.filter((f) => f.riskLevel === 'LOW');
      } else {
        // 'all' in Risk Mode defaults to HIGH and MEDIUM risk findings
        targetFindings = findings.filter((f) => f.riskLevel === 'HIGH' || f.riskLevel === 'MEDIUM');
      }

      const riskEntityIds = new Set(targetFindings.map((f) => f.entityId));

      // 2. Include 1-hop connected neighbors for risk entities
      const visibleNodeIds = new Set<string>();
      riskEntityIds.forEach((id) => visibleNodeIds.add(id));

      edges.forEach((edge) => {
        if (riskEntityIds.has(edge.source) || riskEntityIds.has(edge.target)) {
          visibleNodeIds.add(edge.source);
          visibleNodeIds.add(edge.target);
        }
      });

      // 3. Filter Nodes in View
      const subNodes = nodes.filter((node) => {
        if (!visibleNodeIds.has(node.id)) return false;
        const matchesType = nodeTypeFilter === 'all' || node.type === nodeTypeFilter;
        const matchesSearch =
          search === '' ||
          node.label.toLowerCase().includes(search.toLowerCase()) ||
          node.id.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
      });

      const subNodeIds = new Set(subNodes.map((n) => n.id));

      // 4. Rebuild Visible Edges (ONLY edges connecting visible nodes)
      const subEdges = edges.filter((edge) => {
        const matchesRelation = relationFilter === 'all' || edge.relation === relationFilter;
        return matchesRelation && subNodeIds.has(edge.source) && subNodeIds.has(edge.target);
      });

      return { filteredNodes: subNodes, filteredEdges: subEdges };
    } else {
      // All Relationships View
      const subNodes = nodes.filter((node) => {
        const matchesType = nodeTypeFilter === 'all' || node.type === nodeTypeFilter;
        const matchesSearch =
          search === '' ||
          node.label.toLowerCase().includes(search.toLowerCase()) ||
          node.id.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
      });

      const subNodeIds = new Set(subNodes.map((n) => n.id));

      const subEdges = edges.filter((edge) => {
        const matchesRelation = relationFilter === 'all' || edge.relation === relationFilter;
        return matchesRelation && (subNodeIds.has(edge.source) || subNodeIds.has(edge.target));
      });

      return { filteredNodes: subNodes, filteredEdges: subEdges };
    }
  }, [nodes, edges, findings, viewMode, severityFilter, nodeTypeFilter, relationFilter, search]);

  // Selected Node Object
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Selected Node Risk Finding (if any)
  const selectedNodeRisk = useMemo(() => {
    if (!selectedNodeId) return null;
    return riskFindingMap.get(selectedNodeId) || null;
  }, [selectedNodeId, riskFindingMap]);

  // Connected Edges for Selected Node
  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId);
  }, [edges, selectedNodeId]);

  // Preserve selection if node remains in filteredNodes; otherwise reset
  useEffect(() => {
    if (filteredNodes.length > 0) {
      const isStillVisible = filteredNodes.some((n) => n.id === selectedNodeId);
      if (!isStillVisible && selectedNodeId !== null) {
        // If selected node is no longer visible, reset to top risk node in current view
        const topVisibleRisk = filteredNodes.find((n) => riskFindingMap.has(n.id));
        setSelectedNodeId(topVisibleRisk ? topVisibleRisk.id : filteredNodes[0].id);
      }
    } else {
      setSelectedNodeId(null);
    }
  }, [filteredNodes, selectedNodeId, riskFindingMap]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Evidence-First Risk Graph</Badge>
            <Badge variant="outline">Adjacency Matrix</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Network Graph Explorer
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Interactive risk matrix linking suspicious beneficiaries, shared payout accounts, and transaction telemetry.
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

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">High Risk Leads</span>
              <ShieldAlert className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1 font-mono">
              {loading ? '...' : summary.highRiskCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Beneficiaries</span>
              <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-1 font-mono">
              {loading ? '...' : summary.beneficiaryCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Payout Accounts</span>
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {loading ? '...' : summary.payoutAccountCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Relationship Edges</span>
              <Link className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {loading ? '...' : summary.totalEdges}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Selector & Filters Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            {/* View Mode Toggle Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 mr-1">View Mode:</span>
              <button
                onClick={() => setViewMode('risk')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                  viewMode === 'risk'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Risk Investigation (Default)
              </button>

              <button
                onClick={() => setViewMode('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                  viewMode === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GitFork className="w-3.5 h-3.5" />
                All Relationships
              </button>
            </div>

            {/* Severity Filter Pills (Active in Risk Investigation Mode) */}
            {viewMode === 'risk' && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-slate-500 font-mono text-[11px]">Severity:</span>
                <button
                  onClick={() => setSeverityFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    severityFilter === 'all'
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All Risks ({summary.highRiskCount + summary.mediumRiskCount})
                </button>
                <button
                  onClick={() => setSeverityFilter('HIGH')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    severityFilter === 'HIGH'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  High ({summary.highRiskCount})
                </button>
                <button
                  onClick={() => setSeverityFilter('MEDIUM')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    severityFilter === 'MEDIUM'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                  }`}
                >
                  Medium ({summary.mediumRiskCount})
                </button>
              </div>
            )}
          </div>

          {/* Search and Secondary Select Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search entity name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Filter:
              </div>
              <select
                value={nodeTypeFilter}
                onChange={(e) => setNodeTypeFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Node Types</option>
                <option value="beneficiary">Beneficiaries</option>
                <option value="payout_account">Payout Accounts</option>
                <option value="disbursement">Disbursements</option>
              </select>

              <select
                value={relationFilter}
                onChange={(e) => setRelationFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Relationship Edges</option>
                <option value="SHARED_BANK_ACCOUNT">Shared Bank Account</option>
                <option value="SHARED_PHONE">Shared Phone Number</option>
                <option value="SHARED_ADDRESS">Shared Physical Address</option>
                <option value="SHARED_EMAIL">Shared Email</option>
                <option value="SHARED_IDENTITY_HASH">Shared Identity Hash</option>
                <option value="BENEFICIARY_PAYOUT_ACCOUNT">Beneficiary Payout Link</option>
                <option value="DISBURSED_TO">Disbursement Link</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading network graph telemetry: {error}</span>
        </div>
      )}

      {/* Main Visualizer + Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Graph Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <GitFork className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                {viewMode === 'risk' ? 'Risk Investigation Network' : 'Full Relationship Network'} ({filteredNodes.length} nodes, {filteredEdges.length} edges)
              </CardTitle>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> Beneficiary
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Account
                </span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Disbursement
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {loading ? (
              <div className="h-96 flex flex-col items-center justify-center text-slate-500 space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <p className="text-xs font-mono">Running hybrid risk analysis & graph layout...</p>
              </div>
            ) : filteredNodes.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-center space-y-4 p-6">
                <ShieldAlert className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                    {viewMode === 'risk' ? 'No Risk Findings Detected' : 'No Graph Nodes Match Filters'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    {nodes.length === 0
                      ? 'No beneficiaries ingested yet. Ingest a beneficiary CSV file to populate the graph.'
                      : viewMode === 'risk'
                      ? 'No entities in the current dataset match the selected severity filter. All records meet standard compliance parameters.'
                      : 'No graph nodes match your search query or dropdown filter selections.'}
                  </p>
                </div>
                {viewMode === 'risk' && nodes.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setViewMode('all')}>
                    <GitFork className="w-4 h-4 mr-2" />
                    Switch to All Relationships View
                  </Button>
                )}
                {nodes.length === 0 && (
                  <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Ingest Beneficiaries CSV
                  </Button>
                )}
              </div>
            ) : (
              <InteractiveForceGraph
                nodes={filteredNodes}
                edges={filteredEdges}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                riskFindingMap={riskFindingMap}
              />
            )}
          </CardContent>
        </Card>

        {/* Evidence-First Node Inspector Panel */}
        <Card className="lg:col-span-1 border-l-4 border-l-blue-500">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Node Inspector & Evidence
              </span>
              {selectedNodeRisk && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                  Evidence Panel
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {selectedNode ? (
              <div className="space-y-4">
                {/* Node Identity Banner */}
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        selectedNode.type === 'beneficiary'
                          ? 'cyan'
                          : selectedNode.type === 'payout_account'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      {selectedNode.type.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{selectedNode.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedNode.label}</h3>
                </div>

                {/* Risk Evidence Box (If Selected Node is a Flagged Risk Finding) */}
                {selectedNodeRisk ? (
                  <div className="p-3.5 rounded-xl bg-red-500/5 dark:bg-red-950/20 border border-red-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-red-600 dark:text-red-400">
                        <ShieldAlert className="w-4 h-4" />
                        <span>{selectedNodeRisk.riskLevel} RISK FINDING</span>
                      </div>
                      <span className="text-xs font-mono font-extrabold text-red-600 dark:text-red-400">
                        Hybrid Score: {selectedNodeRisk.riskScore}/100
                      </span>
                    </div>

                    {/* Score Breakdown Pills */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 block">Rule Score:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedNodeRisk.ruleScore ?? selectedNodeRisk.riskScore}/100</span>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 block">Isolation Forest:</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {selectedNodeRisk.anomalyScore !== undefined ? `${Math.round(selectedNodeRisk.anomalyScore * 100)}% Anomaly` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Triggered Rule Signals */}
                    {selectedNodeRisk.signals.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-400 block uppercase">
                          Triggered Risk Signals ({selectedNodeRisk.signals.length}):
                        </span>
                        {selectedNodeRisk.signals.map((sig, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 text-[11px] space-y-0.5"
                          >
                            <div className="flex items-center justify-between text-red-600 dark:text-red-400 font-mono font-bold text-[10px]">
                              <span>[{sig.ruleId}]</span>
                              <span>+{sig.points} pts</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 text-[10px] leading-relaxed">
                              {sig.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Narrative Explanation */}
                    {selectedNodeRisk.explanations.length > 0 && (
                      <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 font-sans border-t border-red-500/20 pt-2">
                        <span className="font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-400 block uppercase">
                          Investigative Lead Summary:
                        </span>
                        {selectedNodeRisk.explanations.map((exp, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[10px] leading-relaxed">
                            <span className="text-red-500 font-bold">•</span>
                            <span>{exp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Ordinary Node Notice */
                  <div className="p-3 rounded-lg bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Entity has no direct risk findings flagged in the compliance system.</span>
                  </div>
                )}

                {/* Node Recorded Metadata Attributes */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <span className="font-mono font-semibold uppercase text-[10px] text-slate-500 dark:text-slate-400 block">
                    Recorded Metadata Attributes:
                  </span>
                  {selectedNode.metadata.category && (
                    <div className="flex justify-between text-slate-800 dark:text-slate-300">
                      <span className="text-slate-500">Category:</span>
                      <span>{selectedNode.metadata.category}</span>
                    </div>
                  )}
                  {selectedNode.metadata.bankAccountNumber && (
                    <div className="flex justify-between text-slate-800 dark:text-slate-300">
                      <span className="text-slate-500">Bank Account:</span>
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {selectedNode.metadata.bankAccountNumber}
                      </span>
                    </div>
                  )}
                  {selectedNode.metadata.ifscOrRoutingCode && (
                    <div className="flex justify-between text-slate-800 dark:text-slate-300">
                      <span className="text-slate-500">IFSC/Routing:</span>
                      <span className="font-mono">{selectedNode.metadata.ifscOrRoutingCode}</span>
                    </div>
                  )}
                  {selectedNode.metadata.phone && (
                    <div className="flex justify-between text-slate-800 dark:text-slate-300">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-mono">{selectedNode.metadata.phone}</span>
                    </div>
                  )}
                  {selectedNode.metadata.email && (
                    <div className="flex justify-between text-slate-800 dark:text-slate-300">
                      <span className="text-slate-500">Email:</span>
                      <span className="truncate max-w-[150px]">{selectedNode.metadata.email}</span>
                    </div>
                  )}
                  {selectedNode.metadata.amount !== undefined && (
                    <div className="flex justify-between text-slate-800 dark:text-slate-300">
                      <span className="text-slate-500">Disbursement Amount:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ₹{Number(selectedNode.metadata.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Connected Relationships & Recorded Evidence */}
                <div className="space-y-2">
                  <span className="font-mono font-semibold uppercase text-[10px] text-slate-500 dark:text-slate-400 block">
                    Recorded Relationship Evidence ({connectedEdges.length}):
                  </span>

                  {connectedEdges.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">No connected edges.</div>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {connectedEdges.map((edge) => (
                        <div
                          key={edge.id}
                          className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono space-y-1"
                        >
                          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-semibold text-[10px]">
                            <span>{edge.relation}</span>
                            <span className="text-[9px] text-slate-500">Field: {edge.sourceAttribute}</span>
                          </div>
                          <div className="text-slate-700 dark:text-slate-300 text-[10px] font-sans leading-relaxed">
                            {edge.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audit Disclaimer */}
                <div className="p-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" />
                  <span>
                    <strong>Audit Lead Disclaimer:</strong> Risk scores and shared account signals are investigative indicators requiring human review. They do not constitute legal proof of wrongdoing.
                  </span>
                </div>
              </div>
            ) : (
              /* No Selection Prompt */
              <div className="p-8 text-center space-y-3">
                <Target className="w-10 h-10 text-blue-500 opacity-70 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Select an Entity to Inspect
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Click any risk node or relationship link on the graph to inspect evidence, triggered rules, Isolation Forest anomaly scores, and recorded attributes.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
