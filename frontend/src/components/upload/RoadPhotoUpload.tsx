import React, { useRef, useState, useCallback } from 'react';
import { Camera, Image as ImageIcon, UploadCloud, X, ZoomIn, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface RoadPhotoUploadProps {
  currentImageUrl?: string;
  currentFilename?: string;
  currentFileSize?: number;
  evidenceSource?: 'USER_UPLOADED' | 'LICENSED_EXTERNAL' | 'DEMO_SYNTHETIC';
  onFileSelect: (file: File, previewUrl: string) => void;
  onClear: () => void;
  disabled?: boolean;
  label?: string;
  subtitle?: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Client-side canvas downscaling for large phone camera photos (> 1.5MB)
 */
async function compressImageIfNeeded(file: File): Promise<File> {
  if (file.size <= 1.5 * 1024 * 1024 || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1920;
        let { width, height } = img;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file);
            } else {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const RoadPhotoUpload: React.FC<RoadPhotoUploadProps> = ({
  currentImageUrl,
  currentFilename,
  currentFileSize,
  evidenceSource = 'USER_UPLOADED',
  onFileSelect,
  onClear,
  disabled = false,
  label = 'Upload Road Photo',
  subtitle = 'Capture clear on-site photo showing pavement distress and surrounding road perspective.',
}) => {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);

  const validateAndProcessFile = async (file: File) => {
    setErrorMessage('');

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setErrorMessage('Unsupported file format. Please upload a JPG, PNG, or WebP photo.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`Photo exceeds 10MB limit (Selected size: ${formatBytes(file.size)}). Please choose a smaller image.`);
      return;
    }

    try {
      setIsCompressing(true);
      const processedFile = await compressImageIfNeeded(file);
      const previewUrl = URL.createObjectURL(processedFile);
      onFileSelect(processedFile, previewUrl);
    } catch {
      const previewUrl = URL.createObjectURL(file);
      onFileSelect(file, previewUrl);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
    e.target.value = '';
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
    e.target.value = '';
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  }, []);

  const isDemo = evidenceSource === 'DEMO_SYNTHETIC' || evidenceSource === 'LICENSED_EXTERNAL';

  return (
    <div className="space-y-3">
      {/* Hidden Native File Inputs */}
      {/* 1. Camera capture for mobile browsers */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        disabled={disabled}
        onChange={handleCameraChange}
      />
      {/* 2. Standard Gallery / File Picker */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={handleGalleryChange}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <label className="text-xs sm:text-sm font-bold text-slate-900 block">{label}</label>
          <p className="text-[11px] text-slate-500">{subtitle}</p>
        </div>
        <span className="text-[10px] text-slate-400 font-mono self-start sm:self-auto">JPG • PNG • WebP (Max 10MB)</span>
      </div>

      {/* Error alert if validation fails */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* When Photo is Selected: Show Clean Evidence Preview */}
      {currentImageUrl ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="relative aspect-video max-h-64 rounded-xl overflow-hidden bg-slate-900 shadow-inner group">
            <img
              src={currentImageUrl}
              alt="Road distress evidence"
              className="w-full h-full object-cover transition duration-200 group-hover:scale-[1.01]"
            />

            {/* Evidence Source Badge */}
            <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
              {isDemo ? (
                <div className="flex items-center space-x-1 bg-amber-500/90 backdrop-blur-md text-amber-950 font-bold px-2.5 py-1 rounded-lg text-[10px] tracking-wide border border-amber-300/40 shadow-sm">
                  <ShieldAlert className="w-3 h-3 text-amber-950" />
                  <span>LICENSED EXTERNAL DEMO EVIDENCE (CC)</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 bg-emerald-600/90 backdrop-blur-md text-white font-bold px-2.5 py-1 rounded-lg text-[10px] tracking-wide border border-emerald-400/40 shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                  <span>CITIZEN CAPTURED PHOTO</span>
                </div>
              )}
            </div>

            {/* Quick Zoom Button */}
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="absolute top-2.5 right-2.5 bg-slate-900/75 hover:bg-slate-900 text-white p-1.5 rounded-lg backdrop-blur-sm transition opacity-90 hover:opacity-100"
              title="Inspect Evidence Fullscreen"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Evidence Metadata & Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 px-1">
            <div className="flex items-center space-x-2 text-xs text-slate-700 min-w-0">
              <span className="font-semibold truncate max-w-[200px] sm:max-w-xs">
                {currentFilename || (isDemo ? 'potholes-on-road.jpg' : 'road_photo_evidence.jpg')}
              </span>
              {currentFileSize && (
                <span className="text-slate-400 text-[11px] font-mono">
                  • {formatBytes(currentFileSize)}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={disabled}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition flex items-center space-x-1"
              >
                <Camera className="w-3.5 h-3.5 text-gov-700" />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={onClear}
                disabled={disabled}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium transition flex items-center space-x-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone with Two Clear Primary Buttons */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
            dragActive
              ? 'border-gov-700 bg-gov-50/60 ring-4 ring-gov-100'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/70'
          }`}
        >
          <div className="max-w-md mx-auto flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gov-100 text-gov-700 flex items-center justify-center shadow-sm">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                Capture or select road damage evidence
              </p>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Drag and drop your photo here, or use the buttons below
              </p>
            </div>

            {/* Two Action Buttons: Take Photo & Gallery */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full max-w-xs">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={disabled || isCompressing}
                className="flex-1 min-w-[130px] bg-gov-700 hover:bg-gov-800 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={disabled || isCompressing}
                className="flex-1 min-w-[130px] bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold py-2.5 px-3.5 rounded-xl border border-slate-300 shadow-sm transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4 text-slate-600" />
                <span>Choose Gallery</span>
              </button>
            </div>

            {isCompressing && (
              <p className="text-[11px] text-gov-700 font-medium animate-pulse">
                Optimizing high-resolution photo for rapid upload...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {isZoomOpen && currentImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={currentImageUrl}
              alt="Road evidence inspection"
              className="max-h-[85vh] w-auto object-contain rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-3 text-xs text-white/80 font-mono flex items-center space-x-2">
              <span>{currentFilename || 'road-evidence-inspection'}</span>
              {currentFileSize && <span>({formatBytes(currentFileSize)})</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
