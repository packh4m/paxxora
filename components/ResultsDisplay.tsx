"use client";

import { useState, useMemo } from "react";
import { AnalysisResult, MetricCategory, MetricResult, VisionScores, VISION_METRIC_LABELS } from "@/lib/types";
import MetricCard from "./MetricCard";
import LandmarkOverlay from "./LandmarkOverlay";
import MetricDetailModal from "./MetricDetailModal";
import { getScoreColor, getScoreLabel, calculateOverallScore } from "@/lib/scoring";

interface ResultsDisplayProps {
  result: AnalysisResult;
  onReset: () => void;
}

// Define which categories belong to Harmony vs Features
const HARMONY_CATEGORIES: MetricCategory[] = ["Facial Thirds", "Eyes"];
const FEATURES_CATEGORIES: MetricCategory[] = ["Nose", "Jaw", "Lips", "Brows", "Features"];

// Score circle component
function ScoreCircle({ score, size = "large", label }: { score: number; size?: "large" | "medium" | "small"; label?: string }) {
  const color = getScoreColor(score);
  const scoreLabel = label || getScoreLabel(score);
  const circumference = 2 * Math.PI * 45;
  const progress = (score / 10) * circumference;

  const sizeClasses = size === "large"
    ? "w-36 h-36"
    : size === "medium"
    ? "w-24 h-24"
    : "w-16 h-16";
  const textSize = size === "large"
    ? "text-5xl"
    : size === "medium"
    ? "text-2xl"
    : "text-lg";
  const labelSize = size === "large"
    ? "text-xs"
    : size === "medium"
    ? "text-[10px]"
    : "text-[8px]";

  return (
    <div className={`relative ${sizeClasses}`}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#27272a"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${textSize} font-bold`} style={{ color }}>
          {score.toFixed(1)}
        </span>
        <span className={`${labelSize} text-zinc-400 mt-0.5`}>{scoreLabel}</span>
      </div>
    </div>
  );
}

