import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { offlineSync, OfflineDraftReport } from '../services/offlineSync';
import { RoadReport } from '../../../shared/types';
import { StatusBadge, SeverityBadge } from '../components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  MapPin,
  ArrowRight,
  WifiOff,
  RefreshCw,
  Trash2,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const MyReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<RoadReport[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<OfflineDraftReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const drafts = await offlineSync.getPendingReports(user?.id);
      setPendingDrafts(drafts.filter((d) => d.status !== 'SYNCED'));

      if (navigator.onLine) {
        const data = await api.getMyReports();
        setReports(data);
      }
    } catch (err) {
      console.error('Failed to load my reports:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();

    const unsubscribe = offlineSync.subscribe((count, syncing) => {
      setIsSyncing(syncing);
      offlineSync.getPendingReports(user?.id).then((drafts) => {
        setPendingDrafts(drafts.filter((d) => d.status !== 'SYNCED'));
      });
    });

    const handleOnline = () => loadData();
    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, [loadData, user?.id]);

  const handleSyncNow = async () => {
    if (!navigator.onLine) {
      setSyncFeedback('You are currently offline. Connect to internet to sync.');
      setTimeout(() => setSyncFeedback(null), 3500);
      return;
    }

    setIsSyncing(true);
    setSyncFeedback('Uploading offline reports and running AI optical analysis...');
    try {
      const res = await offlineSync.syncPendingReports(user?.id);
      if (res.synced > 0) {
        setSyncFeedback(`Successfully synchronized ${res.synced} report(s)!`);
        await loadData();
      } else if (res.failed > 0) {
        setSyncFeedback(`Sync failed for ${res.failed} report(s). Retrying automatically.`);
      } else {
        setSyncFeedback('All offline drafts are up to date.');
      }
    } catch (e: any) {
      setSyncFeedback(`Sync error: ${e.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    if (window.confirm('Are you sure you want to discard this unsynced draft?')) {
      await offlineSync.deleteOfflineReport(id);
      const drafts = await offlineSync.getPendingReports(user?.id);
      setPendingDrafts(drafts.filter((d) => d.status !== 'SYNCED'));
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filter === 'ACTIVE') {
      return report.status !== 'RESOLVED' && report.status !== 'CANCELLED';
    }
    if (filter === 'RESOLVED') {
      return report.status === 'RESOLVED';
    }
    return true;
  });

  const activeCount = reports.filter((r) => r.status !== 'RESOLVED' && r.status !== 'CANCELLED').length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;

  const getCitizenStatus = (status: string) => {
    switch (status) {
      case 'REPORTED':
        return { label: 'REPORTED', style: 'bg-warm-100 text-slate-700 border-slate-300' };
      case 'AI_ANALYZED':
      case 'PRIORITY_CALCULATED':
        return { label: 'ANALYZING', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'ASSIGNED':
      case 'ACKNOWLEDGED':
        return { label: 'ASSIGNED', style: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'INSPECTION_SCHEDULED':
      case 'REPAIR_IN_PROGRESS':
        return { label: 'IN PROGRESS', style: 'bg-amber-50 text-amber-800 border-amber-300 font-bold' };
      case 'REPAIR_COMPLETED':
      case 'AI_VERIFIED':
      case 'NEEDS_REINSPECTION':
        return { label: 'VERIFICATION', style: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' };
      case 'RESOLVED':
        return { label: 'RESOLVED', style: 'bg-teal-700 text-white border-teal-800 font-bold' };
      case 'CANCELLED':
        return { label: 'CANCELLED', style: 'bg-rose-50 text-rose-800 border-rose-200 font-bold' };
      default:
        return { label: status.replace(/_/g, ' '), style: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 shadow-subtle px-3 py-1 rounded-full text-xs font-bold text-teal-800 mb-2">
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>Citizen Tracking Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-ink-950 tracking-tight uppercase">
            MY ROAD REPORTS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track remediation progress, department handling, and verification for your submitted road issues.
          </p>
        </div>

        <Link
          to="/report"
          className="btn-lift self-start sm:self-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs sm:text-sm font-extrabold px-5 py-3 rounded-xl transition flex items-center space-x-2 shadow-md shadow-teal-900/15 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Issue</span>
        </Link>
      </div>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="p-3.5 bg-ink-950 text-white rounded-2xl text-xs flex items-center justify-between shadow-premium animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <RefreshCw className={`w-4 h-4 text-teal-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{syncFeedback}</span>
          </div>
        </div>
      )}

      {/* Offline Drafts Alert (if any) */}
      {pendingDrafts.length > 0 && (
        <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
              <WifiOff className="w-4 h-4 text-amber-600" />
              <span>{pendingDrafts.length} Offline Draft(s) Stored on this Device</span>
            </div>
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="btn-lift bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingDrafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-subtle flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono text-[10px] text-slate-400 font-bold block">{draft.id}</span>
                  <span className="font-bold text-ink-950 capitalize">{draft.damageTypeHint}</span>
                  <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">{draft.address}</span>
                </div>
                <button
                  onClick={() => handleDeleteDraft(draft.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                  title="Discard Draft"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'ALL'
              ? 'bg-ink-950 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All ({reports.length})
        </button>
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'ACTIVE'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setFilter('RESOLVED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'RESOLVED'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Resolved ({resolvedCount})
        </button>
      </div>

      {/* Main Content: Modern Citizen Report Cards */}
      {loading ? (
        <div className="text-center py-16 space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading your reported road issues...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-warm-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-black text-lg text-ink-950">No reports found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't submitted any road hazards matching this filter. See a pothole or surface issue?
            </p>
          </div>
          <Link
            to="/report"
            className="btn-lift inline-flex items-center space-x-2 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report an Issue</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredReports.map((report) => {
            const formattedReportId = report.id.startsWith('RG-')
              ? report.id
              : `RG-${report.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;

            const priorityPillColor =
              report.riskScore >= 70
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : report.riskScore >= 40
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200';

            const citizenStatus = getCitizenStatus(report.status);

            return (
              <div
                key={report.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 flex flex-col justify-between space-y-5 card-hover"
              >
                {/* Top Row: Report ID & Current Status Chip */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-ink-950 bg-warm-100 px-3 py-1 rounded-xl border border-slate-200">
                      {formattedReportId}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${priorityPillColor}`}>
                      Priority: {report.riskScore}/100
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border tracking-wider uppercase ${citizenStatus.style}`}
                  >
                    {citizenStatus.label}
                  </span>
                </div>

                {/* Body Details: Issue & Location */}
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Issue
                    </span>
                    <h3 className="font-black font-heading text-lg sm:text-xl text-ink-950 capitalize tracking-tight">
                      {report.damageType.replace(/_/g, ' ')}
                    </h3>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Location
                    </span>
                    <div className="flex items-start space-x-1.5 text-xs text-slate-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span className="truncate">{report.address || 'Meerut Road Network, Uttar Pradesh'}</span>
                    </div>
                  </div>

                  {report.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-warm-50 p-3 rounded-2xl border border-slate-100">
                      {report.description}
                    </p>
                  )}
                </div>

                {/* Footer: Last Updated & View Report → CTA */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Last Updated {new Date(report.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  <Link
                    to={`/reports/${report.id}`}
                    className="btn-lift bg-warm-100 hover:bg-slate-200 text-ink-950 font-black px-4 py-2 rounded-xl border border-slate-200 transition flex items-center space-x-1 text-xs shadow-xs"
                  >
                    <span>View Report</span>
                    <span className="text-teal-700 font-bold ml-0.5">→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
