import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, MapPin, Cpu, ArrowRight, CheckCircle2, AlertTriangle, FileText, Activity, Users } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-gov-navy to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8 rounded-3xl mx-4 sm:mx-8 shadow-2xl border border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2.5 bg-slate-900/80 border border-slate-700/80 px-4 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center text-white shadow">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-heading font-extrabold text-sm tracking-tight text-white">ROADGUARD</span>
              <span className="text-[10px] bg-gov-500 text-white px-1.5 py-0.5 rounded font-bold">AI</span>
            </div>
            <span className="text-slate-400 text-xs hidden sm:inline border-l border-slate-700 pl-2.5">
              Public Infrastructure Intelligence & Safety Platform
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-heading leading-tight">
            From Road Complaints to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gov-500 to-teal-400">
              Intelligent, Accountable Road Action.
            </span>
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            ROADGUARD AI bridges citizen road hazard reporting with computer vision damage classification, 
            transparent 0–100 Dynamic Risk scoring, public tender accountability, and AI-assisted repair verification.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/report"
              className="bg-gov-500 hover:bg-gov-600 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-gov-500/30 transition flex items-center space-x-2"
            >
              <span>Report a Road Issue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/map"
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold px-6 py-3.5 rounded-xl border border-slate-700 transition flex items-center space-x-2"
            >
              <MapPin className="w-4 h-4 text-gov-500" />
              <span>Public Road Map</span>
            </Link>

            <Link
              to="/authority"
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3.5 rounded-xl transition flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Authority Dashboard</span>
            </Link>
          </div>

          {/* Institutional Infrastructure Workflow Ribbon */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-200 font-semibold text-xs block">Inter-Agency Routing</span>
                <span className="text-[11px] text-slate-400 leading-tight block">Automated matching to PWD, Nagar Nigam & NHAI divisions</span>
              </div>
            </div>
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-200 font-semibold text-xs block">Objective Prioritization</span>
                <span className="text-[11px] text-slate-400 leading-tight block">Multi-factor road risk index & spatial cluster deduplication</span>
              </div>
            </div>
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-200 font-semibold text-xs block">Verified Civil Remediation</span>
                <span className="text-[11px] text-slate-400 leading-tight block">Mandatory pre- & post-repair photographic verification</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* End-to-End Visual Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            The Complete Intelligent Accountability Lifecycle
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Not just pothole reporting — an integrated workflow from citizen photo to verified civil remediation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">1</div>
            <h3 className="font-bold text-slate-900 mb-1">Citizen Capture</h3>
            <p className="text-xs text-slate-600">Geo-tagged photo upload with auto GPS coordinates or interactive pin fallback.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4">2</div>
            <h3 className="font-bold text-slate-900 mb-1">AI Classification</h3>
            <p className="text-xs text-slate-600">Detects damage type, severity level, safety hazard index, and flags duplicate clusters.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-4">3</div>
            <h3 className="font-bold text-slate-900 mb-1">Dynamic Risk & Tender</h3>
            <p className="text-xs text-slate-600">Calculates 0–100 Road Risk Score and automatically links to public e-Procurement road tenders.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">4</div>
            <h3 className="font-bold text-slate-900 mb-1">Verified Resolution</h3>
            <p className="text-xs text-slate-600">Before/After visual audit with computer vision evaluation before final authorized closure.</p>
          </div>
        </div>
      </section>

      {/* Core Innovation Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-900 to-gov-navy text-white p-6 rounded-2xl shadow-md border border-slate-800">
            <AlertTriangle className="w-8 h-8 text-amber-400 mb-4" />
            <h3 className="font-bold text-lg mb-2">Dynamic Road Risk Score</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Transparent 0–100 score weighing defect severity, pedestrian/vehicular safety hazard, cluster density, corridor importance, and chronic damage recurrence.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-gov-navy text-white p-6 rounded-2xl shadow-md border border-slate-800">
            <FileText className="w-8 h-8 text-gov-500 mb-4" />
            <h3 className="font-bold text-lg mb-2">Tender & Contract Intelligence</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connects road maintenance issues with official UP e-Procurement records, work descriptions, and contractor accountability statuses.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-gov-navy text-white p-6 rounded-2xl shadow-md border border-slate-800">
            <Activity className="w-8 h-8 text-teal-400 mb-4" />
            <h3 className="font-bold text-lg mb-2">Chronic Hotspot Detection</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Flags recurring failure corridors receiving multiple complaints to mandate comprehensive structural reconstruction over repetitive spot patches.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
