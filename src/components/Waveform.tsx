import { useEffect, useRef } from "react";

interface WaveformProps {
  peaks: number[];
  height?: number;
  className?: string;
  color?: string;
}

export function Waveform({ peaks, height = 120, className, color }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, color ?? "oklch(0.7 0.22 305)");
    gradient.addColorStop(1, "oklch(0.78 0.2 340)");
    ctx.fillStyle = gradient;

    const barWidth = Math.max(1.5, w / peaks.length - 1);
    const gap = 1;
    const centerY = h / 2;
    peaks.forEach((p, i) => {
      const barH = Math.max(2, p * (h - 8));
      const x = i * (barWidth + gap);
      ctx.beginPath();
      const radius = barWidth / 2;
      const y = centerY - barH / 2;
      ctx.roundRect(x, y, barWidth, barH, radius);
      ctx.fill();
    });
  }, [peaks, height, color]);

  return <canvas ref={canvasRef} style={{ width: "100%", height }} className={className} />;
}
