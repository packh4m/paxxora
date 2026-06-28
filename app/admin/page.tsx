"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { LANDMARK_DOT_POSITIONS } from "@/components/FaceReferenceImage";

// 34 landmark definitions
const LANDMARKS = [
  { id: 0, name: "Left Eye - Outer Corner", region: "eyes" },
  { id: 1, name: "Left Eye - Inner Corner", region: "eyes" },
  { id: 2, name: "Left Eye - Top Center", region: "eyes" },
  { id: 3, name: "Left Eye - Bottom Center", region: "eyes" },
  { id: 4, name: "Right Eye - Outer Corner", region: "eyes" },
  { id: 5, name: "Right Eye - Inner Corner", region: "eyes" },
  { id: 6, name: "Right Eye - Top Center", region: "eyes" },
  { id: 7, name: "Right Eye - Bottom Center", region: "eyes" },
  { id: 8, name: "Left Brow - Inner End", region: "brows" },
  { id: 9, name: "Left Brow - Outer End", region: "brows" },
  { id: 10, name: "Right Brow - Inner End", region: "brows" },
  { id: 11, name: "Right Brow - Outer End", region: "brows" },
  { id: 12, name: "Nose Bridge (Sellion)", region: "nose" },
  { id: 13, name: "Nose Tip", region: "nose" },
  { id: 14, name: "Left Alar", region: "nose" },
  { id: 15, name: "Right Alar", region: "nose" },
  { id: 16, name: "Subnasale", region: "nose" },
  { id: 17, name: "Mouth - Left Corner", region: "mouth" },
  { id: 18, name: "Mouth - Right Corner", region: "mouth" },
  { id: 19, name: "Upper Lip - Top Center", region: "mouth" },
  { id: 20, name: "Upper Lip - Bottom", region: "mouth" },
  { id: 21, name: "Lower Lip - Bottom", region: "mouth" },
  { id: 22, name: "Chin (Menton)", region: "jaw" },
  { id: 23, name: "Left Jaw Angle", region: "jaw" },
  { id: 24, name: "Right Jaw Angle", region: "jaw" },
  { id: 25, name: "Left Cheekbone", region: "face" },
  { id: 26, name: "Right Cheekbone", region: "face" },
  { id: 27, name: "Left Temple", region: "face" },
  { id: 28, name: "Right Temple", region: "face" },
  { id: 29, name: "Glabella", region: "face" },
  { id: 30, name: "Left Ear - Top", region: "ears" },
  { id: 31, name: "Left Ear - Bottom", region: "ears" },
  { id: 32, name: "Right Ear - Top", region: "ears" },
  { id: 33, name: "Right Ear - Bottom", region: "ears" },
  { id: 34, name: "Left Neck Edge", region: "neck" },
  { id: 35, name: "Right Neck Edge", region: "neck" },
];

const TOTAL_POINTS = LANDMARKS.length;

// Zoom config for Max reference image based on current point
const getZoomConfig = (idx: number) => {
  if (idx <= 3) return { scale: 2.5, originX: "38%", originY: "37%" }; // Left eye
  if (idx <= 7) return { scale: 2.5, originX: "62%", originY: "37%" }; // Right eye
  if (idx <= 9) return { scale: 2.2, originX: "60%", originY: "34%" }; // Left brow
  if (idx <= 11) return { scale: 2.2, originX: "40%", originY: "34%" }; // Right brow
  if (idx <= 16) return { scale: 2.2, originX: "50%", originY: "45%" }; // Nose
  if (idx <= 21) return { scale: 2.2, originX: "50%", originY: "55%" }; // Mouth
  if (idx === 22) return { scale: 2, originX: "50%", originY: "67%" }; // Chin
  if (idx === 23) return { scale: 2, originX: "33%", originY: "57%" }; // Left jaw
  if (idx === 24) return { scale: 2, originX: "67%", originY: "57%" }; // Right jaw
  if (idx === 25) return { scale: 2, originX: "66%", originY: "43%" }; // Left cheekbone
  if (idx === 26) return { scale: 2, originX: "34%", originY: "44%" }; // Right cheekbone
  if (idx === 27) return { scale: 2, originX: "68%", originY: "25%" }; // Left temple
  if (idx === 28) return { scale: 2, originX: "32%", originY: "25%" }; // Right temple
  if (idx === 29) return { scale: 2.2, originX: "50%", originY: "34%" }; // Glabella
  if (idx <= 31) return { scale: 2.2, originX: "26%", originY: "40%" }; // Left ear
  if (idx <= 33) return { scale: 2.2, originX: "74%", originY: "40%" }; // Right ear
  return { scale: 2, originX: "50%", originY: "75%" }; // Neck
};

