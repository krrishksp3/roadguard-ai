import React, { useEffect, useState } from 'react';
import { api, resolveImageUrl } from '../services/api';
import { RoadReport } from '../../../shared/types';
import { StatusBadge, SeverityBadge } from '../components/ui/StatusBadge';
import { RiskScoreMeter } from '../components/ui/RiskScoreMeter';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Building,
  ArrowUpRight,
  Gavel,
  RefreshCw,
  Send,
  X,
  Layers,
  Search,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'critical' | 'overdue' | 'escalated' | 'contractor'>('critical');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Take Action Modal state
  const [actionModalReport, setActionModalReport] = useState<RoadReport | null>(null);
  const [actionType, setActionType] = useState<string>('ESCALATE_AUTHORITY');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [targetDept, setTargetDept] = useState<string>('');
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string>('');

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getAdminOverview();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load admin overview:', err);
      setError(err.message || 'Failed to load administrative overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleOpenActionModal = (report: RoadReport) => {
    setActionModalReport(report);
    setActionType('ESCALATE_AUTHORITY');
    setActionNotes('');
    setTargetDept(report.departmentId || '');
    setActionFeedback('');
  };

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModalReport) return;

    setActionSubmitting(true);
    setActionFeedback('');
    try {
      await api.adminTakeAction({
        reportId: actionModalReport.id,
        actionType,
        notes: actionNotes.trim(),
        targetDepartmentId: targetDept || undefined,
      });
      setActionFeedback('Administrative action registered and timeline updated successfully!');
      setTimeout(() => {
        setActionModalReport(null);
        loadOverview();
      }, 1200);
    } catch (err: any) {
      setActionFeedback(`Action error: ${err.message}`);
    } finally {
      setActionSubmitting(false);
    }
  };

  const getActiveReports = (): RoadReport[] => {
    if (!data) return [];
    let list: RoadReport[] = [];
    if (activeTab === 'critical') list = data.criticalReports || [];
    else if (activeTab === 'overdue') list = data.overdueReports || [];
    else if (activeTab === 'escalated') list = data.escalatedReports || [];
    else if (activeTab === 'contractor') list = data.contractorIssues || [];

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.address && r.address.toLowerCase().includes(q))
    );
  };

  const currentReports = getActiveReports();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gov-700 text-white shadow-sm">
              District Administration Apex Console
            </span>
            <span className="text-xs text-slate-500">• Meerut Zone Central Oversight</span>
          </div>
          <h1 className="text-3xl font-extrabold font-heading text-slate-900 mt-1">
            Executive Infrastructure Governance
          </h1>
        </div>

        <button
          onClick={loadOverview}
          disabled={loading}
          className="bg-gov-700 hover:bg-gov-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Intelligence</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* KPI Oversight Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Total District Reports</span>
          <span className="text-2xl font-black text-slate-900">{data?.stats?.totalReports || 0}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Logged Across Corridors</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/40 shadow-sm">
          <span className="text-xs font-semibold text-red-700 block">Critical Risk (Score &gt;= 80)</span>
          <span className="text-2xl font-black text-red-600">{data?.stats?.criticalCount || 0}</span>
          <span className="text-[10px] text-red-500 block mt-1">Severe Hazard Density</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <span className="text-xs font-semibold text-amber-800 block">SLA Overdue Incidents</span>
          <span className="text-2xl font-black text-amber-700">{data?.stats?.overdueCount || 0}</span>
          <span className="text-[10px] text-amber-600 block mt-1">Mandatory Compliance Breach</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/40 shadow-sm">
          <span className="text-xs font-semibold text-purple-800 block">Authority Escalations</span>
          <span className="text-2xl font-black text-purple-700">{data?.stats?.escalatedCount || 0}</span>
          <span className="text-[10px] text-purple-600 block mt-1">Escalated by Engineers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
          <span className="text-xs font-semibold text-emerald-800 block">Verified Closures</span>
          <span className="text-2xl font-black text-emerald-600">{data?.stats?.resolvedCount || 0}</span>
          <span className="text-[10px] text-emerald-600 block mt-1">Post-Audit Approved</span>
        </div>
      </div>

      {/* Tabs and Action Worklist */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          {/* Section Tabs */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('critical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'critical'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Critical Incidents ({data?.stats?.criticalCount || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'overdue'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>SLA Overdue ({data?.stats?.overdueCount || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('escalated')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'escalated'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Escalations ({data?.stats?.escalatedCount || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('contractor')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'contractor'
                  ? 'bg-gov-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Contractor & Hotspot Audit</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by ID or road name..."
              className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gov-700"
            />
          </div>
        </div>

        {/* Complaints Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Complaint ID</th>
                <th className="py-3 px-3">Evidence Photo</th>
                <th className="py-3 px-3">Division</th>
                <th className="py-3 px-3">Road Corridor</th>
                <th className="py-3 px-3">Dynamic Risk</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Linked Contractor / Tender</th>
                <th className="py-3 px-3 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {currentReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No records found matching current administrative filter.
                  </td>
                </tr>
              ) : (
                currentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      <Link to={`/reports/${report.id}`} className="hover:text-gov-700 hover:underline">
                        {report.id}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <img
                          src={report.imageUrl}
                          alt="thumbnail"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/demo-evidence/pothole-reference.jpg';
                          }}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <span className="capitalize font-bold text-slate-900 truncate max-w-[120px]">
                          {report.damageType.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-[10px] block truncate max-w-[130px]">
                        {report.department?.name || 'UP PWD Meerut'}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-[160px] truncate text-slate-800">
                      {report.address || 'Meerut Road Network'}
                    </td>
                    <td className="py-3 px-3">
                      <RiskScoreMeter score={report.riskScore} compact={true} />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="py-3 px-3 text-[11px] max-w-[180px]">
                      {report.roadSegment?.tender ? (
                        <div className="truncate">
                          <span className="font-semibold text-slate-800 block truncate">
                            {report.roadSegment.tender.contractor}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {report.roadSegment.tender.tenderId}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Corridor Maintenance</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal(report)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gov-700 hover:bg-gov-800 text-white font-bold text-xs transition shadow-sm"
                      >
                        <Gavel className="w-3.5 h-3.5" />
                        <span>Take Action</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Take Action Modal */}
      {actionModalReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Gavel className="w-5 h-5 text-gov-700" />
                <h3 className="font-bold text-slate-900 text-base">District Administrative Directive</h3>
              </div>
              <button
                onClick={() => setActionModalReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Case ID:</span>
                <span className="font-mono font-bold text-slate-900">{actionModalReport.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-medium text-slate-800 truncate max-w-[280px]">
                  {actionModalReport.address}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Responsible Division:</span>
                <span className="font-bold text-slate-800">
                  {actionModalReport.department?.name || 'UP PWD Meerut'}
                </span>
              </div>
            </div>

            {actionFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                {actionFeedback}
              </div>
            )}

            <form onSubmit={handleExecuteAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Directive / Intervention Type</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gov-700 bg-white"
                >
                  <option value="ESCALATE_AUTHORITY">🚨 Escalate & Issue Immediate 24h Remediation Order</option>
                  <option value="REQUIRE_INSPECTION">📋 Require Senior Divisional Field Inspection</option>
                  <option value="REQUIRE_REINSPECTION">❌ Reject Quality & Mandate Immediate Reinspection</option>
                  <option value="REQUIRE_EVIDENCE">📷 Require Fresh High-Resolution Photographic Proof</option>
                  <option value="FLAG_CONTRACTOR_SLA">⚠️ Flag Contractor SLA Breach / Liquidated Damages</option>
                  <option value="DIRECTIVE">📝 General Executive Directive / Instruction</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign to Division</label>
                <select
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gov-700 bg-white"
                >
                  <option value="dept-pwd-mrt">Public Works Department (UP PWD Meerut)</option>
                  <option value="dept-nn-mrt">Meerut Municipal Corporation (Nagar Nigam Meerut)</option>
                  <option value="dept-nhai-mrt">National Highways Authority of India (NHAI Meerut PIU)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Remarks & Instructions (Persisted to Live Timeline)
                </label>
                <textarea
                  rows={3}
                  required
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Enter official instruction for Executive Engineer (e.g. Mandatory joint cross-section inspection by JE within 24h, dense BC overlay required)..."
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gov-700"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModalReport(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="px-5 py-2 rounded-xl bg-gov-700 hover:bg-gov-800 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{actionSubmitting ? 'Dispatching...' : 'Dispatch Directive'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
