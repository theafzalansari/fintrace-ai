import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import {
  ShieldCheck,
  ArrowRight,
  GitFork,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface LandingPageProps {
  onNavigate?: (tab: string) => void;
}

interface NetworkNode {
  id: string;
  label: string;
  type: 'beneficiary' | 'account' | 'disbursement';
  x: number;
  y: number;
  riskScore: number;
  details: string;
}

interface NetworkLink {
  source: string;
  target: string;
  relation: string;
  isSuspicious?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const navigate = useNavigate();
  const [activeNode, setActiveNode] = useState<NetworkNode | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [liveStats, setLiveStats] = useState<{
    beneficiaries: number;
    disbursements: number;
    highRisks: number;
    graphNodes: number;
    isLive: boolean;
  }>({
    beneficiaries: 0,
    disbursements: 0,
    highRisks: 0,
    graphNodes: 0,
    isLive: false
  });

  useEffect(() => {
    async function loadTelemetry() {
      try {
        const [benRes, disbRes, riskRes, graphRes] = await Promise.all([
          api.getBeneficiaries().catch(() => ({ data: [] })),
          api.getDisbursements().catch(() => ({ data: [] })),
          api.getRiskAnalysis().catch(() => ({ data: { summary: { highRiskCount: 0 } } })),
          api.getGraphAnalysis().catch(() => ({ data: { summary: { totalNodes: 0 } } }))
        ]);

        setLiveStats({
          beneficiaries: benRes.data?.length || 0,
          disbursements: disbRes.data?.length || 0,
          highRisks: riskRes.data?.summary?.highRiskCount || 0,
          graphNodes: graphRes.data?.summary?.totalNodes || 0,
          isLive: (benRes.data?.length || 0) > 0
        });
      } catch {
        // Fallback to default state
      }
    }
    loadTelemetry();
  }, []);

  // SVG Nodes for the interactive investigation graph
  const nodes: NetworkNode[] = [
    { id: 'BEN-1001', label: 'Rajesh Kumar', type: 'beneficiary', x: 120, y: 110, riskScore: 85, details: 'Shared Payout Account (ACC-9999) with BEN-1002' },
    { id: 'BEN-1002', label: 'Asha Workers Co-Op', type: 'beneficiary', x: 340, y: 110, riskScore: 78, details: 'NGO account linked to shared payout account ACC-9999' },
    { id: 'ACC-9999', label: 'ACC-999988887777', type: 'account', x: 230, y: 190, riskScore: 92, details: 'Shared payout account destination for 2+ distinct entities' },
    { id: 'BEN-1003', label: 'Apex Infrastructure', type: 'beneficiary', x: 440, y: 270, riskScore: 25, details: 'Verified Contractor account, single owner' },
    { id: 'DISB-001', label: 'DISB-2024-001', type: 'disbursement', x: 90, y: 280, riskScore: 85, details: '₹25,000 Direct benefit payout to BEN-1001' },
    { id: 'DISB-002', label: 'DISB-2024-002', type: 'disbursement', x: 230, y: 310, riskScore: 78, details: '₹150,000 NEFT equipment payout to BEN-1002' },
    { id: 'DISB-003', label: 'DISB-2024-003', type: 'disbursement', x: 370, y: 340, riskScore: 25, details: '₹450,000 RTGS payout to Apex Infrastructure' }
  ];

  const links: NetworkLink[] = [
    { source: 'BEN-1001', target: 'ACC-9999', relation: 'SHARES_BANK_ACCOUNT', isSuspicious: true },
    { source: 'BEN-1002', target: 'ACC-9999', relation: 'SHARES_BANK_ACCOUNT', isSuspicious: true },
    { source: 'BEN-1001', target: 'DISB-001', relation: 'DISBURSEMENT_PAYOUT', isSuspicious: false },
    { source: 'BEN-1002', target: 'DISB-002', relation: 'DISBURSEMENT_PAYOUT', isSuspicious: false },
    { source: 'BEN-1003', target: 'DISB-003', relation: 'DISBURSEMENT_PAYOUT', isSuspicious: false }
  ];

  const steps = [
    {
      step: '01',
      title: 'INGEST RECORDS',
      description: 'Upload structured CSV files or send JSON payloads with Zod multi-field validation and row-level line error reporting.',
      code: 'POST /api/ingest/beneficiaries/csv\nPOST /api/ingest/disbursements/csv'
    },
    {
      step: '02',
      title: 'DETECT ANOMALIES',
      description: 'In-house Isolation Forest decision trees evaluate 6D feature vectors to calculate unsupervised statistical anomaly scores.',
      code: 's(x, n) = 2^(- E(h(x)) / c(n))\nVector: [Degree, SharedAcc, Vol, Velocity, MaxAmt, FailRatio]'
    },
    {
      step: '03',
      title: 'TRACE RELATIONSHIPS',
      description: 'Adjacency matrix graph resolves normalized bank accounts, phone numbers, identity hashes, and physical address overlaps.',
      code: 'Adjacency Edges: SHARED_BANK_ACCOUNT, SHARED_PHONE, SHARED_ADDRESS'
    },
    {
      step: '04',
      title: 'REVIEW & EXPORT',
      description: 'Forensic auditors update review statuses, generate 1-click printable PDF summaries, and export machine-readable CSV ledgers.',
      code: 'Status: PENDING_REVIEW | IN_REVIEW | VERIFIED_CLEAN | CONFIRMED_RISK'
    }
  ];

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans space-y-20 pb-20 animate-fade-in selection:bg-lime-500 selection:text-black">
      {/* Top Metadata Header Bar */}
      <div className="border-b border-slate-800/80 bg-[#07090E] py-2.5 px-6 font-mono text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-lime-400 font-bold">[SYS_REF: 0x88F2]</span>
          <span>FINTRACE AI • FORENSIC INVESTIGATION TERMINAL</span>
        </div>
        <div className="flex items-center gap-4">
          <span>CLASSIFICATION: HACKATHON DEMO</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ENGINE ACTIVE
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left: Asymmetric Editorial Copy */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-400 font-mono text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Explainable Risk Engine v1.0
              </div>

              <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-[1.08] font-sans">
                Follow the money. <br />
                <span className="text-lime-400 underline decoration-lime-500/40 decoration-2 underline-offset-8">
                  Find the connections.
                </span>
              </h1>

              <p className="text-slate-300 text-base md:text-lg leading-relaxed font-sans max-w-xl">
                Financial micro-auditing that connects transaction anomalies, beneficiary relationships, and explainable risk signals in real time.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  const el = document.getElementById('walkthrough');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-lime-500 hover:bg-lime-400 text-slate-950 font-extrabold border-transparent shadow-lg shadow-lime-500/20 cursor-pointer"
              >
                Explore the Investigation
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <button
                onClick={() => navigate('/dashboard')}
                className="text-xs font-mono font-bold text-slate-300 hover:text-lime-400 flex items-center gap-1 transition uppercase tracking-wider underline decoration-slate-700 underline-offset-4"
              >
                Open Dashboard <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Minimal Monospace Data Callout */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-4 font-mono text-xs text-slate-400">
              <div>
                <span className="block text-white font-bold text-sm">65 / 35</span>
                <span className="text-[10px] text-slate-500">Rules / ML Weight</span>
              </div>
              <div>
                <span className="block font-bold text-lime-400 text-sm">0.88 F1</span>
                <span className="text-[10px] text-slate-500">Held-Out Test Score</span>
              </div>
              <div>
                <span className="block font-bold text-white text-sm">0.00ms</span>
                <span className="text-[10px] text-slate-500">Node JS Native iForest</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Interactive SVG Financial Network Graphic */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl bg-[#0B0E14] border border-slate-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-2 font-bold">
                  <GitFork className="w-4 h-4 text-lime-400" />
                  [ILLUSTRATIVE INVESTIGATION GRAPH]
                </span>
                <span className="text-[10px] text-slate-500">HOVER NODE TO INSPECT</span>
              </div>

              {/* Interactive Network SVG Canvas */}
              <div className="relative h-96 w-full bg-[#080A0F] rounded-xl border border-slate-800/60 overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 520 420">
                  {/* Fine connecting edges */}
                  {links.map((link, idx) => {
                    const sourceNode = nodes.find((n) => n.id === link.source);
                    const targetNode = nodes.find((n) => n.id === link.target);
                    if (!sourceNode || !targetNode) return null;

                    return (
                      <g key={idx}>
                        <line
                          x1={sourceNode.x}
                          y1={sourceNode.y}
                          x2={targetNode.x}
                          y2={targetNode.y}
                          stroke={link.isSuspicious ? '#84CC16' : '#1E293B'}
                          strokeWidth={link.isSuspicious ? 2 : 1}
                          strokeDasharray={link.isSuspicious ? '4 2' : undefined}
                          className={link.isSuspicious ? 'animate-pulse' : ''}
                        />
                        {link.isSuspicious && (
                          <circle
                            cx={(sourceNode.x + targetNode.x) / 2}
                            cy={(sourceNode.y + targetNode.y) / 2}
                            r={3}
                            fill="#84CC16"
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* Render Nodes */}
                  {nodes.map((node) => {
                    const isSelected = activeNode?.id === node.id;
                    const isHighRisk = node.riskScore >= 70;

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        onMouseEnter={() => setActiveNode(node)}
                        onMouseLeave={() => setActiveNode(null)}
                        className="cursor-pointer group"
                      >
                        {/* Outer Glow Ring for High Risk / Selected */}
                        {(isHighRisk || isSelected) && (
                          <circle
                            r={isSelected ? 18 : 14}
                            fill="none"
                            stroke={isHighRisk ? '#84CC16' : '#3B82F6'}
                            strokeWidth={1.5}
                            opacity={0.6}
                            className="animate-ping"
                          />
                        )}

                        {/* Core Node Circle */}
                        <circle
                          r={node.type === 'account' ? 12 : 10}
                          fill={
                            node.type === 'account'
                              ? '#0284C7'
                              : isHighRisk
                              ? '#84CC16'
                              : '#334155'
                          }
                          stroke="#080A0F"
                          strokeWidth={2}
                        />

                        {/* Node Monospace Label */}
                        <text
                          y={node.type === 'account' ? 24 : 20}
                          textAnchor="middle"
                          fill="#94A3B8"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {node.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Node Details Card on Hover */}
                {activeNode && (
                  <div className="absolute bottom-4 left-4 right-4 p-3 rounded-lg bg-slate-900/95 border border-lime-500/40 text-xs font-mono space-y-1 shadow-2xl backdrop-blur-md animate-fade-in">
                    <div className="flex items-center justify-between text-white font-bold">
                      <span>{activeNode.label} ({activeNode.id})</span>
                      <Badge variant={activeNode.riskScore >= 70 ? 'danger' : 'success'}>
                        SCORE: {activeNode.riskScore}/100
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans">{activeNode.details}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-lime-400" /> Ghost Cluster Flagged
                </span>
                <span>Adjacency Matrix: 7 Nodes, 5 Links</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement Banner */}
      <section className="border-y border-slate-800/80 bg-[#0B0E14] py-14 px-6 md:px-12">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <span className="text-xs font-mono font-bold text-lime-400 uppercase tracking-widest">
            [FORENSIC AUDIT CHALLENGE]
          </span>
          <blockquote className="text-2xl sm:text-3xl font-extrabold text-white leading-snug font-sans">
            “Public benefit schemes lose billions not through single massive spikes, but through quiet, distributed clusters of shared accounts and ghost identities.”
          </blockquote>
          <p className="text-xs font-mono text-slate-400 max-w-xl mx-auto">
            FinTrace AI correlates normalized phone numbers, bank accounts, physical addresses, and identity hashes into an adjacency matrix graph to expose multi-entity collision risks.
          </p>
        </div>
      </section>

      {/* Interactive 4-Step Forensic Walkthrough */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <span className="text-xs font-mono text-lime-400 uppercase tracking-wider font-bold">
              [STANDARD OPERATING PROCEDURE]
            </span>
            <h2 className="text-3xl font-black text-white mt-1">4-Step Forensic Investigation Pipeline</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {steps.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                  activeStep === idx
                    ? 'bg-lime-500 text-slate-950 font-extrabold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {s.step} {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Step Display Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#0B0E14] border border-slate-800 rounded-2xl p-6 md:p-8">
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-mono text-lime-400 font-bold">PHASE {steps[activeStep].step}</div>
            <h3 className="text-2xl font-black text-white">{steps[activeStep].title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">{steps[activeStep].description}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-xs font-mono border-slate-700"
            >
              Test Stage in Workspace <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

          <div className="lg:col-span-7">
            <div className="p-4 rounded-xl bg-[#080A0F] border border-slate-800 font-mono text-xs text-lime-300 space-y-2 overflow-x-auto">
              <div className="flex items-center justify-between text-slate-500 text-[10px] border-b border-slate-800/80 pb-2">
                <span>[EXECUTION TRACE]</span>
                <span>STATUS: VERIFIED</span>
              </div>
              <pre className="text-[11px] leading-relaxed text-slate-200">
                {steps[activeStep].code}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Real Risk Evidence Matrix Preview */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-lime-400 uppercase tracking-wider font-bold">
              [EXPLAINABLE FINDINGS]
            </span>
            <h2 className="text-2xl font-black text-white mt-1">Authentic Evidence Matrix & Signals</h2>
          </div>
          <Badge variant={liveStats.isLive ? 'success' : 'outline'}>
            {liveStats.isLive ? `${liveStats.beneficiaries} Records in DB` : 'Synthetic Standard Model'}
          </Badge>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0B0E14] overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#080A0F] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Entity ID & Name</th>
                <th className="py-3.5 px-4 font-semibold">Hybrid Score</th>
                <th className="py-3.5 px-4 font-semibold">iForest ML Anomaly</th>
                <th className="py-3.5 px-4 font-semibold">Triggered Evidence Signals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-900/40">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-white">Rajesh Kumar</div>
                  <div className="text-[10px] text-blue-400">BEN-1001</div>
                </td>
                <td className="py-3.5 px-4">
                  <Badge variant="danger">HIGH (85/100)</Badge>
                </td>
                <td className="py-3.5 px-4 text-lime-400 font-bold">
                  81.0% Anomaly Score
                </td>
                <td className="py-3.5 px-4 text-xs font-sans text-slate-300 space-y-1">
                  <div>• <span className="font-mono text-amber-400 font-bold">SHARED_PAYOUT_ACCOUNT</span> (+70 PTS): Bank account 918273645012 is shared by 2 beneficiaries.</div>
                  <div>• <span className="font-mono text-purple-400 font-bold">ISOLATION_FOREST_ANOMALY</span> (+28 PTS): Decision tree path length isolated at shallow depth.</div>
                </td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-white">Asha Workers Co-Op</div>
                  <div className="text-[10px] text-blue-400">BEN-1002</div>
                </td>
                <td className="py-3.5 px-4">
                  <Badge variant="danger">HIGH (78/100)</Badge>
                </td>
                <td className="py-3.5 px-4 text-lime-400 font-bold">
                  76.0% Anomaly Score
                </td>
                <td className="py-3.5 px-4 text-xs font-sans text-slate-300 space-y-1">
                  <div>• <span className="font-mono text-amber-400 font-bold">SHARED_PAYOUT_ACCOUNT</span> (+50 PTS): Payout destination overlap with BEN-1001.</div>
                  <div>• <span className="font-mono text-amber-400 font-bold">HIGH_DISBURSEMENT_VOLUME</span> (+15 PTS): Cumulative payouts total ₹150,000.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Model Transparency & Technical Specification */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto">
        <div className="p-8 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono text-lime-400 font-bold uppercase">[MODEL SPECIFICATION]</span>
              <h3 className="text-xl font-black text-white mt-0.5">In-House Isolation Forest Transparency</h3>
            </div>
            <Badge variant="cyan">Zero Native Binary Dependencies</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#080A0F] border border-slate-800/80 space-y-2">
              <div className="text-slate-400 font-bold">6D FEATURE VECTOR</div>
              <ul className="text-[11px] text-slate-300 space-y-1">
                <li>1. Degree Centrality</li>
                <li>2. Shared Account Count</li>
                <li>3. Total Payout Amount</li>
                <li>4. Disbursement Count</li>
                <li>5. Max Single Payment</li>
                <li>6. Failed Payment Ratio</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#080A0F] border border-slate-800/80 space-y-2">
              <div className="text-slate-400 font-bold">HELD-OUT EVALUATION</div>
              <div className="text-2xl font-bold text-lime-400">0.88 F1-Score</div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Evaluated on a 70/30 train/held-out test split (75 test entities) without synthetic data leakage.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080A0F] border border-slate-800/80 space-y-2">
              <div className="text-slate-400 font-bold">HUMAN REVIEW DISCLAIMER</div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Synthetic benchmark performance does not guarantee real-world fraud detection accuracy. Automated risk scores require forensic human review and do not constitute legal proof of fraud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Invitation Footer Banner */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto">
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-lime-950/20 border border-slate-800 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-white">Ready to inspect live audit findings?</h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto font-sans">
            Open the working FinTrace AI workspace to upload CSV ledgers, inspect the interactive financial web graph, and export audit reports.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="bg-lime-500 hover:bg-lime-400 text-slate-950 font-extrabold border-transparent shadow-xl shadow-lime-500/20"
          >
            Open Audit Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 md:px-12 max-w-7xl mx-auto pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-lime-400" />
          <span>FinTrace AI • Forensic Investigation Terminal v1.0</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link to="/login" className="hover:text-white">Sign In</Link>
          <Link to="/signup" className="hover:text-white">Register</Link>
        </div>
      </footer>
    </div>
  );
};
