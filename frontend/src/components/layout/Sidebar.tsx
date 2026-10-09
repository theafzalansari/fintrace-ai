import React from 'react';
import {
  LayoutDashboard,
  Users,
  GitFork,
  SearchCode,
  Bot,
  FileCheck,
  ChevronRight,
  FileText
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Audit Dashboard', icon: LayoutDashboard },
    { id: 'beneficiaries', label: 'Beneficiary Ledger', icon: Users, badge: 'Ghost Detection' },
    { id: 'disbursements', label: 'Disbursement Records', icon: FileText },
    { id: 'investigations', label: 'Micro-Audit Risks', icon: SearchCode, badge: 'Rule Engine' },
    { id: 'network', label: 'Network Graph', icon: GitFork, badge: 'Adjacency' },
    { id: 'copilot', label: 'Audit Copilot', icon: Bot, badge: 'Future' },
    { id: 'reports', label: 'Audit Reports', icon: FileCheck, badge: 'Future' }
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] shrink-0">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Audit Workspace
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-blue-400" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 space-y-1">
        <div className="flex items-center justify-between font-mono text-[11px] text-slate-300">
          <span>Forensic Engine</span>
          <span className="text-emerald-400">API Connected</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Real-time backend REST integration active.
        </p>
      </div>
    </aside>
  );
};
