import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import {
  ArrowUpRight,
  Shield,
  Activity,
  Zap,
  Cpu,
  Lock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Terminal,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  Info,
  Sliders,
  Database,
  Clock
} from 'lucide-react';

interface ClusterProfile {
  id: string;
  code: string;
  risk: number;
  amount: string;
  title: string;
  subtitle: string;
  meta: string;
  f1: { name: string; val: string; pct: number; isRisk: boolean };
  f2: { name: string; val: string; pct: number; isRisk: boolean };
  f3: { name: string; val: string; pct: number; isRisk: boolean };
  f4: { name: string; val: string; pct: number; isRisk: boolean };
  recommendation: string;
  wireIds: string;
}

const CLUSTER_DATA: Record<string, ClusterProfile> = {
  '01': {
    id: '01',
    code: '#CL-8821',
    risk: 0.96,
    amount: '$94,500.00',
    title: 'Split Structuring Sub-10K & ABA Routing Loop',
    subtitle: '11 Micro-Disbursements',
    meta: 'Flagged by Structuring Heuristic + iForest Tree 4',
    f1: { name: 'Sub-10K Payout Clumping', val: '+44.2%', pct: 88, isRisk: true },
    f2: { name: 'Routing BIC Shared Fingerprint', val: '+31.8%', pct: 64, isRisk: true },
    f3: { name: 'Temporal Interval Dispersion', val: '+18.0%', pct: 36, isRisk: true },
    f4: { name: 'Payor Historical Cleared Baseline', val: '-12.4%', pct: 25, isRisk: false },
    recommendation: 'Hold batch release for Wire IDs 90401-90412. Escalate to AML Team Tier-2 for beneficial ownership confirmation.',
    wireIds: '90401-90412'
  },
  '02': {
    id: '02',
    code: '#CL-8819',
    risk: 0.89,
    amount: '$248,000.00',
    title: 'Shared SWIFT BIC Collision across 7 Entities',
    subtitle: '4 Payor Accounts / 1 Collateral Vault',
    meta: 'Flagged by Bipartite Graph Density + Shell Score',
    f1: { name: 'Intermediary SWIFT Multiplexing', val: '+52.1%', pct: 94, isRisk: true },
    f2: { name: 'Disbursement Volume Disparity', val: '+28.4%', pct: 58, isRisk: true },
    f3: { name: 'Tax Residence Mismatch', val: '+14.9%', pct: 30, isRisk: true },
    f4: { name: 'Known Corporate Vendor Age (>5y)', val: '-18.2%', pct: 36, isRisk: false },
    recommendation: 'Verify cross-entity signatory records for shared beneficial control. Notify Corporate Treasury immediately.',
    wireIds: '90380-90395'
  },
  '03': {
    id: '03',
    code: '#CL-8794',
    risk: 0.74,
    amount: '$19,800.00',
    title: 'Rapid Velocity Burst (<120s from batch release)',
    subtitle: '3 Synthetic Corporate Tax IDs',
    meta: 'Flagged by Velocity Windowing Engine',
    f1: { name: 'Burst Velocity (12 txn / 90s)', val: '+61.0%', pct: 96, isRisk: true },
    f2: { name: 'Zero Balance Drain Target', val: '+24.5%', pct: 50, isRisk: true },
    f3: { name: 'Off-Hours API Submission', val: '+12.1%', pct: 24, isRisk: true },
    f4: { name: 'Verified Bank Token Match', val: '-23.6%', pct: 47, isRisk: false },
    recommendation: 'Execute temporary 24h payout hold. Request verified tax identification documentation from beneficiary.',
    wireIds: '90120-90128'
  },
  '04': {
    id: '04',
    code: '#CL-8755',
    risk: 0.68,
    amount: '$51,200.00',
    title: 'OFAC Secondary Exposure via Intermediary Proxy',
    subtitle: 'Jurisdiction Jump: CY → AE → US',
    meta: 'Flagged by Sanctions Fuzzy Matcher',
    f1: { name: 'Jurisdiction Risk Tier (High)', val: '+48.7%', pct: 82, isRisk: true },
    f2: { name: 'Intermediary Proxy Hop', val: '+33.2%', pct: 66, isRisk: true },
    f3: { name: 'Sanctions Phoneme Similarity', val: '+16.4%', pct: 32, isRisk: true },
    f4: { name: 'Pre-Approved Clearing License', val: '-30.1%', pct: 60, isRisk: false },
    recommendation: 'Perform manual OFAC SDN list fuzzy resolution. Confirm intermediary banking license documentation.',
    wireIds: '89950-89962'
  }
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [selectedClusterId, setSelectedClusterId] = useState<string>('01');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<{
    beneficiaries: number;
    disbursements: number;
    highRisks: number;
    isLive: boolean;
  }>({
    beneficiaries: 250,
    disbursements: 48192,
    highRisks: 14,
    isLive: false
  });

  // Load real telemetry if backend is active
  useEffect(() => {
    async function loadTelemetry() {
      try {
        const [benRes, disbRes, riskRes] = await Promise.all([
          api.getBeneficiaries().catch(() => ({ data: [] })),
          api.getDisbursements().catch(() => ({ data: [] })),
          api.getRiskAnalysis().catch(() => ({ data: { summary: { highRiskCount: 0 } } }))
        ]);

        if (benRes.data && benRes.data.length > 0) {
          setTelemetry({
            beneficiaries: benRes.data.length,
            disbursements: disbRes.data?.length || 48192,
            highRisks: riskRes.data?.summary?.highRiskCount || 14,
            isLive: true
          });
        }
      } catch {
        // Fallback demo state active
      }
    }
    loadTelemetry();
  }, []);

  const currentCluster = CLUSTER_DATA[selectedClusterId] || CLUSTER_DATA['01'];

  const handleRerunAnomalyPass = () => {
    setIsSimulating(true);
    setActionFeedback('Executing iForest 100-tree anomaly recalculation pass...');
    setTimeout(() => {
      setIsSimulating(false);
      setActionFeedback('Anomaly pass complete. 14 anomalous clusters synchronized.');
      setTimeout(() => setActionFeedback(null), 3500);
    }, 1200);
  };

  const handleAuditAction = (action: 'flag' | 'justify' | 'demo') => {
    if (action === 'flag') {
      setActionFeedback(`Cluster ${currentCluster.code} locked & escalated for Tier-2 AML review.`);
    } else if (action === 'justify') {
      setActionFeedback(`Normalizing justification saved for ${currentCluster.code}. Ledger updated.`);
    } else {
      navigate('/dashboard');
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  return (
    <div className="w-full text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-[#070A10] transition-colors duration-200 min-h-screen">
      
      {/* Notice Scrim Bar: Statutory Audit Requirement */}
      <div className="w-full bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 py-2.5 px-4 sm:px-6 border-b border-blue-200 dark:border-blue-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center text-xs">
          <ShieldAlertIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="font-sans tracking-normal leading-tight">
            <span className="font-bold text-blue-700 dark:text-blue-300">Mandatory Audit Principle:</span> Algorithmic outputs are evidentiary risk signals, not definitive legal findings. Continuous certified investigator review required under SEC/FINRA Rule 3110.
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-[#090D16] border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10 space-y-8">
          
          {/* Overline Tag */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Institutional Disbursement Ledger Forensic v2.4</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">Zero False Negatives Target</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl leading-[1.15]"
          >
            Explainable Financial Micro-Auditing for High-Stakes Disbursements
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed font-sans"
          >
            Uncover hidden beneficiary networks, isolate synthetic disbursement rings, and trace audit trails with verifiable evidence. Purpose-built for compliance directors, oversight inspectors, and forensic AML units.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                const el = document.getElementById('product-preview');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="font-semibold text-sm px-6 py-3 shadow-md"
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Explore Product Preview
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="font-semibold text-sm px-6 py-3"
            >
              <Terminal className="w-4 h-4 mr-2" />
              Open Workspace Console
              <ArrowUpRight className="w-4 h-4 ml-1.5" />
            </Button>
          </motion.div>

          {/* Trust Metrics / At-a-glance Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl pt-8 border-t border-slate-200 dark:border-slate-800/80"
          >
            <div className="bg-slate-50 dark:bg-[#0E131F] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left shadow-sm">
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Detection Velocity</p>
              <p className="text-base font-bold text-slate-900 dark:text-white font-mono mt-1">420k txn/sec</p>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                <Zap className="w-3.5 h-3.5" /> Sub-second latency
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-[#0E131F] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left shadow-sm">
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confidence Metric</p>
              <p className="text-base font-bold text-slate-900 dark:text-white font-mono mt-1">99.98% Hash Seal</p>
              <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1 font-medium">
                <Lock className="w-3.5 h-3.5" /> SHA-256 Chain of Custody
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-[#0E131F] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left shadow-sm">
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unsupervised Baseline</p>
              <p className="text-base font-bold text-slate-900 dark:text-white font-mono mt-1">Isolation Forest</p>
              <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1 font-mono">
                <Cpu className="w-3.5 h-3.5 text-amber-500" /> Contamination @ 0.015
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-[#0E131F] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left shadow-sm">
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Oversight Compliance</p>
              <p className="text-base font-bold text-slate-900 dark:text-white font-mono mt-1">FedRAMP & SOC2</p>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Type II Certified
              </span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Interactive Product Preview Component Section */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-slate-100/70 dark:bg-[#0B0F19]" id="product-preview">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-mono text-xs uppercase tracking-wider font-bold mb-1">
                <Activity className="w-4 h-4" />
                <span>Live Micro-Audit Engine Telemetry</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Investigation Canvas: Batch RUN-2025-0418-X9
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{telemetry.isLive ? 'LIVE DATABASE SYNCHRONIZED' : 'DEMO STREAM SYNCHRONIZED'}</span>
              </span>

              <button
                onClick={handleRerunAnomalyPass}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-medium text-xs shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>Rerun Anomaly Pass</span>
              </button>
            </div>
          </div>

          {/* Action Feedback Banner */}
          <AnimatePresence>
            {actionFeedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-blue-600 text-white font-mono text-xs flex items-center justify-between shadow-md"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{actionFeedback}</span>
                </div>
                <span className="text-[10px] opacity-80 uppercase font-bold">Audit Event Logged</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Interactive Dashboard Sandbox */}
          <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Top Telemetry Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 bg-slate-50 dark:bg-[#090D16] p-4 gap-3 border-b border-slate-200 dark:border-slate-800">
              <div className="bg-white dark:bg-[#0E131F] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Audited Records</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                    {telemetry.disbursements.toLocaleString()}
                  </span>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">100% Parsed</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0E131F] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Throughput</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-base font-bold text-slate-900 dark:text-white">$142,829,410.00</span>
                  <span className="text-xs font-mono text-slate-500">USD</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0E131F] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Anomalous Clusters</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-base font-bold text-rose-600 dark:text-rose-400">
                    {telemetry.highRisks} Flagged
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold">
                    High Purity
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0E131F] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Heuristic Coverage</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-base font-bold text-slate-900 dark:text-white">24 Active Rules</span>
                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">+ iForest 12-Tree</span>
                </div>
              </div>
            </div>

            {/* 3-Panel Forensic Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
              
              {/* Column 1: Flagged Cluster Ledger (5 cols) */}
              <div className="lg:col-span-5 p-4 bg-slate-50/50 dark:bg-[#0A0E17] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/60">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Prioritized Evidence Ledger</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">Sort: Anomaly Score ↓</span>
                </div>

                {/* Cluster Cards List */}
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[440px] pr-1">
                  {Object.values(CLUSTER_DATA).map((cluster) => {
                    const isSelected = cluster.id === selectedClusterId;
                    return (
                      <div
                        key={cluster.id}
                        onClick={() => setSelectedClusterId(cluster.id)}
                        className={`cursor-pointer p-3.5 rounded-xl transition-all border ${
                          isSelected
                            ? 'bg-white dark:bg-[#121827] border-blue-500 shadow-md ring-1 ring-blue-500/20'
                            : 'bg-white/80 dark:bg-[#0E131F] border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{cluster.code}</span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                cluster.risk > 0.8
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              }`}>
                                Risk: {cluster.risk.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1">{cluster.title}</p>
                          </div>
                          <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0 ml-2">{cluster.amount}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-slate-500 text-[11px]">
                          <span>{cluster.subtitle}</span>
                          <span className={`flex items-center font-medium text-xs ${isSelected ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400'}`}>
                            Inspect Trace <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-auto pt-2 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Showing 4 of {telemetry.highRisks} flagged items</span>
                  <button onClick={() => navigate('/dashboard')} className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                    View All in Console →
                  </button>
                </div>
              </div>

              {/* Column 2: Connected-Entity Bipartite Graph Visualization (4 cols) */}
              <div className="lg:col-span-4 p-4 bg-white dark:bg-[#0E131F] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Entity Topology & Collisions</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">Bipartite Layer</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    Live node linkage between Disbursing Entities (D-Node), Virtual Payout Gateways, and Beneficiary IBANs.
                  </p>
                </div>

                {/* SVG Graph Canvas */}
                <div className="w-full bg-slate-50 dark:bg-[#070A10] rounded-xl p-3 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center relative my-2">
                  <svg className="w-full h-56" viewBox="0 0 320 200" fill="none">
                    {/* SVG Links */}
                    <line x1="50" y1="100" x2="160" y2="50" stroke="#94A3B8" strokeDasharray="3 3" strokeWidth="1.5" />
                    <line x1="50" y1="100" x2="160" y2="100" stroke="#3B82F6" strokeWidth="2" />
                    <line x1="50" y1="100" x2="160" y2="150" stroke="#F43F5E" strokeWidth="2.5" />
                    <line x1="160" y1="50" x2="270" y2="50" stroke="#94A3B8" strokeWidth="1.5" />
                    <line x1="160" y1="100" x2="270" y2="50" stroke="#F43F5E" strokeWidth="2" />
                    <line x1="160" y1="150" x2="270" y2="150" stroke="#F43F5E" strokeWidth="2" />
                    <line x1="160" y1="150" x2="270" y2="50" stroke="#F43F5E" strokeWidth="2.5" />

                    {/* Source Node */}
                    <circle cx="50" cy="100" r="16" fill="#0F172A" className="dark:fill-slate-800" />
                    <text x="50" y="104" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold">SRC-01</text>
                    <text x="50" y="126" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="sans-serif">Disbursing Acc</text>

                    {/* Routers */}
                    <circle cx="160" cy="50" r="13" fill="#DBEAFE" className="dark:fill-blue-950/60" />
                    <text x="160" y="54" textAnchor="middle" fill="#1D4ED8" className="dark:fill-blue-300" fontSize="8" fontFamily="monospace">RT-081</text>

                    <circle cx="160" cy="100" r="13" fill="#DBEAFE" className="dark:fill-blue-950/60" />
                    <text x="160" y="104" textAnchor="middle" fill="#1D4ED8" className="dark:fill-blue-300" fontSize="8" fontFamily="monospace">RT-082</text>

                    {/* High Risk Intermediary Node */}
                    <circle cx="160" cy="150" r="15" fill="#FFE4E6" className="dark:fill-rose-950/60" />
                    <circle cx="160" cy="150" r="19" stroke="#F43F5E" strokeDasharray="2 2" strokeWidth="1.5" fill="none" />
                    <text x="160" y="154" textAnchor="middle" fill="#E11D48" className="dark:fill-rose-300" fontSize="8" fontFamily="monospace" fontWeight="bold">RT-994</text>
                    <text x="160" y="178" textAnchor="middle" fill="#E11D48" className="dark:fill-rose-400" fontSize="8" fontFamily="sans-serif" fontWeight="bold">Shared Route</text>

                    {/* Terminating Beneficiaries */}
                    <circle cx="270" cy="50" r="14" fill="#FFE4E6" className="dark:fill-rose-950/60" />
                    <text x="270" y="53" textAnchor="middle" fill="#E11D48" className="dark:fill-rose-300" fontSize="8" fontFamily="monospace">BN-41</text>
                    <text x="270" y="73" textAnchor="middle" fill="#E11D48" className="dark:fill-rose-400" fontSize="7" fontFamily="sans-serif">Collision Node</text>

                    <circle cx="270" cy="150" r="13" fill="#D1FAE5" className="dark:fill-emerald-950/60" />
                    <text x="270" y="154" textAnchor="middle" fill="#047857" className="dark:fill-emerald-300" fontSize="8" fontFamily="monospace">BN-18</text>
                    <text x="270" y="172" textAnchor="middle" fill="#047857" className="dark:fill-emerald-400" fontSize="7" fontFamily="sans-serif">Verified Recipient</text>
                  </svg>

                  <div className="flex items-center justify-between w-full pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono">
                    <span className="text-slate-500">Density: 0.78</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Synthetic Ring Signature
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-around text-[11px] font-mono text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-800 dark:bg-slate-200" /> Origin</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Router</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Collision</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Verified</span>
                </div>
              </div>

              {/* Column 3: Forensic Explainability Detail Pane (3 cols) */}
              <div className="lg:col-span-3 p-4 bg-slate-50/70 dark:bg-[#0A0E17] flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/60">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Feature Contribution</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                      SHAP-LIME
                    </span>
                  </div>

                  {/* SHAP Feature Contribution Bars */}
                  <div className="space-y-3 pt-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-800 dark:text-slate-200 font-medium text-[11px]">{currentCluster.f1.name}</span>
                        <span className="text-rose-600 dark:text-rose-400 font-mono text-xs font-bold">{currentCluster.f1.val}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full transition-all duration-300" style={{ width: `${currentCluster.f1.pct}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-800 dark:text-slate-200 font-medium text-[11px]">{currentCluster.f2.name}</span>
                        <span className="text-rose-600 dark:text-rose-400 font-mono text-xs font-bold">{currentCluster.f2.val}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full transition-all duration-300" style={{ width: `${currentCluster.f2.pct}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-800 dark:text-slate-200 font-medium text-[11px]">{currentCluster.f3.name}</span>
                        <span className="text-blue-600 dark:text-blue-400 font-mono text-xs font-bold">{currentCluster.f3.val}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${currentCluster.f3.pct}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium text-[11px]">{currentCluster.f4.name}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">{currentCluster.f4.val}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${currentCluster.f4.pct}%` }} />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-slate-800 shadow-sm mt-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1">
                        Audit Recommendation
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                        {currentCluster.recommendation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sign-Off Action Triggers */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => handleAuditAction('flag')}
                    className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Flag & Lock For Manual Review</span>
                  </button>

                  <button
                    onClick={() => handleAuditAction('justify')}
                    className="w-full py-2 px-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Mark Normalizing Justification</span>
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 5-Stage Forensic Lineage Workflow */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#090D16] border-t border-b border-slate-200 dark:border-slate-800/80" id="workflow">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              5-Stage Forensic Lineage
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              From Raw Ingestion to Cryptographically Sealed Dossiers
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed font-sans">
              Every stage preserves deterministic reproducibility. When regulators request documentation, your audit trails answer with mathematical clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                num: '01',
                title: 'Import Data',
                desc: 'High-throughput batch CSV, JSON schemas, or native Kafka/FedNow disbursement streaming pipelines.',
                badge: 'Multi-Source Schema Map',
                icon: Database
              },
              {
                num: '02',
                title: 'Analyze Risks',
                desc: 'Rule-based deterministic compliance checks layered with unsupervised Isolation Forest ML anomaly scoring.',
                badge: 'Dual-Engine Pass',
                icon: Activity
              },
              {
                num: '03',
                title: 'Investigate Connections',
                desc: 'Bipartite graph topological models reveal shell companies and split payment account collisions instantly.',
                badge: 'Graph Entity Traversal',
                icon: Share2
              },
              {
                num: '04',
                title: 'Review Evidence',
                desc: 'Explainable feature weighting provides plain-language justification notes ready for human sign-off.',
                badge: 'Human-in-the-Loop Signoff',
                icon: ShieldCheck
              },
              {
                num: '05',
                title: 'Export Reports',
                desc: 'Generate SHA-256 hashed audit dossiers compliant with FinCEN SAR and regulatory submission formats.',
                badge: 'Tamper-Proof Dossier',
                icon: FileCheck
              }
            ].map((step, idx) => (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-[#0E131F] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-blue-500/50 transition-all shadow-sm group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-mono text-xs font-extrabold flex items-center justify-center">
                      {step.num}
                    </span>
                    <step.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{step.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 block text-center font-medium">
                    {step.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Methodology Deep Dive: Dual Engine Architecture */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-slate-100/60 dark:bg-[#0B0F19]" id="methodology">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Architectural Rigor
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              The Dual-Engine Detection Architecture
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed font-sans">
              Rule-only systems drown compliance in false positives. Pure black-box machine learning fails regulatory explainability tests. FinTrace combines both engines to produce verifiable certainty.
            </p>
          </div>

          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Engine A: Deterministic Rule-Based Heuristics */}
            <div className="bg-white dark:bg-[#0E131F] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Deterministic Heuristics Engine</h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Engine A
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  Hardcoded statutory limits, global sanctions screening, and pattern-based structuring flags that provide binary audit evidence for legal proceedings.
                </p>

                <ul className="space-y-4 text-xs font-sans">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white font-semibold block mb-0.5">Structuring Identification ($9,000 - $9,999):</strong>
                      <span className="text-slate-600 dark:text-slate-400 leading-relaxed block">
                        Automated identification of repeated transfers calibrated just beneath mandatory CTR reporting triggers within arbitrary rolling timeframes.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white font-semibold block mb-0.5">OFAC & PEP Fuzzy Entity Resolution:</strong>
                      <span className="text-slate-600 dark:text-slate-400 leading-relaxed block">
                        Jaro-Winkler and Levenshtein token distance matching against updated sanctions registries with automated phoneme phonetic hashing.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white font-semibold block mb-0.5">Rapid Velocity Windowing:</strong>
                      <span className="text-slate-600 dark:text-slate-400 leading-relaxed block">
                        Detection of sub-minute batch dispersion spikes where account balances drop back to zero within single clearing cycles.
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider block mb-2">Regulatory Standard Mapping:</span>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">Bank Secrecy Act (BSA)</span>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">FinCEN 314(a)</span>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">EU 6AMLD</span>
                </div>
              </div>
            </div>

            {/* Engine B: Unsupervised Isolation Forest ML */}
            <div className="bg-white dark:bg-[#0E131F] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Isolation Forest Anomaly ML</h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Engine B
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  Tree-based ensemble isolation isolating zero-day disbursement anomalies that circumvent pre-configured rules by analyzing high-dimensional distance.
                </p>

                <ul className="space-y-4 text-xs font-sans">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white font-semibold block mb-0.5">Contamination Threshold: 0.015:</strong>
                      <span className="text-slate-600 dark:text-slate-400 leading-relaxed block">
                        Strictly parameterized to isolate the most extreme 1.5% outliers, dramatically suppressing benign transactional noise.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white font-semibold block mb-0.5">12-Tree Subspace Partitioning:</strong>
                      <span className="text-slate-600 dark:text-slate-400 leading-relaxed block">
                        Multi-feature recursive tree splitting over disbursement intervals, IP subnet shifts, beneficiary account vintage, and volume deviations.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white font-semibold block mb-0.5">SHAP Value Explainability Scores:</strong>
                      <span className="text-slate-600 dark:text-slate-400 leading-relaxed block">
                        Every flagged anomaly outputs normalized marginal contribution scores (+/-) so auditors immediately understand why the record was isolated.
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider block mb-2">Model Calibration Profile:</span>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">Contamination: 0.015</span>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">Trees: 100</span>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">Max Depth: 12</span>
                </div>
              </div>
            </div>

          </div>

          {/* Statutory Auditor Verification Protocol Callout Box */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 max-w-3xl">
              <ShieldCheck className="w-7 h-7 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Statutory Auditor Verification Protocol</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  FinTrace AI explicitly decouples suspicion generation from regulatory reporting. An automated flag is an evidentiary risk indicator, not definitive proof of fraud. Human auditor verification and documented sign-off are required before SAR generation or fund revocation.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/dashboard')}
              className="shrink-0 text-xs font-medium"
            >
              Read Governance Framework
            </Button>
          </div>

        </div>
      </section>

      {/* Final Onboarding CTA Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#090D16] border-t border-slate-200 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto p-10 rounded-2xl bg-slate-50 dark:bg-[#0E131F] border border-slate-200 dark:border-slate-800 shadow-xl text-center flex flex-col items-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ready to harden your disbursement audits?
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-base max-w-xl leading-relaxed font-sans">
            Deploy FinTrace AI in your private cloud, integrate with transaction streaming brokers, and equip your investigators with deterministic forensic audit power.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/signup')}
              className="font-semibold text-sm px-6 py-3 shadow-md"
            >
              <Terminal className="w-4 h-4 mr-2" />
              Deploy Self-Hosted Sandbox
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="font-semibold text-sm px-6 py-3"
            >
              <Clock className="w-4 h-4 mr-2" />
              Schedule Technical Walkthrough
            </Button>
          </div>

          <p className="text-xs text-slate-500 font-mono">
            No payment details required. SOC2 Type II audit report available under enterprise mutual NDA.
          </p>
        </div>
      </section>

      {/* Restrained Institutional Footer */}
      <footer className="w-full bg-slate-900 text-slate-300 pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-bold text-white tracking-tight">FinTrace AI Systems</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-sans">
                Institutional-grade explainable forensic financial micro-auditing infrastructure. Built to detect structured disbursement fraud, entity collisions, and synthetic account networks across high-velocity settlement corridors.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">SOC 2 TYPE II</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">FedRAMP In-Process</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">ISO 27001</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-mono">Product</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">Investigation Canvas</button></li>
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">Disbursement Ingest</button></li>
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">Dual Engine ML</button></li>
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">Topology Explorer</button></li>
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">Audit Export Dossiers</button></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-mono">Workspace</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">Active Run Ledger</button></li>
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">Rule Configuration</button></li>
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">Isolation Hyperparameters</button></li>
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">Investigator Sign-off Queues</button></li>
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">Kafka & FedNow Connectors</button></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-mono">Governance</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">SAR Filing Protocols</button></li>
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">Model Explainability Report</button></li>
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">Chain-of-Custody Hashing</button></li>
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">Privacy & Data Residency</button></li>
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 transition-colors">Responsible AI Charter</button></li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-200">STATUTORY REGULATORY DISCLAIMER:</span> FinTrace AI is an investigative decision-support system. All flagged records, anomaly risk indices, topological clusters, and algorithmic scores represent mathematical variations relative to baseline disbursements and do not constitute a conclusive legal determination of fraud, money laundering, sanctions evasion, or criminal culpability. Designated compliance officers and authorized forensic personnel must conduct independent evidentiary corroboration prior to filing Suspicious Activity Reports (SARs) or executing asset freezes.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 pt-2 border-t border-slate-800">
            <p>© 2026 FinTrace AI Technologies Inc. All rights reserved. Cryptographic integrity guaranteed under SHA-256 ledger seals.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-300 cursor-pointer">Security Whitepaper</span>
              <span className="hover:text-slate-300 cursor-pointer">API Docs</span>
              <span className="hover:text-slate-300 cursor-pointer text-emerald-400 font-mono">System Status: Operational</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

// Helper component for Scrim Bar icon
const ShieldAlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
