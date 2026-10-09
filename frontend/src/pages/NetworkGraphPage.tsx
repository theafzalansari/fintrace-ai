import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CsvUploadModal } from '../components/ui/CsvUploadModal';
import { api } from '../lib/api';
import { GraphResponseData } from '../types';
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
  Search
} from 'lucide-react';

export const NetworkGraphPage: React.FC = () => {
  const [data, setData] = useState<GraphResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string>('all');
  const [relationFilter, setRelationFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getGraphAnalysis();
      setData(res.data || null);
      if (res.data?.nodes && res.data.nodes.length > 0 && !selectedNodeId) {
        setSelectedNodeId(res.data.nodes[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch network graph');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const nodes = data?.nodes || [];
  const edges = data?.edges || [];
  const summary = data?.summary || { totalNodes: 0, totalEdges: 0, beneficiaryCount: 0, payoutAccountCount: 0, disbursementCount: 0 };

  // Filter nodes & edges
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesType = nodeTypeFilter === 'all' || node.type === nodeTypeFilter;
      const matchesSearch =
        node.label.toLowerCase().includes(search.toLowerCase()) ||
        node.id.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [nodes, nodeTypeFilter, search]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return edges.filter((edge) => {
      const matchesRelation = relationFilter === 'all' || edge.relation === relationFilter;
      const matchesNodes = filteredNodeIds.has(edge.source) || filteredNodeIds.has(edge.target);
      return matchesRelation && matchesNodes;
    });
  }, [edges, relationFilter, filteredNodeIds]);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId);
  }, [edges, selectedNodeId]);

  // Layout calculations for interactive visual SVG network graph
  const nodePositions = useMemo(() => {
    const posMap = new Map<string, { x: number; y: number }>();
    const count = filteredNodes.length;
    if (count === 0) return posMap;

    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.38;

    filteredNodes.forEach((node, idx) => {
      const angle = (2 * Math.PI * idx) / count;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      posMap.set(node.id, { x, y });
    });

    return posMap;
  }, [filteredNodes]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Financial Web Graph Engine</Badge>
            <Badge variant="outline">Adjacency Matrix</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Network Graph Explorer
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Interactive relational matrix linking beneficiaries, payout accounts, and circular transfer flags.
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Total Graph Nodes</span>
              <GitFork className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
              {loading ? '...' : summary.totalNodes}
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

      {/* Filter and Search Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search node label or ID..."
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
          <span>Error loading network graph: {error}</span>
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
                Financial Relational Graph ({filteredNodes.length} nodes, {filteredEdges.length} edges)
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
                <p className="text-xs font-mono">Constructing adjacency matrix & layout...</p>
              </div>
            ) : filteredNodes.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-center space-y-4">
                <GitFork className="w-12 h-12 text-slate-400 dark:text-slate-700 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300">Graph Matrix Empty</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-500 max-w-sm">
                    {nodes.length === 0
                      ? 'No records ingested yet. Ingest sample beneficiary CSV to populate graph nodes.'
                      : 'No graph nodes match your search and filter options.'}
                  </p>
                </div>
                {nodes.length === 0 && (
                  <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Ingest Beneficiaries CSV
                  </Button>
                )}
              </div>
            ) : (
              <div className="relative w-full h-[450px] bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/80 overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 600 400">
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="20"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                    </marker>
                  </defs>

                  {/* Draw Edges */}
                  {filteredEdges.map((edge) => {
                    const srcPos = nodePositions.get(edge.source);
                    const tgtPos = nodePositions.get(edge.target);
                    if (!srcPos || !tgtPos) return null;

                    const isSelected =
                      selectedNodeId === edge.source || selectedNodeId === edge.target;

                    const isShared = edge.relation.startsWith('SHARED_');

                    return (
                      <g key={edge.id}>
                        <line
                          x1={srcPos.x}
                          y1={srcPos.y}
                          x2={tgtPos.x}
                          y2={tgtPos.y}
                          stroke={
                            isSelected
                              ? isShared
                                ? '#f59e0b'
                                : '#3b82f6'
                              : isShared
                              ? '#d97706'
                              : '#94a3b8'
                          }
                          strokeWidth={isSelected ? 2.5 : isShared ? 1.8 : 1}
                          strokeDasharray={isShared ? '4,4' : 'none'}
                          opacity={isSelected ? 1 : 0.65}
                        />
                      </g>
                    );
                  })}

                  {/* Draw Nodes */}
                  {filteredNodes.map((node) => {
                    const pos = nodePositions.get(node.id);
                    if (!pos) return null;

                    const isSelected = selectedNodeId === node.id;
                    let color = '#0284c7'; // beneficiary cyan (accessible)
                    if (node.type === 'payout_account') color = '#059669'; // account emerald
                    if (node.type === 'disbursement') color = '#d97706'; // disbursement amber

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => setSelectedNodeId(node.id)}
                        className="cursor-pointer group"
                      >
                        {isSelected && (
                          <circle
                            r="22"
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            className="animate-ping opacity-40"
                          />
                        )}

                        <circle
                          r="16"
                          fill="currentColor"
                          stroke={color}
                          strokeWidth={isSelected ? 3 : 2}
                          className="fill-white dark:fill-slate-900 transition hover:scale-110"
                        />

                        <text
                          textAnchor="middle"
                          dy="4"
                          fill={color}
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {node.type === 'beneficiary'
                            ? 'BEN'
                            : node.type === 'payout_account'
                            ? 'ACC'
                            : 'DISB'}
                        </text>

                        <text
                          textAnchor="middle"
                          dy="30"
                          fontSize="9"
                          fontFamily="sans-serif"
                          className="fill-slate-700 dark:fill-slate-400 select-none pointer-events-none font-medium"
                        >
                          {node.label.length > 18 ? `${node.label.substring(0, 16)}...` : node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Node Inspector Panel */}
        <Card className="lg:col-span-1 border-l-4 border-l-blue-500">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Node Inspector
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {selectedNode ? (
              <div className="space-y-4">
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

                {/* Node Metadata Attributes */}
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
                      <span className="font-mono">{selectedNode.metadata.bankAccountNumber}</span>
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
                  {selectedNode.metadata.associatedBeneficiariesCount !== undefined && (
                    <div className="flex justify-between text-slate-800 dark:text-slate-300">
                      <span className="text-slate-500">Linked Beneficiaries:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {selectedNode.metadata.associatedBeneficiariesCount}
                      </span>
                    </div>
                  )}
                  {selectedNode.metadata.amount !== undefined && (
                    <div className="flex justify-between text-slate-800 dark:text-slate-300">
                      <span className="text-slate-500">Payout Amount:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ₹{Number(selectedNode.metadata.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Connected Edges & Reasons */}
                <div className="space-y-2">
                  <span className="font-mono font-semibold uppercase text-[10px] text-slate-500 dark:text-slate-400 block">
                    Connected Relationships ({connectedEdges.length}):
                  </span>

                  {connectedEdges.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">No connected edges.</div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {connectedEdges.map((edge) => (
                        <div
                          key={edge.id}
                          className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono space-y-1"
                        >
                          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-semibold">
                            <span>{edge.relation}</span>
                            <span className="text-[9px] text-slate-500">attr: {edge.sourceAttribute}</span>
                          </div>
                          <div className="text-slate-700 dark:text-slate-300 text-[10px] font-sans leading-relaxed">
                            {edge.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Select a graph node to inspect details and relationship reasons.
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
