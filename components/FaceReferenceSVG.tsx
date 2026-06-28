"use client";

interface FaceReferenceSVGProps {
  activePointIndex: number;
  completedPoints: number[];
}

// All 33 landmark points with their SVG coordinates and metadata
export const LANDMARK_POINTS = [
  // EYES (8 points)
  { id: 0, name: "Left Eye - Outer Corner", svgX: 62, svgY: 95, description: "Outer corner where left eye meets the temple side" },
  { id: 1, name: "Left Eye - Inner Corner", svgX: 82, svgY: 95, description: "Inner corner of left eye, nearest to nose bridge" },
  { id: 2, name: "Left Eye - Top Center", svgX: 72, svgY: 89, description: "Highest point of left upper eyelid" },
  { id: 3, name: "Left Eye - Bottom Center", svgX: 72, svgY: 101, description: "Lowest point of left lower eyelid" },
  { id: 4, name: "Right Eye - Outer Corner", svgX: 138, svgY: 95, description: "Outer corner where right eye meets the temple side" },
  { id: 5, name: "Right Eye - Inner Corner", svgX: 118, svgY: 95, description: "Inner corner of right eye, nearest to nose bridge" },
  { id: 6, name: "Right Eye - Top Center", svgX: 128, svgY: 89, description: "Highest point of right upper eyelid" },
  { id: 7, name: "Right Eye - Bottom Center", svgX: 128, svgY: 101, description: "Lowest point of right lower eyelid" },

  // EYEBROWS (4 points)
  { id: 8, name: "Left Brow - Inner End", svgX: 78, svgY: 75, description: "Inner end of left eyebrow, above inner eye corner" },
  { id: 9, name: "Left Brow - Outer End", svgX: 55, svgY: 78, description: "Outer end of left eyebrow, near temple" },
  { id: 10, name: "Right Brow - Inner End", svgX: 122, svgY: 75, description: "Inner end of right eyebrow, above inner eye corner" },
  { id: 11, name: "Right Brow - Outer End", svgX: 145, svgY: 78, description: "Outer end of right eyebrow, near temple" },

  // NOSE (5 points)
  { id: 12, name: "Nose Bridge (Sellion)", svgX: 100, svgY: 88, description: "Top of nose bridge, between the eyes at brow level" },
  { id: 13, name: "Nose Tip (Pronasale)", svgX: 100, svgY: 130, description: "Tip of the nose, the most projecting point" },
  { id: 14, name: "Left Alar", svgX: 88, svgY: 138, description: "Left nostril wing, outermost point of left nostril" },
  { id: 15, name: "Right Alar", svgX: 112, svgY: 138, description: "Right nostril wing, outermost point of right nostril" },
  { id: 16, name: "Subnasale", svgX: 100, svgY: 142, description: "Base of nose where it meets the upper lip" },

  // MOUTH (5 points)
  { id: 17, name: "Mouth - Left Corner", svgX: 80, svgY: 165, description: "Left corner of the mouth (commissure)" },
  { id: 18, name: "Mouth - Right Corner", svgX: 120, svgY: 165, description: "Right corner of the mouth (commissure)" },
  { id: 19, name: "Upper Lip - Top Center", svgX: 100, svgY: 152, description: "Center top of upper lip (Cupid's bow peak)" },
  { id: 20, name: "Upper Lip - Bottom", svgX: 100, svgY: 162, description: "Bottom edge of upper lip (vermilion border)" },
  { id: 21, name: "Lower Lip - Bottom", svgX: 100, svgY: 175, description: "Bottom center of lower lip" },

  // JAW & FACE STRUCTURE (8 points)
  { id: 22, name: "Chin (Menton)", svgX: 100, svgY: 210, description: "Lowest point of the chin" },
  { id: 23, name: "Left Jaw Angle (Gonion)", svgX: 50, svgY: 165, description: "Left jaw corner, where jaw turns upward" },
  { id: 24, name: "Right Jaw Angle (Gonion)", svgX: 150, svgY: 165, description: "Right jaw corner, where jaw turns upward" },
  { id: 25, name: "Left Cheekbone", svgX: 55, svgY: 115, description: "Most prominent point of left cheekbone" },
  { id: 26, name: "Right Cheekbone", svgX: 145, svgY: 115, description: "Most prominent point of right cheekbone" },
  { id: 27, name: "Left Temple", svgX: 45, svgY: 75, description: "Left temple, side of forehead above cheekbone" },
  { id: 28, name: "Right Temple", svgX: 155, svgY: 75, description: "Right temple, side of forehead above cheekbone" },
  { id: 29, name: "Glabella", svgX: 100, svgY: 72, description: "Center point between eyebrows" },

  // EARS (4 points) - Note: typically not detectable from frontal photos
  { id: 30, name: "Left Ear - Top", svgX: 35, svgY: 85, description: "Top of left ear (helix)" },
  { id: 31, name: "Left Ear - Bottom", svgX: 38, svgY: 130, description: "Bottom of left ear (earlobe)" },
  { id: 32, name: "Right Ear - Top", svgX: 165, svgY: 85, description: "Top of right ear (helix)" },
  { id: 33, name: "Right Ear - Bottom", svgX: 162, svgY: 130, description: "Bottom of right ear (earlobe)" },
];

