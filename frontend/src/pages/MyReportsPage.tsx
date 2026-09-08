import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { offlineSync, OfflineDraftReport } from '../services/offlineSync';
import { RoadReport } from '../../../shared/types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { PlusCircle, MapPin, ArrowRight, WifiOff, RefreshCw, Trash2, Clock, AlertTriangle } from 'lucide-react';

export const MyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<RoadReport[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<OfflineDraftReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const drafts = await offlineSync.getPendingReports();
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
  };

  useEffect(() => {
    loadData();

    const unsubscribe = offlineSync.subscribe((count, syncing) => {
      setIsSyncing(syncing);
      offlineSync.getPendingReports().then((drafts) => {
        setPendingDrafts(drafts.filter((d) => d.status !== 'SYNCED'));
      });
    });

    const handleOnline = () => loadData();
    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleSyncNow = async () => {
    if (!navigator.onLine) {
      setSyncFeedback('You are currently offline. Connect to the internet to sync.');
      setTimeout(() => setSyncFeedback(null), 3500);
      return;
    }

    setIsSyncing(true);
    setSyncFeedback('Uploading offline reports and running AI optical analysis...');
    try {
      const res = await offlineSync.syncPendingReports();
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
      const drafts = await offlineSync.getPendingReports();
      setPendingDrafts(drafts.filter((d) => d.status !== 'SYNCED'));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">My Registered Complaints</h1>
          <p className="text-xs text-slate-500">Track real-time remediation progress, SLA deadlines, and offline drafts</p>
        </div>
        <Link
          to="/report"
          className="bg-gov-700 hover:bg-gov-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Report</span>
        </Link>
      </div>

      {syncFeedback && (
        <div className="p-3.5 bg-slate-900 text-white rounded-xl text-xs flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center space-x-2">
            <RefreshCw className={`w-4 h-4 text-gov-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{syncFeedback}</span>
          </div>
        </div>
      )}

      {/* SECTION: Offline Pending Sync Drafts */}
      {pendingDrafts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-amber-200/70 text-amber-800 rounded-lg">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Pending Synchronization ({pendingDrafts.length})
                </h3>
                <p className="text-[11px] text-amber-800/80">
                  Stored locally on this device. These will sync automatically when back online.
                </p>
              </div>
            </div>

            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingDrafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-white rounded-xl p-3.5 border border-amber-200/80 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex space-x-3">
                  <img
                    src={draft.imageUrl}
                    alt={draft.damageTypeHint}
                    className="w-18 h-18 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] font-bold text-amber-900 truncate max-w-[120px]">
                        {draft.id}
                      </span>
                      <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
                        Pending Sync
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs capitalize truncate">
                      {draft.damageTypeHint}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{draft.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1 truncate max-w-[200px]">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{draft.address}</span>
                  </span>
                  <button
                    onClick={() => handleDeleteDraft(draft.id)}
                    title="Discard offline draft"
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: Synced Reports */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading complaints...</div>
      ) : reports.length === 0 && pendingDrafts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <p className="text-slate-600 font-medium">No road complaints submitted under this account yet.</p>
          <Link
            to="/report"
            className="inline-block bg-gov-700 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gov-800 transition"
          >
            Report First Road Hazard
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.length > 0 && (
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Submitted Complaints ({reports.length})
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => (
              <Link
                key={report.id}
                to={`/reports/${report.id}`}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-gov-500 hover:shadow-md transition flex flex-col justify-between space-y-3 group"
              >
                <div className="flex space-x-3">
                  <div className="relative w-20 h-20 shrink-0">
                    <img
                      src={report.imageUrl}
                      alt={report.damageType}
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                    />
                    {(report.evidenceSource === 'LICENSED_EXTERNAL' ||
                      report.evidenceSource === 'DEMO_SYNTHETIC' ||
                      report.imageUrl?.includes('demo-evidence')) && (
                      <span className="absolute bottom-1 right-1 bg-slate-900/80 text-amber-300 text-[8px] font-bold px-1 py-0.5 rounded shadow-xs">
                        CC DEMO
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-gov-700 transition">
                        {report.id}
                      </span>
                      <StatusBadge status={report.status} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs capitalize truncate">
                      {report.damageType.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{report.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[180px]">{report.address || 'Meerut Road Network'}</span>
                  </span>
                  <span className="text-gov-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center space-x-0.5">
                    <span>Track Action</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

