"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import FaceReferenceImage, { LANDMARK_POINTS } from "./FaceReferenceImage";
import { Point } from "@/lib/types";

interface ManualPointPlacementProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  onComplete: (landmarks: Point[]) => void;
  onCancel: () => void;
}

const ZOOM_LEVELS = [
  { label: "1", sub: "1x", multiplier: 1 },
  { label: "2", sub: "2x", multiplier: 2 },
  { label: "3", sub: "4x", multiplier: 4 },
];

export default function ManualPointPlacement({
  imageUrl,
  imageWidth,
  imageHeight,
  onComplete,
  onCancel,
}: ManualPointPlacementProps) {
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [placedPoints, setPlacedPoints] = useState<(Point | null)[]>(
    new Array(LANDMARK_POINTS.length).fill(null)
  );
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number } | null>(null);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [baseSize, setBaseSize] = useState<{ width: number; height: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const completedIndices = placedPoints
    .map((p, i) => (p !== null ? i : -1))
    .filter((i) => i !== -1);

  const currentPoint = LANDMARK_POINTS[currentPointIndex];
  const progress = (completedIndices.length / LANDMARK_POINTS.length) * 100;
  const multiplier = ZOOM_LEVELS[zoomIndex].multiplier;

  const displayWidth = baseSize ? baseSize.width * multiplier : undefined;
  const displayHeight = baseSize ? baseSize.height * multiplier : undefined;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !displayWidth || !displayHeight) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.scale(dpr, dpr);

    const scaleX = displayWidth / imageWidth;
    const scaleY = displayHeight / imageHeight;

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    placedPoints.forEach((point, index) => {
      if (point === null) return;
      const x = point.x * scaleX;
      const y = point.y * scaleY;
      const isActive = index === currentPointIndex;

      ctx.beginPath();
      ctx.arc(x, y, isActive ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? "#ef4444" : "#22c55e";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = "bold 9px system-ui, sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(index + 1), x, y - 9);
    });

    if (hoveredPoint) {
      ctx.beginPath();
      ctx.arc(hoveredPoint.x, hoveredPoint.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hoveredPoint.x, hoveredPoint.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
    }
  }, [placedPoints, currentPointIndex, hoveredPoint, imageWidth, imageHeight, displayWidth, displayHeight]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  const handleImageLoad = () => {
    const image = imageRef.current;
    if (!image) return;
    setBaseSize({ width: image.clientWidth, height: image.clientHeight });
  };

  useEffect(() => {
    if (baseSize) drawCanvas();
  }, [baseSize, drawCanvas]);

  useEffect(() => {
    const handleResize = () => setTimeout(drawCanvas, 100);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawCanvas]);

  // Auto-scroll to current point
  useEffect(() => {
    const current = placedPoints[currentPointIndex];
    const scroll = scrollRef.current;
    if (!current || !scroll || !displayWidth || !displayHeight) return;
    const x = (current.x / imageWidth) * displayWidth;
    const y = (current.y / imageHeight) * displayHeight;
    scroll.scrollTo({
      left: x - scroll.clientWidth / 2,
      top: y - scroll.clientHeight / 2,
      behavior: "smooth",
    });
  }, [zoomIndex, currentPointIndex]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !displayWidth || !displayHeight) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const imageX = (clickX / displayWidth) * imageWidth;
    const imageY = (clickY / displayHeight) * imageHeight;

    const newPlacedPoints = [...placedPoints];
    newPlacedPoints[currentPointIndex] = { x: imageX, y: imageY };
    setPlacedPoints(newPlacedPoints);

    const nextUnplaced = newPlacedPoints.findIndex((p, i) => p === null && i > currentPointIndex);
    if (nextUnplaced !== -1) {
      setCurrentPointIndex(nextUnplaced);
    } else {
      const allPlaced = newPlacedPoints.every((p) => p !== null);
      if (!allPlaced) {
        const firstUnplaced = newPlacedPoints.findIndex((p) => p === null);
        if (firstUnplaced !== -1) setCurrentPointIndex(firstUnplaced);
      }
    }
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setHoveredPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleCanvasLeave = () => setHoveredPoint(null);

  const handleUndo = () => {
    if (completedIndices.length === 0) return;
    const lastPlacedIndex = Math.max(...completedIndices);
    const newPlacedPoints = [...placedPoints];
    newPlacedPoints[lastPlacedIndex] = null;
    setPlacedPoints(newPlacedPoints);
    setCurrentPointIndex(lastPlacedIndex);
  };

  const handleSkip = () => {
    const nextIndex = (currentPointIndex + 1) % LANDMARK_POINTS.length;
    setCurrentPointIndex(nextIndex);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (placedPoints[currentPointIndex] === null) return;
      let dx = 0, dy = 0;
      switch (e.key) {
        case "ArrowUp": dy = -1; break;
        case "ArrowDown": dy = 1; break;
        case "ArrowLeft": dx = -1; break;
        case "ArrowRight": dx = 1; break;
        default: return;
      }
      e.preventDefault();
      const currentPlacedPoint = placedPoints[currentPointIndex];
      if (!currentPlacedPoint) return;
      const newPlacedPoints = [...placedPoints];
      newPlacedPoints[currentPointIndex] = {
        x: Math.max(0, Math.min(imageWidth, currentPlacedPoint.x + dx)),
        y: Math.max(0, Math.min(imageHeight, currentPlacedPoint.y + dy)),
      };
      setPlacedPoints(newPlacedPoints);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPointIndex, placedPoints, imageWidth, imageHeight]);

  const handlePointSelect = (index: number) => setCurrentPointIndex(index);

  const handleComplete = () => {
    const landmarks: Point[] = placedPoints.map((p) => p || { x: 0, y: 0 });
    onComplete(landmarks);
  };

  const allPlaced = placedPoints.every((p) => p !== null);

  return (
    <div className="fixed inset-0 z-50 bg-[#f7f7f5] flex">
      {/* Main canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="text-zinc-400 hover:text-black transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="text-sm font-medium text-black">Manual Landmark Placement</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom buttons */}
            <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
              {ZOOM_LEVELS.map((z, i) => (
                <button
                  key={i}
                  onClick={() => setZoomIndex(i)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    zoomIndex === i ? "bg-white shadow text-black" : "text-zinc-500 hover:text-black"
                  }`}
                >
                  {z.sub}
                </button>
              ))}
            </div>

            <button
              onClick={handleUndo}
              disabled={completedIndices.length === 0}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Undo
            </button>

            <button
              onClick={handleComplete}
              disabled={!allPlaced}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                allPlaced
                  ? "bg-black hover:bg-zinc-800 text-white"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              }`}
            >
              Complete ({completedIndices.length}/{LANDMARK_POINTS.length})
            </button>
          </div>
        </div>

        {/* Scrollable canvas */}
        <div ref={scrollRef} className="flex-1 overflow-auto bg-zinc-200">
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
              alt="Face for landmark placement"
              className="select-none block"
              style={{
                width: displayWidth ?? "auto",
                height: displayHeight ?? "auto",
                maxWidth: displayWidth ? "none" : "100%",
                maxHeight: displayWidth ? "none" : "calc(100vh - 160px)",
                objectFit: "contain",
              }}
              onLoad={handleImageLoad}
              draggable={false}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 cursor-none"
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMove}
              onMouseLeave={handleCanvasLeave}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-6 py-3 border-t border-zinc-200 bg-white flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Arrow keys to fine-tune (1px) · Scroll to navigate
          </p>
          <span className="text-xs text-zinc-500 font-mono">
            {completedIndices.length}/{LANDMARK_POINTS.length} points
          </span>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-72 border-l border-zinc-200 bg-white flex flex-col max-h-screen">
        {/* Progress */}
        <div className="px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-mono">
              {currentPointIndex + 1} of {LANDMARK_POINTS.length}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Reference image */}
        <div className="px-5 py-4 border-b border-zinc-100">
          <FaceReferenceImage
            activePointIndex={currentPointIndex}
            completedPoints={completedIndices}
          />
        </div>

        {/* Keyboard shortcuts */}
        <div className="px-5 py-4 border-b border-zinc-100">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Keyboard shortcuts</p>
          <div className="space-y-2">
            {[
              { key: "↑ ↓ ← →", label: "Fine-tune (1px)" },
              { key: "Enter", label: "Next / Confirm" },
              { key: "Backspace", label: "Previous" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <kbd className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-xs font-mono text-zinc-600">{key}</kbd>
                <span className="text-xs text-zinc-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Point list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
          <div className="space-y-0.5">
            {LANDMARK_POINTS.map((point, index) => {
              const isPlaced = placedPoints[index] !== null;
              const isActive = index === currentPointIndex;
              return (
                <button
                  key={point.id}
                  onClick={() => handlePointSelect(index)}
                  className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors flex items-center gap-2 ${
                    isActive
                      ? "bg-black text-white"
                      : isPlaced
                      ? "text-zinc-500 hover:bg-zinc-50"
                      : "text-zinc-400 hover:bg-zinc-50"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                    isActive
                      ? "bg-white text-black"
                      : isPlaced
                      ? "bg-green-500 text-white"
                      : "bg-zinc-200 text-zinc-500"
                  }`}>
                    {isPlaced && !isActive ? "✓" : index + 1}
                  </span>
                  <span className="truncate">{point.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skip */}
        <div className="p-4 border-t border-zinc-100">
          <button
            onClick={handleSkip}
            className="w-full px-4 py-2 text-xs text-zinc-400 hover:text-black hover:bg-zinc-50 rounded-lg transition-colors"
          >
            Skip this point (mark as undetectable)
          </button>
        </div>
      </div>
    </div>
  );
}