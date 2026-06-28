"use client";

interface ScoreBarProps {
  score: number | null;
}

export default function ScoreBar({ score }: ScoreBarProps) {
  if (score === null) {
    return (
      <div className="relative h-2 w-full rounded-full bg-gray-700">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] text-gray-500">N/A</span>
        </div>
      </div>
    );
  }

  // Score position (0-10 maps to 0-100%)
  const position = (score / 10) * 100;

  return (
    <div className="relative h-2 w-full">
      {/* Gradient background */}
      <div className="absolute inset-0 rounded-full score-gradient opacity-80" />

      {/* Score marker */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300"
        style={{ left: `${position}%` }}
      >
        {/* Marker dot */}
        <div className="w-3 h-3 rounded-full bg-white shadow-lg border-2 border-gray-900" />
      </div>

      {/* Scale markers */}
      <div className="absolute -bottom-4 left-0 text-[9px] text-gray-500">0</div>
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-gray-500">
        5
      </div>
      <div className="absolute -bottom-4 right-0 text-[9px] text-gray-500">10</div>
    </div>
  );
}
