"use client";

import { getScoreColor, getScoreLabel } from "@/lib/scoring";

interface OverallScoreProps {
  score: number;
}

export default function OverallScore({ score }: OverallScoreProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  // Calculate ring progress (score out of 10)
  const circumference = 2 * Math.PI * 54; // radius of 54
  const progress = (score / 10) * circumference;
  const offset = circumference - progress;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Background ring */}
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-bold tabular-nums"
            style={{ color }}
          >
            {score.toFixed(1)}
          </span>
          <span className="text-xs text-gray-400 mt-1">out of 10</span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span
          className="text-sm font-medium px-3 py-1 rounded-full"
          style={{
            color,
            backgroundColor: `${color}20`,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
