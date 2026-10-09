import React from 'react';
import { ShieldCheck, Activity, Terminal } from 'lucide-react';
import { useHealth } from '../../hooks/useHealth';
import { Badge } from '../ui/Badge';

export const Navbar: React.FC = () => {
  const { health, loading } = useHealth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-cyan-500/10 flex items-center justify-center">
          <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            FinTrace <span className="text-blue-500">AI</span>
          </span>
          <p className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">Micro-Audit & Ghost Detection Engine</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs">
          <Activity className={`h-3.5 w-3.5 ${health?.status === 'ok' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
          <span className="text-slate-400 font-mono text-[11px]">API Status:</span>
          {loading ? (
            <span className="text-slate-500 font-mono">Checking...</span>
          ) : health?.status === 'ok' ? (
            <Badge variant="success">ONLINE</Badge>
          ) : (
            <Badge variant="warning">DISCONNECTED</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 border-l border-slate-800 pl-4">
          <Terminal className="h-3.5 w-3.5 text-blue-400" />
          <span>v1.0.0-hackathon</span>
        </div>
      </div>
    </header>
  );
};
