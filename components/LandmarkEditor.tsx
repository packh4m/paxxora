"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Point } from "@/lib/types";
import { LANDMARK_POINTS } from "./FaceReferenceImage";

interface LandmarkEditorProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  landmarks: Point[];
  editingIndex: number;
  relevantIndices: number[];
  onDone: (updatedLandmarks: Point[]) => void;
  onBack: () => void;
}

const ZOOM_LEVELS = [
  { label: "1", sub: "2x", scale: 2 },
  { label: "2", sub: "4x", scale: 4 },
  { label: "3", sub: "8x", scale: 8 },
];

export default function LandmarkEditor({
  imageUrl,
  imageWidth,
  imageHeight,
  landmarks,
  editingIndex,
  relevantIndices,
  onDone,
  onBack,
}: LandmarkEditorProps) {
  const [points, setPoints] = useState<Point[]>([...landmarks]);
  const [zoomIndex, setZoomIndex] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const point = LANDMARK_POINTS[editingIndex - 1];
  const zoomScale = ZOOM_LEVELS[zoomIndex].scale / 2;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !image.complete) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = image.clientWidth;
    const h = image.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const scaleX = w / imageWidth;
    const scaleY = h / imageHeight;

    points.forEach((p, i) => {
      if (!p || (p.x === 0 && p.y === 0)) return;
      const isActive = i === editingIndex;
      const isRelevant = relevantIndices.includes(i);

      if (!isActive && !isRelevant) return;

      const x = p.x * scaleX;
      const y = p.y * scaleY;

      // Match dot size from ManualPointPlacement
      const radius = isActive ? 6 : 4;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? "#ef4444" : "rgba(0, 206, 209, 0.8)";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = isActive ? 2 : 1.5;
      ctx.stroke();

      // Label number for active point
      if (isActive) {
        ctx.font = "bold 10px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(editingIndex), x, y - radius - 8);
      }
    });
  }, [points, editingIndex, relevantIndices, imageWidth, imageHeight]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  useEffect(() => {
    const timeout = setTimeout(drawCanvas, 50);
    return () => clearTimeout(timeout);
  }, [zoomIndex, drawCanvas]);

  useEffect(() => {
    const handleResize = () => setTimeout(drawCanvas, 100);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawCanvas]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const rect = canvas.getBoundingClientRect();
    // Divide by zoomScale to account for CSS transform scaling
    const clickX = (e.clientX - rect.left) / zoomScale;
    const clickY = (e.clientY - rect.top) / zoomScale;
    const scaleX = imageWidth / image.clientWidth;
    const scaleY = imageHeight / image.clientHeight;

    const newPoints = [...points];
    newPoints[editingIndex] = {
      x: clickX * scaleX,
      y: clickY * scaleY,
    };
    setPoints(newPoints);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const current = points[editingIndex];
      if (!current) return;
      let dx = 0, dy = 0;
      switch (e.key) {
        case "ArrowUp": dy = -1; break;
        case "ArrowDown": dy = 1; break;
        case "ArrowLeft": dx = -1; break;
        case "ArrowRight": dx = 1; break;
        default: return;
      }
      e.preventDefault();
      // Fine-tune at 1px in screen space, divided by zoom for accuracy
      const newPoints = [...points];
      newPoints[editingIndex] = {
        x: Math.max(0, Math.min(imageWidth, current.x + dx / zoomScale)),
        y: Math.max(0, Math.min(imageHeight, current.y + dy / zoomScale)),
      };
      setPoints(newPoints);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [points, editingIndex, imageWidth, imageHeight, zoomScale]);

  return (
    <div className="fixed inset-0 z-[60] bg-[#f7f7f5] flex">
      {/* Left — photo */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-zinc-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {editingIndex}
          </div>
          <div>
            <p className="text-sm font-semibold text-black">{point?.name}</p>
            <p className="text-xs text-zinc-400">Editing landmark · {editingIndex} of 52</p>
          </div>
          <button
            onClick={() => {
              const newPoints = [...points];
              newPoints[editingIndex] = { ...landmarks[editingIndex] };
              setPoints(newPoints);
            }}
            className="ml-auto text-xs text-zinc-500 hover:text-black transition-colors px-3 py-1.5 border border-zinc-200 rounded-lg"
          >
            Reset
          </button>
        </div>

        {/* Image canvas */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-zinc-100 p-4">
          <div
            className="relative"
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: "center center",
            }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Edit landmark"
              className="select-none block"
              style={{ maxWidth: "800px", maxHeight: "70vh", objectFit: "contain" }}
              onLoad={drawCanvas}
              draggable={false}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 cursor-crosshair"
              onClick={handleCanvasClick}
            />
          </div>
        </div>

        {/* Bottom hint */}
        <div className="flex-shrink-0 px-6 py-3 bg-white border-t border-zinc-200 text-center">
          <p className="text-xs text-zinc-400">Click to move point · Arrow keys to fine-tune (1px)</p>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-72 flex-shrink-0 bg-white border-l border-zinc-200 flex flex-col">
        {/* Point info */}
        <div className="px-5 py-5 border-b border-zinc-100">
          <p className="text-base font-semibold text-black mb-0.5">{point?.name}</p>
          <p className="text-xs text-zinc-400 italic mb-2">{point?.latin}</p>
          <p className="text-xs text-zinc-500 leading-relaxed">{point?.description}</p>
        </div>

        {/* Reference image */}
        <div className="px-5 py-4 border-b border-zinc-100">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Reference</p>
          <div className="rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50" style={{ height: 160 }}>
            <img
              src={`/landmarks/${point?.name?.toLowerCase()}.png`}
              alt={point?.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        </div>

        {/* Keyboard shortcuts */}
        <div className="px-5 py-4 border-b border-zinc-100">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Keyboard shortcuts</p>
          <div className="space-y-2">
            {[
              { key: "↑ ↓ ← →", label: "Fine-tune (1px)" },
              { key: "Click", label: "Move point" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <kbd className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-xs font-mono text-zinc-600">{key}</kbd>
                <span className="text-xs text-zinc-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zoom */}
        <div className="px-5 py-4 border-b border-zinc-100">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Zoom level</p>
          <div className="grid grid-cols-3 gap-2">
            {ZOOM_LEVELS.map((z, i) => (
              <button
                key={i}
                onClick={() => setZoomIndex(i)}
                className={`py-2 rounded-lg text-center border transition-colors ${
                  zoomIndex === i
                    ? "bg-black text-white border-black"
                    : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <div className="text-sm font-semibold">{z.label}</div>
                <div className="text-xs opacity-60">{z.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 mt-auto flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => onDone(points)}
            className="flex-1 py-2.5 text-sm font-medium bg-black text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}