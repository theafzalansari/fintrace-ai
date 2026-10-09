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
  MapPin,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Ghost Beneficiary Detection</Badge>
            <Badge variant="outline">Live API Data</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
            Beneficiary Ledger
          </h1>
          <p className="text-sm text-slate-400">
            Real-time entity resolution registry and verified account details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Ingest Beneficiaries CSV
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, ID, account, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
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
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Flagged">Flagged</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error connecting to backend API: {error}</span>
        </div>
      )}

      {/* Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Registered Beneficiaries ({filteredBeneficiaries.length})
            </CardTitle>
            <span className="text-xs font-mono text-slate-500">
              Showing {filteredBeneficiaries.length} of {beneficiaries.length} records
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400" />
              <p className="text-sm font-mono">Fetching beneficiaries from API...</p>
            </div>
          ) : filteredBeneficiaries.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-300">No Beneficiaries Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {beneficiaries.length === 0
                    ? 'No beneficiary records have been ingested into the backend database yet.'
                    : 'No records matched your search filters.'}
                </p>
              </div>
              {beneficiaries.length === 0 && (
                <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Ingest Beneficiaries CSV
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-3.5 px-4 font-semibold">Beneficiary ID</th>
                  <th className="py-3.5 px-4 font-semibold">Name & Category</th>
                  <th className="py-3.5 px-4 font-semibold">Bank Account & IFSC</th>
                  <th className="py-3.5 px-4 font-semibold">Contact Info</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredBeneficiaries.map((ben) => (
                  <tr key={ben.beneficiaryId} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 px-4 font-mono text-blue-400 font-semibold">
                      {ben.beneficiaryId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{ben.name}</div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {ben.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {ben.bankAccountNumber}
                      </div>
                      <div className="text-[10px] text-slate-500">IFSC: {ben.ifscOrRoutingCode}</div>
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      {ben.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Phone className="w-3 h-3 text-slate-500" /> {ben.phone}
                        </div>
                      )}
                      {ben.email && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Mail className="w-3 h-3 text-slate-500" /> {ben.email}
                        </div>
                      )}
                      {ben.address && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-xs">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" /> {ben.address}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
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
