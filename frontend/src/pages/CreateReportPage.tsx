import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { offlineSync, OfflineDraftReport } from '../services/offlineSync';
import { ReportsMap } from '../components/map/ReportsMap';
import { useLanguage } from '../i18n/LanguageContext';
import {
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Navigation,
  Building2,
  CheckCircle2,
  ShieldAlert,
  WifiOff,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  AlertCircle,
  Droplets,
  Layers,
  AlertTriangle,
  HelpCircle,
  Activity,
  Check,
  Clock,
  ChevronRight,
  Trash2,
  ZoomIn,
  X,
  FileCheck,
  Eye,
} from 'lucide-react';

interface DemoPreset {
  name: string;
  url: string;
  filename: string;
  desc: string;
  type: string;
  license: string;
  author: string;
  sourceUrl: string;
  originalLocation: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const generateClientId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'draft_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
};

const demoPresets: DemoPreset[] = [
  {
    name: 'Pothole Cavity',
    url: '/demo-evidence/pothole-reference.jpg',
    filename: 'pothole-reference.jpg',
    desc: 'Deep road cavity and depression right on vehicular lane near Jail Chungi, Meerut.',
    type: 'pothole',
    license: 'LICENSED_REFERENCE',
    author: 'Contributed Photo Evidence',
    sourceUrl: 'UPLOADED_REFERENCE_EVIDENCE',
    originalLocation: 'Reference Road Dataset',
  },
  {
    name: 'Pothole Cluster',
    url: '/demo-evidence/severe-damage-reference.jpg',
    filename: 'severe-damage-reference.jpg',
    desc: 'Multiple pavement potholes creating two-wheeler hazard near Delhi Road, Meerut.',
    type: 'pothole',
    license: 'LICENSED_REFERENCE',
    author: 'Contributed Photo Evidence',
    sourceUrl: 'UPLOADED_REFERENCE_EVIDENCE',
    originalLocation: 'Reference Road Dataset',
  },
  {
    name: 'Waterlogging Hazard',
    url: '/demo-evidence/waterlogging-reference.jpg',
    filename: 'waterlogging-reference.jpg',
    desc: 'Storm waterlogging concealing road pavement rupture near Surajkund Road, Meerut.',
    type: 'waterlogging',
    license: 'LICENSED_REFERENCE',
    author: 'Contributed Photo Evidence',
    sourceUrl: 'UPLOADED_REFERENCE_EVIDENCE',
    originalLocation: 'Reference Road Dataset',
  },
  {
    name: 'Surface Cracking',
    url: '/demo-evidence/surface-deterioration-reference.jpg',
    filename: 'surface-deterioration-reference.jpg',
    desc: 'Coarse asphalt cracking and surface stripping along wheelpath near Baghpat Bypass, Meerut.',
    type: 'surface_deterioration',
    license: 'LICENSED_REFERENCE',
    author: 'Contributed Photo Evidence',
    sourceUrl: 'UPLOADED_REFERENCE_EVIDENCE',
    originalLocation: 'Reference Road Dataset',
  },
  {
    name: 'Road Edge Damage',
    url: '/demo-evidence/road-edge-reference.jpg',
    filename: 'road-edge-reference.jpg',
    desc: 'Washed-out road edge and hazardous shoulder dropoff near Garh Road, Meerut.',
    type: 'road_edge_damage',
    license: 'LICENSED_REFERENCE',
    author: 'Contributed Photo Evidence',
    sourceUrl: 'UPLOADED_REFERENCE_EVIDENCE',
    originalLocation: 'Reference Road Dataset',
  },
];

const defectCategories = [
  {
    id: 'pothole',
    label: 'Pothole',
    icon: AlertCircle,
  },
  {
    id: 'road_crack',
    label: 'Road Crack',
    icon: Activity,
  },
  {
    id: 'surface_deterioration',
    label: 'Damaged Surface',
    icon: Layers,
  },
  {
    id: 'waterlogging',
    label: 'Waterlogging',
    icon: Droplets,
  },
  {
    id: 'road_obstruction',
    label: 'Road Obstruction',
    icon: AlertTriangle,
  },
  {
    id: 'other',
    label: 'Other',
    icon: HelpCircle,
  },
];

