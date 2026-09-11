import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { RoadReport, ComplaintStatus } from '../../../shared/types';
import { StatusBadge, SeverityBadge } from '../components/ui/StatusBadge';
import { RiskScoreMeter } from '../components/ui/RiskScoreMeter';
import { ComplaintTimeline } from '../components/timeline/ComplaintTimeline';
import { BeforeAfterComparison } from '../components/verification/BeforeAfterComparison';
import { useAuth } from '../context/AuthContext';
import { MapPin, FileText, AlertTriangle, Building, Clock, ChevronLeft, ExternalLink, ShieldCheck, ZoomIn, X, ShieldAlert } from 'lucide-react';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthority } = useAuth();
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
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500">
        <p className="animate-pulse">Loading complaint record & intelligence analysis...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-red-600 font-semibold">{error || 'Complaint not found'}</p>
        <Link to="/map" className="inline-block text-sm text-gov-700 font-bold hover:underline">
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/map"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold font-heading text-slate-900">{report.id}</h1>
              <StatusBadge status={report.status} />
              <SeverityBadge severity={report.severity} />
            </div>
            <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{report.address || 'Meerut Road Network'}</span>
              <span>•</span>
              <span>Reported: {new Date(report.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* SLA Status Pill */}
        <div className="flex items-center space-x-2">
          {report.isOverdue ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-100 text-red-800 border border-red-300 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>SLA EXCEEDED (+{report.overdueHours || 18}h)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>SLA Target: {report.slaTargetHours}h</span>
            </div>
          )}
        </div>
      </div>

      {/* Cancelled Report Banner */}
      {report.status === 'CANCELLED' && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 text-rose-950 space-y-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-900">REPORT CANCELLED — INVALID ROAD-DAMAGE EVIDENCE</h2>
              <p className="text-xs text-rose-700">No supported road damage was detected in the uploaded photograph. Workflow stopped at intake.</p>
            </div>
          </div>
          <div className="bg-white/80 rounded-xl p-3 border border-rose-200 text-xs space-y-1 text-slate-700">
            <p><span className="font-semibold text-rose-900">Supported evidence includes:</span> Pothole • Water Logging • Surface Cracking • Edge Dropping • Drain / Manhole Damage</p>
            <p><span className="font-semibold text-rose-900">Forwarded to Authority:</span> <span className="font-bold text-rose-800">NO</span></p>
            <p><span className="font-semibold text-rose-900">Risk Assessment:</span> <span className="font-bold text-slate-700">NO RISK FOUND (N/A)</span></p>
          </div>
        </div>
      )}

      {/* Main Grid: Left = Visuals & Timeline, Right = Intelligence & Tender */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Image Card */}
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="relative aspect-video max-h-80 bg-slate-900 group">
              <img
                src={report.imageUrl}
                alt={report.damageType}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute top-3 left-3 flex items-center space-x-2">
                <div className="bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-mono">
                  Lat: {report.latitude.toFixed(5)}, Lng: {report.longitude.toFixed(5)}
                </div>
                {isDemoEvidence ? (
                  <div className="bg-amber-500/90 backdrop-blur-md text-amber-950 font-bold px-2.5 py-1 rounded-lg text-[10px] tracking-wide flex items-center space-x-1 shadow-sm">
                    <ShieldAlert className="w-3 h-3 text-amber-950" />
                    <span>SYNTHETIC DEMO EVIDENCE (CC)</span>
                  </div>
                ) : (
                  <div className="bg-emerald-600/90 backdrop-blur-md text-white font-bold px-2.5 py-1 rounded-lg text-[10px] tracking-wide shadow-sm">
                    CITIZEN EVIDENCE
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsImageZoomed(true)}
                className="absolute top-3 right-3 bg-slate-900/75 hover:bg-slate-900 text-white p-1.5 rounded-lg backdrop-blur-sm transition"
                title="Inspect Photo Fullscreen"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            {isDemoEvidence && (
              <div className="mx-5 mt-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-amber-900 font-bold">
                  <span className="flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                    <span>Real Photograph Reference (Licensed External)</span>
                  </span>
                  {evidenceMeta?.license && (
                    <span className="font-mono text-[10px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-900 font-semibold">
                      {evidenceMeta.license}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-amber-800">
                  {evidenceMeta?.title || 'Road Pothole Photograph'} via{' '}
                  <span className="font-semibold">Wikimedia Commons</span>
                  {evidenceMeta?.author ? ` (Author: ${evidenceMeta.author})` : ''}.
                </p>
                <p className="text-[10px] text-amber-700 italic">
                  Synthetic Demo Record: Used under reusable license for demonstration. Not captured in Meerut.
                </p>
              </div>
            )}
            <div className="p-5 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Citizen Distress Description</h3>
              <p className="text-sm text-slate-800 font-medium leading-relaxed">{report.description}</p>
            </div>
          </div>

          {/* E-Commerce Delivery-Style Action Timeline */}
          <ComplaintTimeline timeline={report.timeline} currentStatus={report.status} />

          {/* Before / After AI Verification Module — only for valid road complaints */}
          {report.status !== 'CANCELLED' && (
            <BeforeAfterComparison
              reportId={report.id}
              beforeImageUrl={report.imageUrl}
              afterImageUrl={report.repairAfterImageUrl || undefined}
              verification={report.verificationResult || undefined}
              isAuthority={isAuthority}
              onVerificationComplete={fetchReport}
            />
          )}
        </div>

        {/* Right 1 Col: Intelligence, Tender & Authority Action */}
        <div className="space-y-6">
          {/* Dynamic Road Risk Score */}
          <RiskScoreMeter
            score={report.riskScore}
            priorityAssessment={report.priorityAssessment || undefined}
          />

          {/* AI Damage Analysis Summary */}
          {report.aiAnalysis && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  AI Computer Vision Diagnosis
                </span>
                <span className="text-xs font-bold text-gov-700">
                  {Math.round(report.aiAnalysis.confidence * 100)}% Confidence
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Classified Defect</span>
                  <span className="font-bold text-slate-900 capitalize text-sm">{report.aiAnalysis.damageType.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Civil Engineering Description</span>
                  <p className="text-slate-700 mt-0.5">{report.aiAnalysis.description}</p>
                </div>
                <div>
                  <span className="text-slate-400 block">Recommended Action</span>
                  <p className="text-gov-800 font-medium mt-0.5">{report.aiAnalysis.recommendedAction}</p>
                </div>
              </div>
            </div>
          )}

          {/* Responsible Department Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Building className="w-4 h-4 text-gov-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Responsible Authority
              </span>
            </div>
            <div className="text-xs space-y-1.5">
              <p className="font-bold text-slate-900 text-sm">{report.department?.name || 'UP PWD Meerut'}</p>
              <p className="text-slate-500">Jurisdiction: {report.department?.jurisdiction || 'Provincial Division'}</p>
              <p className="text-slate-500">Nodal Officer: {report.department?.nodalOfficer || 'Executive Engineer'}</p>
              <p className="text-slate-500 font-mono text-[11px]">{report.department?.contactEmail || 'pwd-meerut@up.gov.in.demo'}</p>
            </div>
          </div>

          {/* Tender Intelligence Card (Accountability Layer) */}
          {tender && (
            <div className="bg-gradient-to-br from-slate-900 to-gov-navy text-white rounded-2xl p-5 shadow-sm space-y-3 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gov-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Linked Public Tender
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  {tender.verificationStatus}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Tender ID / Ref</span>
                  <span className="font-mono font-bold text-slate-100">{tender.tenderId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Scope of Work</span>
                  <p className="text-slate-200">{tender.workDescription}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Value</span>
                    <span className="font-bold text-teal-400">{tender.tenderValue}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Status</span>
                    <span className="font-semibold text-slate-200">{tender.tenderStatus}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Awarded Contractor</span>
                  <span className="font-semibold text-slate-200 block">{tender.contractor}</span>
                  <span className="text-[10px] text-slate-400 font-mono italic">
                    Status: {tender.contractorStatus}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">UP e-Procurement Record</span>
                  <a
                    href={tender.officialSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gov-500 hover:text-teal-300 flex items-center space-x-1"
                  >
                    <span>View Gazette</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Authority Quick Actions Bar */}
          {isAuthority && report.status !== 'CANCELLED' && (
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                Authority Administrative Action
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdateStatus('ACKNOWLEDGED')}
                  disabled={statusUpdateLoading}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  Acknowledge
                </button>
                <button
                  onClick={() => handleUpdateStatus('INSPECTION_SCHEDULED')}
                  disabled={statusUpdateLoading}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  Schedule JE Inspection
                </button>
                <button
                  onClick={() => handleUpdateStatus('REPAIR_IN_PROGRESS')}
                  disabled={statusUpdateLoading}
                  className="px-3 py-2 bg-gov-700 hover:bg-gov-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  Mobilize Repair Team
                </button>
                <button
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  disabled={statusUpdateLoading}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => setShowEscalateModal(true)}
                  disabled={statusUpdateLoading || escalating}
                  className="col-span-2 px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-200" />
                  <span>Escalate to District Administration</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Escalate to District Administration Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-slate-900 text-base">Escalate to District Admin</h3>
              </div>
              <button
                onClick={() => setShowEscalateModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Flag this incident for urgent District Collector / Chief Engineer intervention (e.g. contractor non-responsiveness, severe hazardous condition, multi-department jurisdiction dispute).
            </p>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Escalation Reason / Context</label>
              <textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="Describe reason for escalation (e.g. Contractor unreachable past 48 hours, high risk to school corridor)..."
                rows={3}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalate}
                disabled={escalating || !escalateReason.trim()}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {escalating ? 'Submitting Escalation...' : 'Confirm Escalation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {isImageZoomed && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsImageZoomed(false)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsImageZoomed(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={report.imageUrl}
              alt="Road distress full resolution"
              className="max-h-[85vh] w-auto object-contain rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-3 text-xs text-white/80 font-mono">
              {report.address || 'Meerut Road Network'} • Lat: {report.latitude.toFixed(5)}, Lng: {report.longitude.toFixed(5)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
