import React, { useState, useRef } from 'react';
import { RepairVerification } from '../../../../shared/types';
import { api } from '../../services/api';
import { ShieldCheck, AlertOctagon, CheckCircle2, Camera, Image as ImageIcon, ZoomIn, X, Clock, UploadCloud } from 'lucide-react';

interface BeforeAfterProps {
  reportId: string;
  beforeImageUrl: string;
  afterImageUrl?: string;
  verification?: RepairVerification;
  isAuthority?: boolean;
  onVerificationComplete?: () => void;
}

export const BeforeAfterComparison: React.FC<BeforeAfterProps> = ({
  reportId,
  beforeImageUrl,
  afterImageUrl: initialAfterImage,
  verification: initialVerification,
  isAuthority = false,
  onVerificationComplete,
}) => {
  const [afterImage, setAfterImage] = useState<string>(initialAfterImage || '');
  const [verification, setVerification] = useState<RepairVerification | undefined>(initialVerification);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadingAfter, setUploadingAfter] = useState<boolean>(false);
  const [authorityDecision, setAuthorityDecision] = useState<string>('');
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);

  const afterCameraInputRef = useRef<HTMLInputElement | null>(null);
  const afterGalleryInputRef = useRef<HTMLInputElement | null>(null);

  // Upload genuine after-repair photo
  const handleAfterFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAfter(true);
    try {
      // 1. Upload to storage
      const uploaded = await api.uploadImage(file);
      // 2. Attach to complaint record
      await api.uploadAfterRepairPhoto(reportId, uploaded.url, 'Maintenance team uploaded remediation evidence.');
      setAfterImage(uploaded.url);
      if (onVerificationComplete) onVerificationComplete();
    } catch (err: any) {
      alert(err.message || 'Failed to upload after-repair photo');
    } finally {
      setUploadingAfter(false);
      e.target.value = '';
    }
  };

  const handleRunAiAudit = async () => {
    if (!afterImage) return;
    setIsLoading(true);
    try {
      const res = await api.runRepairVerification(reportId, afterImage, notes);
      setVerification(res);
      if (onVerificationComplete) onVerificationComplete();
    } catch (err: any) {
      alert(err.message || 'Error running AI verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED_REINSPECT') => {
    setIsLoading(true);
    try {
      await api.submitAuthorityDecision(reportId, decision, notes);
      setAuthorityDecision(decision);
      if (onVerificationComplete) onVerificationComplete();
    } catch (err: any) {
      alert(err.message || 'Error submitting authority decision');
    } finally {
      setIsLoading(false);
    }
  };

  const isBothImagesPresent = Boolean(beforeImageUrl && afterImage);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
      {/* Hidden file inputs for after-repair photo */}
      <input
        ref={afterCameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleAfterFileSelected}
      />
      <input
        ref={afterGalleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAfterFileSelected}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-gov-700" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Before & After Repair Evidence Verification
          </h3>
        </div>
        <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-mono">
          Decision Support System
        </span>
      </div>

      {/* Side-by-Side Visual Evidence Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Before Repair (Citizen Evidence) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              <span>Before Repair (Citizen Evidence)</span>
            </span>
          </div>

          <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-inner">
            <img
              src={beforeImageUrl}
              alt="Before repair road damage"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setActiveZoomImage(beforeImageUrl)}
              className="absolute top-2.5 right-2.5 bg-slate-900/75 hover:bg-slate-900 text-white p-1.5 rounded-lg backdrop-blur-sm transition"
              title="Zoom Before Image"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-0.5 rounded-md text-[10px] font-mono">
              Original Incident Photo
            </div>
          </div>
        </div>

        {/* 2. After Repair (Genuine Remediation Evidence) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>After Repair (Contractor Remediation)</span>
            </span>
            {afterImage && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                Evidence Uploaded
              </span>
            )}
          </div>

          {afterImage ? (
            <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-inner">
              <img
                src={afterImage}
                alt="After repair road condition"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setActiveZoomImage(afterImage)}
                className="absolute top-2.5 right-2.5 bg-slate-900/75 hover:bg-slate-900 text-white p-1.5 rounded-lg backdrop-blur-sm transition"
                title="Zoom After Image"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Authority Re-upload button */}
              {isAuthority && (
                <button
                  type="button"
                  onClick={() => afterGalleryInputRef.current?.click()}
                  disabled={uploadingAfter || isLoading}
                  className="absolute bottom-2.5 right-2.5 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] px-2.5 py-1 rounded-md backdrop-blur-sm transition font-medium"
                >
                  Replace Photo
                </button>
              )}
            </div>
          ) : (
            /* Honest Empty State: Never display an unrelated photo */
            <div className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-5 text-center bg-slate-50 space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  After-repair evidence not uploaded yet
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                  Remediation work is either pending or on-site completion photograph has not been submitted by the field maintenance team.
                </p>
              </div>

              {/* Authority Upload Control */}
              {isAuthority && (
                <div className="pt-1 w-full max-w-xs space-y-2">
                  <span className="text-[10px] font-bold text-gov-800 uppercase tracking-wider block">
                    Upload After-Repair Photo:
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => afterCameraInputRef.current?.click()}
                      disabled={uploadingAfter}
                      className="flex-1 bg-gov-700 hover:bg-gov-800 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => afterGalleryInputRef.current?.click()}
                      disabled={uploadingAfter}
                      className="flex-1 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold py-2 px-3 rounded-lg border border-slate-300 shadow-sm transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                      <span>Gallery</span>
                    </button>
                  </div>
                  {uploadingAfter && (
                    <p className="text-[10px] text-gov-700 font-medium animate-pulse">
                      Uploading repair evidence...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Verification Section — ONLY runs when BOTH Before and After images exist */}
      {isBothImagesPresent && (
        <div className="space-y-4 pt-2">
          {/* Action to trigger AI audit if not yet performed */}
          {!verification && isAuthority && (
            <div className="p-4 rounded-xl bg-gov-50/70 border border-gov-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-gov-900">Before & After Evidence Ready for Audit</p>
                <p className="text-[11px] text-gov-700">
                  Run computer vision assessment to compare pavement remediation, detect residual depressions, and evaluate location consistency.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunAiAudit}
                disabled={isLoading}
                className="shrink-0 bg-gov-700 hover:bg-gov-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {isLoading ? 'Analyzing Images...' : 'Run AI Repair Audit'}
              </button>
            </div>
          )}

          {/* AI Verification Results Card */}
          {verification && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-md font-mono">
                    DEMO AI ANALYSIS
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Computer Vision Remediation Evaluation
                  </span>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                    verification.recommendation === 'PASS'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  RECOMMENDATION:{' '}
                  {verification.recommendation === 'PASS'
                    ? 'PASS'
                    : verification.recommendation === 'REJECT'
                    ? 'REJECTED'
                    : 'NEEDS HUMAN REVIEW'}
                </span>
              </div>

              {/* 4 Objective Inspection Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                  <span className="text-[11px] text-slate-500 block">Location Match</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {verification.locationMatchConfidence}%
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                  <span className="text-[11px] text-slate-500 block">Visible Improvement</span>
                  <span className="text-lg font-extrabold text-emerald-600">
                    {verification.visibleImprovementScore}%
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                  <span className="text-[11px] text-slate-500 block">Remaining Damage</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {verification.remainingDamageScore}%
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                  <span className="text-[11px] text-slate-500 block">AI Confidence</span>
                  <span className="text-lg font-extrabold text-gov-700">
                    {verification.overallConfidence}%
                  </span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Engineering Assessment: </strong>
                {verification.recommendationExplanation}
              </div>

              {/* Human Reviewer Sign-Off Controls */}
              {isAuthority && (
                <div className="pt-2 border-t border-slate-200/80 space-y-3">
                  <input
                    type="text"
                    placeholder="Official engineer inspection remarks (e.g. Verified by JE on site, dense BC overlay confirmed)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gov-700 bg-white"
                  />

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecision('APPROVED')}
                      disabled={isLoading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Formally Close Complaint</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision('REJECTED_REINSPECT')}
                      disabled={isLoading}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                    >
                      <AlertOctagon className="w-4 h-4" />
                      <span>Reject & Mandate Reinspection</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {activeZoomImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveZoomImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setActiveZoomImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeZoomImage}
              alt="Road inspection full resolution"
              className="max-h-[85vh] w-auto object-contain rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