// Vision metric row component
function VisionMetricRow({ name, score }: { name: string; score: number }) {
  const color = getScoreColor(score);
  const percentage = (score / 10) * 100;

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-zinc-300 w-40 flex-shrink-0">{name}</span>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-semibold w-10 text-right" style={{ color }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// Category dropdown component
function CategoryDropdown({
  title,
  metrics,
  isExpanded,
  onToggle,
  onMetricClick
}: {
  title: string;
  metrics: MetricResult[];
  isExpanded: boolean;
  onToggle: () => void;
  onMetricClick: (id: string) => void;
}) {
  // Calculate category average score
  const validScores = metrics.filter(m => m.score !== null).map(m => m.score as number);
  const avgScore = validScores.length > 0
    ? validScores.reduce((a, b) => a + b, 0) / validScores.length
    : 0;

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">{title}</span>
          <span className="text-xs text-zinc-500">
            {metrics.length} metrics
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-semibold"
            style={{ color: getScoreColor(avgScore) }}
          >
            {avgScore.toFixed(1)}
          </span>
          <svg
            className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 space-y-2">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.definition.id}
              metric={metric}
              onClick={() => onMetricClick(metric.definition.id)}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main score section component
function ScoreSection({
  title,
  subtitle,
  score,
  metrics,
  expandedCategories,
  onToggleCategory,
  onMetricClick,
}: {
  title: string;
  subtitle: string;
  score: number;
  metrics: { category: MetricCategory; metrics: MetricResult[] }[];
  expandedCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  onMetricClick: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      {/* Main header - clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-5">
          <ScoreCircle score={score} size="medium" />
          <div className="text-left">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {isExpanded ? "Hide" : "Show"} details
          </span>
          <svg
            className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-3">
          {metrics.map(({ category, metrics: catMetrics }) => (
            <CategoryDropdown
              key={category}
              title={category}
              metrics={catMetrics}
              isExpanded={expandedCategories.has(category)}
              onToggle={() => onToggleCategory(category)}
              onMetricClick={onMetricClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Angularity sub-score row component
function AngularitySubScoreRow({ name, score }: { name: string; score: number }) {
  const color = getScoreColor(score);
  const percentage = (score / 10) * 100;

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-zinc-300 w-44 flex-shrink-0">{name}</span>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-semibold w-10 text-right" style={{ color }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// Angularity Section
function AngularitySection({ metrics }: { metrics: MetricResult[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to get a metric's score
  const getScore = (metricId: string): number => {
    const result = metrics.find(r => r.definition.id === metricId);
    return result?.score ?? 5.0;
  };

  // Calculate the 5 sub-scores
  const subScores = useMemo(() => {
    const jawDefinition = (getScore("jaw_frontal_angle") * 0.5) + (getScore("jaw_slope") * 0.5);
    const chinDefinition = (getScore("chin_philtrum") * 0.6) + (getScore("lower_third_proportion") * 0.4);
    const cheekboneProminence = (getScore("cheekbone_height") * 0.6) + (getScore("face_width_height") * 0.4);
    const cheekLeanness = (getScore("midface_ratio") * 0.5) + (getScore("bigonial_width") * 0.5);
    const submentalDefinition = (getScore("neck_width") * 0.6) + (getScore("jaw_slope") * 0.4);

    return {
      jawDefinition: Math.round(jawDefinition * 10) / 10,
      chinDefinition: Math.round(chinDefinition * 10) / 10,
      cheekboneProminence: Math.round(cheekboneProminence * 10) / 10,
      cheekLeanness: Math.round(cheekLeanness * 10) / 10,
      submentalDefinition: Math.round(submentalDefinition * 10) / 10,
    };
  }, [metrics]);

  // Get overall angularity score from metrics
  const angularityScore = useMemo(() => {
    const angularityMetric = metrics.find(m => m.definition.id === "angularity_score");
    return angularityMetric?.score ?? 5.0;
  }, [metrics]);

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-5">
          <ScoreCircle score={angularityScore} size="medium" />
          <div className="text-left">
            <h3 className="text-xl font-bold text-white">Angularity</h3>
            <p className="text-sm text-zinc-400 mt-1">Facial definition and sharpness</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {isExpanded ? "Hide" : "Show"} details
          </span>
          <svg
            className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6">
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-1">
            <AngularitySubScoreRow name="Jaw Definition" score={subScores.jawDefinition} />
            <AngularitySubScoreRow name="Chin Definition" score={subScores.chinDefinition} />
            <AngularitySubScoreRow name="Cheekbone Prominence" score={subScores.cheekboneProminence} />
            <AngularitySubScoreRow name="Cheek Leanness" score={subScores.cheekLeanness} />
            <AngularitySubScoreRow name="Submental Definition" score={subScores.submentalDefinition} />
          </div>
        </div>
      )}
    </div>
  );
}

// Dimorphism sub-score row component
function DimorphismSubScoreRow({ name, score }: { name: string; score: number }) {
  const color = getScoreColor(score);
  const percentage = (score / 10) * 100;

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-zinc-300 w-44 flex-shrink-0">{name}</span>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-semibold w-10 text-right" style={{ color }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// Dimorphism Section
function DimorphismSection({ metrics }: { metrics: MetricResult[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to get a metric's score
  const getScore = (metricId: string): number => {
    const result = metrics.find(r => r.definition.id === metricId);
    return result?.score ?? 5.0;
  };

  // Calculate the 6 sub-scores
  const subScores = useMemo(() => {
    const jaw = (getScore("jaw_frontal_angle") * 0.4) + (getScore("bigonial_width") * 0.3) + (getScore("jaw_slope") * 0.3);
    const eyes = (getScore("canthal_tilt") * 0.5) + (getScore("eye_aspect_ratio") * 0.5);
    const faceShape = (getScore("face_width_height") * 0.5) + (getScore("total_face_width_height") * 0.5);
    const nose = (getScore("intercanthal_nasal") * 0.6) + (getScore("middle_third") * 0.4);
    const browRidge = (getScore("eyebrow_tilt") * 0.6) + (getScore("brow_length_ratio") * 0.4);
    const lips = (getScore("chin_philtrum") * 0.5) + (getScore("lower_third_proportion") * 0.5);

    return {
      jaw: Math.round(jaw * 10) / 10,
      eyes: Math.round(eyes * 10) / 10,
      faceShape: Math.round(faceShape * 10) / 10,
      nose: Math.round(nose * 10) / 10,
      browRidge: Math.round(browRidge * 10) / 10,
      lips: Math.round(lips * 10) / 10,
    };
  }, [metrics]);

  // Get overall dimorphism score from metrics
  const dimorphismScore = useMemo(() => {
    const dimorphismMetric = metrics.find(m => m.definition.id === "dimorphism_score");
    return dimorphismMetric?.score ?? 5.0;
  }, [metrics]);

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-5">
          <ScoreCircle score={dimorphismScore} size="medium" />
          <div className="text-left">
            <h3 className="text-xl font-bold text-white">Dimorphism</h3>
            <p className="text-sm text-zinc-400 mt-1">Sexual dimorphism and masculinity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {isExpanded ? "Hide" : "Show"} details
          </span>
          <svg
            className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6">
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-1">
            <DimorphismSubScoreRow name="Jaw" score={subScores.jaw} />
            <DimorphismSubScoreRow name="Eyes" score={subScores.eyes} />
            <DimorphismSubScoreRow name="Face Shape" score={subScores.faceShape} />
            <DimorphismSubScoreRow name="Nose" score={subScores.nose} />
            <DimorphismSubScoreRow name="Brow Ridge" score={subScores.browRidge} />
            <DimorphismSubScoreRow name="Lips" score={subScores.lips} />
          </div>
        </div>
      )}
    </div>
  );
}

// Vision Analysis Section
function VisionSection({ visionScores, visionError, isLoading }: {
  visionScores?: VisionScores;
  visionError?: string;
  isLoading: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate overall vision score
  const overallVisionScore = useMemo(() => {
    if (!visionScores) return 0;
    const scores = [
      visionScores.jaw_definition,
      visionScores.cheekbone_prominence,
      visionScores.skin_quality,
      visionScores.sexual_dimorphism,
      visionScores.facial_fat,
      visionScores.overall_harmony,
      visionScores.eye_appeal,
      visionScores.overall_impression,
    ];
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [visionScores]);

  if (isLoading) {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden p-6">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-zinc-800 animate-pulse flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">AI Vision Analysis</h3>
            <p className="text-sm text-amber-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              Analyzing facial features...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (visionError) {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden p-6">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">AI Vision Analysis</h3>
            <p className="text-sm text-zinc-400 mt-1">Vision analysis unavailable</p>
            <p className="text-xs text-zinc-500 mt-1">{visionError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!visionScores) return null;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-5">
          <ScoreCircle score={overallVisionScore} size="medium" />
          <div className="text-left">
            <h3 className="text-xl font-bold text-white">AI Vision Analysis</h3>
            <p className="text-sm text-zinc-400 mt-1">Subjective aesthetic assessment by AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {isExpanded ? "Hide" : "Show"} details
          </span>
          <svg
            className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6">
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-1">
            {(Object.keys(VISION_METRIC_LABELS) as Array<keyof typeof VISION_METRIC_LABELS>).map((key) => (
              <VisionMetricRow
                key={key}
                name={VISION_METRIC_LABELS[key]}
                score={visionScores[key]}
              />
            ))}
          </div>
          {visionScores.reasoning && (
            <div className="mt-4 p-4 bg-zinc-800/30 rounded-xl border border-zinc-700">
              <p className="text-xs text-zinc-500 mb-1">AI Analysis</p>
              <p className="text-sm text-zinc-300">{visionScores.reasoning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResultsDisplay({ result, onReset }: ResultsDisplayProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [selectedMetricIndex, setSelectedMetricIndex] = useState<number | null>(null);

  // Calculate Harmony and Features scores
  const { harmonyScore, featuresScore, harmonyMetrics, featuresMetrics } = useMemo(() => {
    const harmonyMetrics = HARMONY_CATEGORIES.map(category => ({
      category,
      metrics: result.metrics.filter(m => m.definition.category === category),
    }));

    const featuresMetrics = FEATURES_CATEGORIES.map(category => ({
      category,
      metrics: result.metrics.filter(m => m.definition.category === category),
    }));

    // Calculate scores using the same method as overall
    const harmonyScores = harmonyMetrics.flatMap(c => c.metrics).filter(m => m.score !== null).map(m => m.score as number);
    const harmonyIds = harmonyMetrics.flatMap(c => c.metrics).filter(m => m.score !== null).map(m => m.definition.id);
    const harmonyScore = calculateOverallScore(harmonyScores, harmonyIds);

    const featuresScores = featuresMetrics.flatMap(c => c.metrics).filter(m => m.score !== null).map(m => m.score as number);
    const featuresIds = featuresMetrics.flatMap(c => c.metrics).filter(m => m.score !== null).map(m => m.definition.id);
    const featuresScore = calculateOverallScore(featuresScores, featuresIds);

    return { harmonyScore, featuresScore, harmonyMetrics, featuresMetrics };
  }, [result.metrics]);

  // Calculate vision score average
  const visionScore = useMemo(() => {
    if (!result.visionScores) return null;
    const scores = [
      result.visionScores.jaw_definition,
      result.visionScores.cheekbone_prominence,
      result.visionScores.skin_quality,
      result.visionScores.sexual_dimorphism,
      result.visionScores.facial_fat,
      result.visionScores.overall_harmony,
      result.visionScores.eye_appeal,
      result.visionScores.overall_impression,
    ];
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [result.visionScores]);

  // Calculate final score (50% geometric + 50% vision)
  const finalScore = useMemo(() => {
    if (result.finalScore !== undefined) return result.finalScore;
    if (visionScore !== null) {
      return (result.overallScore * 0.5) + (visionScore * 0.5);
    }
    return result.overallScore;
  }, [result.overallScore, result.finalScore, visionScore]);

  const handleMetricClick = (metricId: string) => {
    const index = result.metrics.findIndex((m) => m.definition.id === metricId);
    if (index !== -1 && result.metrics[index].value !== null) {
      setSelectedMetricIndex(index);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Check if vision is still loading (no scores and no error)
  const visionLoading = !result.visionScores && !result.visionError && result.visionScores === undefined && result.visionError === undefined;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">LooksLadder</h1>
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Analyze New Photo
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Final Overall Score Section */}
        <div className="text-center mb-8">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">Final Score</h2>
          <div className="flex justify-center mb-4">
            <ScoreCircle score={finalScore} size="large" />
          </div>

          {/* Score breakdown */}
          <div className="flex justify-center gap-8 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: getScoreColor(result.overallScore) }}>
                {result.overallScore.toFixed(1)}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Geometric Score</div>
              <div className="text-[10px] text-zinc-600">33 facial measurements</div>
            </div>

            <div className="w-px bg-zinc-700" />

            <div className="text-center">
              {visionScore !== null ? (
                <>
                  <div className="text-2xl font-bold" style={{ color: getScoreColor(visionScore) }}>
                    {visionScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Vision Score</div>
                  <div className="text-[10px] text-zinc-600">AI visual analysis</div>
                </>
              ) : result.visionError ? (
                <>
                  <div className="text-2xl font-bold text-zinc-600">--</div>
                  <div className="text-xs text-zinc-500 mt-1">Vision Score</div>
                  <div className="text-[10px] text-zinc-600">Unavailable</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-zinc-600 animate-pulse">...</div>
                  <div className="text-xs text-zinc-500 mt-1">Vision Score</div>
                  <div className="text-[10px] text-amber-500">Analyzing...</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Photo with toggle */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-400">Analyzed Photo</span>
            <button
              onClick={() => setShowLandmarks(!showLandmarks)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                showLandmarks
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              {showLandmarks ? "Landmarks ON" : "Landmarks OFF"}
            </button>
          </div>
          <div className="flex justify-center">
            {showLandmarks && result.landmarks && result.imageWidth && result.imageHeight ? (
              <div className="max-w-sm">
                <LandmarkOverlay
                  imageUrl={result.imageUrl}
                  landmarks={result.landmarks}
                  imageWidth={result.imageWidth}
                  imageHeight={result.imageHeight}
                />
              </div>
            ) : (
              <img
                src={result.imageUrl}
                alt="Analyzed photo"
                className="max-w-sm w-full rounded-xl object-cover"
              />
            )}
          </div>
        </div>

        {/* Geometric Analysis Section */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 px-1">Geometric Analysis</h3>
          <div className="space-y-4">
            <ScoreSection
              title="Harmony"
              subtitle="Facial proportions, symmetry, and balance"
              score={harmonyScore}
              metrics={harmonyMetrics}
              expandedCategories={expandedCategories}
              onToggleCategory={toggleCategory}
              onMetricClick={handleMetricClick}
            />

            <ScoreSection
              title="Features"
              subtitle="Individual facial feature quality"
              score={featuresScore}
              metrics={featuresMetrics}
              expandedCategories={expandedCategories}
              onToggleCategory={toggleCategory}
              onMetricClick={handleMetricClick}
            />

            <AngularitySection metrics={result.metrics} />

            <DimorphismSection metrics={result.metrics} />
          </div>
        </div>

        {/* Vision Analysis Section */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 px-1">Vision Analysis</h3>
          <VisionSection
            visionScores={result.visionScores}
            visionError={result.visionError}
            isLoading={visionLoading}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-zinc-500">
          <p>
            LooksLadder provides facial analysis for informational purposes only.
          </p>
        </div>
      </footer>

      {/* Metric Detail Modal */}
      {selectedMetricIndex !== null && result.landmarks && result.imageWidth && result.imageHeight && (
        <MetricDetailModal
          metric={result.metrics[selectedMetricIndex]}
          metrics={result.metrics}
          currentIndex={selectedMetricIndex}
          imageUrl={result.imageUrl}
          landmarks={result.landmarks}
          imageWidth={result.imageWidth}
          imageHeight={result.imageHeight}
          onClose={() => setSelectedMetricIndex(null)}
          onNavigate={(index) => setSelectedMetricIndex(index)}
        />
      )}
    </div>
  );
}
