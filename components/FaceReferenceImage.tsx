"use client";

import { useState } from "react";

interface FaceReferenceImageProps {
  activePointIndex: number;
  completedPoints: number[];
}

// Zoom configurations for each landmark region (52-point system, 0-indexed)
// Returns { scale, originX, originY } for CSS transform
const getZoomConfig = (pointIndex: number): { scale: number; originX: string; originY: string } => {
  // Hairline (0)
  if (pointIndex === 0) {
    return { scale: 2, originX: '50%', originY: '15%' };
  }
  // Left Pupil (1)
  if (pointIndex === 1) {
    return { scale: 2.5, originX: '40%', originY: '37%' };
  }
  // Right Pupil (2)
  if (pointIndex === 2) {
    return { scale: 2.5, originX: '60%', originY: '37%' };
  }
  // Nose sides - Left/Right Ala Nasi (3-4)
  if (pointIndex >= 3 && pointIndex <= 4) {
    return { scale: 2.2, originX: '50%', originY: '52%' };
  }
  // Lower Lip Center (5)
  if (pointIndex === 5) {
    return { scale: 2.2, originX: '50%', originY: '60%' };
  }
  // Chin Bottom - Menton (6)
  if (pointIndex === 6) {
    return { scale: 2, originX: '50%', originY: '70%' };
  }
  // Left Outer Ear (7)
  if (pointIndex === 7) {
    return { scale: 2.2, originX: '26%', originY: '42%' };
  }
  // Right Outer Ear (8)
  if (pointIndex === 8) {
    return { scale: 2.2, originX: '74%', originY: '42%' };
  }
  // Left Temple (9)
  if (pointIndex === 9) {
    return { scale: 2, originX: '32%', originY: '28%' };
  }
  // Right Temple (10)
  if (pointIndex === 10) {
    return { scale: 2, originX: '68%', originY: '28%' };
  }
  // Left Eye points: Medial/Lateral Canthus, Upper/Lower Eyelid, Hood, Crease (11-15, 21)
  if ((pointIndex >= 11 && pointIndex <= 15) || pointIndex === 21) {
    return { scale: 2.5, originX: '40%', originY: '37%' };
  }
  // Left Brow points: Head, Inner Corner, Arch, Peak, Tail (16-20)
  if (pointIndex >= 16 && pointIndex <= 20) {
    return { scale: 2.2, originX: '40%', originY: '32%' };
  }
  // Right Eye points: Medial/Lateral Canthus, Upper/Lower Eyelid, Hood, Crease (22-26, 32)
  if ((pointIndex >= 22 && pointIndex <= 26) || pointIndex === 32) {
    return { scale: 2.5, originX: '60%', originY: '37%' };
  }
  // Right Brow points: Head, Inner Corner, Arch, Peak, Tail (27-31)
  if (pointIndex >= 27 && pointIndex <= 31) {
    return { scale: 2.2, originX: '60%', originY: '32%' };
  }
  // Nose points: Sellion, Subnasale, Left/Right Bridge (33-36)
  if (pointIndex >= 33 && pointIndex <= 36) {
    return { scale: 2.2, originX: '50%', originY: '45%' };
  }
  // Mouth points: Corners, Cupid's Bow, Inner Bow, Middle (37-41)
  if (pointIndex >= 37 && pointIndex <= 41) {
    return { scale: 2.2, originX: '50%', originY: '58%' };
  }
  // Left Jaw angles: Upper and Lower (42, 44)
  if (pointIndex === 42 || pointIndex === 44) {
    return { scale: 2, originX: '32%', originY: '57%' };
  }
  // Right Jaw angles: Upper and Lower (43, 45)
  if (pointIndex === 43 || pointIndex === 45) {
    return { scale: 2, originX: '68%', originY: '57%' };
  }
  // Chin points: Left and Right (46-47)
  if (pointIndex >= 46 && pointIndex <= 47) {
    return { scale: 2, originX: '50%', originY: '68%' };
  }
  // Neck points: Left and Right (48-49)
  if (pointIndex >= 48 && pointIndex <= 49) {
    return { scale: 2, originX: '50%', originY: '76%' };
  }
  // Left Cheekbone (50)
  if (pointIndex === 50) {
    return { scale: 2, originX: '34%', originY: '45%' };
  }
  // Right Cheekbone (51)
  if (pointIndex === 51) {
    return { scale: 2, originX: '66%', originY: '45%' };
  }
  // Default - no zoom
  return { scale: 1, originX: '50%', originY: '50%' };
};

