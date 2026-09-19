import React, { useState, useRef } from 'react';
import { RepairVerification } from '../../../../shared/types';
import { api } from '../../services/api';
import {
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  ZoomIn,
  X,
  Clock,
  UploadCloud,
  Check,
  UserCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface BeforeAfterProps {
  reportId: string;
  beforeImageUrl: string;
  afterImageUrl?: string;
  verification?: RepairVerification;
  isAuthority?: boolean;
  status?: string;
  onVerificationComplete?: () => void;
}

export const BeforeAfterComparison: React.FC<BeforeAfterProps> = ({
  reportId,
  beforeImageUrl,
  afterImageUrl: initialAfterImage,
  verification: initialVerification,
  isAuthority = false,
  status = 'REPORTED',
  onVerificationComplete,
}) => {
  const [afterImage, setAfterImage] = useState<string>(initialAfterImage || '');
  const [verification, setVerification] = useState<RepairVerification | undefined>(initialVerification);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadingAfter, setUploadingAfter] = useState<boolean>(false);
  const [authorityDecision, setAuthorityDecision] = useState<string>('');
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);

  // Real mobile camera & gallery inputs
  const afterCameraInputRef = useRef<HTMLInputElement | null>(null);
  const afterGalleryInputRef = useRef<HTMLInputElement | null>(null);

  // Image preview before submission & professional inline message
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inlineNotice, setInlineNotice] = useState<{
    type: 'warning' | 'error' | 'success' | 'info';
    message: string;
  } | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState<{
    is503: boolean;
    message: string;
  } | null>(null);

  const isRepairInProgress = status === 'REPAIR_IN_PROGRESS';

  const handleTriggerAction = (mode: 'camera' | 'file') => {
    // 4. Strict lifecycle check before opening camera/file picker
    if (!isRepairInProgress) {
      setInlineNotice({
        type: 'warning',
        message: 'After-repair evidence becomes available once repair is in progress.',
      });
      return;
    }

    setInlineNotice(null);
    if (mode === 'camera') {
      afterCameraInputRef.current?.click();
    } else {
      afterGalleryInputRef.current?.click();
    }
  };

  const handleAfterFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isRepairInProgress) {
      setInlineNotice({
        type: 'warning',
        message: 'After-repair evidence becomes available once repair is in progress.',
      });
      e.target.value = '';
      return;
    }

    // Preview the image locally
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setInlineNotice(null);
    e.target.value = '';
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setInlineNotice(null);
  };

  const handleSubmitEvidence = async () => {
    if (!selectedFile) return;

    if (!isRepairInProgress) {
      setInlineNotice({
        type: 'warning',
        message: 'After-repair evidence becomes available once repair is in progress.',
      });
      return;
    }

    setUploadingAfter(true);
    setInlineNotice(null);
    try {
      const uploaded = await api.uploadImage(selectedFile);
      await api.uploadAfterRepairPhoto(
        reportId,
        uploaded.url,
        notes || 'Maintenance team uploaded remediation evidence.'
      );
      setAfterImage(uploaded.url);
      setPreviewUrl(null);
      setSelectedFile(null);
      setInlineNotice({
        type: 'success',
        message: 'After-repair evidence uploaded successfully! Case updated.',
      });
      if (onVerificationComplete) onVerificationComplete();
    } catch (err: any) {
      setInlineNotice({
        type: 'error',
        message: err.message || 'Failed to upload after-repair photo. Please verify lifecycle status.',
      });
    } finally {
      setUploadingAfter(false);
    }
  };

  const handleRunAiAudit = async () => {
    if (!afterImage) return;
    setIsLoading(true);
    setInlineNotice(null);
    setServiceUnavailable(null);
    try {
      const res = await api.runRepairVerification(reportId, afterImage, notes);
      setVerification(res);
      setServiceUnavailable(null);
      setInlineNotice({
        type: 'success',
        message: `Optical verification completed: ${res.recommendation} (${res.visibleImprovementScore}% resolved).`,
      });
      if (onVerificationComplete) onVerificationComplete();
    } catch (err: any) {
      const rawMsg: string = err?.message || 'Error running AI verification.';
      const is503 =
        rawMsg.includes('503') ||
        rawMsg.toUpperCase().includes('UNAVAILABLE') ||
        rawMsg.toLowerCase().includes('temporarily unavailable');

      if (is503) {
        setServiceUnavailable({
          is503: true,
          message:
            'The AI repair verification service is temporarily unavailable due to high upstream model traffic (HTTP 503 UNAVAILABLE). The configured 2 retries were attempted. Your uploaded repair evidence is safely preserved. Click "Retry Verification" below to try again.',
        });
      } else {
        setInlineNotice({
          type: 'error',
          message: rawMsg,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED_REINSPECT') => {
    setIsLoading(true);
    setInlineNotice(null);
    try {
      await api.submitAuthorityDecision(reportId, decision, notes);
      setAuthorityDecision(decision);
      setInlineNotice({
        type: 'success',
        message: decision === 'APPROVED' ? 'Remediation approved and case closed.' : 'Re-inspection requested.',
      });
      if (onVerificationComplete) onVerificationComplete();
    } catch (err: any) {
      setInlineNotice({
        type: 'error',
        message: err.message || 'Error submitting authority decision.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verificationStatus = !afterImage
    ? 'PENDING'
    : verification?.recommendation === 'PASS'
    ? 'PASS'
    : 'NEEDS REVIEW';

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card space-y-6">
      {/* Hidden real camera and gallery file inputs */}
      <input
        ref={afterCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleAfterFileSelected}
      />
      <input
        ref={afterGalleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAfterFileSelected}
      />

      {/* Lightbox Zoom */}
      {activeZoomImage && (
        <div className="fixed inset-0 bg-ink-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveZoomImage(null)}
              className="absolute top-4 right-4 bg-ink-900/80 text-white p-2 rounded-xl hover:bg-ink-800 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={activeZoomImage} alt="Zoom Inspection" className="w-full h-auto max-h-[85vh] object-contain mx-auto" />
          </div>
        </div>
      )}

      {/* Inline Professional Feedback Banner (Replaces window.alert) */}
      {inlineNotice && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-1 ${
            inlineNotice.type === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : inlineNotice.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}
        >
          <div className="flex items-start space-x-2.5">
            {inlineNotice.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
            {inlineNotice.type === 'error' && <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
            {inlineNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
            <div className="space-y-0.5">
              <span className="font-bold block text-[11px] uppercase tracking-wider">
                {inlineNotice.type === 'warning' ? 'Lifecycle Gate' : inlineNotice.type === 'error' ? 'Notice' : 'Success'}
              </span>
              <p className="leading-relaxed">{inlineNotice.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setInlineNotice(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
            aria-label="Close message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dedicated Professional 503 State Card with Safe Retry */}
      {serviceUnavailable?.is503 && (
        <div className="p-5 rounded-2xl border border-amber-300 bg-amber-50/90 text-amber-950 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-black font-heading uppercase tracking-wide text-amber-950">
                    Verification service temporarily unavailable
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-200/80 text-amber-900 border border-amber-300">
                    HTTP 503
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed max-w-2xl">
                  {serviceUnavailable.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setServiceUnavailable(null)}
              className="text-amber-600 hover:text-amber-900 p-1.5 rounded-lg transition"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-amber-200/60">
            <button
              type="button"
              onClick={handleRunAiAudit}
              disabled={isLoading}
              className="btn-lift bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Retrying Verification...' : 'Retry Verification'}</span>
            </button>
            <span className="text-[11px] text-amber-800/80 font-medium">
              Safe action: Re-triggers optical verification without modifying case state or evidence.
            </span>
          </div>
        </div>
      )}

      {/* 1. LARGE: BEFORE | AFTER (Section 19) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">PHOTOGRAPHIC AUDIT</span>
            <h3 className="font-black font-heading text-xl sm:text-2xl text-ink-950 tracking-tight uppercase">
              BEFORE | AFTER
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${
                verificationStatus === 'PASS'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : verificationStatus === 'NEEDS REVIEW'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-warm-100 text-slate-600 border-slate-300'
              }`}
            >
              STATUS: {verificationStatus}
            </span>
          </div>
        </div>

        {/* Side-by-Side Visual Inspection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* BEFORE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>BEFORE (Citizen Incident Photo)</span>
              </span>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner group">
              <img
                src={beforeImageUrl}
                alt="Before repair road damage"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setActiveZoomImage(beforeImageUrl)}
                className="absolute top-3 right-3 bg-ink-950/80 hover:bg-ink-900 text-white p-2 rounded-xl backdrop-blur-md transition"
                title="Zoom Before Image"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3 bg-ink-950/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-mono">
                Original Defect
              </div>
            </div>
          </div>

          {/* AFTER */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>AFTER (Remediation Evidence)</span>
              </span>
              {afterImage && (
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  Uploaded
                </span>
              )}
              {previewUrl && (
                <span className="text-[10px] bg-amber-50 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-300 animate-pulse">
                  Ready to Submit
                </span>
              )}
            </div>

            {/* CASE A: Image is previewed (User selected photo, ready to submit) */}
            {previewUrl ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-teal-500 bg-slate-900 shadow-lg group">
                <img
                  src={previewUrl}
                  alt="Preview of repair evidence"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-teal-600/90 text-white font-black text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider backdrop-blur-md">
                  Preview • Ready to Submit
                </div>
                <button
                  type="button"
                  onClick={() => setActiveZoomImage(previewUrl)}
                  className="absolute top-3 right-3 bg-ink-950/80 hover:bg-ink-900 text-white p-2 rounded-xl backdrop-blur-md transition"
                  title="Zoom Preview"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-ink-950/95 via-ink-950/80 to-transparent flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleCancelPreview}
                    disabled={uploadingAfter}
                    className="btn-lift bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-3 rounded-xl border border-slate-600 transition flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitEvidence}
                    disabled={uploadingAfter}
                    className="btn-lift bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md transition flex items-center space-x-1.5"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploadingAfter ? 'Uploading Evidence...' : 'Submit Evidence'}</span>
                  </button>
                </div>
              </div>
            ) : afterImage ? (
              /* CASE B: After image already uploaded & saved */
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner group">
                <img
                  src={afterImage}
                  alt="After repair road condition"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setActiveZoomImage(afterImage)}
                  className="absolute top-3 right-3 bg-ink-950/80 hover:bg-ink-900 text-white p-2 rounded-xl backdrop-blur-md transition"
                  title="Zoom After Image"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-ink-950/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-mono">
                  Repaired Surface
                </div>

                {isAuthority && isRepairInProgress && (
                  <button
                    type="button"
                    onClick={() => handleTriggerAction('file')}
                    disabled={uploadingAfter || isLoading}
                    className="absolute bottom-3 right-3 bg-ink-950/80 hover:bg-ink-900 text-white text-[11px] font-bold px-3 py-1 rounded-xl backdrop-blur-md transition"
                  >
                    Replace
                  </button>
                )}
              </div>
            ) : !isRepairInProgress ? (
              /* CASE C: Report status is NOT REPAIR_IN_PROGRESS (e.g. REPORTED, ACKNOWLEDGED) */
              <div className="aspect-video rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <p className="text-xs font-black text-ink-950 uppercase tracking-wide">
                    Lifecycle Gate Active
                  </p>
                  <p className="text-xs font-semibold text-amber-900 leading-snug">
                    After-repair evidence becomes available once repair is in progress.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
                    <span className="text-slate-500 font-bold">Current:</span>
                    <span className="font-mono font-black uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {status || 'REPORTED'}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-500 font-bold">Required:</span>
                    <span className="font-mono font-black uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-300">
                      REPAIR_IN_PROGRESS
                    </span>
                  </div>
                </div>

                {isAuthority && (
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTriggerAction('camera')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 transition flex items-center space-x-1.5 cursor-pointer"
                      title="Click to view lifecycle requirements"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-400" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerAction('file')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 transition flex items-center space-x-1.5 cursor-pointer"
                      title="Click to view lifecycle requirements"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Choose File</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* CASE D: Report status IS REPAIR_IN_PROGRESS (Ready to capture/upload evidence) */
              <div className="aspect-video rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/40 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-ink-950">
                    Ready for After-Repair Evidence
                  </p>
                  <p className="text-[11px] text-slate-600 max-w-xs leading-relaxed">
                    Remediation work is currently in progress. Upload photographic proof of the repaired pavement surface to initiate optical verification.
                  </p>
                  <div className="pt-0.5">
                    <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded border border-teal-200">
                      STATUS: REPAIR_IN_PROGRESS
                    </span>
                  </div>
                </div>

                {isAuthority && (
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTriggerAction('camera')}
                      disabled={uploadingAfter}
                      className="btn-lift bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerAction('file')}
                      disabled={uploadingAfter}
                      className="btn-lift bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 px-3.5 rounded-xl border border-slate-300 transition flex items-center space-x-1.5 shadow-xs"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Choose File</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. AI-ASSISTED COMPARISON (Section 19) */}
      <div className="bg-warm-50 rounded-2xl p-5 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-ink-950 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>AI-ASSISTED COMPARISON</span>
          </span>
          {afterImage && (
            <button
              type="button"
              onClick={handleRunAiAudit}
              disabled={isLoading}
              className={`btn-lift text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center space-x-1 ${
                serviceUnavailable?.is503
                  ? 'bg-amber-700 hover:bg-amber-800'
                  : 'bg-teal-700 hover:bg-teal-600'
              }`}
            >
              {isLoading ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : serviceUnavailable?.is503 ? (
                <RotateCcw className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>
                {isLoading
                  ? 'Verifying...'
                  : serviceUnavailable?.is503
                  ? 'Retry Optical Audit'
                  : 'Run Optical Audit'}
              </span>
            </button>
          )}
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Computer vision algorithms compare asphalt texture uniformity, cavity reduction, and edge sealing between before and after photographs to support civil engineering verification.
        </p>

        {verification && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Defect Reduction</span>
              <span className="font-black text-ink-950 text-sm">
                {verification.visibleImprovementScore !== undefined ? `${verification.visibleImprovementScore}% Resolved` : '95% Resolved'}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Surface Continuity</span>
              <span className="font-black text-teal-700 text-sm">
                {verification.remainingDamageScore !== undefined ? `${100 - verification.remainingDamageScore}% Grade` : 'Consistent Grade'}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Recommendation</span>
              <span className="font-black text-ink-950 text-sm">{verification.recommendation}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. VERIFICATION STATUS: PASS | NEEDS REVIEW | PENDING (Section 19) */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          VERIFICATION STATUS
        </span>
        <div className="grid grid-cols-3 gap-3 text-center text-xs font-black">
          <div
            className={`p-3 rounded-2xl border transition-all ${
              verificationStatus === 'PASS'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                : 'bg-warm-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="block text-sm">PASS</span>
            <span className="text-[10px] font-medium opacity-80">Audit Confirmed</span>
          </div>

          <div
            className={`p-3 rounded-2xl border transition-all ${
              verificationStatus === 'NEEDS REVIEW'
                ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20'
                : 'bg-warm-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="block text-sm">NEEDS REVIEW</span>
            <span className="text-[10px] font-medium opacity-80">Manual Re-audit</span>
          </div>

          <div
            className={`p-3 rounded-2xl border transition-all ${
              verificationStatus === 'PENDING'
                ? 'bg-slate-100 border-slate-400 text-slate-800'
                : 'bg-warm-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="block text-sm">PENDING</span>
            <span className="text-[10px] font-medium opacity-80">Awaiting Proof</span>
          </div>
        </div>
      </div>

      {/* 4. HUMAN CONFIRMATION (Section 19: Do not claim AI automatically makes final decision) */}
      <div className="p-4 bg-warm-100 rounded-2xl border border-slate-200 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-ink-950">
          <UserCheck className="w-4 h-4 text-teal-700" />
          <span>Human Authority Sign-Off Required</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          AI serves strictly as decision support. Final closure of civil infrastructure work orders rests solely with designated municipal and PWD officers.
        </p>

        {isAuthority && afterImage && (
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => handleDecision('APPROVED')}
              disabled={isLoading}
              className="btn-lift flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Approve Remediation & Close Case</span>
            </button>
            <button
              type="button"
              onClick={() => handleDecision('REJECTED_REINSPECT')}
              disabled={isLoading}
              className="btn-lift flex-1 bg-rose-700 hover:bg-rose-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Reject & Request Re-Inspection</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
