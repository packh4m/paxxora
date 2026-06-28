"use client";

import { MetricResult } from "@/lib/types";
import { getScoreColor } from "@/lib/scoring";
import ScoreBar from "./ScoreBar";

interface MetricCardProps {
  metric: MetricResult;
  onClick?: () => void;
  compact?: boolean;
}

export default function MetricCard({ metric, onClick, compact = false }: MetricCardProps) {
  const { definition, score, displayValue } = metric;
  const scoreColor = score !== null ? getScoreColor(score) : "#6b7280";
  const isClickable = score !== null && onClick;

  if (compact) {
    return (
      <div
        onClick={isClickable ? onClick : undefined}
        className={`bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 transition-all ${
          isClickable
            ? "cursor-pointer hover:border-zinc-600 hover:bg-zinc-800"
            : ""
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-white">{definition.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">{displayValue}</span>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: scoreColor }}
            >
              {score !== null ? score.toFixed(1) : "N/A"}
            </span>
          </div>
        </div>
        <ScoreBar score={score} />
      </div>
    );
  }

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`bg-surface rounded-lg p-4 border border-border transition-all ${
        isClickable
          ? "cursor-pointer hover:border-gray-500 hover:bg-surface-light hover:scale-[1.02]"
          : "hover:border-gray-600"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white">{definition.name}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{definition.description}</p>
        </div>
        <div className="flex flex-col items-end ml-3">
          <span
            className="text-xl font-bold tabular-nums"
            style={{ color: scoreColor }}
          >
            {score !== null ? score.toFixed(1) : "N/A"}
          </span>
          <span className="text-xs text-gray-400">{displayValue}</span>
        </div>
      </div>

      <div className="pt-2 flex items-center gap-2">
        <div className="flex-1">
          <ScoreBar score={score} />
        </div>
        {isClickable && (
          <svg
            className="w-4 h-4 text-gray-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
