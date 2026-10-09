import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: (activeTab: string, setActiveTab: (tab: string) => void) => React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col font-sans print:bg-white print:text-black">
      <div className="no-print">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className="flex flex-1">
        <div className="no-print">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto print:p-0 print:m-0 print:overflow-visible">
          {children(activeTab, setActiveTab)}
        </main>
      </div>
    </div>
  );
};
