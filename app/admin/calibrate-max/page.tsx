"use client";

import { useState, useRef } from "react";

// 52-point FaceIQ landmark system (1-indexed)
const LANDMARK_NAMES = [
  "1. Hairline (Trichion)",
  "2. Left Pupil",
  "3. Right Pupil",
  "4. Left Ala Nasi",
  "5. Right Ala Nasi",
  "6. Labrale Inferius (Lower Lip Center)",
  "7. Menton (Chin Bottom)",
  "8. Left Tragion (Left Ear)",
  "9. Right Tragion (Right Ear)",
  "10. Left Temple",
  "11. Right Temple",
  "12. Left Medial Canthus (Inner Eye)",
  "13. Left Lateral Canthus (Outer Eye)",
  "14. Left Upper Eyelid",
  "15. Left Lower Eyelid",
  "16. Left Eyelid Hood",
  "17. Left Brow Head",
  "18. Left Brow Inner",
  "19. Left Brow Arch",
  "20. Left Brow Peak",
  "21. Left Brow Tail",
  "22. Left Eyelid Crease",
  "23. Right Medial Canthus (Inner Eye)",
  "24. Right Lateral Canthus (Outer Eye)",
  "25. Right Upper Eyelid",
  "26. Right Lower Eyelid",
  "27. Right Eyelid Hood",
  "28. Right Brow Head",
  "29. Right Brow Inner",
  "30. Right Brow Arch",
  "31. Right Brow Peak",
  "32. Right Brow Tail",
  "33. Right Eyelid Crease",
  "34. Sellion (Nasal Base)",
  "35. Subnasale (Nose Bottom)",
  "36. Left Dorsum Nasi (Nose Bridge)",
  "37. Right Dorsum Nasi (Nose Bridge)",
  "38. Left Cheilion (Mouth Corner)",
  "39. Right Cheilion (Mouth Corner)",
  "40. Labrale Superius (Upper Lip)",
  "41. Cupid's Bow",
  "42. Mouth Middle",
  "43. Left Gonion Superior",
  "44. Right Gonion Superior",
  "45. Left Gonion Inferior",
  "46. Right Gonion Inferior",
  "47. Left Mentum Lateralis (Chin Side)",
  "48. Right Mentum Lateralis (Chin Side)",
  "49. Left Cervical Lateralis (Neck)",
  "50. Right Cervical Lateralis (Neck)",
  "51. Left Zygion (Cheekbone)",
  "52. Right Zygion (Cheekbone)",
];

const ZOOM_LEVELS = [1, 2, 4, 6, 8];

export default function CalibrateMaxPage() {
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [copied, setCopied] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const currentIndex = points.length;
  const isComplete = currentIndex >= LANDMARK_NAMES.length;

  const baseWidth = 400;
  const baseHeight = 480;

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isComplete) return;

    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Round to 1 decimal place
    const roundedX = Math.round(x * 10) / 10;
    const roundedY = Math.round(y * 10) / 10;

    setPoints([...points, { x: roundedX, y: roundedY }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const handleUndo = () => {
    if (points.length > 0) {
      setPoints(points.slice(0, -1));
    }
  };

  const handleReset = () => {
    setPoints([]);
    setCopied(false);
  };

  const handleCopy = () => {
    const lines = points.map((p, i) => {
      const comment = LANDMARK_NAMES[i].replace(/^\d+\.\s*/, '');
      return `  { x: ${p.x}, y: ${p.y} },  // ${i}: ${comment}`;
    });

    const output = `export const LANDMARK_DOT_POSITIONS: { x: number; y: number }[] = [
${lines.join('\n')}
];`;

    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left side - Image */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-xl font-bold mb-4">52-Point Landmark Calibration</h1>

        {!isComplete && (
          <div className="mb-4 text-center">
            <div className="text-amber-400 text-lg font-medium">
              {LANDMARK_NAMES[currentIndex]}
            </div>
            <p className="text-zinc-500 text-sm mt-1">
              Click on the image to place this landmark
            </p>
          </div>
        )}

        {isComplete && (
          <div className="mb-4 text-center">
            <div className="text-green-400 text-lg font-medium">
              All 52 landmarks placed!
            </div>
          </div>
        )}

        {/* Zoom controls */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-zinc-500 text-sm">Zoom:</span>
          {ZOOM_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setZoom(level)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                zoom === level
                  ? "bg-amber-500 text-black font-medium"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
            >
              {level}x
            </button>
          ))}
        </div>

        {/* Scrollable viewport */}
        <div
          ref={scrollContainerRef}
          className="bg-zinc-900 rounded-xl overflow-auto cursor-none"
          style={{ width: baseWidth, height: baseHeight }}
        >
          {/* Zoomable image container */}
          <div
            ref={imageContainerRef}
            className="relative"
            style={{
              width: baseWidth * zoom,
              height: baseHeight * zoom,
            }}
            onClick={handleImageClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src="/max.assistant.webp"
              alt="Max assistant face"
              className="w-full h-full object-cover pointer-events-none"
              style={{ objectPosition: '50% 20%' }}
            />

            {/* Custom dot cursor */}
            {mousePos && !isComplete && (
              <div
                className="absolute pointer-events-none rounded-full bg-red-500 border border-white"
                style={{
                  width: '3px',
                  height: '3px',
                  left: `${mousePos.x}%`,
                  top: `${mousePos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}

            {/* Show placed points */}
            {points.map((point, index) => (
              <div
                key={index}
                className="absolute w-1.5 h-1.5 rounded-full bg-lime-400 border border-black pointer-events-none"
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleUndo}
            disabled={points.length === 0}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
          >
            Undo Last
          </button>
          <button
            onClick={handleReset}
            disabled={points.length === 0}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
          >
            Reset All
          </button>
          {isComplete && (
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-amber-500 hover:bg-amber-400 text-black"
              }`}
            >
              {copied ? "Copied!" : "Copy Coordinates"}
            </button>
          )}
        </div>
      </div>

      {/* Right side - Coordinates list */}
      <div className="w-96 border-l border-zinc-800 p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Recorded Coordinates</h2>

        <div className="space-y-1 font-mono text-xs">
          {LANDMARK_NAMES.map((name, index) => {
            const point = points[index];
            const isNext = index === currentIndex;
            const isPlaced = index < currentIndex;

            return (
              <div
                key={index}
                className={`flex items-center gap-2 py-1 px-2 rounded ${
                  isNext
                    ? "bg-amber-400/20 text-amber-400"
                    : isPlaced
                    ? "text-green-400"
                    : "text-zinc-600"
                }`}
              >
                <span className="flex-1 truncate">{name}</span>
                {point && (
                  <span className="text-zinc-400">
                    ({point.x}, {point.y})
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="mt-6 pt-4 border-t border-zinc-800">
          <div className="flex justify-between text-sm text-zinc-500 mb-2">
            <span>Progress</span>
            <span>{currentIndex}/{LANDMARK_NAMES.length}</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-300"
              style={{ width: `${(currentIndex / LANDMARK_NAMES.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
