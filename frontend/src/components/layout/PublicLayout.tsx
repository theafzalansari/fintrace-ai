import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { ShieldCheck, ArrowRight, Terminal } from 'lucide-react';
import { Button } from '../ui/Button';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  const handleExploreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.location.pathname !== '/') {
      navigate('/#walkthrough');
    } else {
      const element = document.getElementById('walkthrough');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-[#84CC16] selection:text-[#07090E]">
      {/* Public Editorial Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#07090E]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-lg bg-slate-900 border border-[#84CC16]/40 flex items-center justify-center group-hover:border-[#84CC16] transition-colors">
            <ShieldCheck className="h-5 w-5 text-[#84CC16]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold tracking-tight text-white uppercase">
                FinTrace <span className="text-[#84CC16]">AI</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                FORENSIC ARCHITECTURE
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-4 text-xs font-mono">
          <a
            href="#walkthrough"
            onClick={handleExploreClick}
            className="hidden md:inline-block text-slate-400 hover:text-white transition-colors"
          >
            // EXPLORE PIPELINE
          </a>

          {publishableKey ? (
            <>
              <SignedIn>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="border-[#84CC16]/40 text-[#84CC16] hover:bg-[#84CC16]/10 text-xs font-mono"
                >
                  Open Workspace
                </Button>
                <UserButton
                  appearance={{
                    elements: {
                      userButtonBox: 'flex flex-row-reverse gap-2 text-slate-200 font-mono text-xs',
                    }
                  }}
                />
              </SignedIn>

              <SignedOut>
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white px-3 py-1.5 rounded hover:bg-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="border-[#84CC16]/40 text-[#84CC16] hover:bg-[#84CC16]/10 text-xs font-mono"
                >
                  Open Dashboard
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/signup')}
                  className="bg-[#84CC16] hover:bg-[#a3e635] text-[#07090E] font-medium text-xs font-mono"
                >
                  Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </SignedOut>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-slate-300 hover:text-white px-3 py-1.5 rounded hover:bg-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="border-[#84CC16]/40 text-[#84CC16] hover:bg-[#84CC16]/10 text-xs font-mono"
              >
                Open Dashboard
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/signup')}
                className="bg-[#84CC16] hover:bg-[#a3e635] text-[#07090E] font-medium text-xs font-mono"
              >
                Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </>
          )}
        </nav>
      </header>

      {/* Main Public Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-900 bg-[#05070B] py-8 px-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#84CC16]" />
            <span>FINTRACE FORENSIC ENGINE // ALL SYSTEM SIGNALS GROUNDED</span>
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <Link to="/" className="hover:text-white transition-colors">Public Portal</Link>
            <Link to="/login" className="hover:text-white transition-colors">Auditor Login</Link>
            <Link to="/signup" className="hover:text-white transition-colors">Register Profile</Link>
            <Link to="/dashboard" className="hover:text-[#84CC16] transition-colors">Open Workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
