import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  return (
    <Layout>
      {(activeTab) => {
        switch (activeTab) {
          case 'dashboard':
          default:
            return <DashboardPage />;
        }
      }}
    </Layout>
  );
}

export default App;
