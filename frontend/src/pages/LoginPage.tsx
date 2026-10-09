import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { ShieldCheck, Key, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-6 bg-[#07090E]">
      <div className="w-full max-w-md space-y-6">
        {publishableKey ? (
          /* Real Clerk Sign In UI */
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-400 mb-2">
              <ShieldCheck className="h-4 w-4 text-[#84CC16]" />
              <span>CLERK AUTHENTICATION TERMINAL</span>
            </div>
            <div className="w-full bg-[#0B0F17] border border-slate-800 p-2 rounded-xl shadow-2xl flex justify-center">
              <SignIn
                routing="path"
                path="/login"
                signUpUrl="/signup"
                forceRedirectUrl="/dashboard"
                fallbackRedirectUrl="/dashboard"
              />
            </div>
          </div>
        ) : (
          /* Clerk Key Setup Instructions fallback if key is not set yet */
          <div className="border border-slate-800 bg-[#0B0F17] rounded-lg p-6 space-y-6 shadow-2xl">
            <div className="space-y-2 border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded bg-slate-900 border border-[#84CC16]/40 flex items-center justify-center">
                    <Key className="h-4 w-4 text-[#84CC16]" />
                  </div>
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    CLERK AUTH INTEGRATION
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                  KEY REQUIRED
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">Sign in to FinTrace AI</h1>
              <p className="text-xs text-slate-400 font-mono">
                Real Clerk authentication SDK is installed and ready.
              </p>
            </div>

            <div className="p-4 rounded border border-amber-500/40 bg-amber-950/20 text-amber-300 text-xs space-y-2 font-mono">
              <div className="font-bold uppercase tracking-wider text-amber-400">
                Setup Environment Variable:
              </div>
              <p className="text-amber-200/90 leading-relaxed">
                Add your Clerk Publishable Key to <code className="text-white bg-slate-900 px-1 py-0.5 rounded">frontend/.env</code>:
              </p>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-lime-400 font-mono text-[11px] select-all">
                VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
              </div>
            </div>

            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-[#84CC16] hover:bg-[#a3e635] text-[#07090E] font-mono font-medium py-2.5 text-xs flex items-center justify-center gap-2"
            >
              CONTINUE TO DASHBOARD (DEMO) <ArrowRight className="h-3.5 w-3.5" />
            </Button>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Direct access enabled for inspection</span>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-[#84CC16] hover:underline flex items-center gap-1"
              >
                Open Workspace <CheckCircle2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1">
          <Link to="/" className="hover:text-slate-300">
            ← Return to public portal
          </Link>
          <Link to="/signup" className="text-slate-400 hover:text-white">
            Register new profile →
          </Link>
        </div>
      </div>
    </div>
  );
};
