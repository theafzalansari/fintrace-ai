import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignedIn, UserButton } from '@clerk/clerk-react';
import { ShieldCheck, Activity, Globe, Menu } from 'lucide-react';
import { useHealth } from '../../hooks/useHealth';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onOpenMobileDrawer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileDrawer }) => {
  const { health, loading } = useHealth();
  const navigate = useNavigate();
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-3">
        {onOpenMobileDrawer && (
          <button
            onClick={onOpenMobileDrawer}
            className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800"
            aria-label="Open Workspace Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link
          to="/"
          className="flex items-center gap-3 group"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/10 flex items-center justify-center">
            <div className="h-full w-full bg-slate-100 dark:bg-slate-950 rounded-[10px] flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-900 transition">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              FinTrace <span className="text-blue-500 font-semibold">AI</span>
            </span>
            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tracking-wider uppercase hidden sm:block">Micro-Audit Workspace</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Navigation Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="text-xs font-mono"
          >
            <Globe className="w-3.5 h-3.5 mr-1.5 text-lime-600 dark:text-lime-400" />
            <span className="hidden sm:inline">Public Portal</span>
            <span className="sm:hidden">Portal</span>
          </Button>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* API Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
          <Activity className={`h-3.5 w-3.5 ${health?.status === 'ok' ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
          <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">API:</span>
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
          <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    userButtonBox: 'flex flex-row-reverse gap-2 text-slate-800 dark:text-slate-200 font-mono text-xs font-medium',
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
