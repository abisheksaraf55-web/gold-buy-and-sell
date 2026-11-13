import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  Check,
  Crop,
  Maximize2,
  RefreshCw,
  RotateCw,
  Upload,
  X,
  AlertCircle,
} from 'lucide-react';

export interface DocumentCropModalProps {
  isOpen: boolean;
  sideLabel: string;
  initialMode: 'camera' | 'crop';
  initialImageSrc?: string;
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string) => void;
}

interface NormalizedRect {
  x: number; // 0..1
  y: number; // 0..1
  w: number; // 0..1
  h: number; // 0..1
}

type DragHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

const MIN_RECT_SIZE = 0.12;

/**
 * Estimates a tight rectangular bounding box around a document in an uploaded photo
 * so obvious uniform/table backgrounds are automatically trimmed into the frame.
 * Falls back conservatively to a centered document rectangle if edges are ambiguous.
 */
function detectDocumentRect(img: HTMLImageElement): NormalizedRect {
  const fallbackRect: NormalizedRect = { x: 0.06, y: 0.1, w: 0.88, h: 0.8 };

  try {
    const sampleW = 240;
    const ratio = img.naturalHeight / (img.naturalWidth || 1);
    const sampleH = Math.max(40, Math.round(sampleW * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = sampleW;
    canvas.height = sampleH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fallbackRect;

    ctx.drawImage(img, 0, 0, sampleW, sampleH);
    const { data } = ctx.getImageData(0, 0, sampleW, sampleH);

    // Sample outer perimeter median-like average color (top, bottom, left, right border strips)
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let count = 0;
    const border = 4;

    for (let y = 0; y < sampleH; y++) {
      for (let x = 0; x < sampleW; x++) {
        if (x < border || x >= sampleW - border || y < border || y >= sampleH - border) {
          const idx = (y * sampleW + x) * 4;
          rSum += data[idx];
          gSum += data[idx + 1];
          bSum += data[idx + 2];
          count++;
        }
      }
    }

    if (count === 0) return fallbackRect;
    const bgR = rSum / count;
    const bgG = gSum / count;
    const bgB = bSum / count;

    // Measure row-wise and col-wise deviation from border background
    const rowScores: number[] = new Array(sampleH).fill(0);
    const colScores: number[] = new Array(sampleW).fill(0);

    for (let y = 0; y < sampleH; y++) {
      for (let x = 0; x < sampleW; x++) {
        const idx = (y * sampleW + x) * 4;
        const diff =
          Math.abs(data[idx] - bgR) +
          Math.abs(data[idx + 1] - bgG) +
          Math.abs(data[idx + 2] - bgB);
        if (diff > 55) {
          rowScores[y]++;
          colScores[x]++;
        }
      }
    }

    const minRowHits = Math.max(8, sampleW * 0.14);
    const minColHits = Math.max(8, sampleH * 0.14);

    let top = 0;
    while (top < sampleH - 1 && rowScores[top] < minRowHits) top++;
    let bottom = sampleH - 1;
    while (bottom > top && rowScores[bottom] < minRowHits) bottom--;
    let left = 0;
    while (left < sampleW - 1 && colScores[left] < minColHits) left++;
    let right = sampleW - 1;
    while (right > left && colScores[right] < minColHits) right--;

    const detectedW = (right - left + 1) / sampleW;
    const detectedH = (bottom - top + 1) / sampleH;

    // Only accept auto-detected box if it looks like a realistic framed document
    if (
      detectedW >= 0.3 &&
      detectedH >= 0.25 &&
      detectedW * detectedH >= 0.15 &&
      detectedW * detectedH <= 0.96
    ) {
      const padX = 0.015;
      const padY = 0.015;
      const nx = Math.max(0, left / sampleW - padX);
      const ny = Math.max(0, top / sampleH - padY);
      const nx2 = Math.min(1, (right + 1) / sampleW + padX);
      const ny2 = Math.min(1, (bottom + 1) / sampleH + padY);
      return {
        x: nx,
        y: ny,
        w: Math.max(MIN_RECT_SIZE, nx2 - nx),
        h: Math.max(MIN_RECT_SIZE, ny2 - ny),
      };
    }

    return fallbackRect;
  } catch {
    return fallbackRect;
  }
}

export const DocumentCropModal: React.FC<DocumentCropModalProps> = ({
  isOpen,
  sideLabel,
  initialMode,
  initialImageSrc,
  onCancel,
  onConfirm,
}) => {
  const [mode, setMode] = useState<'camera' | 'crop'>(initialMode);
  const [workingImageSrc, setWorkingImageSrc] = useState<string>(initialImageSrc || '');
  const [cropRect, setCropRect] = useState<NormalizedRect>({ x: 0.06, y: 0.1, w: 0.88, h: 0.8 });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraAspect, setCameraAspect] = useState<'landscape' | 'portrait'>('landscape');
  const [hasExplicitInitialRect, setHasExplicitInitialRect] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const guideRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cropStageRef = useRef<HTMLDivElement | null>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const dragStateRef = useRef<{
    handle: DragHandle;
    startX: number;
    startY: number;
    startRect: NormalizedRect;
    stageW: number;
    stageH: number;
  } | null>(null);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  }, []);

  // Reset state whenever modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      return;
    }
    setMode(initialMode);
    setWorkingImageSrc(initialImageSrc || '');
    setCameraError(null);
    setHasExplicitInitialRect(false);
    setCropRect({ x: 0.06, y: 0.1, w: 0.88, h: 0.8 });
  }, [isOpen, initialMode, initialImageSrc, stopCameraStream]);

  // Start live camera stream when in camera mode
  useEffect(() => {
    if (!isOpen || mode !== 'camera') {
      stopCameraStream();
      return;
    }

    let cancelled = false;
    setCameraError(null);
    setIsCameraReady(false);

    async function initCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'तपाईंको ब्राउजरमा सिधा क्यामेरा उपलब्ध छैन। कृपया तलको "फाइल अपलोड गर्नुहोस्" बाट तस्बिर छान्नुहोस्।'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setIsCameraReady(true);
        }
      } catch (err: any) {
        if (!cancelled) {
          setCameraError(
            err?.name === 'NotAllowedError'
              ? 'क्यामेरा अनुमति (Permission) अस्वीकार गरियो। कृपया ब्राउजरमा क्यामेरा अनुमति दिनुहोस् वा फाइल अपलोड गर्नुहोस्।'
              : 'क्यामेरा सुरु गर्न सकिएन। कृपया फोटो फाइल अपलोड गरी क्रप गर्नुहोस्।'
          );
        }
      }
    }

    initCamera();

    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [isOpen, mode, stopCameraStream]);

  // Handle pointer move/up globally for smooth rectangle dragging & resizing
  useEffect(() => {
    if (!isOpen || mode !== 'crop') return;

    const handlePointerMove = (e: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;

      const dx = (e.clientX - drag.startX) / (drag.stageW || 1);
      const dy = (e.clientY - drag.startY) / (drag.stageH || 1);
      const s = drag.startRect;
      let { x, y, w, h } = s;

      if (drag.handle === 'move') {
        x = Math.max(0, Math.min(1 - w, s.x + dx));
        y = Math.max(0, Math.min(1 - h, s.y + dy));
      } else {
        let left = s.x;
        let top = s.y;
        let right = s.x + s.w;
        let bottom = s.y + s.h;

        if (drag.handle.includes('w')) {
          left = Math.max(0, Math.min(right - MIN_RECT_SIZE, s.x + dx));
        }
        if (drag.handle.includes('e')) {
          right = Math.min(1, Math.max(left + MIN_RECT_SIZE, s.x + s.w + dx));
        }
        if (drag.handle.includes('n')) {
          top = Math.max(0, Math.min(bottom - MIN_RECT_SIZE, s.y + dy));
        }
        if (drag.handle.includes('s')) {
          bottom = Math.min(1, Math.max(top + MIN_RECT_SIZE, s.y + s.h + dy));
        }

        x = left;
        y = top;
        w = right - left;
        h = bottom - top;
      }

      setCropRect({ x, y, w, h });
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const startDrag = (handle: DragHandle) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const stage = cropStageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    dragStateRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...cropRect },
      stageW: rect.width,
      stageH: rect.height,
    };
  };

  /**
   * Captures the live camera frame and automatically maps the visible rectangular
   * guide box onto the full frame so background is automatically excluded.
   */
  const handleCaptureCameraFrame = () => {
    const video = videoRef.current;
    const guide = guideRef.current;
    if (!video || !guide || !video.videoWidth || !video.videoHeight) return;

    const vW = video.videoWidth;
    const vH = video.videoHeight;

    // Save full high-res snapshot so user can confirm or adjust edges slightly if needed
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = vW;
    fullCanvas.height = vH;
    const fCtx = fullCanvas.getContext('2d');
    if (!fCtx) return;
    fCtx.drawImage(video, 0, 0, vW, vH);
    const fullDataUrl = fullCanvas.toDataURL('image/jpeg', 0.92);

    // Map the exact visible rectangular guide box over object-cover video coordinates
    const videoRect = video.getBoundingClientRect();
    const guideRect = guide.getBoundingClientRect();
    const scale = Math.max(videoRect.width / vW, videoRect.height / vH);
    const renderedW = vW * scale;
    const renderedH = vH * scale;
    const offsetX = (renderedW - videoRect.width) / 2;
    const offsetY = (renderedH - videoRect.height) / 2;

    const sx = Math.max(0, (guideRect.left - videoRect.left + offsetX) / scale);
    const sy = Math.max(0, (guideRect.top - videoRect.top + offsetY) / scale);
    const sw = Math.min(vW - sx, guideRect.width / scale);
    const sh = Math.min(vH - sy, guideRect.height / scale);

    const normalizedGuideRect: NormalizedRect = {
      x: Math.max(0, Math.min(0.9, sx / vW)),
      y: Math.max(0, Math.min(0.9, sy / vH)),
      w: Math.max(MIN_RECT_SIZE, Math.min(1, sw / vW)),
      h: Math.max(MIN_RECT_SIZE, Math.min(1, sh / vH)),
    };

    stopCameraStream();
    setHasExplicitInitialRect(true);
    setCropRect(normalizedGuideRect);
    setWorkingImageSrc(fullDataUrl);
    setMode('crop');
  };

  /**
   * Rotate working image 90 degrees clockwise in crop mode
   */
  const handleRotate90 = () => {
    const img = cropImgRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalHeight;
    canvas.height = img.naturalWidth;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    const rotatedUrl = canvas.toDataURL('image/jpeg', 0.92);
    // Transform normalized rect by 90° clockwise: (x, y, w, h) -> (1 - (y + h), x, h, w)
    const nextRect: NormalizedRect = {
      x: Math.max(0, 1 - (cropRect.y + cropRect.h)),
      y: Math.max(0, cropRect.x),
      w: Math.max(MIN_RECT_SIZE, cropRect.h),
      h: Math.max(MIN_RECT_SIZE, cropRect.w),
    };
    setHasExplicitInitialRect(true);
    setCropRect(nextRect);
    setWorkingImageSrc(rotatedUrl);
  };

  /**
   * Set preset ID aspect ratio centered on current image
   */
  const applyAspectPreset = (ratio: number | null) => {
    const img = cropImgRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) return;

    if (ratio === null) {
      // Auto-detect or full border trim
      setCropRect(detectDocumentRect(img));
      return;
    }

    const imgAspect = img.naturalWidth / img.naturalHeight;
    // Normalized box aspect: (w * imgW) / (h * imgH) = ratio => w / h = ratio / imgAspect
    const targetNormRatio = ratio / imgAspect;
    let w = 0.86;
    let h = w / targetNormRatio;
    if (h > 0.88) {
      h = 0.88;
      w = h * targetNormRatio;
    }
    setCropRect({
      x: (1 - w) / 2,
      y: (1 - h) / 2,
      w,
      h,
    });
  };

  /**
   * Handle fallback upload inside modal
   */
  const handleFallbackFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (url) {
        stopCameraStream();
        setHasExplicitInitialRect(false);
        setWorkingImageSrc(url);
        setMode('crop');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /**
   * Finalize crop strictly to the visible rectangle and emit optimized JPEG data URL
   */
  const handleConfirmCrop = () => {
    const img = cropImgRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) return;

    const sx = Math.round(cropRect.x * img.naturalWidth);
    const sy = Math.round(cropRect.y * img.naturalHeight);
    const sw = Math.max(20, Math.round(cropRect.w * img.naturalWidth));
    const sh = Math.max(20, Math.round(cropRect.h * img.naturalHeight));

    const maxDim = 1600;
    let outW = sw;
    let outH = sh;
    if (outW > maxDim || outH > maxDim) {
      if (outW > outH) {
        outH = Math.round((outH * maxDim) / outW);
        outW = maxDim;
      } else {
        outW = Math.round((outW * maxDim) / outH);
        outH = maxDim;
      }
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = outW;
    outCanvas.height = outH;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

    const croppedDataUrl = outCanvas.toDataURL('image/jpeg', 0.88);
    onConfirm(croppedDataUrl);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-neutral-950 text-white rounded-2xl max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-neutral-800 shadow-2xl">
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-neutral-800 flex items-center justify-between gap-3 bg-neutral-900">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 truncate">
              {mode === 'camera' ? (
                <Camera className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Crop className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="truncate">कागजात फ्रेम तथा स्वचालित क्रप ({sideLabel})</span>
            </h3>
            <p className="text-[11px] text-amber-300 font-medium truncate">
              यो आयताकार फ्रेम (Rectangle Frame) भित्र आउने भाग मात्र प्रिन्ट र PDF मा सेभ हुनेछ
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shrink-0"
            title="बन्द गर्नुहोस्"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {mode === 'camera' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 bg-black space-y-3 overflow-y-auto">
            {cameraError ? (
              <div className="max-w-md w-full bg-neutral-900 border border-red-700/60 rounded-xl p-5 text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-xs text-neutral-200 leading-relaxed">{cameraError}</p>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>फोटो फाइल अपलोड गर्नुहोस् (Upload Photo)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFallbackFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <>
                {/* Live Viewfinder with Strict Rectangle Guide */}
                <div className="relative w-full max-w-2xl h-[54vh] min-h-[280px] bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Darkened Outer Mask + Crisp Rectangle Frame */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div
                      ref={guideRef}
                      className={`relative border-2 border-amber-400 rounded-md transition-all ${
                        cameraAspect === 'landscape'
                          ? 'w-[86%] max-w-[500px] aspect-[1.586/1]'
                          : 'h-[82%] max-h-[420px] aspect-[1/1.414]'
                      }`}
                      style={{
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.62)',
                      }}
                    >
                      {/* Corner Brackets */}
                      <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-xs" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-xs" />
                      <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-xs" />
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-xs" />

                      {/* Subtle Center Guide */}
                      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/25" />
                      <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-white/25" />

                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-amber-300 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded border border-amber-500/40">
                        परिचयपत्र यही फ्रेम भित्र मिलाउनुहोस् (Print & PDF Area)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Camera Controls */}
                <div className="w-full max-w-2xl flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCameraAspect((prev) => (prev === 'landscape' ? 'portrait' : 'landscape'))
                      }
                      className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {cameraAspect === 'landscape' ? 'तेर्सो फ्रेम (Landscape)' : 'ठाडो फ्रेम (Portrait)'}
                      </span>
                    </button>

                    <label className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span>ग्यालरीबाट छान्नुहोस्</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFallbackFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={!isCameraReady}
                    onClick={handleCaptureCameraFrame}
                    className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>फोटो खिच्नुहोस् (Capture & Auto-Crop)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-3 sm:p-4 bg-neutral-950 space-y-3 overflow-y-auto">
            {/* Aspect Presets & Rotation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-neutral-400 font-medium mr-1">फ्रेम आकार:</span>
                <button
                  type="button"
                  onClick={() => applyAspectPreset(null)}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 border border-neutral-700 rounded-md cursor-pointer flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>स्वतः मिलाउनुहोस् (Auto Fit)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyAspectPreset(1.586)}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-md cursor-pointer"
                >
                  ID कार्ड (1.58:1)
                </button>
                <button
                  type="button"
                  onClick={() => applyAspectPreset(1.42)}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-md cursor-pointer"
                >
                  नागरिकता (1.42:1)
                </button>
                <button
                  type="button"
                  onClick={() => setCropRect({ x: 0.02, y: 0.02, w: 0.96, h: 0.96 })}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-md cursor-pointer"
                >
                  पूरा फोटो (Full)
                </button>
              </div>

              <button
                type="button"
                onClick={handleRotate90}
                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 rounded-md cursor-pointer flex items-center gap-1.5 font-medium"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>९०° घुमाउनुहोस् (Rotate)</span>
              </button>
            </div>

            {/* Interactive Rectangular Crop Stage */}
            <div className="flex-1 min-h-[260px] flex items-center justify-center bg-black rounded-xl border border-neutral-800 p-2 sm:p-4 overflow-hidden select-none">
              {workingImageSrc && (
                <div
                  ref={cropStageRef}
                  className="relative inline-block max-w-full overflow-hidden touch-none select-none"
                >
                  <img
                    ref={cropImgRef}
                    src={workingImageSrc}
                    alt="Document Crop Preview"
                    draggable={false}
                    onLoad={(e) => {
                      if (!hasExplicitInitialRect) {
                        setCropRect(detectDocumentRect(e.currentTarget));
                      }
                    }}
                    className="block max-h-[52vh] max-w-full w-auto h-auto object-contain select-none pointer-events-none"
                  />

                  {/* Draggable & Resizable Rectangular Frame */}
                  <div
                    onPointerDown={startDrag('move')}
                    className="absolute border-2 border-amber-400 cursor-move touch-none"
                    style={{
                      left: `${cropRect.x * 100}%`,
                      top: `${cropRect.y * 100}%`,
                      width: `${cropRect.w * 100}%`,
                      height: `${cropRect.h * 100}%`,
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.68)',
                    }}
                  >
                    {/* Rule-of-thirds faint grid inside print area */}
                    <div className="absolute inset-x-0 top-1/3 border-t border-white/20 pointer-events-none" />
                    <div className="absolute inset-x-0 top-2/3 border-t border-white/20 pointer-events-none" />
                    <div className="absolute inset-y-0 left-1/3 border-l border-white/20 pointer-events-none" />
                    <div className="absolute inset-y-0 left-2/3 border-l border-white/20 pointer-events-none" />

                    {/* Top badge inside/on frame */}
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-black/75 text-emerald-300 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap pointer-events-none border border-emerald-400/40">
                      प्रिन्ट र PDF मा आउने भाग (Print Area)
                    </div>

                    {/* 4 Corner Resize Handles */}
                    <div
                      onPointerDown={startDrag('nw')}
                      className="absolute -top-2 -left-2 w-5 h-5 bg-emerald-400 border-2 border-neutral-950 rounded-xs cursor-nwse-resize touch-none"
                    />
                    <div
                      onPointerDown={startDrag('ne')}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-400 border-2 border-neutral-950 rounded-xs cursor-nesw-resize touch-none"
                    />
                    <div
                      onPointerDown={startDrag('sw')}
                      className="absolute -bottom-2 -left-2 w-5 h-5 bg-emerald-400 border-2 border-neutral-950 rounded-xs cursor-nesw-resize touch-none"
                    />
                    <div
                      onPointerDown={startDrag('se')}
                      className="absolute -bottom-2 -right-2 w-5 h-5 bg-emerald-400 border-2 border-neutral-950 rounded-xs cursor-nwse-resize touch-none"
                    />

                    {/* 4 Edge Midpoint Handles */}
                    <div
                      onPointerDown={startDrag('n')}
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-amber-400 border border-neutral-950 rounded-full cursor-ns-resize touch-none"
                    />
                    <div
                      onPointerDown={startDrag('s')}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-amber-400 border border-neutral-950 rounded-full cursor-ns-resize touch-none"
                    />
                    <div
                      onPointerDown={startDrag('w')}
                      className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-8 bg-amber-400 border border-neutral-950 rounded-full cursor-ew-resize touch-none"
                    />
                    <div
                      onPointerDown={startDrag('e')}
                      className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-8 bg-amber-400 border border-neutral-950 rounded-full cursor-ew-resize touch-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setHasExplicitInitialRect(false);
                    setMode('camera');
                  }}
                  className="px-3 py-2 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>क्यामेराबाट फेरि खिच्नुहोस्</span>
                </button>

                <label className="px-3 py-2 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>अर्को फोटो</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFallbackFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCrop}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>क्रप गरी सेभ & स्क्यान गर्नुहोस् (Save Print Area)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