export const CreateReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dict, language, getDamageTypeLabel, getSeverityLabel } = useLanguage();

  // Wizard Step: 1 = ISSUE, 2 = PHOTO, 3 = LOCATION, 4 = SUBMIT (REVIEW)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Issue
  const [selectedCategory, setSelectedCategory] = useState<string>('pothole');

  // Step 2: Photo
  const [selectedPreset, setSelectedPreset] = useState<DemoPreset | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFilename, setImageFilename] = useState<string>('');
  const [imageFileSize, setImageFileSize] = useState<number | undefined>(undefined);
  const [evidenceSource, setEvidenceSource] = useState<'USER_UPLOADED' | 'LICENSED_EXTERNAL' | 'DEMO_SYNTHETIC'>('USER_UPLOADED');
  const [isPhotoZoomed, setIsPhotoZoomed] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Step 3: Location
  const [location, setLocation] = useState<[number, number]>([28.9835, 77.7425]); // Meerut default
  const [detectedRoad, setDetectedRoad] = useState<string>('Jail Chungi Road, Meerut');
  const [detectedDepartment, setDetectedDepartment] = useState<string>('Public Works Department (UP PWD Meerut)');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'success' | 'denied'>('idle');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isManualLocationMode, setIsManualLocationMode] = useState<boolean>(false);

  // Step 4: Review & Description
  const [description, setDescription] = useState<string>('');

  // Submission & Processing state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionStage, setSubmissionStage] = useState<number>(0);
  const [submittedReport, setSubmittedReport] = useState<any | null>(null);
  const [error, setError] = useState<string>('');
  const [savedOfflineDraft, setSavedOfflineDraft] = useState<OfflineDraftReport | null>(null);
  const [cancelledReport, setCancelledReport] = useState<any | null>(null);

  // Auto-resolve road name and jurisdiction
  const fetchJurisdiction = useCallback(async (lat: number, lng: number) => {
    try {
      const info = await api.resolveJurisdiction(lat, lng);
      if (info.roadSegmentName) setDetectedRoad(info.roadSegmentName);
      if (info.departmentName) setDetectedDepartment(info.departmentName);
    } catch {
      // Keep sensible default
    }
  }, []);

  useEffect(() => {
    fetchJurisdiction(location[0], location[1]);
  }, [location, fetchJurisdiction]);

  // GPS Location Request
  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }

    if (gpsStatus === 'locating') return;
    setGpsStatus('locating');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setLocation(coords);
        setGpsAccuracy(Math.round(pos.coords.accuracy || 10));
        setGpsStatus('success');
      },
      (err) => {
        console.warn('High accuracy GPS timed out, falling back to standard accuracy:', err);
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => {
            const coords: [number, number] = [fallbackPos.coords.latitude, fallbackPos.coords.longitude];
            setLocation(coords);
            setGpsAccuracy(Math.round(fallbackPos.coords.accuracy || 45));
            setGpsStatus('success');
          },
          () => {
            setGpsStatus('denied');
          },
          { timeout: 5000, enableHighAccuracy: false, maximumAge: 60000 }
        );
      },
      { timeout: 5000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    requestGpsLocation();
  }, []);

  const handleMapSelect = (lat: number, lng: number) => {
    setLocation([lat, lng]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setSelectedPreset(null);
    setSelectedFile(file);
    setImageUrl(previewUrl);
    setImageFilename(file.name);
    setImageFileSize(file.size);
    setEvidenceSource('USER_UPLOADED');
    setError('');
  };

  const handleSelectPreset = (preset: DemoPreset) => {
    setSelectedPreset(preset);
    setSelectedFile(null);
    setImageUrl(preset.url);
    setImageFilename(preset.filename);
    setImageFileSize(undefined);
    setEvidenceSource('LICENSED_EXTERNAL');
    setDescription(preset.desc);
    setSelectedCategory(preset.type === 'road_edge_damage' ? 'other' : preset.type);
    setError('');
  };

  const handlePhotoRemove = () => {
    setSelectedPreset(null);
    setSelectedFile(null);
    setImageUrl('');
    setImageFilename('');
    setImageFileSize(undefined);
    setEvidenceSource('USER_UPLOADED');
  };

  const handleSaveOffline = async () => {
    try {
      let base64Data: string | undefined = undefined;
      if (selectedFile) {
        base64Data = await fileToBase64(selectedFile);
      } else if (imageUrl.startsWith('data:')) {
        base64Data = imageUrl;
      }

      const clientDraftId = generateClientId();
      const effectiveDescription =
        description.trim() ||
        `${defectCategories.find((c) => c.id === selectedCategory)?.label || 'Road hazard'} reported near ${detectedRoad}.`;

      const draft: OfflineDraftReport = {
        id: clientDraftId,
        userId: user?.id,
        imageUrl: imageUrl,
        photoBase64: base64Data,
        evidenceSource,
        imageFilename: imageFilename || 'road_hazard.jpg',
        imageMimeType: selectedFile?.type || 'image/jpeg',
        latitude: location[0],
        longitude: location[1],
        address: `${detectedRoad}, Meerut, Uttar Pradesh`,
        description: effectiveDescription,
        damageTypeHint: selectedCategory,
        createdAt: new Date().toISOString(),
        status: 'PENDING_SYNC',
        syncAttempts: 0,
      };

      await offlineSync.saveOfflineReport(draft);
      setSavedOfflineDraft(draft);
      setSubmitting(false);
      setSubmissionStage(0);
    } catch (saveErr: any) {
      setError(`Failed to save offline draft: ${saveErr.message}`);
      setSubmitting(false);
      setSubmissionStage(0);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!imageUrl) {
      setCurrentStep(2);
      setError(dict.createReport.validationPhotoRequired);
      return;
    }

    setSubmitting(true);
    setError('');
    setSubmissionStage(1); // 1: REPORT RECEIVED

    const categoryObj = defectCategories.find((c) => c.id === selectedCategory);
    const categoryLabel = categoryObj ? categoryObj.label : 'Road Hazard';
    const effectiveDescription =
      description.trim().length >= 3
        ? description.trim()
        : `${categoryLabel} reported near ${detectedRoad}.`;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await handleSaveOffline();
      return;
    }

    try {
      let finalImageUrl = imageUrl;

      if (selectedFile) {
        const uploadResult = await api.uploadImage(selectedFile);
        finalImageUrl = uploadResult.url;
      }

      // Stage 2: AI ANALYSIS
      setSubmissionStage(2);
      await new Promise((r) => setTimeout(r, 450));

      // Stage 3: PRIORITY
      setSubmissionStage(3);
      await new Promise((r) => setTimeout(r, 400));

      // Stage 4: AUTHORITY ROUTING
      setSubmissionStage(4);
      await new Promise((r) => setTimeout(r, 350));

      const newReport = await api.createReport({
        imageUrl: finalImageUrl,
        evidenceSource,
        evidenceSourceMetadata:
          evidenceSource === 'LICENSED_EXTERNAL' || evidenceSource === 'DEMO_SYNTHETIC'
            ? JSON.stringify({
                title: selectedPreset?.name || 'Road Distress Reference Photo',
                source: 'Wikimedia Commons',
                sourceUrl: selectedPreset?.sourceUrl || 'https://commons.wikimedia.org',
                license: selectedPreset?.license || 'CC BY-SA 4.0',
                author: selectedPreset?.author || 'Wikimedia Contributor',
                originalLocation: selectedPreset?.originalLocation || 'India',
                nature: 'LICENSED_EXTERNAL / SYNTHETIC DEMO EVIDENCE',
                note: 'Real photograph licensed under Creative Commons used as synthetic reference evidence for SIH 2026 hackathon demonstration. NOT captured in Meerut.',
                isSyntheticDemo: true,
              })
            : undefined,
        imageFilename: imageFilename || undefined,
        latitude: location[0],
        longitude: location[1],
        address: `${detectedRoad}, Meerut, Uttar Pradesh`,
        description: effectiveDescription,
        damageTypeHint: selectedCategory,
      });

      if (newReport.status === 'CANCELLED' || (newReport as any).validRoadDamage === false) {
        setCancelledReport(newReport);
        setSubmitting(false);
        setSubmissionStage(0);
        return;
      }

      setSubmittedReport(newReport);
      setSubmitting(false);
    } catch (err: any) {
      const isNetworkError =
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')));

      if (isNetworkError) {
        console.warn('Network submission failed, saving offline draft:', err);
        await handleSaveOffline();
      } else {
        setError(err.message || 'Failed to submit road report. Please check details and try again.');
        setSubmitting(false);
        setSubmissionStage(0);
      }
    }
  };

  // SUCCESS SCREEN (Section: Success Screen & AI Assessment)
  if (submittedReport) {
    const ai = submittedReport.aiAnalysis;
    const priority = submittedReport.riskScore;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-9 border border-slate-200/90 shadow-float space-y-7 text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Check Circle Icon */}
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-subtle">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          {/* Header */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 bg-teal-50 text-teal-800 border border-teal-200 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <span>✓ {language === 'hi' ? 'रिपोर्ट दर्ज' : 'REPORT SUBMITTED'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-ink-950">
              {dict.createReport.reportSuccessTitle}
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {dict.createReport.reportSuccessDesc}
            </p>
          </div>

          {/* Report ID Badge */}
          <div className="p-4 bg-warm-100 rounded-2xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{dict.myReports.reportId}</span>
            <span className="font-mono text-base sm:text-lg font-black text-ink-950 bg-white px-3.5 py-1 rounded-xl border border-slate-200 shadow-xs">
              {submittedReport.id.startsWith('RG-')
                ? submittedReport.id
                : `RG-${submittedReport.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`}
            </span>
          </div>

          {/* Lifecycle Progression (Required Sequence) */}
          <div className="space-y-2 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              {language === 'hi' ? 'शिकायत समाधान प्रक्रिया' : 'REPORT RESOLUTION LIFECYCLE'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px] font-extrabold">
              <div className="p-2.5 rounded-xl bg-teal-700 text-white border border-teal-800 shadow-xs">
                <span>{language === 'hi' ? 'रिपोर्ट दर्ज ✓' : 'REPORT RECEIVED ✓'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-teal-700 text-white border border-teal-800 shadow-xs">
                <span>{language === 'hi' ? 'AI विश्लेषण ✓' : 'AI ANALYSIS ✓'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-teal-700 text-white border border-teal-800 shadow-xs">
                <span>{language === 'hi' ? 'प्राथमिकता ✓' : 'PRIORITY ✓'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-teal-700 text-white border border-teal-800 shadow-xs">
                <span>{language === 'hi' ? 'अधिकारी ✓' : 'AUTHORITY ✓'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-warm-100 text-slate-500 border border-slate-200">
                <span>{language === 'hi' ? 'कार्यवाही ○' : 'ACTION ○'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-warm-100 text-slate-500 border border-slate-200">
                <span>{language === 'hi' ? 'सत्यापन ○' : 'VERIFICATION ○'}</span>
              </div>
            </div>
          </div>

          {/* AI ASSESSMENT CARD (From Backend Response) */}
          {ai && (
            <div className="bg-warm-50 rounded-2xl p-5 border border-slate-200 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-ink-950 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>{dict.reportDetail.aiAnalysisCardTitle}</span>
                </span>
                <span className="text-[10px] font-bold bg-white text-teal-800 border border-slate-200 px-2 py-0.5 rounded-md">
                  {language === 'hi' ? 'AI-सहायित विश्लेषण' : 'AI-assisted assessment'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">{language === 'hi' ? 'समस्या' : 'Issue'}</span>
                  <span className="font-black text-ink-950 capitalize">{getDamageTypeLabel(ai.damageType || submittedReport.damageType)}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">{dict.common.severity}</span>
                  <span className="font-black text-ink-950 capitalize">{getSeverityLabel(ai.severity || submittedReport.severity)}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">{language === 'hi' ? 'सुरक्षा जोखिम' : 'Safety Risk'}</span>
                  <span className="font-black text-ink-950 capitalize">
                    {ai.roadSafetyRisk !== undefined
                      ? (ai.roadSafetyRisk >= 70 ? (language === 'hi' ? 'उच्च' : 'High') : ai.roadSafetyRisk >= 40 ? (language === 'hi' ? 'मध्यम' : 'Moderate') : (language === 'hi' ? 'कम' : 'Low'))
                      : (priority >= 70 ? (language === 'hi' ? 'उच्च' : 'High') : (language === 'hi' ? 'मध्यम' : 'Moderate'))}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">{dict.common.priority}</span>
                  <span className="font-black text-teal-700">{priority} / 100</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">{language === 'hi' ? 'समान शिकायत' : 'Duplicate'}</span>
                  <span className="font-black text-ink-950">{submittedReport.isDuplicate ? (language === 'hi' ? 'हाँ' : 'Yes') : (language === 'hi' ? 'नहीं' : 'No')}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                <span className="italic">{language === 'hi' ? 'अंतिम कार्यवाही अधिकृत निकाय द्वारा सत्यापित की जाती है।' : 'Final action is reviewed by the responsible authority.'}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to={`/reports/${submittedReport.id}`}
              className="btn-lift w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold px-8 py-3.5 rounded-xl text-xs sm:text-sm tracking-wide transition shadow-md shadow-teal-900/15 flex items-center justify-center space-x-2"
            >
              <span>{dict.createReport.viewMyReport}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setSubmittedReport(null);
                setImageUrl('');
                setSelectedFile(null);
                setSelectedPreset(null);
                setDescription('');
                setCurrentStep(1);
              }}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3.5 rounded-xl text-xs sm:text-sm border border-slate-200 transition"
            >
              {dict.createReport.reportAnother}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CANCELLED REPORT SCREEN (Intake validation rejection)
  if (cancelledReport) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-float space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <span>✕ {language === 'hi' ? 'प्रारंभिक सत्यापन समाप्त' : 'Intake Verification Stopped'}</span>
            </div>
            <h2 className="text-2xl font-black font-heading text-ink-950">
              {dict.reportDetail.noDamageTitle}
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              {dict.reportDetail.noDamageSubtitle}
            </p>
          </div>

          {/* Verification Status Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-left">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">{language === 'hi' ? 'साक्ष्य स्थिति' : 'Evidence Status'}</span>
              <span className="font-black text-rose-700 text-xs sm:text-sm">{language === 'hi' ? 'सत्यापित नहीं' : 'Not Verified'}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">{dict.common.riskScore}</span>
              <span className="font-black text-slate-900 text-xs sm:text-sm">0</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">{dict.common.priority}</span>
              <span className="font-black text-slate-900 text-xs sm:text-sm">{language === 'hi' ? 'कोई नहीं' : 'None'}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">{dict.common.assignedDepartment}</span>
              <span className="font-black text-slate-600 text-xs sm:text-sm">{language === 'hi' ? 'आवंटित नहीं' : 'Not Created'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setCancelledReport(null);
                setImageUrl('');
                setSelectedFile(null);
                setSelectedPreset(null);
                setCurrentStep(2);
              }}
              className="btn-lift flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition text-xs"
            >
              {language === 'hi' ? 'सड़क की फोटो दोबारा अपलोड करें' : 'Upload Road Photo Again'}
            </button>
            <Link
              to="/my-reports"
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition text-xs flex items-center justify-center space-x-1.5"
            >
              <span>{dict.myReports.title}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // OFFLINE SAVED DRAFT SCREEN
  if (savedOfflineDraft) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-float space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
            <WifiOff className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <span>Saved Locally • Pending Sync</span>
            </div>
            <h2 className="text-2xl font-black font-heading text-ink-950">
              Report Queued for Synchronization
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              You are currently offline. Your road evidence and GPS location are securely stored on your device.
            </p>
          </div>

          <div className="bg-warm-100 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Draft ID:</span>
              <span className="font-mono font-bold text-slate-900">{savedOfflineDraft.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Location:</span>
              <span className="font-medium text-slate-900 truncate max-w-[240px]">{savedOfflineDraft.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Auto-sync:</span>
              <span className="text-teal-700 font-bold flex items-center space-x-1">
                <RefreshCw className="w-3 h-3" />
                <span>Will sync when reconnected</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/my-reports"
              className="w-full sm:w-auto bg-teal-700 hover:bg-teal-600 text-white font-bold px-6 py-3 rounded-xl text-xs transition flex items-center justify-center space-x-2"
            >
              <span>View My Reports</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                setSavedOfflineDraft(null);
                handlePhotoRemove();
                setDescription('');
                setCurrentStep(1);
              }}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-xs transition"
            >
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // WIZARD PROGRESS BAR STEPS
  const steps = [
    { num: 1, label: language === 'hi' ? '01 समस्या' : '01 ISSUE' },
    { num: 2, label: language === 'hi' ? '02 फोटो' : '02 PHOTO' },
    { num: 3, label: language === 'hi' ? '03 स्थान' : '03 LOCATION' },
    { num: 4, label: language === 'hi' ? '04 जमा करें' : '04 SUBMIT' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-7 pb-24 sm:pb-12">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Photo Lightbox */}
      {isPhotoZoomed && imageUrl && (
        <div className="fixed inset-0 bg-ink-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsPhotoZoomed(false)}
              className="absolute top-4 right-4 bg-ink-900/80 text-white p-2 rounded-xl hover:bg-ink-800 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={imageUrl} alt="Inspection Preview" className="w-full h-auto max-h-[85vh] object-contain mx-auto" />
          </div>
        </div>
      )}

      {/* SUBMISSION PROCESSING STATE MODAL (Section: Submission Experience) */}
      {submitting && (
        <div className="fixed inset-0 bg-ink-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-7 sm:p-8 max-w-md w-full shadow-float border border-slate-200 text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black font-heading text-ink-950 uppercase tracking-tight">
                {dict.createReport.submittingReport}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'hi' ? 'कृपया प्रतीक्षा करें, आपकी रिपोर्ट दर्ज की जा रही है...' : 'Please wait while our intake workflow registers your evidence...'}
              </p>
            </div>

            {/* Required Submission Processing State */}
            <div className="space-y-2 text-left text-xs">
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between text-teal-900 font-bold">
                <span>{language === 'hi' ? 'रिपोर्ट प्राप्त' : 'REPORT RECEIVED'}</span>
                <span className="text-teal-700">✓</span>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  submissionStage >= 2
                    ? 'bg-teal-50 border-teal-200 text-teal-900 font-bold'
                    : 'bg-warm-50 border-slate-200 text-slate-400'
                }`}
              >
                <span>{language === 'hi' ? 'AI विश्लेषण' : 'AI ANALYSIS'}</span>
                <span>{submissionStage > 2 ? '✓' : (language === 'hi' ? 'विश्लेषण चालू...' : 'Processing...')}</span>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  submissionStage >= 3
                    ? 'bg-teal-50 border-teal-200 text-teal-900 font-bold'
                    : 'bg-warm-50 border-slate-200 text-slate-400'
                }`}
              >
                <span>{dict.common.priority}</span>
                <span>{submissionStage > 3 ? '✓' : (language === 'hi' ? 'गणना जारी...' : 'Calculating...')}</span>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  submissionStage >= 4
                    ? 'bg-teal-50 border-teal-200 text-teal-900 font-bold'
                    : 'bg-warm-50 border-slate-200 text-slate-400'
                }`}
              >
                <span>{language === 'hi' ? 'अधिकारी को प्रेषण' : 'AUTHORITY ROUTING'}</span>
                <span>{submissionStage >= 4 ? (language === 'hi' ? 'तैयार किया जा रहा है...' : 'Preparing...') : (language === 'hi' ? 'प्रतीक्षारत' : 'Waiting')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP PROGRESS INDICATOR (Connected Progress Line) */}
      <div className="space-y-3">
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-4 h-0.5 bg-teal-600 -translate-y-1/2 transition-all duration-300 z-0"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />

          <div className="relative z-10 flex items-center justify-between">
            {steps.map((s) => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (s.num < currentStep) setCurrentStep(s.num);
                  }}
                  className={`flex flex-col items-center group focus:outline-none ${
                    s.num < currentStep ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isDone
                        ? 'bg-teal-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-ink-950 text-white ring-4 ring-teal-500/20 shadow-xs'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    {isDone ? '✓' : s.num}
                  </div>
                  <span
                    className={`text-[10px] font-bold tracking-wider mt-1.5 uppercase ${
                      isCurrent ? 'text-teal-700 font-black' : isDone ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ================================================== */}
      {/* STEP 1 — SELECT ISSUE                             */}
      {/* ================================================== */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card space-y-6 animate-in fade-in duration-150">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
              {language === 'hi' ? 'चरण 1 / 4' : 'STEP 1 OF 4'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-ink-950">
              {dict.createReport.step1Title}
            </h1>
            <p className="text-xs text-slate-500">
              {dict.createReport.step1Desc}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {defectCategories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 btn-lift ${
                    isSelected
                      ? 'bg-teal-50/70 border-teal-600 ring-2 ring-teal-600/30 text-teal-950 shadow-subtle'
                      : 'bg-warm-50/60 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-teal-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-heading font-black text-sm block tracking-tight">
                      {getDamageTypeLabel(cat.id)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setError('');
                setCurrentStep(2);
              }}
              className="btn-lift w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm px-7 py-3.5 rounded-xl shadow-md shadow-teal-900/15 transition flex items-center justify-center space-x-2"
            >
              <span>{dict.common.next}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* STEP 2 — PHOTO                                    */}
      {/* ================================================== */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card space-y-6 animate-in fade-in duration-150">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
              {language === 'hi' ? 'चरण 2 / 4' : 'STEP 2 OF 4'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-ink-950">
              {dict.createReport.step2Title}
            </h1>
            <p className="text-xs text-slate-500">
              {dict.createReport.step2Desc}
            </p>
          </div>

          {/* Large Upload / Camera Area */}
          {!imageUrl ? (
            <div className="border-2 border-dashed border-slate-300 rounded-3xl p-6 sm:p-8 text-center bg-warm-50/50 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-teal-600 shadow-xs">
                <Camera className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-ink-950 text-sm">
                  {language === 'hi' ? 'सड़क की फोटो अपलोड करें' : 'Upload road defect photograph'}
                </h3>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  {dict.createReport.uploadInstructions}
                </p>
              </div>

              {/* Action Buttons: Take Photo & Upload Photo */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="btn-lift w-full sm:w-auto bg-teal-700 hover:bg-teal-600 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>{dict.createReport.takePhoto}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-lift w-full sm:w-auto bg-white hover:bg-slate-50 text-ink-950 font-extrabold text-xs px-5 py-3 rounded-xl border border-slate-300 transition flex items-center justify-center space-x-2"
                >
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  <span>{dict.createReport.choosePhoto}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Image Preview after selection with Replace & Remove */
            <div className="space-y-3">
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-inner">
                <img src={imageUrl} alt="Selected Road Issue Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setIsPhotoZoomed(true)}
                  className="absolute top-3 right-3 bg-ink-950/80 text-white p-2 rounded-xl hover:bg-ink-900 backdrop-blur-md transition"
                  title={language === 'hi' ? 'ज़ूम करें' : 'Inspect Fullscreen'}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-ink-950/80 backdrop-blur-md text-white px-3 py-1 rounded-xl text-[10px] font-mono">
                  {imageFilename || 'evidence_photo.jpg'}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-lift flex-1 bg-warm-100 hover:bg-slate-200 text-ink-950 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-200 transition text-center"
                >
                  {language === 'hi' ? 'फोटो बदलें' : 'Replace Photo'}
                </button>

                <button
                  type="button"
                  onClick={handlePhotoRemove}
                  className="btn-lift flex items-center justify-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-rose-200 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'हटाएं' : 'Remove'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Demo Reference Presets Row for SIH Evaluators */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {dict.createReport.orSelectPreset}
              </span>
              <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded">
                {language === 'hi' ? 'नमूना फोटो' : '1-Click Preset'}
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {demoPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${
                    selectedPreset?.name === preset.name
                      ? 'bg-ink-900 text-white border-ink-900 shadow-xs'
                      : 'bg-warm-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="btn-lift flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-ink-900 px-5 py-3.5 rounded-xl border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{dict.common.back}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!imageUrl) {
                  setError(dict.createReport.validationPhotoRequired);
                  return;
                }
                setError('');
                setCurrentStep(3);
              }}
              className="btn-lift flex-1 sm:flex-initial bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm px-7 py-3.5 rounded-xl shadow-md shadow-teal-900/15 transition flex items-center justify-center space-x-2"
            >
              <span>{dict.common.next}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* STEP 3 — LOCATION                                 */}
      {/* ================================================== */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card space-y-6 animate-in fade-in duration-150">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
              {language === 'hi' ? 'चरण 3 / 4' : 'STEP 3 OF 4'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-ink-950">
              {dict.createReport.step3Title}
            </h1>
            <p className="text-xs text-slate-500">
              {dict.createReport.step3Desc}
            </p>
          </div>

          {/* GPS Location Status & Details */}
          <div className="p-4 bg-warm-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wide text-ink-950">
                  {gpsStatus === 'success' ? (language === 'hi' ? 'GPS स्थान मिल गया' : 'GPS location detected') : (language === 'hi' ? 'नक्शे पर स्थान' : 'Location Pinpoint')}
                </span>
              </div>

              {gpsAccuracy && (
                <span className="text-[10px] font-mono font-bold bg-white text-teal-800 border border-slate-200 px-2 py-0.5 rounded-md">
                  {language === 'hi' ? 'सटीकता' : 'Accuracy'}: ±{gpsAccuracy}m
                </span>
              )}
            </div>

            {/* Display: Latitude, Longitude, Accuracy */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase">{dict.createReport.latitude}</span>
                <span className="font-bold text-ink-950">{location[0].toFixed(5)}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase">{dict.createReport.longitude}</span>
                <span className="font-bold text-ink-950">{location[1].toFixed(5)}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase">{dict.common.status}</span>
                <span className="font-bold text-teal-700 font-sans capitalize">
                  {gpsStatus === 'success' ? (language === 'hi' ? 'सक्रिय' : 'Active') : gpsStatus}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-0.5 pt-1">
              <span className="font-bold text-ink-950 block">{detectedRoad}</span>
              <span className="text-[11px] text-slate-400 block">
                {language === 'hi' ? 'जिम्मेदार विभाग:' : 'Responsible:'} {detectedDepartment}
              </span>
            </div>

            {/* Buttons: Use My Location & Change Location */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={requestGpsLocation}
                disabled={gpsStatus === 'locating'}
                className="btn-lift bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{gpsStatus === 'locating' ? dict.createReport.gpsDetecting : dict.createReport.detectGps}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManualLocationMode(!isManualLocationMode)}
                className="btn-lift bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl border border-slate-200 transition flex items-center space-x-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {isManualLocationMode
                    ? (language === 'hi' ? 'स्थान चुन लिया' : 'Done Pinning')
                    : (language === 'hi' ? 'स्थान बदलें (नक्शे पर टैप करें)' : 'Change Location (Tap Map)')}
                </span>
              </button>
            </div>
          </div>

          {/* Leaflet Map Preview */}
          <div className="h-64 sm:h-72 rounded-3xl overflow-hidden border border-slate-200 shadow-subtle">
            <ReportsMap
              center={location}
              zoom={14}
              height="100%"
              selectedLocation={location}
              onLocationSelect={handleMapSelect}
            />
          </div>

          {/* Navigation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="btn-lift flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-ink-900 px-5 py-3.5 rounded-xl border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{dict.common.back}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setError('');
                setCurrentStep(4);
              }}
              className="btn-lift flex-1 sm:flex-initial bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm px-7 py-3.5 rounded-xl shadow-md shadow-teal-900/15 transition flex items-center justify-center space-x-2"
            >
              <span>{dict.common.next}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* STEP 4 — REVIEW & SUBMIT                          */}
      {/* ================================================== */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card space-y-6 animate-in fade-in duration-150">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
              {language === 'hi' ? 'चरण 4 / 4' : 'STEP 4 OF 4'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-ink-950">
              {dict.createReport.step4Title}
            </h1>
            <p className="text-xs text-slate-500">
              {dict.createReport.step4Desc}
            </p>
          </div>

          {/* Compact Summary: Issue, Photo, Location */}
          <div className="bg-warm-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">
                  {language === 'hi' ? 'पहचानी गई समस्या' : 'Issue Detected'}
                </span>
                <span className="font-heading font-black text-base text-ink-950 capitalize">
                  {getDamageTypeLabel(selectedCategory)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-teal-700 hover:text-teal-800 font-bold text-xs"
              >
                {language === 'hi' ? 'बदलें' : 'Change'}
              </button>
            </div>

            {/* Photo Thumbnail */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center space-x-3">
                {imageUrl && (
                  <img src={imageUrl} alt="Thumbnail preview" className="w-16 h-12 rounded-xl object-cover border border-slate-200" />
                )}
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">{dict.common.evidence}</span>
                  <span className="font-bold text-ink-950 block truncate max-w-[200px]">
                    {imageFilename || (language === 'hi' ? 'चुनी गई फोटो' : 'Selected road photo')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-teal-700 hover:text-teal-800 font-bold text-xs"
              >
                {language === 'hi' ? 'बदलें' : 'Change'}
              </button>
            </div>

            {/* Location Summary */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{dict.common.location}</span>
                <span className="font-bold text-ink-950 block">{detectedRoad}</span>
                <span className="text-slate-500 text-[11px] font-mono">
                  {location[0].toFixed(5)}, {location[1].toFixed(5)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-teal-700 hover:text-teal-800 font-bold text-xs"
              >
                {language === 'hi' ? 'बदलें' : 'Change'}
              </button>
            </div>
          </div>

          {/* Optional Description: "Anything else we should know?" */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink-950">
              {dict.createReport.descriptionLabel} <span className="text-slate-400 font-normal">({language === 'hi' ? 'वैकल्पिक' : 'Optional'})</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={dict.createReport.descriptionPlaceholder}
              className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition"
            />
          </div>

          {/* Primary CTA: SUBMIT REPORT */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="btn-lift w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-ink-900 px-4 py-3 rounded-xl border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{dict.common.back}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="btn-lift w-full sm:flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm sm:text-base py-4 px-8 rounded-2xl shadow-lg shadow-teal-900/15 tracking-wider uppercase transition flex items-center justify-center space-x-2"
            >
              <span>{dict.createReport.submitReportBtn}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
