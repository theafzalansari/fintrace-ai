import React from 'react';
import {
  LayoutDashboard,
  Users,
  GitFork,
  SearchCode,
  FolderLock,
  Bot,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  FileText
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  onToggleCollapse
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Audit Dashboard', icon: LayoutDashboard },
    { id: 'beneficiaries', label: 'Beneficiary Ledger', icon: Users, badge: 'Ghost Detection' },
    { id: 'disbursements', label: 'Disbursement Records', icon: FileText },
    { id: 'investigations', label: 'Micro-Audit Risks', icon: SearchCode, badge: 'Hybrid Engine' },
    { id: 'cases', label: 'Case Workspace', icon: FolderLock, badge: 'Persistent' },
    { id: 'network', label: 'Network Graph', icon: GitFork, badge: 'Adjacency' },
    { id: 'copilot', label: 'Audit Copilot', icon: Bot, badge: 'AI Assistant' },
    { id: 'reports', label: 'Audit Reports', icon: FileCheck, badge: 'PDF & CSV' }
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] shrink-0 transition-all duration-200 select-none`}
    >
      <div className="space-y-2">
        {/* Header & Collapse Toggle */}
        <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-slate-200 dark:border-slate-800/60 pb-2">
          {!isCollapsed && (
            <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-500 truncate">
              Audit Workspace
            </p>
          )}
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors mx-auto"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'
                } rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                    : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info Card */}
      {!isCollapsed ? (
        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-800 dark:text-slate-300">
            <span>Forensic Engine</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Connected</span>
          </div>
          <p className="text-[10px] text-slate-500">
            REST API & Isolation Forest Active
          </p>
        </div>
      ) : (
        <div className="flex justify-center p-2" title="Forensic Engine Connected">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      )}
    </aside>
  );
};
