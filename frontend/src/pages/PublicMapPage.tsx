import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RoadReport } from '../../../shared/types';
import { ReportsMap } from '../components/map/ReportsMap';
import { Layers, AlertTriangle, CheckCircle2, Clock, MapPin, Sparkles, X, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useLanguage } from '../i18n/LanguageContext';

type MapFilter = 'ALL' | 'HIGH_RISK' | 'IN_PROGRESS' | 'RESOLVED';

export const PublicMapPage: React.FC = () => {
  const { dict, language, getDamageTypeLabel } = useLanguage();
  const [allReports, setAllReports] = useState<RoadReport[]>([]);
  const [activeFilter, setActiveFilter] = useState<MapFilter>('ALL');
  const [selectedReport, setSelectedReport] = useState<RoadReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAllReports();
        // Exclude cancelled invalid reports from public safety map
        setAllReports(res.data.filter((r) => r.status !== 'CANCELLED'));
      } catch (err) {
        console.error('Failed to load map reports:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter reports based on active floating tab
  const filteredReports = allReports.filter((report) => {
    if (activeFilter === 'HIGH_RISK') {
      return report.riskScore >= 70 || report.severity === 'critical' || report.severity === 'high';
    }
    if (activeFilter === 'IN_PROGRESS') {
      return (
        report.status === 'REPAIR_IN_PROGRESS' ||
        report.status === 'ASSIGNED' ||
        report.status === 'INSPECTION_SCHEDULED' ||
        report.status === 'ACKNOWLEDGED'
      );
    }
    if (activeFilter === 'RESOLVED') {
      return report.status === 'RESOLVED';
    }
    return true; // ALL
  });

  const highRiskCount = allReports.filter((r) => r.riskScore >= 70 || r.severity === 'critical' || r.severity === 'high').length;
  const inProgressCount = allReports.filter((r) => r.status !== 'RESOLVED').length;
  const resolvedCount = allReports.filter((r) => r.status === 'RESOLVED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 shadow-subtle px-3 py-1 rounded-full text-xs font-bold text-teal-800 mb-2">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>{language === 'hi' ? 'सार्वजनिक नागरिक अवसंरचना' : 'Public Civic Infrastructure'}</span>
            <span>•</span>
            <span>{language === 'hi' ? 'मेरठ क्षेत्र' : 'Meerut Zone'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-ink-950 tracking-tight uppercase">
            {dict.publicMap.pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {dict.publicMap.pageSubtitle}
          </p>
        </div>

        <Link
          to="/report"
          className="btn-lift self-start sm:self-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-xl transition shadow-md shadow-teal-900/15 active:scale-95 flex items-center space-x-1.5"
        >
          <span>{dict.nav.reportIssue}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Map Card with Floating Controls & Detail Panel */}
      <div className="relative bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-card">
        {/* Top Floating Controls Overlay (Section 16) */}
        <div className="absolute top-6 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Floating Filter Pills */}
          <div className="pointer-events-auto bg-ink-950/90 backdrop-blur-md p-1.5 rounded-2xl shadow-float border border-ink-800 flex items-center space-x-1">
            <button
              type="button"
              onClick={() => {
                setActiveFilter('ALL');
                setSelectedReport(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                activeFilter === 'ALL'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-ink-850'
              }`}
            >
              <span>{dict.common.all.toUpperCase()}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-ink-800 text-slate-300">
                {allReports.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFilter('HIGH_RISK');
                setSelectedReport(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                activeFilter === 'HIGH_RISK'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-ink-850'
              }`}
            >
              <span>{language === 'hi' ? 'उच्च जोखिम' : 'HIGH RISK'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-900/60 text-rose-200">
                {highRiskCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFilter('IN_PROGRESS');
                setSelectedReport(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                activeFilter === 'IN_PROGRESS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-ink-850'
              }`}
            >
              <span>{language === 'hi' ? 'प्रगति पर' : 'IN PROGRESS'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-900/60 text-amber-200">
                {inProgressCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFilter('RESOLVED');
                setSelectedReport(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                activeFilter === 'RESOLVED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-ink-850'
              }`}
            >
              <span>{language === 'hi' ? 'हल हुआ' : 'RESOLVED'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-900/60 text-emerald-200">
                {resolvedCount}
              </span>
            </button>
          </div>

          {/* Floating Marker Legend */}
          <div className="pointer-events-auto hidden md:flex items-center space-x-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-float text-[11px] font-bold text-slate-600">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>{dict.publicMap.legendCritical}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>{dict.publicMap.legendHigh}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>{dict.publicMap.legendMedium}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>{dict.common.resolved}</span>
            </span>
          </div>
        </div>

        {/* Map View */}
        <div className="h-[580px] rounded-2xl overflow-hidden relative">
          <ReportsMap
            reports={filteredReports}
            onReportSelect={(rep) => setSelectedReport(rep)}
            height="100%"
          />

          {/* Modern Slide-out Detail Panel when Marker is Clicked (Section 16) */}
          {selectedReport && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:left-4 sm:w-96 bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-slate-200 shadow-float z-30 animate-in slide-in-from-bottom-3 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-black text-slate-900 bg-warm-100 px-2.5 py-1 rounded-xl border border-slate-200">
                    {selectedReport.id}
                  </span>
                  <StatusBadge status={selectedReport.status} />
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="font-heading font-black text-base text-ink-950 capitalize">
                  {getDamageTypeLabel(selectedReport.damageType)}
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {selectedReport.address || (language === 'hi' ? 'मेरठ सड़क नेटवर्क' : 'Meerut Road Network')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-warm-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">{dict.common.priority}</span>
                  <span className={`font-black text-sm ${selectedReport.riskScore >= 70 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {selectedReport.riskScore} / 100
                  </span>
                </div>
                <div className="bg-warm-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">{dict.common.date}</span>
                  <span className="font-semibold text-slate-800 text-xs">
                    {new Date(selectedReport.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN')}
                  </span>
                </div>
              </div>

              <Link
                to={`/reports/${selectedReport.id}`}
                className="btn-lift w-full bg-teal-700 hover:bg-teal-600 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <span>{dict.myReports.viewDetails}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
