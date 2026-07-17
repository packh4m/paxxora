"use client";

import { useState, useMemo } from "react";
import { AnalysisResult, MetricCategory, MetricResult, VisionScores, VISION_METRIC_LABELS } from "@/lib/types";
import MetricCard from "./MetricCard";
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

type Tab = "overall" | "harmony" | "features" | "angularity" | "dimorphism";

// Score bar component
function ScoreBar({ score }: { score: number }) {
  const color = getScoreColor(score);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(score / 10) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-semibold w-8 text-right" style={{ color }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// Composite score card
function CompositeCard({
  title,
  score,
  description,
  active,
  onClick,
}: {
  title: string;
  score: number;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  const color = getScoreColor(score);
  return (
    <button
      onClick={onClick}
      className={`p-5 rounded-2xl border text-left transition-all ${
        active
          ? "border-black bg-white shadow-sm"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <p className="text-xs text-zinc-400 mb-2 font-mono uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-semibold mb-1" style={{ color }}>
        {score.toFixed(2)}
        <span className="text-sm text-zinc-400 font-normal ml-1">/10</span>
      </p>
      <p className="text-xs text-zinc-500">{description}</p>
    </button>
  );
}

// Sub score row
function SubScoreRow({ name, score }: { name: string; score: number }) {
  const color = getScoreColor(score);
  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-zinc-100 last:border-0">
      <span className="text-sm text-zinc-600 flex-1">{name}</span>
      <div className="w-32 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${(score / 10) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-medium w-8 text-right" style={{ color }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// Category section
function CategorySection({
  title,
  metrics,
  onMetricClick,
}: {
  title: string;
  metrics: MetricResult[];
  onMetricClick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const validScores = metrics.filter(m => m.score !== null).map(m => m.score as number);
  const avg = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
  const color = getScoreColor(avg);

  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 flex items-center justify-between bg-white hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-black">{title}</span>
          <span className="text-xs text-zinc-400">{metrics.length} metrics</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color }}>{avg.toFixed(1)}</span>
          <svg className={`w-4 h-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2 bg-zinc-50">
          {metrics.map(metric => (
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

export default function ResultsDisplay({ result, onReset }: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overall");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
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

  const angularityScore = useMemo(() => {
    return result.metrics.find(m => m.definition.id === "angularity_score")?.score ?? 5.0;
  }, [result.metrics]);

  const dimorphismScore = useMemo(() => {
    return result.metrics.find(m => m.definition.id === "dimorphism_score")?.score ?? 5.0;
  }, [result.metrics]);

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

  const getScore = (metricId: string) => result.metrics.find(r => r.definition.id === metricId)?.score ?? 5.0;

  const angularitySubScores = useMemo(() => ({
    "Jaw Definition": (getScore("jaw_frontal_angle") * 0.5) + (getScore("jaw_slope") * 0.5),
    "Chin Definition": (getScore("chin_philtrum") * 0.6) + (getScore("lower_third_proportion") * 0.4),
    "Cheekbone Prominence": (getScore("cheekbone_height") * 0.6) + (getScore("face_width_height") * 0.4),
    "Cheek Leanness": (getScore("midface_ratio") * 0.5) + (getScore("bigonial_width") * 0.5),
    "Submental Definition": (getScore("neck_width") * 0.6) + (getScore("jaw_slope") * 0.4),
  }), [result.metrics]);

  const dimorphismSubScores = useMemo(() => ({
    "Jaw": (getScore("jaw_frontal_angle") * 0.4) + (getScore("bigonial_width") * 0.3) + (getScore("jaw_slope") * 0.3),
    "Eyes": (getScore("canthal_tilt") * 0.5) + (getScore("eye_aspect_ratio") * 0.5),
    "Face Shape": (getScore("face_width_height") * 0.5) + (getScore("total_face_width_height") * 0.5),
    "Nose": (getScore("intercanthal_nasal") * 0.6) + (getScore("middle_third") * 0.4),
    "Brow Ridge": (getScore("eyebrow_tilt") * 0.6) + (getScore("brow_length_ratio") * 0.4),
    "Lips": (getScore("chin_philtrum") * 0.5) + (getScore("lower_third_proportion") * 0.5),
  }), [result.metrics]);

  const handleMetricClick = (metricId: string) => {
    const index = result.metrics.findIndex(m => m.definition.id === metricId);
    if (index !== -1 && result.metrics[index].value !== null) setSelectedMetricIndex(index);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overall", label: "Overall" },
    { id: "harmony", label: "Harmony" },
    { id: "features", label: "Features" },
    { id: "angularity", label: "Angularity" },
    { id: "dimorphism", label: "Dimorphism" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#f7f7f5]/90 backdrop-blur-lg border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-semibold text-black tracking-tight">
            Paxxora
          </Link>
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-black transition-colors"
          >
            Analyze New Photo →
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Composite score cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <CompositeCard
            title="Harmony"
            score={harmonyScore}
            description={getScoreLabel(harmonyScore)}
            active={activeTab === "harmony"}
            onClick={() => setActiveTab("harmony")}
          />
          <CompositeCard
            title="Angularity"
            score={angularityScore}
            description={getScoreLabel(angularityScore)}
            active={activeTab === "angularity"}
            onClick={() => setActiveTab("angularity")}
          />
          <CompositeCard
            title="Dimorphism"
            score={dimorphismScore}
            description={getScoreLabel(dimorphismScore)}
            active={activeTab === "dimorphism"}
            onClick={() => setActiveTab("dimorphism")}
          />
          <CompositeCard
            title="Features"
            score={featuresScore}
            description={getScoreLabel(featuresScore)}
            active={activeTab === "features"}
            onClick={() => setActiveTab("features")}
          />
        </div>

        {/* Overall score */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1">Overall Score</p>
              <p className="text-5xl font-semibold" style={{ color: getScoreColor(finalScore) }}>
                {finalScore.toFixed(2)}
                <span className="text-lg text-zinc-400 font-normal ml-1">/10</span>
              </p>
              <p className="text-sm text-zinc-500 mt-1">{getScoreLabel(finalScore)}</p>
            </div>

            <div className="flex gap-6 text-right">
              <div>
                <p className="text-xs text-zinc-400 mb-1">Geometric</p>
                <p className="text-xl font-semibold" style={{ color: getScoreColor(result.overallScore) }}>
                  {result.overallScore.toFixed(2)}
                </p>
                <p className="text-xs text-zinc-400">33 metrics</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Vision</p>
                {visionScore !== null ? (
                  <>
                    <p className="text-xl font-semibold" style={{ color: getScoreColor(visionScore) }}>
                      {visionScore.toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-400">AI score</p>
                  </>
                ) : result.visionError ? (
                  <p className="text-xl font-semibold text-zinc-300">—</p>
                ) : (
                  <p className="text-xl font-semibold text-zinc-300 animate-pulse">···</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-zinc-100 mb-5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-black text-white"
                    : "text-zinc-500 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "overall" && (
            <div className="space-y-3">
              {[
                { label: "Harmony", score: harmonyScore },
                { label: "Angularity", score: angularityScore },
                { label: "Dimorphism", score: dimorphismScore },
                { label: "Features", score: featuresScore },
                ...(visionScore !== null ? [{ label: "AI Vision", score: visionScore }] : []),
              ].map(({ label, score }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-zinc-600">{label}</span>
                  </div>
                  <ScoreBar score={score} />
                </div>
              ))}
            </div>
          )}

          {activeTab === "harmony" && (
            <div className="space-y-3">
              {harmonyMetrics.map(({ category, metrics }) => (
                <CategorySection
                  key={category}
                  title={category}
                  metrics={metrics}
                  onMetricClick={handleMetricClick}
                />
              ))}
            </div>
          )}

          {activeTab === "features" && (
            <div className="space-y-3">
              {featuresMetrics.map(({ category, metrics }) => (
                <CategorySection
                  key={category}
                  title={category}
                  metrics={metrics}
                  onMetricClick={handleMetricClick}
                />
              ))}
            </div>
          )}

          {activeTab === "angularity" && (
            <div className="bg-zinc-50 rounded-xl p-4">
              {Object.entries(angularitySubScores).map(([name, score]) => (
                <SubScoreRow key={name} name={name} score={score} />
              ))}
            </div>
          )}

          {activeTab === "dimorphism" && (
            <div className="bg-zinc-50 rounded-xl p-4">
              {Object.entries(dimorphismSubScores).map(([name, score]) => (
                <SubScoreRow key={name} name={name} score={score} />
              ))}
            </div>
          )}
        </div>

        {/* Photo */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">Analyzed Photo</p>
            <button
              onClick={() => setShowLandmarks(!showLandmarks)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                showLandmarks
                  ? "bg-black text-white border-black"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
              }`}
            >
              {showLandmarks ? "Landmarks ON" : "Landmarks OFF"}
            </button>
          </div>
          <div className="flex justify-center">
            {showLandmarks && result.landmarks && result.imageWidth && result.imageHeight ? (
              <div className="max-w-sm w-full">
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

        {/* Vision Analysis */}
        {result.visionScores && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-4">AI Vision Analysis</p>
            <div className="space-y-1">
              {(Object.keys(VISION_METRIC_LABELS) as Array<keyof typeof VISION_METRIC_LABELS>).map(key => (
                <SubScoreRow
                  key={key}
                  name={VISION_METRIC_LABELS[key]}
                  score={result.visionScores![key]}
                />
              ))}
            </div>
            {result.visionScores.reasoning && (
              <div className="mt-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-xs text-zinc-400 mb-1">AI Analysis</p>
                <p className="text-sm text-zinc-600">{result.visionScores.reasoning}</p>
              </div>
            )}
          </div>
        )}

        {!result.visionScores && !result.visionError && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex items-center gap-4">
            <svg className="w-5 h-5 text-zinc-400 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <div>
              <p className="text-sm font-medium text-black">AI Vision Analysis</p>
              <p className="text-xs text-zinc-400">Analyzing facial features...</p>
            </div>
          </div>
        )}
      </main>

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