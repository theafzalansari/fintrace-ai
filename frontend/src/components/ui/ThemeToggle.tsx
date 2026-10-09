import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-mono font-medium cursor-pointer ${
        theme === 'dark'
          ? 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800'
          : 'bg-white border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-100 shadow-sm'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden sm:inline">Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-slate-700" />
          <span className="hidden sm:inline">Dark Mode</span>
        </>
      )}
    </button>
  );
};
