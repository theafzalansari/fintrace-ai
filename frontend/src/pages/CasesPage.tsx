import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { InvestigationCase, CaseStatus, CasePriority } from '../types';
import {
  FolderLock,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  Download,
  Send,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
  History
} from 'lucide-react';

export const CasesPage: React.FC = () => {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Selected Case Detail Modal State
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(null);
  const [caseEvidence, setCaseEvidence] = useState<any | null>(null);
  const [loadingEvidence, setLoadingEvidence] = useState<boolean>(false);
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [submittingNote, setSubmittingNote] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const loadCases = async () => {
    try {
      setLoading(true);
      const res = await api.getCases({ status: statusFilter, priority: priorityFilter, search });
      setCases(res.data || []);

      // If selectedCase exists, update it with fresh data
      if (selectedCase) {
        const fresh = (res.data || []).find((c) => c.caseId === selectedCase.caseId || c._id === selectedCase._id);
        if (fresh) setSelectedCase(fresh);
      }
    } catch (err) {
      console.error('Failed to load investigation cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [statusFilter, priorityFilter, search]);

  // Load Linked Evidence for Selected Case
  const openCaseDetail = async (c: InvestigationCase) => {
    setSelectedCase(c);
    setActionSuccessMsg(null);
    try {
      setLoadingEvidence(true);
      const evRes = await api.getCaseEvidence(c.caseId);
      setCaseEvidence(evRes.data || null);
    } catch (err) {
      console.error('Error loading case evidence:', err);
    } finally {
      setLoadingEvidence(false);
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async (caseId: string, newStatus: CaseStatus) => {
    try {
      setActionSuccessMsg(null);
      const res = await api.updateCase(caseId, { status: newStatus });
      setSelectedCase(res.data);
      setActionSuccessMsg(`Case status updated to ${newStatus}`);
      loadCases();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update case status');
    }
  };

  // Handle Priority Update
  const handleUpdatePriority = async (caseId: string, newPriority: CasePriority) => {
    try {
      setActionSuccessMsg(null);
      const res = await api.updateCase(caseId, { priority: newPriority });
      setSelectedCase(res.data);
      setActionSuccessMsg(`Case priority updated to ${newPriority}`);
      loadCases();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update priority');
    }
  };

  // Handle Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newNoteContent.trim()) return;

    try {
      setSubmittingNote(true);
      setActionSuccessMsg(null);
      const res = await api.addCaseNote(selectedCase.caseId, newNoteContent);
      setSelectedCase(res.data);
      setNewNoteContent('');
      setActionSuccessMsg('Investigator note added to case log');
      loadCases();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Summary Metrics
  const totalCases = cases.length;
  const openCases = cases.filter((c) => c.status === 'OPEN').length;
  const underReviewCases = cases.filter((c) => c.status === 'UNDER_REVIEW').length;
  const resolvedCases = cases.filter((c) => c.status === 'RESOLVED' || c.status === 'DISMISSED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Phase 2: Case Lifecycle Engine</Badge>
            <Badge variant="outline">MongoDB Persistence</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Investigation Case Management
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Persistent audit workspace tracking high-risk leads, investigator notes, and downloadable PDF evidence dossiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadCases} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Cases
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Total Cases</span>
              <FolderLock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
              {loading ? '...' : totalCases}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Open Cases</span>
              <ShieldAlert className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1 font-mono">
              {loading ? '...' : openCases}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Under Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {loading ? '...' : underReviewCases}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Resolved / Dismissed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {loading ? '...' : resolvedCases}
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
                placeholder="Search case ID, entity ID, or title..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Case Statuses</option>
                <option value="OPEN">Open</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Cases Table */}
      <Card>
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-blue-500" />
              Persistent Case Ledger ({cases.length} records)
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
              <p className="text-xs font-mono">Loading persistent investigation cases from MongoDB...</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <FolderLock className="w-10 h-10 text-slate-400 dark:text-slate-700 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Cases Found</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                No investigation cases match your filters. Open a risk finding from Risk Analysis or Network Graph to create a new case file.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono uppercase">
                    <th className="p-3">Case ID</th>
                    <th className="p-3">Entity ID</th>
                    <th className="p-3">Title / Scope</th>
                    <th className="p-3">Risk Score</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
                  {cases.map((c) => (
                    <tr
                      key={c.caseId}
                      onClick={() => openCaseDetail(c)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition"
                    >
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{c.caseId}</td>
                      <td className="p-3 font-mono">{c.entityId}</td>
                      <td className="p-3 font-medium text-slate-900 dark:text-white">{c.title}</td>
                      <td className="p-3 font-mono font-bold">
                        <span className={c.riskScore >= 70 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>
                          {c.riskScore}/100
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant={c.priority === 'HIGH' ? 'danger' : c.priority === 'MEDIUM' ? 'warning' : 'outline'}>
                          {c.priority}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            c.status === 'OPEN'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : c.status === 'UNDER_REVIEW'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {new Date(c.createdAt).toISOString().slice(0, 10)}
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openCaseDetail(c); }}>
                          Inspect <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Case Detail Modal / Drawer */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="cyan">{selectedCase.caseId}</Badge>
                  <span className="text-xs font-mono text-slate-500">Target Entity: {selectedCase.entityId}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{selectedCase.title}</h2>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={api.getCasePdfDossierUrl(selectedCase.caseId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF Evidence Dossier
                </a>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Success Notification */}
              {actionSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}

              {/* Status and Priority Management Bar */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500">Update Status:</span>
                  <select
                    value={selectedCase.status}
                    onChange={(e) => handleUpdateStatus(selectedCase.caseId, e.target.value as CaseStatus)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="OPEN">OPEN (Pending Review)</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW (In Review)</option>
                    <option value="RESOLVED">RESOLVED (Confirmed Risk)</option>
                    <option value="DISMISSED">DISMISSED (Verified Clean)</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500">Update Priority:</span>
                  <select
                    value={selectedCase.priority}
                    onChange={(e) => handleUpdatePriority(selectedCase.caseId, e.target.value as CasePriority)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="HIGH">HIGH Priority</option>
                    <option value="MEDIUM">MEDIUM Priority</option>
                    <option value="LOW">LOW Priority</option>
                  </select>
                </div>
              </div>

              {/* Risk Score & Signal Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-red-500/5 dark:bg-red-950/20 border border-red-500/30">
                  <span className="text-xs font-mono text-slate-500 block">Hybrid Risk Score</span>
                  <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1 font-mono">
                    {selectedCase.riskScore}/100
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Level: {selectedCase.riskSeverity}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-mono text-slate-500 block">Rule Score</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {selectedCase.ruleScore ?? selectedCase.riskScore}/100
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Point Aggregation</span>
                </div>

                <div className="p-4 rounded-xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/30">
                  <span className="text-xs font-mono text-slate-500 block">Isolation Forest</span>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 font-mono">
                    {selectedCase.anomalyScore !== undefined ? `${Math.round(selectedCase.anomalyScore * 100)}%` : 'N/A'}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">ML Anomaly Score</span>
                </div>
              </div>

              {/* Triggered Signals */}
              {selectedCase.riskSignals && selectedCase.riskSignals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase text-slate-500 font-bold">Triggered Risk Signals:</h4>
                  <div className="space-y-2">
                    {selectedCase.riskSignals.map((sig, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-red-600 dark:text-red-400 font-mono font-bold">
                          <span>[{sig.ruleId}]</span>
                          <span>+{sig.points} pts</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-xs mt-1 leading-relaxed">{sig.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Evidence Records */}
              {loadingEvidence ? (
                <div className="p-6 text-center text-slate-500 text-xs">Loading linked MongoDB evidence...</div>
              ) : caseEvidence && (
                <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                  <h4 className="text-xs font-mono uppercase text-slate-500 font-bold">Linked Database Records:</h4>
                  {caseEvidence.beneficiaries && caseEvidence.beneficiaries.length > 0 && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1 font-mono">
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">Target Beneficiary:</span>
                      <div>Name: {caseEvidence.beneficiaries[0].name} ({caseEvidence.beneficiaries[0].beneficiaryId})</div>
                      <div>Bank Account: {caseEvidence.beneficiaries[0].bankAccountNumber} | IFSC: {caseEvidence.beneficiaries[0].ifscOrRoutingCode}</div>
                    </div>
                  )}

                  {caseEvidence.disbursements && caseEvidence.disbursements.length > 0 && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                      <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">
                        Disbursement Transactions ({caseEvidence.disbursements.length}):
                      </span>
                      <div className="space-y-1">
                        {caseEvidence.disbursements.map((d: any) => (
                          <div key={d.disbursementId} className="flex justify-between font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            <span>{d.disbursementId} ({d.paymentChannel})</span>
                            <span className="font-bold text-emerald-600">₹{Number(d.amount).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Investigator Notes Section */}
              <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-mono uppercase text-slate-500 font-bold">Investigator Notes & Activity:</h4>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an investigator note or audit observation..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <Button variant="primary" size="sm" type="submit" disabled={submittingNote || !newNoteContent.trim()}>
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Add Note
                  </Button>
                </form>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedCase.notes && selectedCase.notes.length > 0 ? (
                    selectedCase.notes.map((n, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                          <span className="font-bold text-blue-600 dark:text-blue-400">{n.author}</span>
                          <span>{new Date(n.createdAt).toISOString().slice(0, 19).replace('T', ' ')}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans">{n.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic">No notes added yet.</div>
                  )}
                </div>
              </div>

              {/* Append-Only Audit Trail Timeline */}
              <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-mono uppercase text-slate-500 font-bold flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-blue-500" /> Append-Only Audit Trail
                </h4>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {selectedCase.auditLog && selectedCase.auditLog.length > 0 ? (
                    selectedCase.auditLog.map((log, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono space-y-0.5">
                        <div className="flex justify-between text-slate-500 text-[10px]">
                          <span className="font-bold text-purple-600 dark:text-purple-400">{log.action}</span>
                          <span>{new Date(log.timestamp).toISOString().slice(0, 19).replace('T', ' ')}</span>
                        </div>
                        <div className="text-slate-700 dark:text-slate-300">{log.details}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic">No audit log entries.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
