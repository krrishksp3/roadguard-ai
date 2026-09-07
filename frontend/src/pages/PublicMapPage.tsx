import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RoadReport } from '../../../shared/types';
import { ReportsMap } from '../components/map/ReportsMap';
import { Filter, Layers, AlertTriangle } from 'lucide-react';

export const PublicMapPage: React.FC = () => {
  const [reports, setReports] = useState<RoadReport[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAllReports({
          severity: severityFilter || undefined,
          status: statusFilter || undefined,
        });
        setReports(res.data);
      } catch (err) {
        console.error('Failed to load map reports:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [severityFilter, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Public Road Intelligence & Safety Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time geospatial tracking of road hazards, severity ratings, and remediation across Meerut
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-gov-700"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-gov-700"
          >
            <option value="">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="REPAIR_IN_PROGRESS">In Repair</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Map Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-gov-700" />
            <span>Click any marker to inspect damage diagnosis & road risk metrics</span>
          </span>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span><span>Critical</span></span>
            <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span><span>High</span></span>
            <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span>Medium</span></span>
            <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span>Low</span></span>
          </div>
        </div>

        <div className="h-[550px] rounded-xl overflow-hidden border border-slate-200">
          <ReportsMap reports={reports} height="100%" />
        </div>
      </div>
    </div>
  );
};
