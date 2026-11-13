import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  initialValue?: string;
  onChange: (dataUrl: string) => void;
  height?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  initialValue,
  onChange,
  height = 140,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(Boolean(initialValue));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // Deep ink
    ctx.lineWidth = 2.2;

    if (initialValue) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, height);
        setHasContent(true);
      };
      img.src = initialValue;
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, height);
    }
  }, [initialValue, height]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

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

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, height);
    setHasContent(false);
    onChange('');
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs text-neutral-600">
        <span className="font-medium flex items-center gap-1.5 text-neutral-800">
          <PenTool className="w-3.5 h-3.5 text-amber-600" />
          {label}
        </span>
        <div className="flex items-center gap-2">
          {hasContent && (
            <span className="text-[11px] text-emerald-700 flex items-center gap-1">
              <Check className="w-3 h-3" /> हस्ताक्षर रेकर्ड भयो
            </span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-neutral-500 hover:text-red-600 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded"
          >
            <Eraser className="w-3 h-3" /> मेटाउनुहोस्
          </button>
        </div>
      </div>

      <div className="relative border border-neutral-300 rounded-md overflow-hidden bg-white shadow-xs focus-within:border-amber-500">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full cursor-crosshair touch-none block"
          style={{ height: `${height}px` }}
        />
        {!hasContent && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-neutral-300 text-xs font-sans tracking-wide">
            यहाँ हस्ताक्षर गर्नुहोस् (Sign here using mouse or finger)
          </div>
        )}
      </div>
    </div>
  );
};
