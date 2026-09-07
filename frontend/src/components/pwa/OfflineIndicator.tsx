import React, { useEffect, useState } from 'react';
import { offlineSync } from '../../services/offlineSync';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncFeedback('Back online. Synchronizing pending drafts...');
      setTimeout(() => setSyncFeedback(null), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncFeedback('Offline mode active. Reports will be saved locally.');
      setTimeout(() => setSyncFeedback(null), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = offlineSync.subscribe((count, syncing) => {
      setPendingCount(count);
      setIsSyncing(syncing);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback('Synchronizing pending reports...');
    try {
      const res = await offlineSync.syncPendingReports();
      if (res.synced > 0) {
        setSyncFeedback(`Successfully synced ${res.synced} report(s).`);
      } else if (res.failed > 0) {
        setSyncFeedback(`Sync failed for ${res.failed} report(s). Will retry.`);
      } else {
        setSyncFeedback('All reports are up to date.');
      }
    } catch {
      setSyncFeedback('Sync attempt failed. Please check connection.');
    } finally {
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // If online, no pending reports, and no feedback to show, render subtle status pill in nav
  return (
    <div className="flex items-center space-x-2 text-xs">
      {!isOnline ? (
        <div className="flex items-center space-x-1.5 bg-rose-950/80 border border-rose-600/50 text-rose-300 px-2.5 py-1 rounded-full animate-pulse shadow-sm">
          <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-semibold tracking-wide uppercase text-[10px]">Offline</span>
        </div>
      ) : (
        <div className="hidden sm:flex items-center space-x-1.5 text-emerald-400/90 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full text-[10px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Online</span>
        </div>
      )}

      {pendingCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={!isOnline || isSyncing}
          title={isOnline ? 'Click to sync pending reports' : 'Reports queued locally until online'}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
            isOnline
              ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 hover:bg-amber-900/80 cursor-pointer'
              : 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
          <span>
            {isSyncing ? 'Syncing...' : `${pendingCount} Pending Sync`}
          </span>
        </button>
      )}

      {syncFeedback && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 text-xs">
          {isOnline ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{syncFeedback}</span>
        </div>
      )}
    </div>
  );
};
