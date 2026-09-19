import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  MapPin,
  Camera,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Navigation,
  Clock,
  Activity,
  Layers,
  FileText,
  AlertTriangle,
  Lock,
  Eye,
  Check,
  Building2,
  FileCheck,
  TrendingUp,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8 overflow-hidden">
      {/* 1. HERO SECTION — COMPLETE NEW COMPOSITION */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Subtle Warm Background with Infrastructure Grid Pattern */}
        <div className="relative rounded-3xl bg-warm-50 border border-slate-200/90 shadow-card overflow-hidden p-6 sm:p-10 lg:p-14 bg-civic-grid">
          {/* Very soft subtle gradient accents (NOT heavy blue) */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
            {/* LEFT SIDE: Copy & Actions */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-7">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 shadow-subtle px-3.5 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="font-heading font-extrabold text-[11px] tracking-wider text-ink-900 uppercase">
                  ROADGUARD AI
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
                  Public Infrastructure Safety
                </span>
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold font-heading tracking-tight leading-[1.15] text-ink-950 uppercase">
                  REPORT A ROAD PROBLEM.{' '}
                  <span className="block text-teal-700">
                    HELP MAKE ROADS SAFER.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
                  Capture a road issue, share its location, and follow its journey from report to verified resolution.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                {/* PRIMARY CTA */}
                <Link
                  to="/report"
                  className="btn-lift flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold px-7 py-4 rounded-2xl shadow-lg shadow-teal-900/15 text-sm sm:text-base tracking-wide transition-all"
                >
                  <Camera className="w-5 h-5 text-teal-100" />
                  <span>REPORT A ROAD ISSUE</span>
                  <ArrowRight className="w-4 h-4 text-teal-100 ml-1" />
                </Link>

                <Link
                  to="/map"
                  className="btn-lift flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 text-ink-900 font-bold px-6 py-4 rounded-2xl border border-slate-200 shadow-subtle text-sm sm:text-base transition-all"
                >
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span>VIEW ROAD MAP</span>
                </Link>
              </div>

              {/* Compact Trust Indicators */}
              <div className="pt-3 border-t border-slate-200/80">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>AI-ASSISTED</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Navigation className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>GPS ENABLED</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>EVIDENCE-BASED</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>TRANSPARENT TRACKING</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Real Product-Style Visual Panel */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-premium p-5 space-y-4 relative">
                {/* Console Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-heading font-black text-xs text-ink-900 tracking-wide uppercase">
                      Live Corridor Telemetry
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    Meerut Zone • NH-58
                  </span>
                </div>

                {/* Stylized Miniature Product Map Preview */}
                <div className="bg-slate-900 rounded-xl p-4 text-white space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-400">CORRIDOR SEGMENT: MEERUT-04</span>
                    <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold text-[10px] border border-rose-500/30">
                      HIGH RISK
                    </span>
                  </div>

                  {/* Road Vector Line Simulation */}
                  <div className="h-16 relative flex items-center">
                    <div className="w-full h-2 bg-slate-800 rounded-full relative overflow-hidden">
                      <div className="absolute left-1/4 w-1/3 h-full bg-teal-500/60 rounded-full" />
                    </div>
                    {/* Defect Markers */}
                    <div className="absolute left-[35%] -top-1 transform -translate-x-1/2 flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-lg animate-bounce">
                        !
                      </div>
                      <span className="text-[9px] font-bold text-rose-300 mt-1">Pothole RG-1042</span>
                    </div>

                    <div className="absolute left-[70%] -top-1 transform -translate-x-1/2 flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow">
                        ●
                      </div>
                      <span className="text-[9px] font-medium text-slate-400 mt-1">Crack #312</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                    <span>GPS: 28.9845° N, 77.7064° E</span>
                    <span className="text-teal-400 font-semibold">AI Confidence: 94.2%</span>
                  </div>
                </div>

                {/* Active Incident Preview Card */}
                <div className="bg-warm-100 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-900">Active Report RG-1042</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                      IN PROGRESS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Severe pothole cavity on central carriage lane near Surajkund Road. Assigned to PWD Road Maintenance Cell.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block">Risk Metric</span>
                      <span className="font-bold text-rose-700 text-xs">86 / 100</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block">SLA Target</span>
                      <span className="font-bold text-ink-900 text-xs">24h Remaining</span>
                    </div>
                  </div>
                </div>

                {/* Verified Repair Preview Snapshot */}
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-950 block text-[11px]">Before/After Audit Verified</span>
                      <span className="text-[10px] text-emerald-700">Recent: Garh Road patch approved</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    PASS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW ROADGUARD WORKS: 6 STEPS (FROM REPORT TO VERIFIED RESOLUTION) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">
            End-to-End Operational Lifecycle
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading text-ink-950">
            FROM REPORT TO VERIFIED RESOLUTION
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Every road defect moves through a structured, auditable lifecycle from initial photo to physical repair.
          </p>
        </div>

        {/* 6 Steps Timeline */}
        <div className="relative pt-4">
          {/* Desktop Connecting Line */}
          <div className="hidden md:block absolute top-[2.25rem] left-[5%] right-[5%] h-0.5 bg-slate-200 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 sm:gap-3 relative z-10">
            {[
              {
                num: '01',
                title: 'REPORT',
                desc: 'Photo + location',
                icon: Camera,
                accent: 'bg-teal-600 text-white',
              },
              {
                num: '02',
                title: 'UNDERSTAND',
                desc: 'AI-assisted analysis',
                icon: Sparkles,
                accent: 'bg-teal-600 text-white',
              },
              {
                num: '03',
                title: 'PRIORITIZE',
                desc: 'Risk assessment',
                icon: AlertTriangle,
                accent: 'bg-amber-600 text-white',
              },
              {
                num: '04',
                title: 'ASSIGN',
                desc: 'Relevant authority',
                icon: Building2,
                accent: 'bg-ink-800 text-white',
              },
              {
                num: '05',
                title: 'ACT',
                desc: 'Repair / field action',
                icon: Clock,
                accent: 'bg-teal-600 text-white',
              },
              {
                num: '06',
                title: 'VERIFY',
                desc: 'Before / after evidence',
                icon: CheckCircle2,
                accent: 'bg-emerald-600 text-white',
              },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-white rounded-2xl p-4 sm:p-4 border border-slate-200/90 shadow-subtle flex flex-col justify-between space-y-3 card-hover"
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-8 h-8 rounded-xl ${step.accent} flex items-center justify-center text-xs font-black shadow-xs`}>
                      {step.num}
                    </span>
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-sm tracking-tight text-ink-950">
                      {step.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. CITIZEN-FRIENDLY SECTION: REPORT IN THREE SIMPLE STEPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">
            Citizen First Design
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-ink-950 uppercase">
            REPORT IN THREE SIMPLE STEPS
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Designed for anyone on the road. No complex forms or bureaucracy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 01 */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-subtle card-hover space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-black text-lg">
              01
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-black text-lg text-ink-950">
                TAKE A PHOTO
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Capture the issue. A clear picture of the pothole or damaged surface lets computer vision identify the defect.
              </p>
            </div>
          </div>

          {/* Step 02 */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-subtle card-hover space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-black text-lg">
              02
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-black text-lg text-ink-950">
                SHARE LOCATION
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                GPS helps locate it. Instant coordinates identify the exact road corridor and municipal maintenance division.
              </p>
            </div>
          </div>

          {/* Step 03 */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-subtle card-hover space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-black text-lg">
              03
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-black text-lg text-ink-950">
                TRACK THE ACTION
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Follow the resolution. Receive live progress as work orders are assigned and before/after verification is completed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PLATFORM CAPABILITIES / WHY ROADGUARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center mb-6 space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Core Civic Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-ink-950 uppercase">
            WHY ROADGUARD?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-subtle space-y-2 card-hover">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-sm uppercase tracking-wide text-ink-900">
              SMART PRIORITY
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dynamically evaluates depth, traffic load, and accident proximity to highlight urgent safety hazards.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-subtle space-y-2 card-hover">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Navigation className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-sm uppercase tracking-wide text-ink-900">
              SMART ROUTING
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Instantly maps incidents to PWD, Nagar Nigam, or State Highway divisions without bureaucratic delays.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-subtle space-y-2 card-hover">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-sm uppercase tracking-wide text-ink-900">
              VERIFIED REPAIR
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Requires photographic before/after proof and optical audits before an incident can be closed.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-subtle space-y-2 card-hover">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-sm uppercase tracking-wide text-ink-900">
              ROAD HEALTH
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Detects chronic defect hotspots and correlates road wear with tender contractor warranty periods.
            </p>
          </div>
        </div>
      </section>

      {/* 5. AUTHORITY & SIH JURY PREVIEW CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-ink-950 text-white rounded-3xl p-7 sm:p-10 border border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-premium">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center space-x-2 text-[11px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
              <Lock className="w-3 h-3" />
              <span>SIH 2026 Jury & Authority Preview</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-heading text-white">
              Explore the Authority Operations & Verification Command
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Inspect inter-agency division dispatch, dynamic SLA countdowns, tender contract accountability, and computer vision photographic verification.
            </p>
          </div>

          <Link
            to="/authority"
            className="btn-lift shrink-0 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-xl transition flex items-center space-x-2 shadow-md active:scale-95"
          >
            <span>Open Authority Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