// Landmark dot positions on the reference image (x, y as percentages)
// 52-point system (0-indexed array, FaceIQ 1-52)
// Calibrated using /admin/calibrate-max tool
export const LANDMARK_DOT_POSITIONS: { x: number; y: number }[] = [
  { x: 49.2, y: 18.5 },  // 0: Hairline (Trichion)
  { x: 40.3, y: 36.5 },  // 1: Left Pupil
  { x: 59.8, y: 36.4 },  // 2: Right Pupil
  { x: 44.6, y: 47.5 },  // 3: Left Ala Nasi
  { x: 56, y: 47.5 },  // 4: Right Ala Nasi
  { x: 50.4, y: 57.3 },  // 5: Labrale Inferius (Lower Lip Center)
  { x: 50.1, y: 66.8 },  // 6: Menton (Chin Bottom)
  { x: 23.4, y: 38.4 },  // 7: Left Tragion (Left Ear)
  { x: 75.7, y: 38.9 },  // 8: Right Tragion (Right Ear)
  { x: 31.7, y: 24.7 },  // 9: Left Temple
  { x: 67.6, y: 24.3 },  // 10: Right Temple
  { x: 45, y: 37.4 },  // 11: Left Medial Canthus (Inner Eye)
  { x: 36.5, y: 37 },  // 12: Left Lateral Canthus (Outer Eye)
  { x: 40.2, y: 35.6 },  // 13: Left Upper Eyelid
  { x: 40.2, y: 38.2 },  // 14: Left Lower Eyelid
  { x: 35.3, y: 36.6 },  // 15: Left Eyelid Hood
  { x: 47.3, y: 33.4 },  // 16: Left Brow Head
  { x: 47.3, y: 35.2 },  // 17: Left Brow Inner
  { x: 36.3, y: 34.8 },  // 18: Left Brow Arch
  { x: 36.4, y: 31.8 },  // 19: Left Brow Peak
  { x: 31.7, y: 36.4 },  // 20: Left Brow Tail
  { x: 40.2, y: 35.1 },  // 21: Left Eyelid Crease
  { x: 55.2, y: 37.4 },  // 22: Right Medial Canthus (Inner Eye)
  { x: 63.5, y: 37 },  // 23: Right Lateral Canthus (Outer Eye)
  { x: 59.7, y: 35.4 },  // 24: Right Upper Eyelid
  { x: 60, y: 38 },  // 25: Right Lower Eyelid
  { x: 65.1, y: 36.6 },  // 26: Right Eyelid Hood
  { x: 53.2, y: 33.3 },  // 27: Right Brow Head
  { x: 53.2, y: 35.1 },  // 28: Right Brow Inner
  { x: 64.7, y: 34.9 },  // 29: Right Brow Arch
  { x: 64.3, y: 31.9 },  // 30: Right Brow Peak
  { x: 68.2, y: 36 },  // 31: Right Brow Tail
  { x: 59.7, y: 35 },  // 32: Right Eyelid Crease
  { x: 53.6, y: 48.8 },  // 33: Sellion (Nasal Base)
  { x: 50.4, y: 49 },  // 34: Subnasale (Nose Bottom)
  { x: 47.5, y: 40.8 },  // 35: Left Dorsum Nasi (Nose Bridge)
  { x: 53.2, y: 40.7 },  // 36: Right Dorsum Nasi (Nose Bridge)
  { x: 42.3, y: 54.7 },  // 37: Left Cheilion (Mouth Corner)
  { x: 58.3, y: 54.7 },  // 38: Right Cheilion (Mouth Corner)
  { x: 52.5, y: 53.1 },  // 39: Labrale Superius (Upper Lip)
  { x: 50.2, y: 54.1 },  // 40: Cupid's Bow
  { x: 50.2, y: 55.1 },  // 41: Mouth Middle
  { x: 32.2, y: 55.4 },  // 42: Left Gonion Superior
  { x: 68, y: 54.9 },  // 43: Right Gonion Superior
  { x: 35.6, y: 59.7 },  // 44: Left Gonion Inferior
  { x: 64.9, y: 59.6 },  // 45: Right Gonion Inferior
  { x: 41.6, y: 64.5 },  // 46: Left Mentum Lateralis (Chin Side)
  { x: 59.9, y: 64 },  // 47: Right Mentum Lateralis (Chin Side)
  { x: 32.9, y: 59.1 },  // 48: Left Cervical Lateralis (Neck)
  { x: 67.1, y: 59.6 },  // 49: Right Cervical Lateralis (Neck)
  { x: 28.9, y: 39.9 },  // 50: Left Zygion (Cheekbone)
  { x: 70.6, y: 39.8 },  // 51: Right Zygion (Cheekbone)
];

