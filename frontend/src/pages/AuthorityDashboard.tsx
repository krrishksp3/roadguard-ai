import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RoadReport, AnalyticsSummary } from '../../../shared/types';
import { ReportsMap } from '../components/map/ReportsMap';
import { StatusBadge, SeverityBadge } from '../components/ui/StatusBadge';
import { RiskScoreMeter } from '../components/ui/RiskScoreMeter';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Activity,
  Layers,
  Search,
  Filter,
  ArrowUpRight,
  Shield,
  Sparkles,
  ArrowRight,
  Check,
  Building,
  FileCheck,
  ChevronRight,
  RefreshCw,
  Send,
  AlertCircle,
} from 'lucide-react';

export const AuthorityDashboard: React.FC = () => {
  const [reports, setReports] = useState<RoadReport[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'risk'>('risk');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    try {
      const [reportsRes, analyticsRes] = await Promise.all([
        api.getAllReports({
          status: statusFilter || undefined,
          severity: severityFilter || undefined,
          departmentId: departmentFilter || undefined,
          search: searchQuery || undefined,
          sortBy,
        }),
        api.getAnalyticsSummary(),
      ]);
      setReports(reportsRes.data.filter((r) => r.status !== 'CANCELLED'));
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error('Failed to load authority dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, severityFilter, departmentFilter, searchQuery, sortBy]);

  // 4 Core Required Metrics (Section 18)
  const openReportsCount = reports.filter((r) => r.status !== 'RESOLVED').length;
  const highPriorityCount = reports.filter((r) => r.riskScore >= 70 || r.severity === 'critical' || r.severity === 'high').length;
  const slaDueCount = reports.filter((r) => r.isOverdue || r.status === 'INSPECTION_SCHEDULED').length;
  const verificationCount = reports.filter((r) => r.status === 'AI_VERIFIED' || Boolean(r.repairAfterImageUrl)).length;

  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Real Operational Control Center Layout: Dark Sidebar / Header + Light Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* DARK CHARCOAL SIDEBAR (Section 18) */}
        <aside className="lg:col-span-3 bg-ink-950 text-white rounded-3xl p-6 border border-ink-800 shadow-premium space-y-6 lg:sticky lg:top-24">
          <div className="space-y-2 border-b border-ink-850 pb-4">
            <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>CIVIL CONTROL CENTER</span>
            </div>
            <h2 className="text-xl font-black font-heading text-white">
              Meerut Operations
            </h2>
            <p className="text-[11px] text-slate-400">
              UP Public Works Department & Nagar Nigam Inter-Agency Portal
            </p>
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Filter By Operational Status
            </span>
            <div className="space-y-1">
              {[
                { id: '', label: 'All Incidents' },
                { id: 'REPORTED', label: 'New Reports Pending Intake' },
                { id: 'ASSIGNED', label: 'Dispatched to Division' },
                { id: 'REPAIR_IN_PROGRESS', label: 'Active Field Remediation' },
                { id: 'RESOLVED', label: 'Verified & Closed' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    statusFilter === f.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-300 hover:bg-ink-900 hover:text-white'
                  }`}
                >
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort By Toggle */}
          <div className="space-y-2 border-t border-ink-850 pt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Queue Sorting Priority
            </span>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-ink-900 rounded-xl border border-ink-800">
              <button
                type="button"
                onClick={() => setSortBy('risk')}
                className={`py-1.5 rounded-lg text-xs font-bold transition ${
                  sortBy === 'risk' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Risk Score
              </button>
              <button
                type="button"
                onClick={() => setSortBy('newest')}
                className={`py-1.5 rounded-lg text-xs font-bold transition ${
                  sortBy === 'newest' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Newest First
              </button>
            </div>
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={loadData}
            className="w-full bg-ink-900 hover:bg-ink-850 text-slate-200 border border-ink-800 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Feed</span>
          </button>
        </aside>

        {/* LIGHT WORKSPACE (Section 18) */}
        <main className="lg:col-span-9 space-y-6">
          {/* Top Bar: AUTHORITY OPERATIONS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center space-x-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>OPERATIONAL COMMAND CENTER</span>
                <span>•</span>
                <span className="text-teal-700 font-semibold">LIVE DISPATCH FEED</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-ink-950 tracking-tight uppercase">
                AUTHORITY OPERATIONS
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search corridor or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-xl outline-none focus:border-teal-600 w-48 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* 4 METRICS: OPEN REPORTS, HIGH PRIORITY, SLA DUE, VERIFICATION (Section 18) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* OPEN REPORTS */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-card space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                OPEN REPORTS
              </span>
              <span className="text-3xl font-black font-heading text-ink-950 block">
                {openReportsCount}
              </span>
              <span className="text-[10px] text-teal-700 font-bold block">
                Active in Meerut Zone
              </span>
            </div>

            {/* HIGH PRIORITY */}
            <div className="bg-white p-5 rounded-3xl border border-rose-200 bg-rose-50/20 shadow-card space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                HIGH PRIORITY
              </span>
              <span className="text-3xl font-black font-heading text-rose-600 block">
                {highPriorityCount}
              </span>
              <span className="text-[10px] text-rose-600 font-bold block">
                Risk Score ≥ 70
              </span>
            </div>

            {/* SLA DUE */}
            <div className="bg-white p-5 rounded-3xl border border-amber-200 bg-amber-50/20 shadow-card space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                SLA DUE
              </span>
              <span className="text-3xl font-black font-heading text-amber-700 block">
                {slaDueCount}
              </span>
              <span className="text-[10px] text-amber-700 font-bold block">
                Approaching Deadline
              </span>
            </div>

            {/* VERIFICATION */}
            <div className="bg-white p-5 rounded-3xl border border-emerald-200 bg-emerald-50/20 shadow-card space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                VERIFICATION
              </span>
              <span className="text-3xl font-black font-heading text-emerald-700 block">
                {verificationCount}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold block">
                Evidence Awaiting Review
              </span>
            </div>
          </div>

          {/* 1. PRIORITY QUEUE (Section 18) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">ACTION QUEUE</span>
                <h2 className="text-lg font-black font-heading text-ink-950 uppercase">
                  PRIORITY QUEUE
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {reports.length} Incident Work Orders
              </span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Loading priority queue records...
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No reports found matching the selected operational criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.slice(0, 6).map((report) => {
                  const isHigh = report.riskScore >= 70;
                  return (
                    <div
                      key={report.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-hover"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-black text-ink-950 bg-warm-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {report.id}
                          </span>
                          <StatusBadge status={report.status} />
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isHigh
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            Score: {report.riskScore}/100
                          </span>
                        </div>
                        <h3 className="font-heading font-black text-sm text-ink-950 capitalize truncate">
                          {report.damageType.replace(/_/g, ' ')}
                        </h3>
                        <p className="text-xs text-slate-500 truncate max-w-xl">
                          {report.address || 'Meerut Road Network'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2.5 shrink-0 self-end sm:self-center">
                        <Link
                          to={`/reports/${report.id}`}
                          className="btn-lift bg-ink-950 hover:bg-ink-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1"
                        >
                          <span>Manage Action</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. MAP (Section 18) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">GEOSPATIAL COMMAND</span>
                <h2 className="text-lg font-black font-heading text-ink-950 uppercase">
                  OPERATIONAL CORRIDOR MAP
                </h2>
              </div>
              <span className="text-xs text-slate-500">Meerut Municipal Zone</span>
            </div>

            <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-200">
              <ReportsMap reports={reports} height="100%" />
            </div>
          </div>

          {/* 3. ACTIVITY (Section 18) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">AUDIT LOG</span>
                <h2 className="text-lg font-black font-heading text-ink-950 uppercase">
                  RECENT ACTIVITY
                </h2>
              </div>
              <span className="text-xs text-slate-500">Live operational events</span>
            </div>

            <div className="space-y-3 text-xs">
              {reports.slice(0, 4).map((r, i) => (
                <div key={r.id} className="p-3 bg-warm-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-ink-950 block">
                        Work order {r.id} status updated to {r.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-500 text-[11px]">{r.address}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {new Date(r.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
