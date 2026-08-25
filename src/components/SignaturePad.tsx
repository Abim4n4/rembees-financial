import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string | null;
}

interface SignaturePadProps {
  onChange?: (dataUrl: string | null) => void;
}

// A lightweight canvas-based signature pad. Supports mouse and touch input.
const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(({ onChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [isEmptyState, setIsEmptyState] = useState(true);

  const getContext = () => canvasRef.current?.getContext('2d') || null;

  // Resize canvas to match its displayed size (accounting for device pixel ratio)
  // while preserving existing drawing.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const prev = canvas.toDataURL();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#f8fafc';
        if (hasDrawnRef.current) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
          img.src = prev;
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = getContext();
    const point = getPoint(e);
    const last = lastPointRef.current;
    if (ctx && last) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    lastPointRef.current = point;
    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true;
      setIsEmptyState(false);
    }
  };

  const endDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    if (onChange) {
      onChange(hasDrawnRef.current ? canvasRef.current?.toDataURL() || null : null);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    hasDrawnRef.current = false;
    setIsEmptyState(true);
    if (onChange) onChange(null);
  };

  useImperativeHandle(ref, () => ({
    clear,
    isEmpty: () => !hasDrawnRef.current,
    toDataURL: () => (hasDrawnRef.current ? canvasRef.current?.toDataURL() || null : null),
  }));

  return (
    <div className="space-y-3">
      <div className="relative w-full h-40 rounded-2xl border-2 border-dashed border-neon-blue/40 bg-black/20 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {isEmptyState && (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 pointer-events-none">
            Tanda tangan di sini
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={clear}
        className="px-4 py-1.5 rounded-full border border-neon-blue/40 text-neon-blue text-xs font-semibold hover:bg-neon-blue/10 transition-colors"
      >
        Reset TTD
      </button>
    </div>
  );
});

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
