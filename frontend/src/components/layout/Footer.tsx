import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Terminal, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const handleScrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.location.pathname !== '/') {
      navigate(`/#${id}`);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-100 dark:bg-[#060910] text-slate-600 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 space-y-10">
        {/* Top Multi-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-600/10 border border-blue-500/30 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
              </div>
              <span className="font-sans text-base font-bold tracking-tight text-slate-900 dark:text-white">
                FinTrace <span className="text-blue-500 font-semibold">AI</span>
              </span>
            </Link>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans max-w-sm">
              Automated financial micro-auditing platform for disbursement tracking, ghost-beneficiary detection, and explainable Isolation Forest risk signals.
            </p>
          </div>

          {/* Product Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
              Product Overview
            </h4>
            <ul className="space-y-2 text-xs font-sans">
              <li>
                <a href="#preview" onClick={handleScrollTo('preview')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Product Preview
                </a>
              </li>
              <li>
                <a href="#workflow" onClick={handleScrollTo('workflow')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Pipeline Workflow
                </a>
              </li>
              <li>
                <a href="#methodology" onClick={handleScrollTo('methodology')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Engine Methodology
                </a>
              </li>
              <li>
                <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center">
                  Open Workspace <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Workspace Platform Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
              Workspace Modules
            </h4>
            <ul className="space-y-2 text-xs font-sans">
              <li>
                <Link to="/dashboard" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Audit Dashboard
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Micro-Audit Risk Engine
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Network Graph Topology
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Downloadable Audit Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Access */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
              Account Access
            </h4>
            <ul className="space-y-2 text-xs font-sans">
              <li>
                <Link to="/login" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Auditor Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Register Profile
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Audit Disclaimer Notice */}
        <div className="p-4 rounded-xl bg-slate-200/70 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 space-y-1 font-mono">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-300">
            <Terminal className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>FORENSIC COMPLIANCE & REVIEW NOTICE</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            FinTrace AI provides algorithmic risk detection and explainable anomaly indicators for human audit review. High risk scores serve as signals for investigation and do not constitute legal proof of fraud.
          </p>
        </div>

        {/* Bottom Bar: Copyright & Terminal Indicator */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>
            © {currentYear} FinTrace AI. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>FORENSIC ENGINE ACTIVE // REPO GROUNDED</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
