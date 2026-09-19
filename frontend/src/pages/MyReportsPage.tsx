import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { offlineSync, OfflineDraftReport } from '../services/offlineSync';
import { RoadReport } from '../../../shared/types';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  MapPin,
  WifiOff,
  RefreshCw,
  Trash2,
  Clock,
  FileText,
  Layers,
} from 'lucide-react';

export const MyReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { dict, language, getStatusExplanation, getDamageTypeLabel } = useLanguage();
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
      setSyncFeedback(
        language === 'hi'
          ? 'आप वर्तमान में ऑफ़लाइन हैं। सिंक करने के लिए इंटरनेट से कनेक्ट करें।'
          : 'You are currently offline. Connect to internet to sync.'
      );
      setTimeout(() => setSyncFeedback(null), 3500);
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(
      language === 'hi'
        ? 'ऑफ़लाइन रिपोर्ट अपलोड और AI विश्लेषण किया जा रहा है...'
        : 'Uploading offline reports and running AI optical analysis...'
    );
    try {
      const res = await offlineSync.syncPendingReports(user?.id);
      if (res.synced > 0) {
        setSyncFeedback(
          language === 'hi'
            ? `सफलतापूर्वक ${res.synced} रिपोर्ट सिंक की गईं!`
            : `Successfully synchronized ${res.synced} report(s)!`
        );
        await loadData();
      } else if (res.failed > 0) {
        setSyncFeedback(
          language === 'hi'
            ? `${res.failed} रिपोर्ट सिंक नहीं हो सकीं। स्वतः पुनः प्रयास किया जाएगा।`
            : `Sync failed for ${res.failed} report(s). Retrying automatically.`
        );
      } else {
        setSyncFeedback(
          language === 'hi' ? 'सभी ऑफ़लाइन ड्राफ्ट अपडेट हैं।' : 'All offline drafts are up to date.'
        );
      }
    } catch (e: any) {
      setSyncFeedback(`Sync error: ${e.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    const confirmMsg =
      language === 'hi'
        ? 'क्या आप इस असिंक्ड ड्राफ्ट को हटाना चाहते हैं?'
        : 'Are you sure you want to discard this unsynced draft?';
    if (window.confirm(confirmMsg)) {
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
    const explanation = getStatusExplanation(status);
    switch (status) {
      case 'REPORTED':
        return { label: 'REPORTED', explanation, style: 'bg-warm-100 text-slate-700 border-slate-300' };
      case 'AI_ANALYZED':
      case 'PRIORITY_CALCULATED':
        return { label: 'ANALYZING', explanation, style: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'ASSIGNED':
      case 'ACKNOWLEDGED':
        return { label: 'ASSIGNED', explanation, style: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'INSPECTION_SCHEDULED':
      case 'REPAIR_IN_PROGRESS':
        return { label: 'IN PROGRESS', explanation, style: 'bg-amber-50 text-amber-800 border-amber-300 font-bold' };
      case 'REPAIR_COMPLETED':
      case 'AI_VERIFIED':
      case 'NEEDS_REINSPECTION':
        return { label: 'VERIFICATION', explanation, style: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' };
      case 'RESOLVED':
        return { label: 'RESOLVED', explanation, style: 'bg-teal-700 text-white border-teal-800 font-bold' };
      case 'CANCELLED':
        return { label: 'CANCELLED', explanation, style: 'bg-rose-50 text-rose-800 border-rose-200 font-bold' };
      default:
        return { label: status.replace(/_/g, ' '), explanation, style: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 shadow-subtle px-3 py-1 rounded-full text-xs font-bold text-teal-800 mb-2">
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>{language === 'hi' ? 'नागरिक ट्रैकिंग कंसोल' : 'Citizen Tracking Console'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-ink-950 tracking-tight uppercase">
            {dict.myReports.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {dict.myReports.subtitle}
          </p>
        </div>

        <Link
          to="/report"
          className="btn-lift self-start sm:self-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs sm:text-sm font-extrabold px-5 py-3 rounded-xl transition flex items-center space-x-2 shadow-md shadow-teal-900/15 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{dict.createReport.title}</span>
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
              <span>
                {language === 'hi'
                  ? `${pendingDrafts.length} ऑफ़लाइन ड्राफ्ट इस डिवाइस पर सुरक्षित हैं`
                  : `${pendingDrafts.length} Offline Draft(s) Stored on this Device`}
              </span>
            </div>
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="btn-lift bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{language === 'hi' ? 'अभी सिंक करें' : 'Sync Now'}</span>
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
                  <span className="font-bold text-ink-950 capitalize">
                    {getDamageTypeLabel(draft.damageTypeHint) || draft.damageTypeHint}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">{draft.address}</span>
                </div>
                <button
                  onClick={() => handleDeleteDraft(draft.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                  title={language === 'hi' ? 'ड्राफ्ट हटाएं' : 'Discard Draft'}
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
          {dict.myReports.filterAll} ({reports.length})
        </button>
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'ACTIVE'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {dict.myReports.filterActive} ({activeCount})
        </button>
        <button
          onClick={() => setFilter('RESOLVED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'RESOLVED'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {dict.myReports.filterResolved} ({resolvedCount})
        </button>
      </div>

      {/* Main Content: Citizen Report Cards */}
      {loading ? (
        <div className="text-center py-16 space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">{dict.common.loading}</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-warm-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-black text-lg text-ink-950">{dict.myReports.emptyTitle}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {dict.myReports.emptyDesc}
            </p>
          </div>
          <Link
            to="/report"
            className="btn-lift inline-flex items-center space-x-2 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{dict.createReport.title}</span>
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
            const damageName = getDamageTypeLabel(report.damageType);

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
                      {dict.common.priority}: {report.riskScore}/100
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border tracking-wider uppercase ${citizenStatus.style}`}
                    title={citizenStatus.explanation}
                  >
                    <span>{citizenStatus.label}</span>
                    {language === 'hi' && citizenStatus.explanation && (
                      <span className="font-normal text-[10px] opacity-90 border-l border-current/20 pl-1.5 ml-1.5 normal-case">
                        {citizenStatus.explanation}
                      </span>
                    )}
                  </span>
                </div>

                {/* Body Details: Issue & Location */}
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {language === 'hi' ? 'समस्या' : 'Issue'}
                    </span>
                    <h3 className="font-black font-heading text-lg sm:text-xl text-ink-950 capitalize tracking-tight">
                      {damageName}
                    </h3>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      {dict.common.location}
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
                    <span>
                      {language === 'hi' ? 'अंतिम अपडेट ' : 'Last Updated '}
                      {new Date(report.updatedAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <Link
                    to={`/reports/${report.id}`}
                    className="btn-lift bg-warm-100 hover:bg-slate-200 text-ink-950 font-black px-4 py-2 rounded-xl border border-slate-200 transition flex items-center space-x-1 text-xs shadow-xs"
                  >
                    <span>{dict.myReports.viewDetails}</span>
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
