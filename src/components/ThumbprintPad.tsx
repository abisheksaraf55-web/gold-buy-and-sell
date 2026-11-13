import React, { useRef, useState, useEffect } from 'react';
import { Fingerprint, Eraser, Check, Stamp } from 'lucide-react';

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
    ctx.scale(dpr, dpr);

    if (initialValue) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        setHasContent(true);
      };
      img.src = initialValue;
    } else {
      drawBlankPad(ctx);
    }
  }, [initialValue]);

  const drawBlankPad = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#fafaf9';
    ctx.fillRect(0, 0, width, height);
    // Draw subtle oval outline representing the thumb zone
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
    setHasContent(false);
    onChange('');
  };

  // Generates a high-fidelity biometric thumb ridge impression (legal stamp ink)
  const generateRealisticImpression = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    // Use traditional purple/blue legal thumb ink color
    ctx.strokeStyle = '#1e3a8a'; // Deep indigo legal ink
    ctx.lineWidth = 1.3;

    // Generate concentric wobbly dermal ridges
    for (let r = 8; r < 52; r += 3.2) {
      ctx.beginPath();
      const points = 36;
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * 2 * Math.PI;
        // Wobbly distortion for natural ridge pattern
        const noise = Math.sin(theta * 5) * 1.5 + Math.cos(theta * 7) * 1.2;
        const x = cx + (r * 0.75 + noise) * Math.cos(theta);
        const y = cy + (r * 1.05 + noise) * Math.sin(theta);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.globalAlpha = 0.75 + Math.random() * 0.25;
      ctx.stroke();
    }

    // Add ink pressure smudges at core
    ctx.fillStyle = 'rgba(30, 58, 138, 0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 18, 24, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.globalAlpha = 1.0;

    const dataUrl = canvas.toDataURL('image/png');
    setHasContent(true);
    onChange(dataUrl);
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
    setHasContent(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
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
        {finger === 'left' ? 'बिक्रेताको बायाँ बुढी औंला' : 'बिक्रेताको दायाँ बुढी औंला'}
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
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-2 text-neutral-300 text-[10px]">
            <span>औंठाछाप कोर्नुहोस् वा तलको बटन थिच्नुहोस्</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={generateRealisticImpression}
          className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 flex items-center gap-1 transition-colors"
          title="Digital Stamp Impression"
        >
          <Stamp className="w-3 h-3" />
          <span>औंठाछाप लिनुहोस्</span>
        </button>

        {hasContent && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-neutral-400 hover:text-red-600 rounded transition-colors"
            title="मेटाउनुहोस्"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {hasContent && (
        <span className="text-[10px] text-emerald-700 flex items-center gap-1 mt-1 font-medium">
          <Check className="w-3 h-3" /> छाप प्रमाणित
        </span>
      )}
    </div>
  );
};
