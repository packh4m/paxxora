"use client";

import { useState, useMemo } from "react";
import { AnalysisResult, MetricCategory, MetricResult, VisionScores, VISION_METRIC_LABELS } from "@/lib/types";
import LandmarkOverlay from "./LandmarkOverlay";
import MetricDetailModal from "./MetricDetailModal";
import { getScoreColor, getScoreLabel, calculateOverallScore } from "@/lib/scoring";
import Link from "next/link";

interface ResultsDisplayProps {
  result: AnalysisResult;
  onReset: () => void;
}

const HARMONY_CATEGORIES: MetricCategory[] = ["Facial Thirds", "Eyes"];
const FEATURES_CATEGORIES: MetricCategory[] = ["Nose", "Jaw", "Lips", "Brows", "Features"];

type Tab = "harmony" | "features" | "angularity" | "dimorphism" | "vision";

// Gradient bar like FaceIQ
function GradientBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  return (
    <div className="relative flex-1 h-2 rounded-full overflow-hidden" style={{
      background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #22c55e, #eab308, #f97316, #ef4444)"
    }}>
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-zinc-400 rounded-full shadow"
        style={{ left: `calc(${pct}% - 6px)` }}
      />
    </div>
  );
}

// Metric row with gradient bar
function MetricRow({
  name,
  value,
  score,
  onClick,
}: {
  name: string;
  value?: string;
  score: number;
  onClick?: () => void;
}) {
  const color = getScoreColor(score);
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 py-3 px-4 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0 text-left"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-800 truncate">{name}</p>
        {value && (
          <span className="text-xs text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">{value}</span>
        )}
      </div>
      <div className="w-32 flex-shrink-0">
        <GradientBar score={score} />
      </div>
      <span className="text-sm font-semibold w-8 text-right flex-shrink-0" style={{ color }}>
        {score.toFixed(2)}
      </span>
      <svg className="w-4 h-4 text-zinc-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// Sub score row for angularity/dimorphism
function SubMetricRow({ name, score }: { name: string; score: number }) {
  const color = getScoreColor(score);
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-zinc-100 last:border-0">
      <span className="text-sm text-zinc-800 flex-1">{name}</span>
      <div className="w-32 flex-shrink-0">
        <GradientBar score={score} />
      </div>
      <span className="text-sm font-semibold w-8 text-right flex-shrink-0" style={{ color }}>
        {score.toFixed(2)}
      </span>
    </div>
  );
}

