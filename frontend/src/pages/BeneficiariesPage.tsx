import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CsvUploadModal } from '../components/ui/CsvUploadModal';
import { api } from '../lib/api';
import { BeneficiaryRecord } from '../types';
import {
  Users,
  Search,
  Upload,
  RefreshCw,
  AlertCircle,
  Phone,
  Mail,
  Building2,
  ShieldAlert
} from 'lucide-react';

export const BeneficiariesPage: React.FC = () => {
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getBeneficiaries();
      setBeneficiaries(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch beneficiaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBeneficiaries = beneficiaries.filter((ben) => {
    const matchesSearch =
      ben.name.toLowerCase().includes(search.toLowerCase()) ||
      ben.beneficiaryId.toLowerCase().includes(search.toLowerCase()) ||
      ben.bankAccountNumber.includes(search) ||
      (ben.phone && ben.phone.includes(search));

    const matchesCategory = categoryFilter === 'all' || ben.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || ben.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Beneficiary Ledger
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Real-time entity resolution registry and verified account details.
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

      {/* Filter and Search Bar */}
      <Card className="p-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, ID, bank account, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Individual">Individual</option>
              <option value="Vendor">Vendor</option>
              <option value="NGO">NGO</option>
              <option value="Contractor">Contractor</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Flagged">Flagged</option>
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
              <Users className="w-4 h-4 text-blue-500" />
              Registered Beneficiaries ({filteredBeneficiaries.length})
            </CardTitle>
            <span className="text-xs font-mono text-slate-500">
              Showing {filteredBeneficiaries.length} of {beneficiaries.length} records
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-500" />
              <p className="text-xs font-mono">Fetching beneficiary records...</p>
            </div>
          ) : filteredBeneficiaries.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Records Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {beneficiaries.length === 0
                    ? 'No beneficiary records have been ingested into the database yet.'
                    : 'No records matched your search query.'}
                </p>
              </div>
              {beneficiaries.length === 0 && (
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
                  <th className="py-2.5 px-4 font-semibold">BENEFICIARY ID</th>
                  <th className="py-2.5 px-4 font-semibold">NAME & CATEGORY</th>
                  <th className="py-2.5 px-4 font-semibold">BANK ACCOUNT</th>
                  <th className="py-2.5 px-4 font-semibold">CONTACT DETAILS</th>
                  <th className="py-2.5 px-4 font-semibold">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-300">
                {filteredBeneficiaries.map((ben) => (
                  <tr key={ben.beneficiaryId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-mono text-blue-600 dark:text-blue-400 font-bold">
                      {ben.beneficiaryId}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{ben.name}</div>
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                        {ben.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {ben.bankAccountNumber}
                      </div>
                      <div className="text-[10px] text-slate-500">IFSC: {ben.ifscOrRoutingCode}</div>
                    </td>
                    <td className="py-2.5 px-4 space-y-0.5">
                      {ben.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                          <Phone className="w-3 h-3 text-slate-500" /> {ben.phone}
                        </div>
                      )}
                      {ben.email && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                          <Mail className="w-3 h-3 text-slate-500" /> {ben.email}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge
                        variant={
                          ben.status === 'Active'
                            ? 'success'
                            : ben.status === 'Flagged'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {ben.status}
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
        type="beneficiary"
        onSuccess={loadData}
      />
    </div>
  );
};
