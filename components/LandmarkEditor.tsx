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
  { label: "1", sub: "2x", multiplier: 1 },
  { label: "2", sub: "4x", multiplier: 2 },
  { label: "3", sub: "8x", multiplier: 4 },
];

export default function LandmarkEditor({
  imageUrl,
  imageWidth,
  imageHeight,
  landmarks,
  editingIndex: initialEditingIndex,
  relevantIndices,
  onDone,
  onBack,
}: LandmarkEditorProps) {
  const [points, setPoints] = useState<Point[]>([...landmarks]);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [baseSize, setBaseSize] = useState<{ width: number; height: number } | null>(null);
  const [currentEditIndex, setCurrentEditIndex] = useState(initialEditingIndex);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const point = LANDMARK_POINTS[currentEditIndex - 1];
  const multiplier = ZOOM_LEVELS[zoomIndex].multiplier;

  const displayWidth = baseSize ? baseSize.width * multiplier : undefined;
  const displayHeight = baseSize ? baseSize.height * multiplier : undefined;

  const currentPosInRelevant = relevantIndices.indexOf(currentEditIndex);
  const hasPrev = currentPosInRelevant > 0;
  const hasNext = currentPosInRelevant < relevantIndices.length - 1;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !image.complete || !displayWidth || !displayHeight) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const scaleX = displayWidth / imageWidth;
    const scaleY = displayHeight / imageHeight;

    points.forEach((p, i) => {
      if (!p || (p.x === 0 && p.y === 0)) return;
      const isActive = i === currentEditIndex;
      const isRelevant = relevantIndices.includes(i);
      if (!isActive && !isRelevant) return;

      const x = p.x * scaleX;
      const y = p.y * scaleY;
      const radius = isActive ? 4 : 3;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#22c55e";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (isActive) {
        ctx.font = "bold 9px system-ui, sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(currentEditIndex), x, y - radius - 5);
      }
    });
  }, [points, currentEditIndex, relevantIndices, imageWidth, imageHeight, displayWidth, displayHeight]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  const handleImageLoad = () => {
    const image = imageRef.current;
    if (!image) return;
    setBaseSize({ width: image.clientWidth, height: image.clientHeight });
  };

  useEffect(() => {
    if (baseSize) drawCanvas();
  }, [baseSize, drawCanvas]);

  // Auto-scroll to active point
  const scrollToActive = useCallback(() => {
    const current = points[currentEditIndex];
    const scroll = scrollRef.current;
    if (!current || !scroll || !displayWidth || !displayHeight) return;
    const x = (current.x / imageWidth) * displayWidth;
    const y = (current.y / imageHeight) * displayHeight;
    scroll.scrollTo({
      left: x - scroll.clientWidth / 2,
      top: y - scroll.clientHeight / 2,
      behavior: "smooth",
    });
  }, [currentEditIndex, points, displayWidth, displayHeight, imageWidth, imageHeight]);

  useEffect(() => { scrollToActive(); }, [zoomIndex, currentEditIndex, scrollToActive]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !displayWidth || !displayHeight) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const imageX = (clickX / displayWidth) * imageWidth;
    const imageY = (clickY / displayHeight) * imageHeight;

    const newPoints = [...points];
    newPoints[currentEditIndex] = { x: imageX, y: imageY };
    setPoints(newPoints);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const current = points[currentEditIndex];
      if (!current) return;
      let dx = 0, dy = 0;
      switch (e.key) {
        case "ArrowUp": dy = -1; break;
        case "ArrowDown": dy = 1; break;
        case "ArrowLeft": dx = -1; break;
        case "ArrowRight": dx = 1; break;
        case "Enter":
          e.preventDefault();
          if (hasNext) setCurrentEditIndex(relevantIndices[currentPosInRelevant + 1]);
          return;
        case "Backspace":
          e.preventDefault();
          if (hasPrev) setCurrentEditIndex(relevantIndices[currentPosInRelevant - 1]);
          return;
        default: return;
      }
      e.preventDefault();
      const newPoints = [...points];
      newPoints[currentEditIndex] = {
        x: Math.max(0, Math.min(imageWidth, current.x + dx)),
        y: Math.max(0, Math.min(imageHeight, current.y + dy)),
      };
      setPoints(newPoints);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [points, currentEditIndex, imageWidth, imageHeight, hasPrev, hasNext, relevantIndices, currentPosInRelevant]);

  return (
    <div className="fixed inset-0 z-[60] bg-[#f7f7f5] flex">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-zinc-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {currentEditIndex}
          </div>
          <div>
            <p className="text-sm font-semibold text-black">{point?.name}</p>
            <p className="text-xs text-zinc-400">
              Landmark {currentPosInRelevant + 1} of {relevantIndices.length}
            </p>
          </div>
          <button
            onClick={() => {
              const newPoints = [...points];
              newPoints[currentEditIndex] = { ...landmarks[currentEditIndex] };
              setPoints(newPoints);
            }}
            className="ml-auto text-xs text-zinc-500 hover:text-black transition-colors px-3 py-1.5 border border-zinc-200 rounded-lg"
          >
            Reset
          </button>
        </div>

        {/* Scrollable image */}
        <div ref={scrollRef} className="flex-1 overflow-auto bg-zinc-100">
          <div
            className="relative"
            style={{
              width: displayWidth ?? "100%",
              height: displayHeight ?? "100%",
              minWidth: displayWidth,
              minHeight: displayHeight,
            }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Edit landmark"
              className="select-none block"
              style={{
                width: displayWidth ?? "auto",
                height: displayHeight ?? "auto",
                maxWidth: displayWidth ? "none" : "100%",
                maxHeight: displayWidth ? "none" : "100%",
                objectFit: "contain",
              }}
              onLoad={handleImageLoad}
              draggable={false}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 cursor-crosshair"
              onClick={handleCanvasClick}
            />
          </div>
        </div>

        {/* Bottom bar with prev/next */}
        <div className="flex-shrink-0 px-6 py-3 bg-white border-t border-zinc-200 flex items-center justify-between">
          <button
            onClick={() => hasPrev && setCurrentEditIndex(relevantIndices[currentPosInRelevant - 1])}
            disabled={!hasPrev}
            className="px-4 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <p className="text-xs text-zinc-400">Click to move · Arrow keys to fine-tune</p>
          <button
            onClick={() => hasNext && setCurrentEditIndex(relevantIndices[currentPosInRelevant + 1])}
            disabled={!hasNext}
            className="px-4 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-72 flex-shrink-0 bg-white border-l border-zinc-200 flex flex-col">
        <div className="px-5 py-5 border-b border-zinc-100">
          <p className="text-base font-semibold text-black mb-0.5">{point?.name}</p>
          <p className="text-xs text-zinc-400 italic mb-2">{point?.latin}</p>
          <p className="text-xs text-zinc-500 leading-relaxed">{point?.description}</p>
        </div>

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

        {/* Landmark list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 border-b border-zinc-100">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Landmarks</p>
          <div className="space-y-1">
            {relevantIndices.map((idx) => (
              <button
                key={idx}
                onClick={() => setCurrentEditIndex(idx)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  idx === currentEditIndex
                    ? "bg-black text-white"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                  idx === currentEditIndex ? "bg-white text-black" : "bg-zinc-200 text-zinc-600"
                }`}>
                  {idx}
                </span>
                {LANDMARK_POINTS[idx - 1]?.name}
              </button>
            ))}
          </div>
        </div>

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

        <div className="p-4 flex gap-3">
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