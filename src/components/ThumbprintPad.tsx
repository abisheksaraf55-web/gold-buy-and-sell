import React, { useRef, useState, useEffect } from 'react';
import { Fingerprint, Eraser, Check, Upload, Camera, ShieldAlert } from 'lucide-react';

interface ThumbprintPadProps {
  label: string; // e.g. "बायाँ औंठाछाप (Left Thumb)" or "दायाँ औंठाछाप (Right Thumb)"
  initialValue?: string;
  onChange: (dataUrl: string) => void;
  finger: 'left' | 'right';
}

export const ThumbprintPad: React.FC<ThumbprintPadProps> = ({
  label,
  initialValue,
  onChange,
  finger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const hasDrawnRef = useRef(Boolean(initialValue));
  const [hasContent, setHasContent] = useState(Boolean(initialValue));
  const [isDrawing, setIsDrawing] = useState(false);

  const width = 160;
  const height = 140;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    if (initialValue) {
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        hasDrawnRef.current = true;
        setHasContent(true);
      };
      img.src = initialValue;
    } else {
      drawBlankPad(ctx);
      hasDrawnRef.current = false;
      setHasContent(false);
    }
  }, [initialValue]);

  const drawBlankPad = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#fafaf9';
    ctx.fillRect(0, 0, width, height);
    // Subtle boundary showing the 2.5cm x 3cm physical/scanner stamp zone
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, 45, 55, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    drawBlankPad(ctx);
    hasDrawnRef.current = false;
    setHasContent(false);
    onChange('');
  };

  // Load real thumbprint image from biometric scanner export, inked paper photo, or mobile camera
  const handleRealThumbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Fit the real thumbprint photo cleanly inside the stamp frame
        const scale = Math.min((width - 8) / (img.naturalWidth || 1), (height - 8) / (img.naturalHeight || 1));
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        const dx = (width - drawW) / 2;
        const dy = (height - drawH) / 2;

        ctx.drawImage(img, dx, dy, drawW, drawH);

        const dataUrl = canvas.toDataURL('image/png');
        hasDrawnRef.current = true;
        setHasContent(true);
        onChange(dataUrl);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    hasDrawnRef.current = true;
    setHasContent(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasDrawnRef.current) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  return (
    <div className="flex flex-col items-center p-3 border border-neutral-200 rounded-lg bg-neutral-50/70 text-center">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 mb-1">
        <Fingerprint className="w-4 h-4 text-blue-700" />
        <span>{label}</span>
      </div>
      <p className="text-[11px] text-neutral-500 mb-2">
        {finger === 'left' ? 'बिक्रेताको बायाँ बुढी औंला (वास्तविक छाप मात्र)' : 'बिक्रेताको दायाँ बुढी औंला (वास्तविक छाप मात्र)'}
      </p>

      <div className="relative border border-neutral-300 rounded-md bg-white shadow-xs overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair touch-none block"
          style={{ width: `${width}px`, height: `${height}px` }}
        />
        {!hasContent && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-2.5 text-neutral-400 text-[10px] leading-snug">
            <span>स्क्यानर/मसीको वास्तविक ल्याप्चे अपलोड गर्नुहोस् वा प्रिन्टमा लिनुहोस्</span>
          </div>
        )}
      </div>

      {/* Hidden real-photo / camera inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleRealThumbUpload}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleRealThumbUpload}
        className="hidden"
      />

      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 flex items-center gap-1 transition-colors cursor-pointer"
          title="बायोमेट्रिक स्क्यानर वा मसीमा लगाएको वास्तविक औंठाछापको फोटो अपलोड गर्नुहोस्"
        >
          <Upload className="w-3 h-3" />
          <span>छाप अपलोड (Upload Real)</span>
        </button>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="px-2 py-1 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 flex items-center gap-1 transition-colors cursor-pointer"
          title="कागजमा लगाएको वास्तविक ल्याप्चेको फोटो खिच्नुहोस्"
        >
          <Camera className="w-3 h-3" />
          <span>फोटो</span>
        </button>

        {hasContent && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-neutral-400 hover:text-red-600 rounded transition-colors cursor-pointer"
            title="मेटाउनुहोस्"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {hasContent ? (
        <span className="text-[10px] text-emerald-700 flex items-center gap-1 mt-1.5 font-medium">
          <Check className="w-3 h-3" /> वास्तविक औंठाछाप संलग्न
        </span>
      ) : (
        <span className="text-[10px] text-neutral-500 flex items-center gap-1 mt-1.5 leading-tight max-w-[200px]">
          <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
          <span>नोट: डिजिटल छाप नभए भरपाई प्रिन्ट गरी कागजमा मसीको प्रत्यक्ष ल्याप्चे लिनुहोस्।</span>
        </span>
      )}
    </div>
  );
};
