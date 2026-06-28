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

const ZOOM_LEVELS = [1, 1.5, 2, 2.5, 3, 4];

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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [baseDisplaySize, setBaseDisplaySize] = useState<{ width: number; height: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const completedIndices = placedPoints
    .map((p, i) => (p !== null ? i : -1))
    .filter((i) => i !== -1);

  const currentPoint = LANDMARK_POINTS[currentPointIndex];
  const progress = (completedIndices.length / LANDMARK_POINTS.length) * 100;

  // Cycle through zoom levels
  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoomLevel(ZOOM_LEVELS[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel);
    if (currentIndex > 0) {
      setZoomLevel(ZOOM_LEVELS[currentIndex - 1]);
    }
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  }, [zoomLevel]);

  useEffect(() => {
    const container = imageContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Draw placed points and hover preview
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Capture base display size when at 1x zoom
    if (zoomLevel === 1 && image.clientWidth > 0) {
      setBaseDisplaySize({ width: image.clientWidth, height: image.clientHeight });
    }

    // Match canvas to displayed image size with Retina/high-DPI support
    const displayWidth = image.clientWidth;
    const displayHeight = image.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.scale(dpr, dpr);

    // Scale factors for drawing points
    const scaleX = displayWidth / imageWidth;
    const scaleY = displayHeight / imageHeight;

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Draw all placed points
    placedPoints.forEach((point, index) => {
      if (point === null) return;

      const x = point.x * scaleX;
      const y = point.y * scaleY;
      const isActive = index === currentPointIndex;

      // Point color based on status
      let color = "#22c55e"; // green for completed
      if (isActive) color = "#fbbf24"; // yellow for current

      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, isActive ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Draw point number
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(index + 1), x, y - 12);
    });

    // Draw hover preview - small dot with border
    if (hoveredPoint) {
      // White border
      ctx.beginPath();
      ctx.arc(hoveredPoint.x, hoveredPoint.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      // Red center
      ctx.beginPath();
      ctx.arc(hoveredPoint.x, hoveredPoint.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
    }
  }, [placedPoints, currentPointIndex, hoveredPoint, imageWidth, imageHeight, zoomLevel, baseDisplaySize]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Redraw canvas after zoom changes (with delay for DOM update)
  useEffect(() => {
    const timeout = setTimeout(drawCanvas, 50);
    return () => clearTimeout(timeout);
  }, [zoomLevel, baseDisplaySize]);

  // Handle window resize
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

    // Get click position relative to canvas (in CSS pixels)
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert to original image coordinates
    // Use displayed dimensions (CSS pixels), not canvas backing store
    const displayWidth = image.clientWidth;
    const displayHeight = image.clientHeight;
    const scaleX = imageWidth / displayWidth;
    const scaleY = imageHeight / displayHeight;

    const imageX = clickX * scaleX;
    const imageY = clickY * scaleY;

    // Place the point
    const newPlacedPoints = [...placedPoints];
    newPlacedPoints[currentPointIndex] = { x: imageX, y: imageY };
    setPlacedPoints(newPlacedPoints);

    // Move to next unplaced point
    const nextUnplaced = newPlacedPoints.findIndex((p, i) => p === null && i > currentPointIndex);
    if (nextUnplaced !== -1) {
      setCurrentPointIndex(nextUnplaced);
    } else {
      // Check if all points are placed
      const allPlaced = newPlacedPoints.every((p) => p !== null);
      if (!allPlaced) {
        // Find first unplaced
        const firstUnplaced = newPlacedPoints.findIndex((p) => p === null);
        if (firstUnplaced !== -1) {
          setCurrentPointIndex(firstUnplaced);
        }
      }
    }
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Get position relative to canvas (already in zoomed space)
    setHoveredPoint({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleCanvasLeave = () => {
    setHoveredPoint(null);
  };

  const handleUndo = () => {
    if (completedIndices.length === 0) return;

    // Find the last placed point
    const lastPlacedIndex = Math.max(...completedIndices);
    const newPlacedPoints = [...placedPoints];
    newPlacedPoints[lastPlacedIndex] = null;
    setPlacedPoints(newPlacedPoints);
    setCurrentPointIndex(lastPlacedIndex);
  };

  const handleSkip = () => {
    // Skip current point (leave as null) and move to next
    const nextIndex = (currentPointIndex + 1) % LANDMARK_POINTS.length;
    setCurrentPointIndex(nextIndex);
  };

  // Handle arrow keys for fine-tuning landmark position (1 pixel per press)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only adjust if current point is placed
      if (placedPoints[currentPointIndex] === null) return;

      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case "ArrowUp":
          dy = -1;
          break;
        case "ArrowDown":
          dy = 1;
          break;
        case "ArrowLeft":
          dx = -1;
          break;
        case "ArrowRight":
          dx = 1;
          break;
        default:
          return; // Not an arrow key
      }

      e.preventDefault(); // Prevent page scrolling

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

  const handlePointSelect = (index: number) => {
    setCurrentPointIndex(index);
  };

  const handleComplete = () => {
    // Convert to Point array, using { x: 0, y: 0 } for unplaced points
    const landmarks: Point[] = placedPoints.map((p) => p || { x: 0, y: 0 });
    onComplete(landmarks);
  };

  const allPlaced = placedPoints.every((p) => p !== null);

  return (
    <div className="fixed inset-0 z-50 bg-background flex">
      {/* Main canvas area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-white">Manual Landmark Placement</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 mr-4 bg-zinc-800 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel === 1}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded"
                title="Zoom out"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <span className="px-2 text-sm text-white font-medium min-w-[3rem] text-center">
                {zoomLevel}x
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded"
                title="Zoom in"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
              {zoomLevel > 1 && (
                <button
                  onClick={handleResetZoom}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors rounded ml-1"
                  title="Reset zoom"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={handleUndo}
              disabled={completedIndices.length === 0}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Undo
            </button>
            <button
              onClick={handleComplete}
              disabled={!allPlaced}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                allPlaced
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              Complete ({completedIndices.length}/{LANDMARK_POINTS.length})
            </button>
          </div>
        </div>

        {/* Canvas container - scrollable when zoomed */}
        <div
          ref={containerRef}
          className={`flex-1 p-6 bg-black/50 overflow-auto ${zoomLevel === 1 ? 'flex items-center justify-center' : ''}`}
        >
          <div
            ref={imageContainerRef}
            className="relative flex-shrink-0"
            style={baseDisplaySize && zoomLevel > 1 ? {
              width: baseDisplaySize.width * zoomLevel,
              height: baseDisplaySize.height * zoomLevel,
            } : undefined}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Face for landmark placement"
              className="select-none"
              style={{
                width: baseDisplaySize && zoomLevel > 1 ? baseDisplaySize.width * zoomLevel : 'auto',
                height: baseDisplaySize && zoomLevel > 1 ? baseDisplaySize.height * zoomLevel : 'auto',
                maxWidth: zoomLevel === 1 ? '100%' : 'none',
                maxHeight: zoomLevel === 1 ? 'calc(100vh - 200px)' : 'none',
                objectFit: 'contain',
              }}
              onLoad={drawCanvas}
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

        {/* Progress bar and zoom hint */}
        <div className="px-6 py-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-gray-400 tabular-nums">
                {completedIndices.length}/{LANDMARK_POINTS.length} points
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 text-center">
            {zoomLevel > 1
              ? "Scroll to pan • Ctrl/Cmd + scroll to zoom • Arrow keys to fine-tune (1px)"
              : "Zoom in for precision • Ctrl/Cmd + scroll to zoom • Arrow keys to fine-tune (1px)"
            }
          </p>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l border-border bg-surface flex flex-col max-h-screen">
        {/* Reference Image - always visible at top */}
        <div className="p-4 border-b border-border flex-shrink-0 bg-surface sticky top-0 z-10">
          <FaceReferenceImage
            activePointIndex={currentPointIndex}
            completedPoints={completedIndices}
          />
        </div>

        {/* Point list (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <div className="space-y-1">
            {LANDMARK_POINTS.map((point, index) => {
              const isPlaced = placedPoints[index] !== null;
              const isActive = index === currentPointIndex;

              return (
                <button
                  key={point.id}
                  onClick={() => handlePointSelect(index)}
                  className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors flex items-center gap-2 ${
                    isActive
                      ? "bg-yellow-400/20 text-yellow-400"
                      : isPlaced
                      ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                    isActive
                      ? "bg-yellow-400 text-black"
                      : isPlaced
                      ? "bg-green-500 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}>
                    {isPlaced && !isActive ? "✓" : index + 1}
                  </span>
                  <span className="truncate">{point.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={handleSkip}
            className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Skip this point (mark as undetectable)
          </button>
        </div>
      </div>
    </div>
  );
}
