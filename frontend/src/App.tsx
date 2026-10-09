import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { PublicLayout } from './components/layout/PublicLayout';
import { Layout as DashboardLayout } from './components/layout/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { BeneficiariesPage } from './pages/BeneficiariesPage';
import { DisbursementsPage } from './pages/DisbursementsPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { NetworkGraphPage } from './pages/NetworkGraphPage';
import { CopilotPage } from './pages/CopilotPage';
import { ReportsPage } from './pages/ReportsPage';

import { CasesPage } from './pages/CasesPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedDashboardRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>
    </>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Standalone Landing & Auth Routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <LandingPage />
            </PublicLayout>
          }
        />
        <Route
          path="/login/*"
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          }
        />
        <Route
          path="/signup/*"
          element={
            <PublicLayout>
              <SignupPage />
            </PublicLayout>
          }
        />

        {/* Protected Dashboard Workspace Shell */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedDashboardRoute>
              <DashboardLayout>
                {(activeTab, setActiveTab) => {
                  switch (activeTab) {
                    case 'beneficiaries':
                      return <BeneficiariesPage />;
                    case 'disbursements':
                      return <DisbursementsPage />;
                    case 'investigations':
                      return <RiskAnalysisPage />;
                    case 'cases':
                      return <CasesPage />;
                    case 'network':
                      return <NetworkGraphPage />;
                    case 'copilot':
                      return <CopilotPage />;
                    case 'reports':
                      return <ReportsPage />;
                    case 'dashboard':
                    default:
                      return <DashboardPage onNavigate={setActiveTab} />;
                  }
                }}
              </DashboardLayout>
            </ProtectedDashboardRoute>
          }
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
