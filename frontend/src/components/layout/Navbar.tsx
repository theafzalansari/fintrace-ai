import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignedIn, UserButton } from '@clerk/clerk-react';
import { ShieldCheck, Activity, Globe } from 'lucide-react';
import { useHealth } from '../../hooks/useHealth';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { health, loading } = useHealth();
  const navigate = useNavigate();
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <Link
        to="/"
        className="flex items-center gap-3 group"
      >
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/10 flex items-center justify-center">
          <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center group-hover:bg-slate-900 transition">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-1.5">
            FinTrace <span className="text-blue-500">AI</span>
          </span>
          <p className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">Micro-Audit & Forensic Engine</p>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        {/* Navigation Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="text-xs font-mono border-slate-700 hover:bg-slate-800"
          >
            <Globe className="w-3.5 h-3.5 mr-1.5 text-lime-400" />
            Public Portal
          </Button>
        </div>

        {/* API Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs">
          <Activity className={`h-3.5 w-3.5 ${health?.status === 'ok' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
          <span className="text-slate-400 font-mono text-[11px]">API Status:</span>
          {loading ? (
            <span className="text-slate-500 font-mono text-[11px]">Checking...</span>
          ) : health?.status === 'ok' ? (
            <Badge variant="success">ONLINE</Badge>
          ) : (
            <Badge variant="warning">DISCONNECTED</Badge>
          )}
        </div>

        {/* Clerk User Button Account Menu */}
        {publishableKey && (
          <div className="border-l border-slate-800 pl-4">
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    userButtonBox: 'flex flex-row-reverse gap-2 text-slate-200 font-mono text-xs font-medium',
                  }
                }}
              />
            </SignedIn>
          </div>
        )}
      </div>
    </header>
  );
};