// Landmark metadata - 52 points (1-indexed to match FaceIQ)
export const LANDMARK_POINTS = [
  { id: 1, name: "Hairline", latin: "Trichion", description: "Center of hairline at forehead" },
  { id: 2, name: "Left Pupil", latin: "Left Pupil", description: "Center of left pupil" },
  { id: 3, name: "Right Pupil", latin: "Right Pupil", description: "Center of right pupil" },
  { id: 4, name: "Left Nose Side", latin: "Left Ala Nasi", description: "Outermost point of left nostril wing" },
  { id: 5, name: "Right Nose Side", latin: "Right Ala Nasi", description: "Outermost point of right nostril wing" },
  { id: 6, name: "Lower Lip Center", latin: "Labrale Inferius", description: "Center bottom of lower lip" },
  { id: 7, name: "Chin Bottom", latin: "Menton", description: "Lowest point of chin" },
  { id: 8, name: "Left Outer Ear", latin: "Left Tragion", description: "Left ear at face level" },
  { id: 9, name: "Right Outer Ear", latin: "Right Tragion", description: "Right ear at face level" },
  { id: 10, name: "Left Temple", latin: "Left Temporal", description: "Left temple, side of forehead" },
  { id: 11, name: "Right Temple", latin: "Right Temporal", description: "Right temple, side of forehead" },
  { id: 12, name: "Left Medial Canthus", latin: "Left Medial Canthus", description: "Inner corner of left eye" },
  { id: 13, name: "Left Lateral Canthus", latin: "Left Lateral Canthus", description: "Outer corner of left eye" },
  { id: 14, name: "Left Upper Eyelid", latin: "Left Upper Palpebra", description: "Top center of left upper eyelid" },
  { id: 15, name: "Left Lower Eyelid", latin: "Left Lower Palpebra", description: "Bottom center of left lower eyelid" },
  { id: 16, name: "Left Eyelid Hood", latin: "Left Sulcus Orbitalis", description: "Left eyelid hood outer edge" },
  { id: 17, name: "Left Brow Head", latin: "Left Brow Head", description: "Inner start of left eyebrow" },
  { id: 18, name: "Left Brow Inner Corner", latin: "Left Brow Inner", description: "Bottom-inner edge of left brow" },
  { id: 19, name: "Left Brow Arch", latin: "Left Brow Arch", description: "Arch of left eyebrow" },
  { id: 20, name: "Left Brow Peak", latin: "Left Brow Peak", description: "Highest point of left brow, toward the outer third" },
  { id: 21, name: "Left Brow Tail", latin: "Left Brow Tail", description: "Top-outer tip of left brow tail" },
  { id: 22, name: "Left Eyelid Crease", latin: "Left Upper Eyelid Crease", description: "Left upper eyelid crease" },
  { id: 23, name: "Right Medial Canthus", latin: "Right Medial Canthus", description: "Inner corner of right eye" },
  { id: 24, name: "Right Lateral Canthus", latin: "Right Lateral Canthus", description: "Outer corner of right eye" },
  { id: 25, name: "Right Upper Eyelid", latin: "Right Upper Palpebra", description: "Top center of right upper eyelid" },
  { id: 26, name: "Right Lower Eyelid", latin: "Right Lower Palpebra", description: "Bottom center of right lower eyelid" },
  { id: 27, name: "Right Eyelid Hood", latin: "Right Sulcus Orbitalis", description: "Right eyelid hood outer edge" },
  { id: 28, name: "Right Brow Head", latin: "Right Brow Head", description: "Inner start of right eyebrow" },
  { id: 29, name: "Right Brow Inner Corner", latin: "Right Brow Inner", description: "Bottom-inner edge of right brow" },
  { id: 30, name: "Right Brow Arch", latin: "Right Brow Arch", description: "Arch of right eyebrow" },
  { id: 31, name: "Right Brow Peak", latin: "Right Brow Peak", description: "Highest point of right brow, toward the outer third" },
  { id: 32, name: "Right Brow Tail", latin: "Right Brow Tail", description: "Top-outer tip of right brow tail" },
  { id: 33, name: "Right Eyelid Crease", latin: "Right Upper Eyelid Crease", description: "Right upper eyelid crease" },
  { id: 34, name: "Nasal Base", latin: "Sellion", description: "Top of nose bridge between eyes" },
  { id: 35, name: "Nose Bottom", latin: "Subnasale", description: "Base of nose at upper lip" },
  { id: 36, name: "Left Nose Bridge", latin: "Left Dorsum Nasi", description: "Left side of nose bridge" },
  { id: 37, name: "Right Nose Bridge", latin: "Right Dorsum Nasi", description: "Right side of nose bridge" },
  { id: 38, name: "Left Mouth Corner", latin: "Left Cheilion", description: "Left corner of mouth" },
  { id: 39, name: "Right Mouth Corner", latin: "Right Cheilion", description: "Right corner of mouth" },
  { id: 40, name: "Cupid's Bow", latin: "Labrale Superius", description: "Center top of upper lip" },
  { id: 41, name: "Inner Cupid's Bow", latin: "Cupid's Bow", description: "Inner edge of cupid's bow" },
  { id: 42, name: "Mouth Middle", latin: "Mouth Middle", description: "Center of mouth opening" },
  { id: 43, name: "Left Upper Jaw Angle", latin: "Left Gonion Superior", description: "Upper left jaw angle" },
  { id: 44, name: "Right Upper Jaw Angle", latin: "Right Gonion Superior", description: "Upper right jaw angle" },
  { id: 45, name: "Left Lower Jaw Angle", latin: "Left Gonion Inferior", description: "Lower left jaw angle" },
  { id: 46, name: "Right Lower Jaw Angle", latin: "Right Gonion Inferior", description: "Lower right jaw angle" },
  { id: 47, name: "Left Chin", latin: "Left Mentum Lateralis", description: "Left side of chin" },
  { id: 48, name: "Right Chin", latin: "Right Mentum Lateralis", description: "Right side of chin" },
  { id: 49, name: "Left Neck Point", latin: "Left Cervical Lateralis", description: "Left neck edge" },
  { id: 50, name: "Right Neck Point", latin: "Right Cervical Lateralis", description: "Right neck edge" },
  { id: 51, name: "Left Cheekbone", latin: "Left Zygion", description: "Most prominent point of left cheekbone" },
  { id: 52, name: "Right Cheekbone", latin: "Right Zygion", description: "Most prominent point of right cheekbone" },
];

