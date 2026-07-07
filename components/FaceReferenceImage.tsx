"use client";

import { useState } from "react";

interface FaceReferenceImageProps {
  activePointIndex: number;
  completedPoints: number[];
}

const LANDMARK_CROP_FILES: Record<number, string> = {
  0: "hairline.png",
  1: "left pupil.png",
  2: "right pupil.png",
  3: "left nostril.png",
  4: "right nostril.png",
  5: "bottom lip.png",
  6: "chin.png",
  7: "left outer ear.png",
  8: "right outer ear.png",
  9: "left temple.png",
  10: "right temple.png",
  11: "left inner eye.png",
  12: "left outer eye.png",
  13: "left top eyelid.png",
  14: "left bottom eyelid.png",
  15: "left eye hood.png",
  16: "left browhead.png",
  17: "left brow inner.png",
  18: "left brow arch.png",
  19: "left brow peak.png",
  20: "left brow tail.png",
  21: "left lid crease.png",
  22: "right inner eye.png",
  23: "right outer eye.png",
  24: "right top eyelid.png",
  25: "right bottom eyelid.png",
  26: "right eye hood.png",
  27: "right browhead.png",
  28: "right brow inner.png",
  29: "right brow arch.png",
  30: "right brow peak.png",
  31: "right brow tail.png",
  32: "right lid crease.png",
  33: "nasal base.png",
  34: "nose base.png",
  35: "left nose bridge.png",
  36: "right nose bridge.png",
  37: "left mouth corner.png",
  38: "right mouth corner.png",
  39: "cupids bow.png",
  40: "inner cupids bow.png",
  41: "middle mouth.png",
  42: "left top jaw.png",
  43: "right top jaw.png",
  44: "left middle jaw.png",
  45: "right middle jaw.png",
  46: "leftside chin.png",
  47: "rightside chin.png",
  48: "left neck.png",
  49: "right neck.png",
  50: "left cheekbone.png",
  51: "right cheekbone.png",
};

export const LANDMARK_DOT_POSITIONS: { x: number; y: number }[] = [
  { x: 49.2, y: 18.5 }, { x: 40.3, y: 36.5 }, { x: 59.8, y: 36.4 },
  { x: 44.6, y: 47.5 }, { x: 56, y: 47.5 }, { x: 50.4, y: 57.3 },
  { x: 50.1, y: 66.8 }, { x: 23.4, y: 38.4 }, { x: 75.7, y: 38.9 },
  { x: 31.7, y: 24.7 }, { x: 67.6, y: 24.3 }, { x: 45, y: 37.4 },
  { x: 36.5, y: 37 }, { x: 40.2, y: 35.6 }, { x: 40.2, y: 38.2 },
  { x: 35.3, y: 36.6 }, { x: 47.3, y: 33.4 }, { x: 47.3, y: 35.2 },
  { x: 36.3, y: 34.8 }, { x: 36.4, y: 31.8 }, { x: 31.7, y: 36.4 },
  { x: 40.2, y: 35.1 }, { x: 55.2, y: 37.4 }, { x: 63.5, y: 37 },
  { x: 59.7, y: 35.4 }, { x: 60, y: 38 }, { x: 65.1, y: 36.6 },
  { x: 53.2, y: 33.3 }, { x: 53.2, y: 35.1 }, { x: 64.7, y: 34.9 },
  { x: 64.3, y: 31.9 }, { x: 68.2, y: 36 }, { x: 59.7, y: 35 },
  { x: 53.6, y: 48.8 }, { x: 50.4, y: 49 }, { x: 47.5, y: 40.8 },
  { x: 53.2, y: 40.7 }, { x: 42.3, y: 54.7 }, { x: 58.3, y: 54.7 },
  { x: 52.5, y: 53.1 }, { x: 50.2, y: 54.1 }, { x: 50.2, y: 55.1 },
  { x: 32.2, y: 55.4 }, { x: 68, y: 54.9 }, { x: 35.6, y: 59.7 },
  { x: 64.9, y: 59.6 }, { x: 41.6, y: 64.5 }, { x: 59.9, y: 64 },
  { x: 32.9, y: 59.1 }, { x: 67.1, y: 59.6 }, { x: 28.9, y: 39.9 },
  { x: 70.6, y: 39.8 },
];

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
  const currentPoint = LANDMARK_POINTS[activePointIndex];
  const hasCrop = activePointIndex in LANDMARK_CROP_FILES;

  return (
    <div className="flex flex-col items-center">
      {/* Point info */}
      <div className="w-full mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-5 h-5 rounded-full bg-black text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
            {activePointIndex + 1}
          </span>
          <span className="text-sm font-medium text-black">{currentPoint.name}</span>
        </div>
        <p className="text-xs text-zinc-400 italic">{currentPoint.latin}</p>
        <p className="text-xs text-zinc-500 mt-1">{currentPoint.description}</p>
      </div>

      {/* Reference image */}
      <div
        className="relative bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 w-full"
        style={{ height: 220 }}
      >
        {hasCrop ? (
          <img
            src={`/landmarks/${LANDMARK_CROP_FILES[activePointIndex]}`}
            alt={`${currentPoint.name} reference`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-xs text-zinc-400">No reference image</p>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400 mt-2 font-mono">
        Point {activePointIndex + 1} of {LANDMARK_POINTS.length}
      </p>
    </div>
  );
}