type PageState = "upload" | "annotate" | "saving" | "success";

interface Point {
  x: number;
  y: number;
}

export default function AdminAnnotationPage() {
  const [pageState, setPageState] = useState<PageState>("upload");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [points, setPoints] = useState<(Point | null)[]>(Array(TOTAL_POINTS).fill(null));
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const photoContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completedCount = points.filter((p) => p !== null).length;
  const isComplete = completedCount === TOTAL_POINTS;
  const currentLandmark = LANDMARKS[currentIndex];
  const zoomConfig = getZoomConfig(currentIndex);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageUrl(url);
      setPageState("annotate");
      setPoints(Array(TOTAL_POINTS).fill(null));
      setCurrentIndex(0);
    };
    img.src = url;
  };

  // Handle click on photo to place point
  const handlePhotoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!photoContainerRef.current || isComplete) return;

    const rect = photoContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * imageSize.width;
    const y = ((e.clientY - rect.top) / rect.height) * imageSize.height;

    const newPoints = [...points];
    newPoints[currentIndex] = { x, y };
    setPoints(newPoints);

    // Move to next unplaced point
    if (currentIndex < TOTAL_POINTS - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Handle dragging points
  const handlePointMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setDraggingIndex(index);
    setCurrentIndex(index);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (draggingIndex === null || !photoContainerRef.current) return;

      const rect = photoContainerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(imageSize.width, ((e.clientX - rect.left) / rect.width) * imageSize.width));
      const y = Math.max(0, Math.min(imageSize.height, ((e.clientY - rect.top) / rect.height) * imageSize.height));

      const newPoints = [...points];
      newPoints[draggingIndex] = { x, y };
      setPoints(newPoints);
    },
    [draggingIndex, imageSize, points]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  useEffect(() => {
    if (draggingIndex !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggingIndex, handleMouseMove, handleMouseUp]);

  // Undo last point
  const handleUndo = () => {
    if (completedCount === 0) return;

    // Find the last placed point
    let lastIdx = currentIndex;
    if (points[currentIndex] === null && currentIndex > 0) {
      lastIdx = currentIndex - 1;
    }

    const newPoints = [...points];
    newPoints[lastIdx] = null;
    setPoints(newPoints);
    setCurrentIndex(lastIdx);
  };

  // Save to Supabase
  const handleSave = async () => {
    if (!isComplete || !imageUrl) return;

    setPageState("saving");
    setError(null);

    try {
      // Normalize points to 0-1 range
      const normalizedLandmarks = points.map((p) =>
        p ? { x: p.x / imageSize.width, y: p.y / imageSize.height } : null
      );

      const supabase = getSupabase();
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { error: insertError } = await supabase.from("training_annotations").insert({
        photo_url: imageUrl,
        landmarks: normalizedLandmarks,
        annotated_by: "admin",
        image_width: imageSize.width,
        image_height: imageSize.height,
      });

      if (insertError) throw insertError;

      setSavedCount((c) => c + 1);
      setPageState("success");
    } catch (err) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save");
      setPageState("annotate");
    }
  };

  // Reset for next photo
  const handleNext = () => {
    setImageUrl(null);
    setPoints(Array(TOTAL_POINTS).fill(null));
    setCurrentIndex(0);
    setPageState("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Upload screen
  if (pageState === "upload") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Annotation Tool</h1>
            <p className="text-zinc-400">
              Upload a front-facing photo to annotate {TOTAL_POINTS} facial landmarks
            </p>
            {savedCount > 0 && (
              <p className="text-amber-400 text-sm mt-2">
                {savedCount} annotation{savedCount > 1 ? "s" : ""} saved this session
              </p>
            )}
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 hover:border-amber-500 rounded-2xl p-12 text-center cursor-pointer transition-colors"
          >
            <div className="text-5xl mb-4">📷</div>
            <p className="text-white font-medium mb-2">Click to upload photo</p>
            <p className="text-zinc-500 text-sm">JPG, PNG, or WebP</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Quick links */}
          <div className="mt-8 flex justify-center gap-4">
            <a
              href="/admin/export-data"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
            >
              Export Data
            </a>
            <a
              href="/admin/calibrate-max"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
            >
              Calibrate Max
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Saving screen
  if (pageState === "saving") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Saving annotation...</p>
        </div>
      </div>
    );
  }

  // Success screen
  if (pageState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Annotation Saved!</h2>
          <p className="text-zinc-400 mb-6">
            {TOTAL_POINTS} landmarks saved to database
          </p>
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors"
          >
            Start Next Photo
          </button>
        </div>
      </div>
    );
  }

  // Annotation screen
  return (
    <div className="min-h-screen p-4 lg:p-6">
      {/* Progress bar */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="flex items-center justify-between text-sm text-zinc-400 mb-2">
          <span>
            Point {currentIndex + 1} of {TOTAL_POINTS}
          </span>
          <span>{completedCount} placed</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${(completedCount / TOTAL_POINTS) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
        {/* Left: Subject Photo */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Subject Photo</h2>

          <div
            ref={photoContainerRef}
            onClick={handlePhotoClick}
            className="relative bg-black rounded-xl overflow-hidden cursor-crosshair"
            style={{ aspectRatio: `${imageSize.width} / ${imageSize.height}` }}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Subject"
                className="w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
            )}

            {/* Placed points */}
            {points.map((point, idx) => {
              if (!point) return null;
              const isActive = idx === currentIndex;
              const left = (point.x / imageSize.width) * 100;
              const top = (point.y / imageSize.height) * 100;

              return (
                <div
                  key={idx}
                  onMouseDown={(e) => handlePointMouseDown(e, idx)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move ${
                    isActive ? "z-20" : "z-10"
                  }`}
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  <div
                    className={`rounded-full border-2 ${
                      isActive
                        ? "w-4 h-4 bg-amber-500 border-white"
                        : "w-3 h-3 bg-green-500 border-green-300"
                    }`}
                  />
                  <span
                    className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold whitespace-nowrap ${
                      isActive ? "text-amber-400" : "text-green-400"
                    }`}
                  >
                    {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleUndo}
              disabled={completedCount === 0}
              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white rounded-lg transition-colors"
            >
              Undo
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isComplete}
              className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-black font-semibold rounded-lg transition-colors"
            >
              Save
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center mt-3">{error}</p>
          )}
        </div>

        {/* Right: Max Reference */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Reference Guide</h2>

          {/* Speech bubble instruction */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">👆</div>
              <div>
                <p className="text-amber-400 font-medium">
                  {currentLandmark.name}
                </p>
                <p className="text-zinc-400 text-sm mt-1">
                  Click on the subject photo to place point #{currentIndex + 1}
                </p>
              </div>
            </div>
          </div>

          {/* Max image with zoom */}
          <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: "5/6" }}>
            <div
              className="w-full h-full transition-transform duration-300"
              style={{
                transform: `scale(${zoomConfig.scale})`,
                transformOrigin: `${zoomConfig.originX} ${zoomConfig.originY}`,
              }}
            >
              <img
                src="/max.assistant.webp"
                alt="Max reference"
                className="w-full h-full object-cover"
                draggable={false}
              />

              {/* Reference dots */}
              {LANDMARK_DOT_POSITIONS.map((pos, idx) => {
                const isActive = idx === currentIndex;
                const isCompleted = points[idx] !== null;

                return (
                  <div
                    key={idx}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <div
                      className={`rounded-full ${
                        isActive
                          ? "w-3 h-3 bg-amber-500 ring-2 ring-amber-300 ring-offset-1 ring-offset-black"
                          : isCompleted
                          ? "w-2 h-2 bg-green-500/60"
                          : "w-1.5 h-1.5 bg-zinc-500/40"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Landmark list */}
          <div className="mt-4 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1 text-xs">
              {LANDMARKS.map((lm, idx) => {
                const isActive = idx === currentIndex;
                const isCompleted = points[idx] !== null;

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`text-left px-2 py-1 rounded transition-colors ${
                      isActive
                        ? "bg-amber-500/20 text-amber-400"
                        : isCompleted
                        ? "text-green-400 hover:bg-zinc-800"
                        : "text-zinc-500 hover:bg-zinc-800"
                    }`}
                  >
                    <span className="text-zinc-600 mr-1">{idx + 1}.</span>
                    {lm.name}
                    {isCompleted && " ✓"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