export default function FaceReferenceImage({ activePointIndex, completedPoints }: FaceReferenceImageProps) {
  const [extraZoom, setExtraZoom] = useState(1); // 1 = normal, 1.5 = extra, 2 = max
  const currentPoint = LANDMARK_POINTS[activePointIndex];
  const baseZoomConfig = getZoomConfig(activePointIndex);

  // Apply extra zoom multiplier
  const zoomConfig = {
    ...baseZoomConfig,
    scale: baseZoomConfig.scale * extraZoom,
  };

  const cycleZoom = () => {
    if (extraZoom === 1) setExtraZoom(1.5);
    else if (extraZoom === 1.5) setExtraZoom(2);
    else setExtraZoom(1);
  };

  const getZoomLabel = () => {
    if (extraZoom === 1) return "1x";
    if (extraZoom === 1.5) return "1.5x";
    return "2x";
  };

  return (
    <div className="flex flex-col items-center">
      {/* Speech bubble with instruction */}
      <div className="relative mb-4 w-full">
        <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-black text-xs font-bold flex items-center justify-center">
              {activePointIndex + 1}
            </span>
            <span className="text-amber-400 font-medium text-sm">{currentPoint.name}</span>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed">
            {currentPoint.description}
          </p>
        </div>
        {/* Speech bubble pointer */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-800 border-r border-b border-zinc-700 rotate-45" />
      </div>

      {/* Reference image with dot overlay - zooms to relevant region */}
      <div className="relative bg-zinc-900 rounded-xl overflow-hidden" style={{ width: 250, height: 300 }}>
        {/* Zoom control button */}
        <button
          onClick={cycleZoom}
          className="absolute top-2 right-2 z-10 px-2 py-1 bg-black/60 hover:bg-black/80 rounded text-xs font-medium text-white transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          {getZoomLabel()}
        </button>
        {/* Zoomable container - wraps both image and dots so they move together */}
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoomConfig.scale})`,
            transformOrigin: `${zoomConfig.originX} ${zoomConfig.originY}`,
          }}
        >
          {/* Reference image */}
          <img
            src="/max.assistant.webp"
            alt="Face reference"
            className="w-full h-full object-cover"
            style={{ objectPosition: '50% 20%' }}
          />

          {/* Dot overlay - moves with zoom */}
          <div className="absolute inset-0">
            {LANDMARK_DOT_POSITIONS.map((pos, index) => {
              const isActive = index === activePointIndex;
              const isCompleted = completedPoints.includes(index);

              // Scale down the dot sizes when zoomed to keep them visually consistent
              const dotScale = 1 / zoomConfig.scale;

              return (
                <div
                  key={index}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: `translate(-50%, -50%) scale(${dotScale})`,
                  }}
                >
                  {/* Completed points - green */}
                  {isCompleted && !isActive && (
                    <div className="w-2 h-2 rounded-full bg-green-500 opacity-80" />
                  )}

                  {/* Inactive points - faint grey */}
                  {!isCompleted && !isActive && (
                    <div className="w-2 h-2 rounded-full bg-zinc-600 opacity-40" />
                  )}

                  {/* Active point - same size as others, just orange */}
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Point counter */}
      <div className="mt-4 text-center">
        <span className="text-zinc-500 text-xs">
          Point {activePointIndex + 1} of {LANDMARK_POINTS.length}
        </span>
      </div>
    </div>
  );
}
