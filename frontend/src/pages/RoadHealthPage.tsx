import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RoadSegment } from '../../../shared/types';
import { Activity, AlertTriangle, CheckCircle, ShieldAlert, FileText, Info, ArrowRight, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RoadHealthPage: React.FC = () => {
  const [segments, setSegments] = useState<RoadSegment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getRoadHealth();
        setSegments(data);
      } catch (err) {
        console.error('Failed to load road health:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Compute 4 Visual Intelligence KPI metrics (Section 17)
  const highRiskCount = segments.filter((s) => s.healthScore < 50).length;
  const totalIncidents = segments.reduce((acc, s) => acc + s.openComplaints + s.resolvedComplaints, 0);
  const recurringHotspotsCount = segments.filter((s) => s.isRecurringHotspot).length;
  const totalResolved = segments.reduce((acc, s) => acc + s.resolvedComplaints, 0);
  const avgHealthScore = segments.length > 0 ? Math.round(segments.reduce((acc, s) => acc + s.healthScore, 0) / segments.length) : 74;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header: ROAD HEALTH (Section 17) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 shadow-subtle px-3 py-1 rounded-full text-xs font-bold text-teal-800 mb-2">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>Infrastructure Analytics</span>
            <span>•</span>
            <span>Corridor Health Index</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-ink-950 tracking-tight uppercase">
            ROAD HEALTH
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Corridor-level pavement deterioration monitoring, chronic hotspot detection, and civil asset lifespan metrics.
          </p>
        </div>

        <Link
          to="/map"
          className="btn-lift self-start sm:self-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-xl transition shadow-md shadow-teal-900/15 flex items-center space-x-1.5"
        >
          <span>View on Map</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 4 KPI METRICS: CURRENT RISK, REPORTS, RECURRING ISSUES, RECENT ACTIVITY (Section 17) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CURRENT RISK */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              CURRENT RISK
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black font-heading text-ink-950">
              {highRiskCount} Segments
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            Avg condition: <strong className="text-teal-700 font-mono">{avgHealthScore}/100</strong>
          </span>
        </div>

        {/* REPORTS */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              REPORTS
            </span>
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black font-heading text-ink-950">
              {totalIncidents} Total
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            Across monitored Meerut corridors
          </span>
        </div>

        {/* RECURRING ISSUES */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              RECURRING ISSUES
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black font-heading text-rose-600">
              {recurringHotspotsCount} Hotspots
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            Repeated distress within 6 months
          </span>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              RECENT ACTIVITY
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black font-heading text-emerald-600">
              {totalResolved} Resolved
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            Remediated with audit verification
          </span>
        </div>
      </div>

      {/* Visual Road Segments Grid */}
      {loading ? (
        <div className="text-center py-20 space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading road segment health telemetry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {segments.map((seg) => {
            const riskLevel = seg.healthScore < 50 ? 'HIGH' : seg.healthScore < 70 ? 'MODERATE' : 'LOW';
            const riskBadgeColor =
              riskLevel === 'HIGH'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : riskLevel === 'MODERATE'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200';

            const statusText =
              riskLevel === 'HIGH'
                ? 'Immediate resurfacing required'
                : riskLevel === 'MODERATE'
                ? 'Routine maintenance inspection'
                : 'Pavement stable';

            return (
              <div
                key={seg.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-card flex flex-col justify-between space-y-5 card-hover"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-400 block uppercase">
                        {seg.code} • {seg.lengthKm} KM SPAN
                      </span>
                      <h3 className="font-black font-heading text-ink-950 text-lg mt-0.5">
                        {seg.name}
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">
                        {seg.importanceLevel.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black border uppercase tracking-wide ${riskBadgeColor}`}>
                      {riskLevel} RISK
                    </span>
                  </div>

                  {/* VISUAL ROAD-SEGMENT HEALTH INDICATOR (Section 17) */}
                  <div className="bg-warm-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-700">Pavement Condition Index</span>
                      <span className="font-mono font-black text-ink-950">{seg.healthScore} / 100</span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          seg.healthScore < 50
                            ? 'bg-rose-500'
                            : seg.healthScore < 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${seg.healthScore}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                      <span>0 (Failing)</span>
                      <span>50 (Fair)</span>
                      <span>100 (Optimal)</span>
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-warm-100 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Reports Count</span>
                      <span className="font-bold text-ink-950 text-sm">
                        {seg.openComplaints + seg.resolvedComplaints} Recorded
                      </span>
                    </div>

                    <div className="bg-warm-100 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Recurring Flag</span>
                      <span className={`font-bold text-xs ${seg.isRecurringHotspot ? 'text-rose-700' : 'text-slate-700'}`}>
                        {seg.isRecurringHotspot ? `${seg.recurringDamageCount} Incidents` : 'None Detected'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Link */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px] font-medium">{statusText}</span>
                  <Link
                    to={`/map`}
                    className="text-teal-700 hover:text-teal-800 font-extrabold flex items-center space-x-1"
                  >
                    <span>Inspect On Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
