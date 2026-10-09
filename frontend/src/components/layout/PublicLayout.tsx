import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { ArrowRight, X, Menu, Terminal } from 'lucide-react';
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Sticky Public Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/90 dark:bg-[#070A10]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/90 shadow-md py-3'
            : 'bg-white/80 dark:bg-[#070A10]/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-800/60 py-3.5'
        } px-4 sm:px-8 flex items-center justify-between`}
      >
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.jpeg"
            alt="FinTrace AI Logo"
            className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-sm group-hover:border-blue-500 transition-all duration-200"
          />
          <span className="font-sans text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
            FinTrace <span className="text-blue-600 dark:text-blue-400 font-bold">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
          <a
            href="#workflow"
            onClick={handleScrollTo('workflow')}
            className="px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
          >
            Workflow
          </a>
          <a
            href="#methodology"
            onClick={handleScrollTo('methodology')}
            className="px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
          >
            Methodology
          </a>
          <a
            href="#product-preview"
            onClick={handleScrollTo('product-preview')}
            className="px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
          >
            Product Preview
          </a>
        </nav>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <div className="hidden sm:flex items-center gap-2.5">
            {publishableKey ? (
              <>
                <SignedIn>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                    className="text-xs font-semibold px-3.5 shadow-sm"
                  >
                    <Terminal className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
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
                    className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/signup')}
                    className="text-xs font-semibold px-4 shadow-sm"
                  >
                    Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </SignedOut>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors"
                >
                  Sign In
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="text-xs font-semibold px-4 shadow-sm"
                >
                  Open Workspace <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#070A10]/95 backdrop-blur-md px-6 py-4 space-y-3 text-sm font-semibold shadow-lg">
          <a
            href="#workflow"
            onClick={handleScrollTo('workflow')}
            className="block py-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Workflow
          </a>
          <a
            href="#methodology"
            onClick={handleScrollTo('methodology')}
            className="block py-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Methodology
          </a>
          <a
            href="#product-preview"
            onClick={handleScrollTo('product-preview')}
            className="block py-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Product Preview
          </a>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-col gap-2">
            <Button variant="primary" size="md" onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}>
              Open Workspace Console
            </Button>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center text-xs text-slate-600 dark:text-slate-400 py-2 hover:underline">
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