export default function ResultsDisplay({ result, onReset }: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<Tab>("harmony");
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [selectedMetricIndex, setSelectedMetricIndex] = useState<number | null>(null);

  const { harmonyScore, featuresScore, harmonyMetrics, featuresMetrics } = useMemo(() => {
    const harmonyMetrics = HARMONY_CATEGORIES.map(category => ({
      category,
      metrics: result.metrics.filter(m => m.definition.category === category),
    }));
    const featuresMetrics = FEATURES_CATEGORIES.map(category => ({
      category,
      metrics: result.metrics.filter(m => m.definition.category === category),
    }));
    const harmonyScores = harmonyMetrics.flatMap(c => c.metrics).filter(m => m.score !== null).map(m => m.score as number);
    const harmonyIds = harmonyMetrics.flatMap(c => c.metrics).map(m => m.definition.id);
    const harmonyScore = calculateOverallScore(harmonyScores, harmonyIds);
    const featuresScores = featuresMetrics.flatMap(c => c.metrics).filter(m => m.score !== null).map(m => m.score as number);
    const featuresIds = featuresMetrics.flatMap(c => c.metrics).map(m => m.definition.id);
    const featuresScore = calculateOverallScore(featuresScores, featuresIds);
    return { harmonyScore, featuresScore, harmonyMetrics, featuresMetrics };
  }, [result.metrics]);

  const angularityScore = result.metrics.find(m => m.definition.id === "angularity_score")?.score ?? 5.0;
  const dimorphismScore = result.metrics.find(m => m.definition.id === "dimorphism_score")?.score ?? 5.0;

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

  const finalScore = result.finalScore ?? result.overallScore;

  const getScore = (id: string) => result.metrics.find(r => r.definition.id === id)?.score ?? 5.0;

  const angularitySubScores: Record<string, number> = {
    "Jaw Definition": (getScore("jaw_frontal_angle") * 0.5) + (getScore("jaw_slope") * 0.5),
    "Chin Definition": (getScore("chin_philtrum") * 0.6) + (getScore("lower_third_proportion") * 0.4),
    "Cheekbone Prominence": (getScore("cheekbone_height") * 0.6) + (getScore("face_width_height") * 0.4),
    "Cheek Leanness": (getScore("midface_ratio") * 0.5) + (getScore("bigonial_width") * 0.5),
    "Submental Definition": (getScore("neck_width") * 0.6) + (getScore("jaw_slope") * 0.4),
  };

  const dimorphismSubScores: Record<string, number> = {
    "Jaw": (getScore("jaw_frontal_angle") * 0.4) + (getScore("bigonial_width") * 0.3) + (getScore("jaw_slope") * 0.3),
    "Eyes": (getScore("canthal_tilt") * 0.5) + (getScore("eye_aspect_ratio") * 0.5),
    "Face Shape": (getScore("face_width_height") * 0.5) + (getScore("total_face_width_height") * 0.5),
    "Nose": (getScore("intercanthal_nasal") * 0.6) + (getScore("middle_third") * 0.4),
    "Brow Ridge": (getScore("eyebrow_tilt") * 0.6) + (getScore("brow_length_ratio") * 0.4),
    "Lips": (getScore("chin_philtrum") * 0.5) + (getScore("lower_third_proportion") * 0.5),
  };

  const handleMetricClick = (metricId: string) => {
    const index = result.metrics.findIndex(m => m.definition.id === metricId);
    if (index !== -1 && result.metrics[index].value !== null) setSelectedMetricIndex(index);
  };

  const tabs: { id: Tab; label: string; score: number }[] = [
    { id: "harmony", label: "Harmony", score: harmonyScore },
    { id: "angularity", label: "Angularity", score: angularityScore },
    { id: "dimorphism", label: "Dimorphism", score: dimorphismScore },
    { id: "features", label: "Features", score: featuresScore },
    ...(result.visionScores ? [{ id: "vision" as Tab, label: "Vision", score: visionScore ?? 0 }] : []),
  ];

  const activeScore = tabs.find(t => t.id === activeTab)?.score ?? 0;

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-semibold text-black tracking-tight">
            Paxxora
          </Link>
          <div className="flex items-center gap-4">
            {/* Tab nav in header like FaceIQ */}
            <div className="hidden md:flex items-center gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-black text-black"
                      : "border-transparent text-zinc-400 hover:text-black"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={onReset}
              className="text-sm text-zinc-500 hover:text-black transition-colors"
            >
              New Analysis
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Left — photo */}
        <div className="w-[420px] flex-shrink-0 border-r border-zinc-200 bg-white flex flex-col">
          {/* Score header above photo */}
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Overall Score</p>
              <p className="text-2xl font-semibold" style={{ color: getScoreColor(finalScore) }}>
                {finalScore.toFixed(2)}
                <span className="text-sm text-zinc-400 font-normal ml-1">/10</span>
              </p>
              <p className="text-xs text-zinc-500">{getScoreLabel(finalScore)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400 mb-0.5">{tabs.find(t => t.id === activeTab)?.label}</p>
              <p className="text-2xl font-semibold" style={{ color: getScoreColor(activeScore) }}>
                {activeScore.toFixed(2)}
                <span className="text-sm text-zinc-400 font-normal ml-1">/10</span>
              </p>
              <p className="text-xs text-zinc-500">{getScoreLabel(activeScore)}</p>
            </div>
          </div>

          {/* Photo */}
          <div className="flex-1 relative p-4">
            <button
              onClick={() => setShowLandmarks(!showLandmarks)}
              className={`absolute top-6 right-6 z-10 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                showLandmarks
                  ? "bg-black text-white border-black"
                  : "bg-white/80 text-zinc-500 border-zinc-200 hover:border-zinc-400"
              }`}
            >
              {showLandmarks ? "Landmarks ON" : "Landmarks OFF"}
            </button>
            {showLandmarks && result.landmarks && result.imageWidth && result.imageHeight ? (
              <LandmarkOverlay
                imageUrl={result.imageUrl}
                landmarks={result.landmarks}
                imageWidth={result.imageWidth}
                imageHeight={result.imageHeight}
              />
            ) : (
              <img
                src={result.imageUrl}
                alt="Analyzed photo"
                className="w-full h-full object-contain rounded-xl"
                style={{ maxHeight: "calc(100vh - 200px)" }}
              />
            )}
          </div>
        </div>

        {/* Right — metrics */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Section header */}
          <div className="px-6 py-4 border-b border-zinc-200 bg-white flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-black">
                Your {tabs.find(t => t.id === activeTab)?.label} Ratios
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {activeTab === "harmony" && "Facial proportions and symmetry"}
                {activeTab === "features" && "Individual facial feature quality"}
                {activeTab === "angularity" && "Facial definition and sharpness"}
                {activeTab === "dimorphism" && "Sexual dimorphism indicators"}
                {activeTab === "vision" && "AI subjective assessment"}
              </p>
            </div>
            {/* Mobile tabs */}
            <div className="flex md:hidden gap-1 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap border transition-colors ${
                    activeTab === tab.id
                      ? "bg-black text-white border-black"
                      : "text-zinc-500 border-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metric list */}
          <div className="flex-1 overflow-y-auto bg-white">
            {activeTab === "harmony" && harmonyMetrics.map(({ category, metrics }) => (
              <div key={category}>
                <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-100">
                  <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">{category}</p>
                </div>
                {metrics.map(metric => (
                  metric.score !== null && (
                    <MetricRow
                      key={metric.definition.id}
                      name={metric.definition.name}
                      value={metric.value !== null ? String(metric.value.toFixed(2)) : undefined}
                      score={metric.score}
                      onClick={() => handleMetricClick(metric.definition.id)}
                    />
                  )
                ))}
              </div>
            ))}

            {activeTab === "features" && featuresMetrics.map(({ category, metrics }) => (
              <div key={category}>
                <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-100">
                  <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">{category}</p>
                </div>
                {metrics.map(metric => (
                  metric.score !== null && (
                    <MetricRow
                      key={metric.definition.id}
                      name={metric.definition.name}
                      value={metric.value !== null ? String(metric.value.toFixed(2)) : undefined}
                      score={metric.score}
                      onClick={() => handleMetricClick(metric.definition.id)}
                    />
                  )
                ))}
              </div>
            ))}

            {activeTab === "angularity" && (
              <div>
                {Object.entries(angularitySubScores).map(([name, score]) => (
                  <SubMetricRow key={name} name={name} score={score} />
                ))}
              </div>
            )}

            {activeTab === "dimorphism" && (
              <div>
                {Object.entries(dimorphismSubScores).map(([name, score]) => (
                  <SubMetricRow key={name} name={name} score={score} />
                ))}
              </div>
            )}

            {activeTab === "vision" && result.visionScores && (
              <div>
                {(Object.keys(VISION_METRIC_LABELS) as Array<keyof typeof VISION_METRIC_LABELS>).map(key => (
                  <SubMetricRow
                    key={key}
                    name={VISION_METRIC_LABELS[key]}
                    score={result.visionScores![key]}
                  />
                ))}
                {result.visionScores.reasoning && (
                  <div className="p-5 border-t border-zinc-100">
                    <p className="text-xs text-zinc-400 mb-2">AI Analysis</p>
                    <p className="text-sm text-zinc-600 leading-relaxed">{result.visionScores.reasoning}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "vision" && !result.visionScores && !result.visionError && (
              <div className="flex items-center gap-3 p-6">
                <svg className="w-5 h-5 text-zinc-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <p className="text-sm text-zinc-500">Analyzing facial features...</p>
              </div>
            )}
          </div>
        </div>
      </div>

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