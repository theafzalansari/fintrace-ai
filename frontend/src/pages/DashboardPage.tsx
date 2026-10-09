import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useHealth } from '../hooks/useHealth';
import {
  ShieldAlert,
  Network,
  Cpu,
  FileSpreadsheet,
  ArrowUpRight,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { health, loading, error } = useHealth();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 p-8 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="cyan">Engine Foundation</Badge>
              <Badge variant="outline">24h Hackathon Ready</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              FinTrace <span className="text-blue-500">AI</span>
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm md:text-base">
              Automated Financial Micro-Audit & Ghost-Beneficiary Detection Engine. Architected for real-time forensic ledger inspection, entity resolution, and circular transaction tracing.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" size="md">
              <Database className="w-4 h-4 mr-2 text-slate-400" />
              Ingestion Config
            </Button>
            <Button variant="primary" size="md">
              Initialize Engine
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Backend & Infrastructure Readiness */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">System Status</CardTitle>
              <Cpu className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              {loading ? (
                <span className="text-slate-500 text-lg">Connecting...</span>
              ) : health?.status === 'ok' ? (
                <>
                  <span>Operational</span>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </>
              ) : (
                <>
                  <span>Offline</span>
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-mono">
              {error ? `Error: ${error}` : health ? `Uptime: ${health.uptime.toFixed(1)}s` : 'Awaiting server telemetry...'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">Graph Matrix</CardTitle>
              <Network className="h-4 w-4 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">Adjacency List</div>
            <p className="text-xs text-slate-500 mt-2">
              In-memory graph node structure ready for ledger ingestion.
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">Database Layer</CardTitle>
              <Database className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">MongoDB + Zod</div>
            <p className="text-xs text-slate-500 mt-2">
              Configured schema validation & persistence pipeline.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Module Overview & Setup Blueprint */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Forensic Engine Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-400" />
              </div>
              <CardTitle>1. Data Ingestion</CardTitle>
              <CardDescription>Multi-source financial transaction parser & validator.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">`services/ingestion`</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-9 w-9 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-2">
                <ShieldAlert className="h-5 w-5 text-cyan-400" />
              </div>
              <CardTitle>2. Identity Resolution</CardTitle>
              <CardDescription>Ghost-beneficiary detection & attribute matching.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">`services/identity-resolution`</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
                <Network className="h-5 w-5 text-emerald-400" />
              </div>
              <CardTitle>3. Graph Analysis</CardTitle>
              <CardDescription>Adjacency-list cycle & circular transfer identifier.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">`services/graph-analysis`</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
                <Cpu className="h-5 w-5 text-amber-400" />
              </div>
              <CardTitle>4. Risk Scoring</CardTitle>
              <CardDescription>Multi-vector risk scoring engine for audit priority.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">`services/risk-scoring`</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