export default function FaceReferenceSVG({ activePointIndex, completedPoints }: FaceReferenceSVGProps) {
  return (
    <svg
      viewBox="0 0 200 250"
      className="w-full max-w-[200px] h-auto"
      style={{ filter: "drop-shadow(0 0 10px rgba(0,0,0,0.5))" }}
    >
      {/* Background */}
      <rect width="200" height="250" fill="#1a1a1a" rx="8" />

      {/* Face oval */}
      <ellipse
        cx="100"
        cy="130"
        rx="60"
        ry="85"
        fill="none"
        stroke="#444"
        strokeWidth="1.5"
      />

      {/* Hairline hint */}
      <path
        d="M 45 70 Q 100 35 155 70"
        fill="none"
        stroke="#333"
        strokeWidth="1"
      />

      {/* Left eyebrow */}
      <path
        d="M 55 78 Q 67 72 78 75"
        fill="none"
        stroke="#555"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Right eyebrow */}
      <path
        d="M 122 75 Q 133 72 145 78"
        fill="none"
        stroke="#555"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Left eye */}
      <ellipse
        cx="72"
        cy="95"
        rx="12"
        ry="7"
        fill="none"
        stroke="#555"
        strokeWidth="1.5"
      />
      {/* Left iris */}
      <circle cx="72" cy="95" r="4" fill="#333" />

      {/* Right eye */}
      <ellipse
        cx="128"
        cy="95"
        rx="12"
        ry="7"
        fill="none"
        stroke="#555"
        strokeWidth="1.5"
      />
      {/* Right iris */}
      <circle cx="128" cy="95" r="4" fill="#333" />

      {/* Nose bridge */}
      <path
        d="M 100 88 L 100 130"
        fill="none"
        stroke="#444"
        strokeWidth="1"
      />

      {/* Nose tip/wings */}
      <path
        d="M 88 138 Q 94 145 100 142 Q 106 145 112 138"
        fill="none"
        stroke="#555"
        strokeWidth="1.5"
      />

      {/* Nostrils hint */}
      <ellipse cx="92" cy="136" rx="4" ry="3" fill="none" stroke="#444" strokeWidth="0.8" />
      <ellipse cx="108" cy="136" rx="4" ry="3" fill="none" stroke="#444" strokeWidth="0.8" />

      {/* Upper lip */}
      <path
        d="M 80 165 Q 90 158 100 152 Q 110 158 120 165"
        fill="none"
        stroke="#555"
        strokeWidth="1.5"
      />

      {/* Lower lip */}
      <path
        d="M 80 165 Q 100 182 120 165"
        fill="none"
        stroke="#555"
        strokeWidth="1.5"
      />

      {/* Lip line */}
      <path
        d="M 82 165 Q 100 168 118 165"
        fill="none"
        stroke="#444"
        strokeWidth="0.8"
      />

      {/* Left ear */}
      <path
        d="M 40 85 Q 30 105 38 130 Q 42 135 45 125"
        fill="none"
        stroke="#444"
        strokeWidth="1.5"
      />

      {/* Right ear */}
      <path
        d="M 160 85 Q 170 105 162 130 Q 158 135 155 125"
        fill="none"
        stroke="#444"
        strokeWidth="1.5"
      />

      {/* Neck */}
      <path
        d="M 70 210 L 65 245"
        fill="none"
        stroke="#444"
        strokeWidth="1.5"
      />
      <path
        d="M 130 210 L 135 245"
        fill="none"
        stroke="#444"
        strokeWidth="1.5"
      />

      {/* Jaw line enhancement */}
      <path
        d="M 50 165 Q 75 200 100 210 Q 125 200 150 165"
        fill="none"
        stroke="#444"
        strokeWidth="1"
        strokeDasharray="3,3"
      />

      {/* All landmark points */}
      {LANDMARK_POINTS.map((point, index) => {
        const isActive = index === activePointIndex;
        const isCompleted = completedPoints.includes(index);

        return (
          <g key={point.id}>
            {/* Completed points - green */}
            {isCompleted && !isActive && (
              <circle
                cx={point.svgX}
                cy={point.svgY}
                r="4"
                fill="#22c55e"
                opacity="0.8"
              />
            )}

            {/* Inactive points - faint grey */}
            {!isCompleted && !isActive && (
              <circle
                cx={point.svgX}
                cy={point.svgY}
                r="3"
                fill="#444"
                opacity="0.5"
              />
            )}

            {/* Active point - pulsing yellow */}
            {isActive && (
              <>
                {/* Glow effect */}
                <circle
                  cx={point.svgX}
                  cy={point.svgY}
                  r="12"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  opacity="0.3"
                  className="animate-ping"
                />
                {/* Outer ring */}
                <circle
                  cx={point.svgX}
                  cy={point.svgY}
                  r="8"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  className="animate-pulse"
                />
                {/* Inner dot */}
                <circle
                  cx={point.svgX}
                  cy={point.svgY}
                  r="4"
                  fill="#fbbf24"
                  className="animate-pulse"
                />
              </>
            )}
          </g>
        );
      })}

      {/* Labels for key areas (subtle) */}
      <text x="72" y="115" fontSize="6" fill="#333" textAnchor="middle">L</text>
      <text x="128" y="115" fontSize="6" fill="#333" textAnchor="middle">R</text>
    </svg>
  );
}
