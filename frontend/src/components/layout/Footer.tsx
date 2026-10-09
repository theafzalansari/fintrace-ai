import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, ArrowUpRight } from 'lucide-react';

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
    <footer className="relative w-full bg-gradient-to-br from-[#060913] via-[#091126] to-[#0D1B3E] text-slate-200 pt-14 pb-10 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20 shadow-2xl overflow-hidden">
      {/* Top Cyan Accent Glow Bar */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
      
      {/* Background Soft Radial Glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* Multi-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/logo.jpeg"
                alt="FinTrace AI Logo"
                className="h-8 w-8 rounded-lg object-cover border border-blue-500/30 shadow-md group-hover:border-cyan-400 transition-colors"
              />
              <span className="font-sans text-lg font-extrabold tracking-tight text-white">
                FinTrace <span className="text-cyan-400 font-bold">AI</span>
              </span>
            </Link>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed font-sans">
              Automated financial micro-auditing platform for disbursement tracking, ghost-beneficiary detection, and explainable Isolation Forest risk signals across public and enterprise welfare systems.
            </p>
          </div>

          {/* Product Overview Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Product Overview
            </h4>
            <ul className="space-y-2 text-xs font-sans text-slate-300">
              <li>
                <a href="#product-preview" onClick={handleScrollTo('product-preview')} className="hover:text-white hover:underline transition-colors">
                  Product Preview
                </a>
              </li>
              <li>
                <a href="#workflow" onClick={handleScrollTo('workflow')} className="hover:text-white hover:underline transition-colors">
                  Pipeline Workflow
                </a>
              </li>
              <li>
                <a href="#methodology" onClick={handleScrollTo('methodology')} className="hover:text-white hover:underline transition-colors">
                  Engine Methodology
                </a>
              </li>
              <li>
                <Link to="/dashboard" className="text-cyan-300 font-semibold hover:text-white inline-flex items-center gap-0.5">
                  Open Workspace <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Workspace Modules Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Workspace Modules
            </h4>
            <ul className="space-y-2 text-xs font-sans text-slate-300">
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Audit Dashboard
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Micro-Audit Risk Engine
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Network Graph Topology
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Audit Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Access Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Account Access
            </h4>
            <ul className="space-y-2 text-xs font-sans text-slate-300">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Auditor Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition-colors">
                  Register Profile
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Statutory Audit Disclaimer Notice */}
        <div className="p-4 rounded-xl bg-blue-950/60 border border-blue-500/30 text-xs text-slate-200 space-y-1 font-mono backdrop-blur-sm shadow-inner">
          <div className="flex items-center gap-2 font-bold text-cyan-300">
            <Terminal className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>FORENSIC COMPLIANCE & REVIEW NOTICE</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            FinTrace AI provides algorithmic risk detection and explainable anomaly indicators for human audit review. High risk scores serve as investigative signals for forensic review and do not constitute legal proof of fraud.
          </p>
        </div>

        {/* Bottom Bar: Copyright & Engine Status */}
        <div className="pt-6 border-t border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div>
            © {currentYear} FinTrace AI. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-semibold">FORENSIC ENGINE ACTIVE // REPO GROUNDED</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
