import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { BeneficiariesPage } from './pages/BeneficiariesPage';
import { DisbursementsPage } from './pages/DisbursementsPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { NetworkGraphPage } from './pages/NetworkGraphPage';
import { CopilotPage } from './pages/CopilotPage';
import { ScopePlaceholderPage } from './pages/ScopePlaceholderPage';

export function App() {
  return (
    <Layout>
      {(activeTab, setActiveTab) => {
        switch (activeTab) {
          case 'beneficiaries':
            return <BeneficiariesPage />;
          case 'disbursements':
            return <DisbursementsPage />;
          case 'investigations':
            return <RiskAnalysisPage />;
          case 'network':
            return <NetworkGraphPage />;
          case 'copilot':
            return <CopilotPage />;
          case 'reports':
            return <ScopePlaceholderPage title="Automated Audit Reports" module="reports" />;
          case 'dashboard':
          default:
            return <DashboardPage onNavigate={setActiveTab} />;
        }
      }}
    </Layout>
  );
}

export default App;
