import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CsvUploadModal } from '../components/ui/CsvUploadModal';
import { api } from '../lib/api';
import { DisbursementRecord } from '../types';
import {
  FileText,
  Search,
  Upload,
  RefreshCw,
  AlertCircle,
  IndianRupee,
  Calendar,
  CreditCard,
  Building
} from 'lucide-react';

export const DisbursementsPage: React.FC = () => {
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDisbursements();
      setDisbursements(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch disbursements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDisbursements = disbursements.filter((disb) => {
    const matchesSearch =
      disb.disbursementId.toLowerCase().includes(search.toLowerCase()) ||
      disb.beneficiaryId.toLowerCase().includes(search.toLowerCase()) ||
      disb.programCode.toLowerCase().includes(search.toLowerCase()) ||
      (disb.referenceNumber && disb.referenceNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || disb.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || disb.paymentChannel === channelFilter;

    return matchesSearch && matchesStatus && matchesChannel;
  });

  const totalVolume = filteredDisbursements.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Disbursement Records
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Real-time audit trace for scheme disbursements and direct benefit transfers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Ingest CSV
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Total Disbursements</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
            {loading ? '...' : disbursements.length} Records
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Filtered Volume</span>
            <IndianRupee className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {loading ? '...' : `₹${totalVolume.toLocaleString('en-IN')}`}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Completed Payments</span>
            <CreditCard className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
            {loading ? '...' : disbursements.filter((d) => d.status === 'Completed').length} Completed
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search disbursement ID, beneficiary ID, scheme..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Payment Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Reversed">Reversed</option>
            </select>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Channels</option>
              <option value="Direct Transfer">Direct Transfer</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="UPI">UPI</option>
              <option value="Check">Check</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Error connecting to API: {error}</span>
        </div>
      )}

      {/* Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Disbursement Transactions ({filteredDisbursements.length})
            </CardTitle>
            <span className="text-xs font-mono text-slate-500">
              Showing {filteredDisbursements.length} of {disbursements.length} records
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-500" />
              <p className="text-xs font-mono">Fetching disbursement records...</p>
            </div>
          ) : filteredDisbursements.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Disbursements Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {disbursements.length === 0
                    ? 'No disbursement records have been ingested into the database yet.'
                    : 'No records matched your search query.'}
                </p>
              </div>
              {disbursements.length === 0 && (
                <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Ingest CSV Dataset
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-4 font-semibold">DISBURSEMENT ID</th>
                  <th className="py-2.5 px-4 font-semibold">BENEFICIARY ID</th>
                  <th className="py-2.5 px-4 font-semibold">AMOUNT</th>
                  <th className="py-2.5 px-4 font-semibold">SCHEME & CHANNEL</th>
                  <th className="py-2.5 px-4 font-semibold">DATE</th>
                  <th className="py-2.5 px-4 font-semibold">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-300">
                {filteredDisbursements.map((disb) => (
                  <tr key={disb.disbursementId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {disb.disbursementId}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-blue-600 dark:text-blue-400">
                      {disb.beneficiaryId}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                      ₹{Number(disb.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1 font-mono text-slate-800 dark:text-slate-200">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        {disb.programCode}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Channel: {disb.paymentChannel}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(disb.disbursementDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge
                        variant={
                          disb.status === 'Completed'
                            ? 'success'
                            : disb.status === 'Pending'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {disb.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        type="disbursement"
        onSuccess={loadData}
      />
    </div>
  );
};
