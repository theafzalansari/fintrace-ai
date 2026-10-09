import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { ShieldCheck, ArrowRight, X, Menu } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { Footer } from './Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Public Editorial Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#090D16]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-600/10 border border-blue-500/30 flex items-center justify-center group-hover:border-blue-500 transition-colors">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </div>
          <span className="font-sans text-base font-bold tracking-tight text-slate-900 dark:text-white">
            FinTrace <span className="text-blue-500 font-semibold">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <a href="#workflow" onClick={handleScrollTo('workflow')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Workflow
          </a>
          <a href="#methodology" onClick={handleScrollTo('methodology')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Methodology
          </a>
          <a href="#preview" onClick={handleScrollTo('preview')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Product Preview
          </a>
        </nav>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="hidden sm:flex items-center gap-3">
            {publishableKey ? (
              <>
                <SignedIn>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                    className="text-xs font-medium"
                  >
                    Open Workspace
                  </Button>
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonBox: 'flex flex-row-reverse gap-2 text-slate-800 dark:text-slate-200 text-xs font-medium',
                      }
                    }}
                  />
                </SignedIn>

                <SignedOut>
                  <Link
                    to="/login"
                    className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/signup')}
                    className="text-xs font-medium"
                  >
                    Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </SignedOut>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  Sign In
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="text-xs font-medium"
                >
                  Open Workspace <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-300 dark:border-slate-800"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D16] px-6 py-4 space-y-4 text-sm font-medium">
          <a href="#workflow" onClick={handleScrollTo('workflow')} className="block text-slate-700 dark:text-slate-300">
            Workflow
          </a>
          <a href="#methodology" onClick={handleScrollTo('methodology')} className="block text-slate-700 dark:text-slate-300">
            Methodology
          </a>
          <a href="#preview" onClick={handleScrollTo('preview')} className="block text-slate-700 dark:text-slate-300">
            Product Preview
          </a>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <Button variant="primary" size="md" onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}>
              Open Workspace
            </Button>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center text-xs text-slate-500 dark:text-slate-400 py-2">
              Sign In to Account
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Substantial Multi-Column Footer */}
      <Footer />
    </div>
  );
};
