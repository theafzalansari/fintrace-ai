import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import {
  LayoutDashboard,
  Users,
  GitFork,
  SearchCode,
  Bot,
  FileCheck,
  FileText,
  X,
  ChevronRight
} from 'lucide-react';

interface LayoutProps {
  children: (activeTab: string, setActiveTab: (tab: string) => void) => React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('fintrace_sidebar_collapsed') === 'true';
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('fintrace_sidebar_collapsed', isCollapsed ? 'true' : 'false');
  }, [isCollapsed]);

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Audit Dashboard', icon: LayoutDashboard },
    { id: 'beneficiaries', label: 'Beneficiary Ledger', icon: Users, badge: 'Ghost Detection' },
    { id: 'disbursements', label: 'Disbursement Records', icon: FileText },
    { id: 'investigations', label: 'Micro-Audit Risks', icon: SearchCode, badge: 'Hybrid Engine' },
    { id: 'network', label: 'Network Graph', icon: GitFork, badge: 'Adjacency' },
    { id: 'copilot', label: 'Audit Copilot', icon: Bot, badge: 'AI Assistant' },
    { id: 'reports', label: 'Audit Reports', icon: FileCheck, badge: 'PDF & CSV' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] flex flex-col font-sans print:bg-white print:text-black transition-colors duration-150">
      <div className="no-print">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        />
      </div>

      <div className="flex flex-1 relative">
        {/* Desktop Collapsible Sidebar */}
        <div className="no-print">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileDrawerOpen(false)}
            />

            {/* Slide-in Drawer */}
            <div className="relative w-72 max-w-[80vw] bg-white dark:bg-[#0B0F17] border-r border-slate-200 dark:border-slate-800 p-4 shadow-2xl flex flex-col justify-between z-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Audit Navigation
                  </span>
                  <button
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800"
                    aria-label="Close Mobile Navigation Drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-500/20'
                            : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                <div className="font-mono text-[11px] text-slate-900 dark:text-slate-300 font-bold mb-0.5">
                  FinTrace AI Workspace
                </div>
                <p className="text-[10px] text-slate-500">
                  Micro-Audit & Anomaly Engine
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto print:p-0 print:m-0 print:overflow-visible transition-all">
          {children(activeTab, setActiveTab)}
        </main>
      </div>
    </div>
  );
};
