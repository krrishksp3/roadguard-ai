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
} from 'lucide-react';

export const AuthorityDashboard: React.FC = () => {
  const [reports, setReports] = useState<RoadReport[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'risk'>('newest');
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
      setReports(reportsRes.data);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Authority Operations Command
            </span>
            <span className="text-xs text-slate-400">• Meerut PWD & Nagar Nigam Division</span>
          </div>
          <h1 className="text-3xl font-extrabold font-heading text-slate-900 mt-1">
            Road Infrastructure & Action Dashboard
          </h1>
        </div>

        <button
          onClick={loadData}
          className="bg-gov-700 hover:bg-gov-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm"
        >
          Refresh Live Feed
        </button>
      </div>

      {/* KPI Highlights Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Total Reports</span>
          <span className="text-2xl font-black text-slate-900">{analytics?.totalReports || reports.length}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Logged to Date</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Open Actionable</span>
          <span className="text-2xl font-black text-gov-700">{analytics?.openReports || 0}</span>
          <span className="text-[10px] text-gov-600 block mt-1">Pending Remediation</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/40 shadow-sm">
          <span className="text-xs font-semibold text-red-700 block">Critical Hazards</span>
          <span className="text-2xl font-black text-red-600">{analytics?.criticalReports || 0}</span>
          <span className="text-[10px] text-red-500 block mt-1">Risk Score &gt;= 80</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <span className="text-xs font-semibold text-amber-800 block">SLA Overdue</span>
          <span className="text-2xl font-black text-amber-700">{analytics?.overdueReports || 0}</span>
          <span className="text-[10px] text-amber-600 block mt-1">Immediate Escalation</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Resolved / Closed</span>
          <span className="text-2xl font-black text-emerald-600">{analytics?.resolvedReports || 0}</span>
          <span className="text-[10px] text-emerald-600 block mt-1">Verified Repairs</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Avg Resolution</span>
          <span className="text-2xl font-black text-slate-900">{analytics?.avgResolutionHours || 34.5}h</span>
          <span className="text-[10px] text-slate-400 block mt-1">SLA Target Met</span>
        </div>
      </div>

      {/* Interactive Map & Dispatch Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-gov-700" />
            <h2 className="font-bold text-slate-900 text-base">Geospatial Incident Map (Meerut Zone)</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {reports.length} Geo-tagged markers rendered
          </span>
        </div>
        <div className="h-80 rounded-xl overflow-hidden border border-slate-200">
          <ReportsMap reports={reports} height="100%" />
        </div>
      </div>

      {/* Filter & Priority Incident Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <h2 className="font-bold text-slate-900 text-base">Risk-Ranked Complaint Worklist</h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gov-700 bg-white"
            >
              <option value="newest">🕒 Newest First (Live Feed)</option>
              <option value="risk">⚠️ Highest Risk First</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gov-700 bg-white"
            >
              <option value="">All Divisions (Meerut)</option>
              <option value="dept-pwd-mrt">UP PWD Meerut</option>
              <option value="dept-nn-mrt">Nagar Nigam Meerut</option>
              <option value="dept-nhai-mrt">NHAI Meerut</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, road, area..."
                className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gov-700"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gov-700 bg-white"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gov-700 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="INSPECTION_SCHEDULED">Inspection</option>
              <option value="REPAIR_IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Complaint ID</th>
                <th className="py-3 px-3">Distress & Photo</th>
                <th className="py-3 px-3">Division</th>
                <th className="py-3 px-3">Road Corridor</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Dynamic Risk</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">SLA Due</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    <Link to={`/reports/${report.id}`} className="hover:text-gov-700 hover:underline">
                      {report.id}
                    </Link>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={report.imageUrl}
                        alt="thumbnail"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/demo-evidence/pothole-reference.jpg';
                        }}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                      />
                      <div className="max-w-[180px]">
                        <span className="font-bold text-slate-900 block capitalize truncate">
                          {report.damageType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          {report.description}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-[10px] block truncate max-w-[120px]">
                      {report.department?.code || report.department?.name || 'PWD Meerut'}
                    </span>
                  </td>
                  <td className="py-3 px-3 max-w-[160px] truncate text-slate-800">
                    {report.address || 'Meerut Road Network'}
                  </td>
                  <td className="py-3 px-3">
                    <SeverityBadge severity={report.severity} />
                  </td>
                  <td className="py-3 px-3">
                    <RiskScoreMeter score={report.riskScore} compact={true} />
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px]">
                    {report.isOverdue ? (
                      <span className="text-red-600 font-bold">OVERDUE</span>
                    ) : (
                      <span className="text-slate-500">
                        {new Date(report.slaDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/reports/${report.id}`}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-gov-50 hover:bg-gov-100 text-gov-800 font-semibold text-xs transition"
                    >
                      <span>Manage</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
