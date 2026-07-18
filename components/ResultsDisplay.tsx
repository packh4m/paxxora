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

function GradientBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  return (
    <div className="relative flex-1 h-2 rounded-full overflow-hidden" style={{
      background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #22c55e, #eab308, #f97316, #ef4444)"
    }}>
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-white/80 rounded-full shadow-md"
        style={{ left: `calc(${pct}% - 6px)` }}
      />
    </div>
  );
}

function MetricRow({ name, value, score, onClick }: { name: string; value?: string; score: number; onClick?: () => void }) {
  const color = getScoreColor(score);
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 py-3 px-4 text-left transition-all hover:bg-white/40 border-b border-white/20 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-700 truncate">{name}</p>
        {value && (
          <span className="text-xs text-zinc-400 bg-white/50 backdrop-blur-sm px-1.5 py-0.5 rounded mt-0.5 inline-block border border-white/30">{value}</span>
        )}
      </div>
      <div className="w-28 flex-shrink-0">
        <GradientBar score={score} />
      </div>
      <span className="text-sm font-semibold w-10 text-right flex-shrink-0" style={{ color }}>
        {score.toFixed(2)}
      </span>
      <svg className="w-4 h-4 text-zinc-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function SubMetricRow({ name, score }: { name: string; score: number }) {
  const color = getScoreColor(score);
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-white/20 last:border-0">
      <span className="text-sm text-zinc-700 flex-1">{name}</span>
      <div className="w-28 flex-shrink-0">
        <GradientBar score={score} />
      </div>
      <span className="text-sm font-semibold w-10 text-right flex-shrink-0" style={{ color }}>
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
    <div className="flex flex-col" style={{
      height: "100vh",
      overflow: "hidden",
      background: "linear-gradient(135deg, #e8edf5 0%, #f0e8f5 30%, #e8f0f5 60%, #f5ede8 100%)",
    }}>
      {/* Liquid glass header */}
      <header className="flex-shrink-0 border-b z-10" style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderColor: "rgba(255,255,255,0.5)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 1px 12px rgba(0,0,0,0.06)",
      }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-semibold text-zinc-800 tracking-tight">
            Paxxora
          </Link>
          <div className="flex items-center gap-0.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-4 py-1.5 text-sm font-medium rounded-full transition-all"
                style={activeTab === tab.id ? {
                  background: "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 8px rgba(0,0,0,0.08)",
                  color: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.6)",
                } : {
                  color: "#6b7280",
                  border: "1px solid transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={onReset}
              className="ml-3 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              New Analysis
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full p-4 gap-4">

        {/* Left — photo panel (liquid glass) */}
        <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden rounded-2xl" style={{
          background: "rgba(255,255,255,0.45)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(255,255,255,0.65)",
          boxShadow: "0 2px 0 rgba(255,255,255,0.8) inset, 0 8px 32px rgba(0,0,0,0.08), 0 1px 0 rgba(0,0,0,0.04)",
        }}>
          {/* Score header */}
          <div className="flex-shrink-0 px-5 py-4 flex items-center justify-between" style={{
            borderBottom: "1px solid rgba(255,255,255,0.5)",
          }}>
            <div>
              <p className="text-xs text-zinc-400 mb-0.5 font-medium">Overall</p>
              <p className="text-2xl font-semibold" style={{ color: getScoreColor(finalScore) }}>
                {finalScore.toFixed(2)}<span className="text-sm text-zinc-400 font-normal ml-1">/10</span>
              </p>
              <p className="text-xs text-zinc-400">{getScoreLabel(finalScore)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400 mb-0.5 font-medium">{tabs.find(t => t.id === activeTab)?.label}</p>
              <p className="text-2xl font-semibold" style={{ color: getScoreColor(activeScore) }}>
                {activeScore.toFixed(2)}<span className="text-sm text-zinc-400 font-normal ml-1">/10</span>
              </p>
              <p className="text-xs text-zinc-400">{getScoreLabel(activeScore)}</p>
            </div>
          </div>

          {/* Photo */}
          <div className="flex-1 relative p-3 overflow-hidden">
            <button
              onClick={() => setShowLandmarks(!showLandmarks)}
              className="absolute top-5 right-5 z-10 px-3 py-1.5 text-xs font-medium rounded-full transition-all"
              style={{
                background: showLandmarks ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.65)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.5)",
                color: showLandmarks ? "#fff" : "#374151",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
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
                style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}
              />
            )}
          </div>
        </div>

        {/* Right — scrollable metrics panel (liquid glass) */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl" style={{
          background: "rgba(255,255,255,0.45)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(255,255,255,0.65)",
          boxShadow: "0 2px 0 rgba(255,255,255,0.8) inset, 0 8px 32px rgba(0,0,0,0.08), 0 1px 0 rgba(0,0,0,0.04)",
        }}>
          {/* Section header */}
          <div className="flex-shrink-0 px-6 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.5)" }}>
            <p className="text-sm font-semibold text-zinc-700">
              Your {tabs.find(t => t.id === activeTab)?.label} Ratios
            </p>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "harmony" && harmonyMetrics.map(({ category, metrics }) => (
              <div key={category}>
                <div className="px-4 py-2" style={{ background: "rgba(255,255,255,0.3)", borderBottom: "1px solid rgba(255,255,255,0.4)" }}>
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
                <div className="px-4 py-2" style={{ background: "rgba(255,255,255,0.3)", borderBottom: "1px solid rgba(255,255,255,0.4)" }}>
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

            {activeTab === "angularity" && Object.entries(angularitySubScores).map(([name, score]) => (
              <SubMetricRow key={name} name={name} score={score} />
            ))}

            {activeTab === "dimorphism" && Object.entries(dimorphismSubScores).map(([name, score]) => (
              <SubMetricRow key={name} name={name} score={score} />
            ))}

            {activeTab === "vision" && result.visionScores && (
              <div>
                {(Object.keys(VISION_METRIC_LABELS) as Array<keyof typeof VISION_METRIC_LABELS>).map(key => (
                  <SubMetricRow key={key} name={VISION_METRIC_LABELS[key]} score={result.visionScores![key]} />
                ))}
                {result.visionScores.reasoning && (
                  <div className="p-5" style={{ borderTop: "1px solid rgba(255,255,255,0.4)" }}>
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
