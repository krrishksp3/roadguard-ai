import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { offlineSync, OfflineDraftReport } from '../services/offlineSync';
import { ReportsMap } from '../components/map/ReportsMap';
import { RoadPhotoUpload } from '../components/upload/RoadPhotoUpload';
import { MapPin, Sparkles, ArrowRight, Navigation, Building2, CheckCircle2, ShieldAlert, WifiOff, RefreshCw } from 'lucide-react';

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
    name: 'Potholes on Road (Assam, India)',
    url: '/demo-evidence/potholes-on-road.jpg',
    filename: 'potholes-on-road.jpg',
    desc: '[SYNTHETIC DEMO] Deep depression and road pothole cavity exceeding 18cm right on vehicular lane near Jail Chungi crossing, Meerut.',
    type: 'pothole',
    license: 'CC BY-SA 4.0',
    author: 'KEmel49',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Potholes_on_road.jpg',
    originalLocation: 'Assam, India',
  },
  {
    name: 'Potholes in Bengaluru Road',
    url: '/demo-evidence/potholes-bengaluru-road.jpg',
    filename: 'potholes-bengaluru-road.jpg',
    desc: '[SYNTHETIC DEMO] Multiple pavement potholes and surface disintegration creating two-wheeler hazard near Delhi Road, Meerut.',
    type: 'pothole',
    license: 'CC0 1.0 Universal',
    author: 'Mallikarjunasj',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Potholes_in_Bengaluru_road.jpg',
    originalLocation: 'Bengaluru, Karnataka, India',
  },
  {
    name: 'Waterlogged Pothole Hazard',
    url: '/demo-evidence/waterlogged-pothole.jpg',
    filename: 'waterlogged-pothole.jpg',
    desc: '[SYNTHETIC DEMO] Submerged road cavity and extensive storm waterlogging concealing road rupture near Surajkund Road, Meerut.',
    type: 'waterlogging',
    license: 'CC BY-SA 4.0',
    author: 'Joshuamanboah',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:A_Pothole_on_road_with_water.jpg',
    originalLocation: 'Wikimedia Commons Upload',
  },
  {
    name: 'Large Road Pothole / Fracture',
    url: '/demo-evidence/large-road-pothole.jpg',
    filename: 'large-road-pothole.jpg',
    desc: '[SYNTHETIC DEMO] Deep longitudinal pavement fracture and asphalt cavity along heavy-traffic wheelpath near Baghpat Bypass, Meerut.',
    type: 'crack',
    license: 'CC BY-SA 4.0',
    author: 'Antorsu10',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Road_pothole.jpg',
    originalLocation: 'Wikimedia Commons Upload',
  },
  {
    name: 'Driving Through Potholes / Edge Breakdown',
    url: '/demo-evidence/driving-through-potholes.jpg',
    filename: 'driving-through-potholes.jpg',
    desc: '[SYNTHETIC DEMO] Collapsed road edge and washed-out subbase causing hazardous shoulder dropoff near Garh Road, Meerut.',
    type: 'road_edge_damage',
    license: 'CC BY-SA 4.0',
    author: 'KEmel49',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Driving_through_potholes.jpg',
    originalLocation: 'Assam, India',
  },
];

