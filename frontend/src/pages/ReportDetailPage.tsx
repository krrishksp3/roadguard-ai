import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { RoadReport, ComplaintStatus } from '../../../shared/types';
import { StatusBadge, SeverityBadge } from '../components/ui/StatusBadge';
import { RiskScoreMeter } from '../components/ui/RiskScoreMeter';
import { ComplaintTimeline } from '../components/timeline/ComplaintTimeline';
import { BeforeAfterComparison } from '../components/verification/BeforeAfterComparison';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  FileText,
  AlertTriangle,
  Building,
  Clock,
  ChevronLeft,
  ExternalLink,
  ShieldCheck,
  ZoomIn,
  X,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Send,
  ArrowRight,
} from 'lucide-react';

import { useLanguage } from '../i18n/LanguageContext';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthority } = useAuth();
  const { dict, language, getStatusExplanation, getDamageTypeLabel, getSeverityLabel } = useLanguage();
  const [report, setReport] = useState<RoadReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<boolean>(false);
  const [isImageZoomed, setIsImageZoomed] = useState<boolean>(false);
  const [showEscalateModal, setShowEscalateModal] = useState<boolean>(false);
  const [escalateReason, setEscalateReason] = useState<string>('');
  const [escalating, setEscalating] = useState<boolean>(false);

  const fetchReport = async () => {
    if (!id) return;
    try {
      const data = await api.getReportById(id);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleUpdateStatus = async (newStatus: ComplaintStatus) => {
    if (!id) return;
    setStatusUpdateLoading(true);
    try {
      await api.updateReportStatus(id, newStatus, `Authority action: ${newStatus}`);
      await fetchReport();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!id || !escalateReason.trim()) return;
    setEscalating(true);
    try {
      await api.escalateReport(id, escalateReason);
      setShowEscalateModal(false);
      setEscalateReason('');
      await fetchReport();
      alert('Incident report successfully escalated to District Administration.');
    } catch (err: any) {
      alert(err.message || 'Failed to escalate report');
    } finally {
      setEscalating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Loading complaint record & tracking telemetry...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-rose-600 font-semibold">{error || 'Complaint not found'}</p>
        <Link to="/map" className="inline-block text-sm text-teal-700 font-bold hover:underline">
          Return to Road Map
        </Link>
      </div>
    );
  }

  const tender = report.roadSegment?.tender;
  const isDemoEvidence =
    report.evidenceSource === 'DEMO_SYNTHETIC' ||
    report.evidenceSource === 'LICENSED_EXTERNAL' ||
    Boolean(report.imageUrl?.includes('demo-evidence'));

  let evidenceMeta: any = null;
  if (report.evidenceSourceMetadata) {
    try {
      evidenceMeta = JSON.parse(report.evidenceSourceMetadata);
    } catch {
      evidenceMeta = null;
    }
  }

  // Calculate 6-stage lifecycle progress
  // Reported ✓ -> Analyzed ✓ -> Assigned ✓ -> Action in Progress ● -> Verification ○ -> Resolved ○
  const getStageState = (stageIndex: number) => {
    const status = report.status;
    if (status === 'RESOLVED') return 'completed';
    if (status === 'CANCELLED') return stageIndex === 0 ? 'completed' : 'pending';

    // 0: Reported
    if (stageIndex === 0) return 'completed';

    // 1: Analyzed
    if (stageIndex === 1) {
      if (status === 'REPORTED') {
        return report.aiAnalysis ? 'completed' : 'active';
      }
      return 'completed';
    }

    // 2: Assigned
    if (stageIndex === 2) {
      if (status === 'REPORTED') return 'pending';
      if (status === 'AI_ANALYZED' || status === 'PRIORITY_CALCULATED') return 'active';
      return 'completed';
    }

    // 3: Action in Progress
    if (stageIndex === 3) {
      if (['REPORTED', 'AI_ANALYZED', 'PRIORITY_CALCULATED'].includes(status)) return 'pending';
      if (['ASSIGNED', 'ACKNOWLEDGED', 'INSPECTION_SCHEDULED', 'REPAIR_IN_PROGRESS'].includes(status)) return 'active';
      return 'completed';
    }

    // 4: Verification
    if (stageIndex === 4) {
      if (['REPAIR_COMPLETED', 'AI_VERIFIED', 'NEEDS_REINSPECTION'].includes(status)) {
        return status === 'AI_VERIFIED' ? 'completed' : 'active';
      }
      return 'pending';
    }

    // 5: Resolved
    if (stageIndex === 5) {
      return 'pending';
    }

    return 'pending';
  };

  const formattedReportId = report.id.startsWith('RG-')
    ? report.id
    : `RG-${report.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;

  const priorityLabel = report.riskScore >= 70 ? 'HIGH PRIORITY' : report.riskScore >= 40 ? 'MEDIUM PRIORITY' : 'LOW PRIORITY';
  const priorityColor =
    report.riskScore >= 70
      ? 'bg-rose-50 text-rose-800 border-rose-200'
      : report.riskScore >= 40
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-emerald-50 text-emerald-800 border-emerald-200';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Fullscreen Zoom Modal */}
      {isImageZoomed && (
        <div className="fixed inset-0 bg-ink-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsImageZoomed(false)}
              className="absolute top-4 right-4 bg-ink-900/80 text-white p-2 rounded-xl hover:bg-ink-800 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={report.imageUrl} alt="Road Hazard High-Res Inspection" className="w-full h-auto max-h-[85vh] object-contain mx-auto" />
            <div className="p-4 bg-ink-950 text-white flex items-center justify-between text-xs">
              <span className="font-mono">{formattedReportId} • {report.address}</span>
              <span className="text-teal-400 font-semibold">Incident Evidence Record</span>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER: Issue Type • Priority • Location */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <Link
            to="/my-reports"
            className="btn-lift inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-ink-900 bg-warm-100 px-3.5 py-1.5 rounded-xl border border-slate-200 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{dict.reportDetail.backToReports}</span>
          </Link>

          {/* SLA Clock Indicator */}
          {report.isOverdue ? (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>SLA EXCEEDED (+{report.overdueHours || 18}h)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>SLA: {report.slaTargetHours}h {dict.myReports.slaRemaining}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <h1 className="text-3xl sm:text-4xl font-black font-heading text-ink-950 tracking-tight uppercase">
                {getDamageTypeLabel(report.damageType)}
              </h1>
              <span className={`text-xs font-black px-3 py-1 rounded-xl border uppercase tracking-wider ${priorityColor}`}>
                {language === 'hi'
                  ? (report.riskScore >= 70 ? 'उच्च प्राथमिकता' : report.riskScore >= 40 ? 'मध्यम प्राथमिकता' : 'सामान्य प्राथमिकता')
                  : priorityLabel} ({report.riskScore}/100)
              </span>
              <StatusBadge status={report.status} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-black text-ink-900 bg-warm-100 px-2 py-0.5 rounded-lg border border-slate-200">
                {formattedReportId}
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1 font-semibold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>{report.address || (language === 'hi' ? 'सड़क नेटवर्क, उत्तर प्रदेश' : 'Road Network, Uttar Pradesh')}</span>
              </span>
              <span>•</span>
              <span>{dict.reportDetail.filedOn} {new Date(report.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Authority Actions Bar (If Authority User) */}
          {isAuthority && (
            <div className="flex items-center space-x-2 pt-2 sm:pt-0">
              <select
                disabled={statusUpdateLoading}
                value={report.status}
                onChange={(e) => handleUpdateStatus(e.target.value as ComplaintStatus)}
                className="text-xs font-bold bg-warm-100 border border-slate-300 rounded-xl px-3 py-2 outline-none"
              >
                <option value="REPORTED">REPORTED (दर्ज)</option>
                <option value="ASSIGNED">ASSIGNED (विभाग आवंटित)</option>
                <option value="INSPECTION_SCHEDULED">INSPECTION_SCHEDULED (निरीक्षण)</option>
                <option value="REPAIR_IN_PROGRESS">REPAIR_IN_PROGRESS (मरम्मत चालू)</option>
                <option value="RESOLVED">RESOLVED (हल हुआ)</option>
              </select>

              <button
                onClick={() => setShowEscalateModal(true)}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-xl transition"
              >
                {language === 'hi' ? 'उच्चाधिकारी को भेजें' : 'Escalate'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* REPORT JOURNEY */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
              {dict.reportDetail.citizenTracking}
            </span>
            <h2 className="text-base sm:text-lg font-black font-heading text-ink-950 uppercase tracking-tight">
              {dict.reportDetail.reportJourney}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-bold bg-warm-100 px-3 py-1 rounded-xl border border-slate-200">
            {report.status} {language === 'hi' ? `(${getStatusExplanation(report.status)})` : ''}
          </span>
        </div>

        {/* 6 Lifecycle Steps Visualizer */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-1">
          {[
            { label: dict.reportDetail.stageReported, index: 0 },
            { label: dict.reportDetail.stageAnalyzed, index: 1 },
            { label: dict.reportDetail.stageAssigned, index: 2 },
            { label: dict.reportDetail.stageActionInProgress, index: 3 },
            { label: dict.reportDetail.stageVerification, index: 4 },
            { label: dict.reportDetail.stageResolved, index: 5 },
          ].map((step) => {
            const state = getStageState(step.index);
            return (
              <div
                key={step.label}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  state === 'completed'
                    ? 'bg-teal-50/70 border-teal-300 text-teal-950'
                    : state === 'active'
                    ? 'bg-amber-50/70 border-amber-300 text-amber-950 ring-2 ring-amber-500/20'
                    : 'bg-warm-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center mb-1.5">
                  {state === 'completed' ? (
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                      ✓
                    </div>
                  ) : state === 'active' ? (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-xs animate-pulse">
                      ●
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-xs font-black">
                      ○
                    </div>
                  )}
                </div>
                <span className="font-heading font-black text-xs block leading-tight">
                  {step.label}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70 block mt-0.5">
                  {state === 'completed' ? dict.reportDetail.stageDone : state === 'active' ? dict.reportDetail.stageInProgress : dict.reportDetail.stageUpcoming}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. EVIDENCE: BEFORE / AFTER & CITIZEN PHOTO */}
      <div className="space-y-6">
        {/* Incident Evidence Photo Box */}
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-card">
          <div className="relative aspect-video max-h-96 bg-slate-900 group">
            <img
              src={report.imageUrl}
              alt={report.damageType}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80';
              }}
            />
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <div className="bg-ink-950/80 backdrop-blur-md text-white px-3 py-1 rounded-xl text-xs font-mono">
                GPS: {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
              </div>
              {isDemoEvidence ? (
                <div className="bg-amber-500/90 text-amber-950 font-bold px-2.5 py-1 rounded-xl text-[10px] tracking-wide flex items-center space-x-1 shadow-sm">
                  <ShieldAlert className="w-3 h-3 text-amber-950" />
                  <span>{dict.reportDetail.demoEvidence}</span>
                </div>
              ) : (
                <div className="bg-teal-600/90 text-white font-bold px-2.5 py-1 rounded-xl text-[10px] tracking-wide shadow-sm">
                  {dict.reportDetail.citizenEvidence}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsImageZoomed(true)}
              className="absolute top-4 right-4 bg-ink-950/80 hover:bg-ink-900 text-white p-2 rounded-xl backdrop-blur-md transition"
              title={language === 'hi' ? 'ज़ूम करें' : 'Inspect Fullscreen'}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              {dict.reportDetail.fieldNotes}
            </span>
            <p className="text-sm text-slate-800 font-medium leading-relaxed">
              {report.description || (language === 'hi' ? 'सड़क क्षति की फोटो RoadGuard पर दर्ज की गई।' : 'Road defect photo submitted via RoadGuard intake.')}
            </p>
          </div>
        </div>

        {/* Before / After AI Verification Module */}
        {report.status !== 'CANCELLED' && (
          <BeforeAfterComparison
            reportId={report.id}
            beforeImageUrl={report.imageUrl}
            afterImageUrl={report.repairAfterImageUrl || undefined}
            verification={report.verificationResult || undefined}
            isAuthority={isAuthority}
            status={report.status}
            onVerificationComplete={fetchReport}
          />
        )}
      </div>

      {/* 4. AI ASSESSMENT & RISK METRICS (Section 15: Keep AI explanation short) */}
      {report.status === 'CANCELLED' ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card space-y-5">
          <div className="flex items-center space-x-3 text-amber-600">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-ink-950 text-base sm:text-lg">
                {dict.reportDetail.noDamageTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {dict.reportDetail.noDamageSubtitle}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">{language === 'hi' ? 'साक्ष्य स्थिति' : 'Evidence Status'}</span>
              <span className="font-black text-rose-700 text-sm">{language === 'hi' ? 'सत्यापित नहीं' : 'Not Verified'}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">{dict.common.riskScore}</span>
              <span className="font-black text-slate-900 text-sm">0</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">{dict.common.priority}</span>
              <span className="font-black text-slate-900 text-sm">{language === 'hi' ? 'कोई नहीं' : 'None'}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">{dict.common.assignedDepartment}</span>
              <span className="font-black text-slate-600 text-sm">{language === 'hi' ? 'आवंटित नहीं' : 'Not Created'}</span>
            </div>
          </div>

          {report.aiAnalysis?.description && (
            <div className="p-3.5 bg-warm-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-slate-700 mr-1.5">{language === 'hi' ? 'प्रारंभिक सत्यापन टिप्पणी:' : 'Intake Verification Note:'}</span>
              {report.aiAnalysis.description}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dynamic Road Risk Score */}
          <RiskScoreMeter
            score={report.riskScore}
            priorityAssessment={report.priorityAssessment || undefined}
          />

          {/* AI ASSESSMENT CARD */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-ink-950 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>{dict.reportDetail.aiAnalysisCardTitle}</span>
              </span>
              <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2.5 py-0.5 rounded-full border border-teal-200">
                {language === 'hi' ? 'AI-सहायित विश्लेषण' : 'AI-assisted assessment'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-warm-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{language === 'hi' ? 'समस्या' : 'Issue'}</span>
                <span className="font-black text-ink-950 capitalize text-sm">
                  {getDamageTypeLabel(report.aiAnalysis?.damageType || report.damageType)}
                </span>
              </div>

              <div className="bg-warm-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{dict.common.severity}</span>
                <span className="font-black text-ink-950 capitalize text-sm">
                  {getSeverityLabel(report.aiAnalysis?.severity || report.severity)}
                </span>
              </div>

              <div className="bg-warm-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{language === 'hi' ? 'सुरक्षा जोखिम' : 'Safety Risk'}</span>
                <span className="font-black text-ink-950 capitalize text-sm">
                  {report.aiAnalysis?.roadSafetyRisk !== undefined
                    ? (report.aiAnalysis.roadSafetyRisk >= 70 ? (language === 'hi' ? 'उच्च' : 'High') : report.aiAnalysis.roadSafetyRisk >= 40 ? (language === 'hi' ? 'मध्यम' : 'Moderate') : (language === 'hi' ? 'कम' : 'Low'))
                    : (report.riskScore >= 70 ? (language === 'hi' ? 'उच्च' : 'High') : (language === 'hi' ? 'मध्यम' : 'Moderate'))}
                </span>
              </div>

              <div className="bg-warm-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{dict.common.priority}</span>
                <span className="font-black text-teal-700 text-sm">
                  {report.riskScore} / 100
                </span>
              </div>

              <div className="bg-warm-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{language === 'hi' ? 'समान शिकायत' : 'Duplicate'}</span>
                <span className="font-black text-ink-950 text-sm">
                  {report.isDuplicate ? (language === 'hi' ? 'हाँ' : 'Yes') : (language === 'hi' ? 'नहीं' : 'No')}
                </span>
              </div>

              {report.aiAnalysis?.confidence !== undefined && (
                <div className="bg-warm-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">{dict.reportDetail.confidenceScore}</span>
                  <span className="font-black text-teal-700 text-sm">
                    {Math.round(report.aiAnalysis.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span className="italic">{language === 'hi' ? 'अंतिम कार्यवाही अधिकृत निकाय द्वारा सत्यापित की जाती है।' : 'Final action is reviewed by the responsible authority.'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. AUDITABLE INCIDENT TIMELINE */}
      <ComplaintTimeline timeline={report.timeline} currentStatus={report.status} />

      {/* 6. CONTRACTOR & TENDER INTELLIGENCE (If road segment has tender link) */}
      {tender && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-teal-600" />
              <h3 className="font-black font-heading text-ink-950 text-sm sm:text-base">
                {dict.reportDetail.contractorScope}
              </h3>
            </div>
            <span className="font-mono text-xs font-bold text-slate-600 bg-warm-100 px-2.5 py-1 rounded-xl border border-slate-200">
              {tender.tenderId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-warm-100 p-3 rounded-2xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">{language === 'hi' ? 'आवंटित ठेकेदार' : 'Awarded Contractor'}</span>
              <span className="font-bold text-ink-950 text-xs block truncate">{tender.contractor}</span>
            </div>
            <div className="bg-warm-100 p-3 rounded-2xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">{language === 'hi' ? 'स्वीकृत राशि' : 'Sanctioned Value'}</span>
              <span className="font-bold text-teal-700 text-xs block">{tender.tenderValue}</span>
            </div>
            <div className="bg-warm-100 p-3 rounded-2xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">{language === 'hi' ? 'वारंटी / दायित्व अवधि' : 'Defect Liability Period'}</span>
              <span className="font-bold text-ink-950 text-xs block">{tender.workPeriod}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
