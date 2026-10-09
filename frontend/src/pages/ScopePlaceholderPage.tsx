import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Bot, FileCheck, ShieldCheck } from 'lucide-react';

interface ScopePlaceholderPageProps {
  title: string;
  module: 'copilot' | 'reports';
}

export const ScopePlaceholderPage: React.FC<ScopePlaceholderPageProps> = ({ title, module }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                {module === 'copilot' ? <Bot className="w-6 h-6" /> : <FileCheck className="w-6 h-6" />}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">{title}</CardTitle>
                <CardDescription>
                  Milestone Scope Notice & Milestone Roadmap
                </CardDescription>
              </div>
            </div>
            <Badge variant="cyan">Milestone 3 Roadmap</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <p className="text-sm text-slate-300 leading-relaxed">
            {module === 'copilot'
              ? 'The AI Audit Copilot module is scheduled for development in the next milestone. Current active engine endpoints support live CSV Ingestion, Financial Web Graph Construction, and Explainable Risk Scoring.'
              : 'Automated PDF/CSV Audit Report export generation is scheduled for the upcoming reporting milestone. Current live audit records and risk findings can be inspected directly in the Micro-Audits and Network Graph tabs.'}
          </p>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-mono text-slate-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active Verified Live Engine APIs:
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 font-mono text-[11px] text-slate-400">
              <li>GET /api/beneficiaries (Beneficiary Ledger)</li>
              <li>GET /api/disbursements (Disbursement Ledger)</li>
              <li>GET /api/analysis/graph (Financial Web Graph & Adjacency Matrix)</li>
              <li>GET /api/analysis/risks (Explainable Rule-Based Risk Scoring)</li>
              <li>POST /api/ingest/beneficiaries/csv & /api/ingest/disbursements/csv</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