export const CreateReportPage: React.FC = () => {
  const navigate = useNavigate();

  // Photo Evidence state
  const [selectedPreset, setSelectedPreset] = useState<DemoPreset | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFilename, setImageFilename] = useState<string>('');
  const [imageFileSize, setImageFileSize] = useState<number | undefined>(undefined);
  const [evidenceSource, setEvidenceSource] = useState<'USER_UPLOADED' | 'LICENSED_EXTERNAL' | 'DEMO_SYNTHETIC'>('USER_UPLOADED');

  // Form details
  const [description, setDescription] = useState<string>('');
  const [damageTypeHint, setDamageTypeHint] = useState<string>('pothole');

  // Location state
  const [location, setLocation] = useState<[number, number]>([28.9835, 77.7425]); // Default Jail Chungi Road, Meerut
  const [detectedRoad, setDetectedRoad] = useState<string>('Jail Chungi Road, Meerut');
  const [detectedDepartment, setDetectedDepartment] = useState<string>('Public Works Department (UP PWD Meerut)');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'success' | 'denied'>('idle');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitStep, setSubmitStep] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [savedOfflineDraft, setSavedOfflineDraft] = useState<OfflineDraftReport | null>(null);

  // Auto-resolve jurisdiction whenever location pin moves
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

  // Handle GPS location request
  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }

    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setLocation(coords);
        setGpsAccuracy(Math.round(pos.coords.accuracy || 15));
        setGpsStatus('success');
      },
      () => {
        setGpsStatus('denied');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Attempt GPS on initial mount
  useEffect(() => {
    requestGpsLocation();
  }, []);

  // Map pin drag/click
  const handleMapSelect = (lat: number, lng: number) => {
    setLocation([lat, lng]);
  };

  // Quick preset selection
  const handleSelectPreset = (preset: DemoPreset) => {
    setSelectedPreset(preset);
    setSelectedFile(null);
    setImageUrl(preset.url);
    setImageFilename(preset.filename);
    setImageFileSize(undefined);
    setEvidenceSource('LICENSED_EXTERNAL');
    setDescription(preset.desc);
    setDamageTypeHint(preset.type);
    setError('');
  };

  // Photo upload handler
  const handlePhotoSelect = (file: File, previewUrl: string) => {
    setSelectedPreset(null);
    setSelectedFile(file);
    setImageUrl(previewUrl);
    setImageFilename(file.name);
    setImageFileSize(file.size);
    setEvidenceSource('USER_UPLOADED');
    setError('');
  };

  const handlePhotoClear = () => {
    setSelectedPreset(null);
    setSelectedFile(null);
    setImageUrl('');
    setImageFilename('');
    setImageFileSize(undefined);
    setEvidenceSource('USER_UPLOADED');
  };

  // Save as offline pending sync draft
  const handleSaveOffline = async () => {
    setSubmitStep('Saving report locally on device (Offline Mode)...');
    try {
      let base64Data: string | undefined = undefined;
      if (selectedFile) {
        base64Data = await fileToBase64(selectedFile);
      } else if (imageUrl.startsWith('data:')) {
        base64Data = imageUrl;
      }

      const clientDraftId = generateClientId();
      const draft: OfflineDraftReport = {
        id: clientDraftId,
        imageUrl: imageUrl,
        photoBase64: base64Data,
        evidenceSource,
        imageFilename: imageFilename || 'road_hazard.jpg',
        imageMimeType: selectedFile?.type || 'image/jpeg',
        latitude: location[0],
        longitude: location[1],
        address: `${detectedRoad}, Meerut, Uttar Pradesh`,
        description: description.trim(),
        damageTypeHint,
        createdAt: new Date().toISOString(),
        status: 'PENDING_SYNC',
        syncAttempts: 0,
      };

      await offlineSync.saveOfflineReport(draft);
      setSavedOfflineDraft(draft);
      setSubmitting(false);
      setSubmitStep('');
    } catch (saveErr: any) {
      setError(`Failed to save offline draft: ${saveErr.message}`);
      setSubmitting(false);
      setSubmitStep('');
    }
  };

  // Submit report workflow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl) {
      setError('Please capture or select a photo of the road issue.');
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setError('Please provide a brief description of the road problem (minimum 5 characters).');
      return;
    }

    setSubmitting(true);
    setError('');

    // If currently offline, immediately save locally without attempting failing network call
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await handleSaveOffline();
      return;
    }

    try {
      let finalImageUrl = imageUrl;

      // If user uploaded a local file, upload it first to storage endpoint
      if (selectedFile) {
        setSubmitStep('Uploading high-resolution road evidence...');
        const uploadResult = await api.uploadImage(selectedFile);
        finalImageUrl = uploadResult.url;
      }

      setSubmitStep('AI optical analysis & jurisdiction routing...');
      const newReport = await api.createReport({
        imageUrl: finalImageUrl,
        evidenceSource,
        evidenceSourceMetadata:
          evidenceSource === 'LICENSED_EXTERNAL' || evidenceSource === 'DEMO_SYNTHETIC'
            ? JSON.stringify({
                title: selectedPreset?.name || 'Road Distress Demonstration Photo',
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
        description: description.trim(),
        damageTypeHint,
      });

      // Navigate directly to live complaint lifecycle view
      navigate(`/reports/${newReport.id}`);
    } catch (err: any) {
      // If network failed during submission, save offline automatically so work is not lost!
      console.warn('Network submission failed, falling back to offline draft:', err);
      await handleSaveOffline();
    }
  };

  if (savedOfflineDraft) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <WifiOff className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 bg-amber-100/70 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <span>Pending Sync</span>
              <span>•</span>
              <span>Saved Locally</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-slate-900">
              Report Queued for Synchronization
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              You are currently offline or experiencing weak connectivity. Your evidence photo and GPS coordinates have been safely stored on your device.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Draft ID:</span>
              <span className="font-mono font-semibold text-slate-800">{savedOfflineDraft.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Location:</span>
              <span className="font-medium text-slate-800 truncate max-w-[240px]">{savedOfflineDraft.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hazard Type:</span>
              <span className="font-bold text-slate-800 capitalize">{savedOfflineDraft.damageTypeHint}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sync Behavior:</span>
              <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                <RefreshCw className="w-3 h-3" />
                <span>Auto-sync when internet reconnects</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/my-reports"
              className="w-full sm:w-auto bg-gov-700 hover:bg-gov-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition shadow-md flex items-center justify-center space-x-2"
            >
              <span>View My Reports</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                setSavedOfflineDraft(null);
                handlePhotoClear();
                setDescription('');
              }}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition"
            >
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center space-x-2 bg-gov-50 border border-gov-200 px-3 py-1 rounded-full text-xs font-semibold text-gov-800 mb-2">
          <span>Citizen Redressal Portal</span>
          <span>•</span>
          <span>Meerut District</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
          Report a Road Safety Issue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Upload photo evidence and pin the location. RoadGuard AI analyzes distress severity, starts the SLA clock, and notifies responsible engineers.
        </p>
      </div>

      {/* Global Error Notice */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center space-x-2 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></div>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Capture Road Photo */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-lg bg-gov-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                1
              </div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">Step 1 — Capture Road Photo</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Real Evidence Only</span>
          </div>

          {/* Demonstration Presets Bar (for Judges / Evaluation) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Quick Demonstration Presets (SIH Prototype):</span>
              </span>
              <span className="text-[10px] text-slate-400">Labeled DEMO EVIDENCE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {demoPresets.map((preset, i) => {
                const isSelected = imageUrl === preset.url;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2 rounded-xl text-left border transition text-xs flex items-center space-x-2.5 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-200'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate text-[11px] text-slate-900">{preset.name}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-semibold font-mono">
                          {preset.license}
                        </span>
                        <span className="text-[9px] text-slate-400 truncate">Wikimedia</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attribution Box if Real Licensed Preset is Active */}
          {selectedPreset && (
            <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between text-amber-900 font-bold">
                <span className="flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  <span>Licensed External Photograph Selected</span>
                </span>
                <span className="font-mono text-[10px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-900 font-semibold">
                  {selectedPreset.license}
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                Source: <strong>{selectedPreset.name}</strong> by {selectedPreset.author} via{' '}
                <a
                  href={selectedPreset.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-amber-950"
                >
                  Wikimedia Commons
                </a>{' '}
                ({selectedPreset.originalLocation}).
              </p>
              <p className="text-[10px] text-amber-700 italic">
                Synthetic Demo Record: Real road photograph used under reusable license for demonstration. Not captured in Meerut.
              </p>
            </div>
          )}

          {/* Unified Photo Upload Component */}
          <RoadPhotoUpload
            currentImageUrl={imageUrl}
            currentFilename={imageFilename}
            currentFileSize={imageFileSize}
            evidenceSource={evidenceSource}
            onFileSelect={handlePhotoSelect}
            onClear={handlePhotoClear}
            disabled={submitting}
            label="Upload Real Road Photo"
            subtitle="Take a live photo on site or select from device gallery. JPG, PNG, WebP supported."
          />
        </div>

        {/* STEP 2: Location */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-lg bg-gov-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                2
              </div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">Step 2 — Road Location & Geo-Tag</h2>
            </div>

            {/* Locate Me Button */}
            <button
              type="button"
              onClick={requestGpsLocation}
              disabled={gpsStatus === 'locating'}
              className="text-xs px-3 py-1.5 rounded-xl bg-gov-50 hover:bg-gov-100 text-gov-800 border border-gov-200 font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 text-gov-700 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
              <span>{gpsStatus === 'locating' ? 'Locating...' : 'Use My GPS'}</span>
            </button>
          </div>

          {/* GPS Status Message if denied or unavailable */}
          {gpsStatus === 'denied' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                GPS permission was not granted or timed out. You can click or tap anywhere on the map below to drop the incident pin manually on the correct road.
              </span>
            </div>
          )}

          {gpsStatus === 'success' && gpsAccuracy && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Device GPS locked accurately (±{gpsAccuracy}m). Click map to refine exact pin spot if needed.</span>
            </div>
          )}

          {/* Interactive Leaflet Pin Drop Map */}
          <div className="space-y-3">
            <div className="h-64 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              <ReportsMap
                selectedLocation={location}
                onLocationSelect={handleMapSelect}
                center={location}
                zoom={14}
                height="100%"
              />
            </div>

            {/* Dynamic Telemetry & Jurisdiction Resolution Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-slate-700">
                <MapPin className="w-4 h-4 text-gov-700 shrink-0" />
                <span className="truncate">
                  Lat: {location[0].toFixed(5)}, Lng: {location[1].toFixed(5)}
                </span>
              </div>

              <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800">
                <Building2 className="w-4 h-4 text-gov-700 shrink-0" />
                <span className="truncate">
                  <strong className="text-slate-900">{detectedRoad}</strong> ({detectedDepartment})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: Describe Problem */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-lg bg-gov-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                3
              </div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">Step 3 — Describe the Problem</h2>
            </div>
            <span className="text-[11px] text-slate-400">Plain citizen description</span>
          </div>

          {/* Quick Issue Type Selector Tags */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'pothole', label: '🕳 Pothole' },
              { id: 'waterlogging', label: '🌊 Waterlogging' },
              { id: 'crack', label: '⚡ Surface Cracking' },
              { id: 'road_edge_damage', label: '🚧 Edge Drop-off' },
              { id: 'drainage_damage', label: '🚰 Drainage / Manhole' },
            ].map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setDamageTypeHint(tag.id)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition ${
                  damageTypeHint === tag.id
                    ? 'bg-gov-700 text-white border-gov-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what is wrong with the road (e.g. Deep pothole near junction causing two-wheelers to swerve and skid, exposed stones...)"
            className="w-full p-3.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-700 focus:border-transparent transition"
          />
        </div>

        {/* STEP 4: Submit Report */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-lg bg-gov-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              4
            </div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">Step 4 — Submit Road Report</h2>
          </div>

          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start space-x-3 text-xs text-indigo-950">
            <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-bold">Automated Road Action Pipeline:</p>
              <p className="text-indigo-900/80 leading-relaxed">
                Upon submission, RoadGuard AI checks image optical quality, assesses damage risk, maps the responsible division ({detectedDepartment}), and activates the transparent SLA countdown clock.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-gov-700 to-gov-800 hover:from-gov-800 hover:to-gov-900 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 text-base disabled:opacity-50"
          >
            <span>{submitting ? submitStep || 'Analyzing & Registering Complaint...' : 'Submit Road Report'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
