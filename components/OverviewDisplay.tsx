"use client";

import { useMemo, useState } from "react";
import { AnalysisResult, VISION_METRIC_LABELS } from "@/lib/types";
import { getScoreColor, getScoreLabel, calculateOverallScore, getPercentile } from "@/lib/scoring";
import { METRIC_INSIGHTS, getSeverity } from "@/lib/insights";
import Link from "next/link";

interface OverviewDisplayProps {
  result: AnalysisResult;
  onReset: () => void;
  onGoToAnalysis: () => void;
}

const HARMONY_CATEGORIES = ["Facial Thirds", "Eyes", "Nose", "Jaw", "Lips", "Brows", "Features"];
const ALL_DIMORPHISM_VISION_KEYS: Array<keyof typeof VISION_METRIC_LABELS> = [
  "facial_hair", "neck", "eyebrow_thickness", "nose_masculinity",
  "brow_ridge", "hairline", "eyes_dimorphism", "lip_masculinity",
  "face_shape_dimorphism", "jaw_dimorphism", "hair_length",
  "skin_quality", "facial_fat", "overall_impression",
];

const PILLAR_DESCRIPTIONS: Record<string, string> = {
  Overall: "Your overall score is a weighted composite of all facial metrics across harmony, angularity, and dimorphism. It reflects how your bone structure, proportions, and masculine traits combine to create an attractive appearance. No single metric defines it — the overall score captures the full picture of your facial architecture.",
  Harmony: "Facial harmony measures how well your features align with universal proportions — the golden ratios that make a face read as balanced and attractive regardless of sex. It covers facial thirds, eye spacing, nose width, lip proportions, and how all regions relate to one another. A high harmony score signals that your face is structurally coherent and proportionally refined.",
  Angularity: "Angularity measures the sharpness and definition of your facial structure — the degree to which your jaw, chin, and cheekbones project clean geometric lines. A highly angular face has a defined jawline, prominent cheekbones, and a sharp chin, all of which signal bone density and low facial fat. Angularity is one of the strongest predictors of perceived masculinity.",
  Dimorphism: "Sexual dimorphism measures how distinctly masculine your facial features are relative to the female baseline. It covers bone structure, facial fat distribution, brow ridge prominence, jaw width, eye hooding, and AI-assessed traits like facial hair and neck thickness. Higher dimorphism correlates with testosterone exposure during puberty and is a key signal of genetic fitness.",
};

type PillarTab = "Overall" | "Harmony" | "Angularity" | "Dimorphism";
type SectionTab = "Harmony" | "Angularity" | "Dimorphism";

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  return (
    <div className="relative h-1 rounded-full overflow-hidden bg-zinc-100">
      <div className="absolute inset-y-0 left-0 rounded-full" style={{
        width: `${pct}%`,
        background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)"
      }} />
    </div>
  );
}

function BoldStat({ score, percentile }: { score: number; percentile: number }) {
  const ratio = (100 / Math.max(1, 100 - percentile)).toFixed(1);
  return (
    <div className="bg-zinc-900 rounded-xl p-4">
      <p className="text-xs text-zinc-500 mb-2">Population rank</p>
      <p className="text-3xl font-semibold leading-none" style={{ color: getScoreColor(score) }}>
        1 in {ratio}
      </p>
      <p className="text-sm text-zinc-400 mt-1">males score this high</p>
      <div className="mt-3 pt-3 border-t border-zinc-700">
        <p className="text-xs text-zinc-500">
          Score <span className="text-zinc-300 font-medium">{score.toFixed(2)}</span> · {percentile}th percentile
        </p>
      </div>
    </div>
  );
}

function ScoreContext({ metrics, pillar, score }: {
  metrics: { name: string; score: number }[];
  pillar: string;
  score: number;
}) {
  if (metrics.length === 0) return null;
  const sorted = [...metrics].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const label = getScoreLabel(score);
  const sentence = `Your ${pillar.toLowerCase()} score of ${score.toFixed(1)} is ${label.toLowerCase()}. It is driven by strong ${best.name} (${best.score.toFixed(1)}/10)${sorted.length > 1 ? `, but held back by your ${worst.name} (${worst.score.toFixed(1)}/10)` : ""}.`;

  return (
    <div>
      <p className="text-xs text-zinc-600 leading-relaxed mb-4">{sentence}</p>
      <div className="space-y-2.5">
        {sorted.slice(0, 4).map(m => (
          <div key={m.name}>
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs text-zinc-600 truncate flex-1 mr-3">{m.name}</p>
              <span className="text-xs font-medium flex-shrink-0" style={{ color: getScoreColor(m.score) }}>
                {m.score.toFixed(1)}
              </span>
            </div>
            <ScoreBar score={m.score} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OverviewDisplay({ result, onReset, onGoToAnalysis }: OverviewDisplayProps) {
  const [activeTab, setActiveTab] = useState<PillarTab>("Overall");
  const [strengthsTab, setStrengthsTab] = useState<SectionTab>("Harmony");
  const [improvementsTab, setImprovementsTab] = useState<SectionTab>("Harmony");

  const getScore = (id: string) => result.metrics.find(r => r.definition.id === id)?.score ?? 5.0;

  const harmonyMetrics = useMemo(() =>
    HARMONY_CATEGORIES.flatMap(cat =>
      result.metrics.filter(m => m.definition.category === cat && m.score !== null)
    ), [result.metrics]);

  const harmonyScore = useMemo(() => {
    const scores = harmonyMetrics.map(m => m.score as number);
    const ids = harmonyMetrics.map(m => m.definition.id);
    return calculateOverallScore(scores, ids);
  }, [harmonyMetrics]);

  const angularityItems = useMemo(() => ([
    { name: "Jaw Definition", score: (getScore("jaw_frontal_angle") * 0.5) + (getScore("jaw_slope") * 0.5) },
    { name: "Chin Definition", score: (getScore("chin_philtrum") * 0.6) + (getScore("lower_third_proportion") * 0.4) },
    { name: "Cheekbone Prominence", score: (getScore("cheekbone_height") * 0.6) + (getScore("face_width_height") * 0.4) },
    { name: "Cheek Leanness", score: (getScore("midface_ratio") * 0.5) + (getScore("bigonial_width") * 0.5) },
    { name: "Submental Definition", score: (getScore("neck_width") * 0.6) + (getScore("jaw_slope") * 0.4) },
  ]), [result.metrics]);

  const angularityScore = useMemo(() => {
    const s = angularityItems.map(i => i.score);
    return s.reduce((a, b) => a + b, 0) / s.length;
  }, [angularityItems]);

  const dimorphismGeoItems = useMemo(() => ([
    { name: "Jaw", score: (getScore("jaw_frontal_angle") * 0.4) + (getScore("bigonial_width") * 0.3) + (getScore("jaw_slope") * 0.3) },
    { name: "Eyes", score: (getScore("canthal_tilt") * 0.5) + (getScore("eye_aspect_ratio") * 0.5) },
    { name: "Face Shape", score: (getScore("face_width_height") * 0.5) + (getScore("total_face_width_height") * 0.5) },
    { name: "Nose", score: (getScore("intercanthal_nasal") * 0.6) + (getScore("middle_third") * 0.4) },
    { name: "Brow Ridge", score: (getScore("eyebrow_tilt") * 0.6) + (getScore("brow_length_ratio") * 0.4) },
    { name: "Lips", score: (getScore("chin_philtrum") * 0.5) + (getScore("lower_third_proportion") * 0.5) },
  ]), [result.metrics]);

  const dimorphismVisionItems = useMemo(() => {
    if (!result.visionScores) return [];
    return ALL_DIMORPHISM_VISION_KEYS
      .filter(key => result.visionScores![key] !== undefined)
      .map(key => ({ name: VISION_METRIC_LABELS[key], score: result.visionScores![key] as number }));
  }, [result.visionScores]);

  const dimorphismScore = useMemo(() => {
    const all = [...dimorphismGeoItems.map(i => i.score), ...dimorphismVisionItems.map(i => i.score)];
    return all.length ? all.reduce((a, b) => a + b, 0) / all.length : 5;
  }, [dimorphismGeoItems, dimorphismVisionItems]);

  const finalScore = result.finalScore ?? result.overallScore;

  const pillarData = {
    Overall: {
      score: finalScore,
      metrics: [...result.metrics].filter(m => m.score !== null).map(m => ({ name: m.definition.name, score: m.score! })),
    },
    Harmony: { score: harmonyScore, metrics: harmonyMetrics.map(m => ({ name: m.definition.name, score: m.score! })) },
    Angularity: { score: angularityScore, metrics: angularityItems },
    Dimorphism: { score: dimorphismScore, metrics: [...dimorphismGeoItems, ...dimorphismVisionItems] },
  };

  const active = pillarData[activeTab];
  const activePercentile = getPercentile(active.score);

  const pillars = [
    { label: "Overall" as PillarTab, score: finalScore },
    { label: "Harmony" as PillarTab, score: harmonyScore },
    { label: "Angularity" as PillarTab, score: angularityScore },
    { label: "Dimorphism" as PillarTab, score: dimorphismScore },
  ];

  const sectionTabs: SectionTab[] = ["Harmony", "Angularity", "Dimorphism"];

  const getStrengths = (tab: SectionTab) => {
    const items = pillarData[tab].metrics;
    return [...items].sort((a, b) => b.score - a.score).slice(0, 5);
  };

  const getImprovements = (tab: SectionTab) => {
    const items = pillarData[tab].metrics;
    const result_: { label: string; description: string; impact: string; score: number; name: string }[] = [];

    items.forEach(item => {
      const insights = METRIC_INSIGHTS[item.name] ?? METRIC_INSIGHTS[item.name];
      if (!insights) return;
      insights.filter(i => i.type === "negative" && i.condition(item.score)).forEach(i => {
        result_.push({ label: i.label, description: i.description, impact: i.impact, score: item.score, name: item.name });
      });
    });

    return result_.sort((a, b) => Math.abs(parseFloat(b.impact)) - Math.abs(parseFloat(a.impact))).slice(0, 5);
  };

  return (
    <div className="flex flex-col bg-[#f7f7f5]" style={{ height: "100vh", overflow: "hidden" }}>
      <header className="flex-shrink-0 bg-white border-b border-zinc-200 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/paxxora.svg" alt="Paxxora" className="h-7 w-7 object-contain" />
            <span className="text-lg font-semibold text-black tracking-tight">Paxxora</span>
          </Link>
          <div className="flex items-center gap-1">
            <button className="px-4 py-1.5 text-sm font-medium rounded-full bg-black text-white border border-black">
              Overview
            </button>
            <button onClick={onGoToAnalysis} className="px-4 py-1.5 text-sm font-medium rounded-full text-zinc-500 border-transparent hover:text-black transition-colors">
              Analysis
            </button>
            <button onClick={onReset} className="ml-3 px-3 py-1.5 text-sm text-zinc-400 hover:text-black transition-colors">
              New Analysis
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">

          {/* Pillar score cards */}
          <div className="grid grid-cols-4 gap-4">
            {pillars.map(p => (
              <button
                key={p.label}
                onClick={() => setActiveTab(p.label)}
                className={`rounded-2xl border p-5 text-left transition-all ${
                  activeTab === p.label ? "bg-black border-black" : "bg-white border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">{p.label}</p>
                <p className="text-3xl font-semibold mb-1" style={{ color: activeTab === p.label ? "#fff" : getScoreColor(p.score) }}>
                  {p.score.toFixed(2)}
                </p>
                <p className="text-xs text-zinc-400">{getScoreLabel(p.score)}</p>
                <div className="mt-3">
                  <div className={`relative h-1 rounded-full overflow-hidden ${activeTab === p.label ? "bg-zinc-700" : "bg-zinc-100"}`}>
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{
                      width: `${(p.score / 10) * 100}%`,
                      background: activeTab === p.label ? "#fff" : "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)"
                    }} />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Main panel */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-0.5">Overall score</p>
                <p className="text-2xl font-semibold" style={{ color: getScoreColor(finalScore) }}>
                  {finalScore.toFixed(2)}<span className="text-sm text-zinc-400 font-normal ml-1">/10</span>
                </p>
              </div>
              <div className="flex gap-1 bg-zinc-100 rounded-full p-1">
                {pillars.map(p => (
                  <button
                    key={p.label}
                    onClick={() => setActiveTab(p.label)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                      activeTab === p.label ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-black"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-0">
              {/* Photo */}
              <div className="relative overflow-hidden border-r border-zinc-100" style={{ height: 400 }}>
                <img src={result.imageUrl} alt="Your photo" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white/60 text-xs">{activeTab} Score</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold" style={{ color: getScoreColor(active.score) }}>
                      {active.score.toFixed(2)}
                    </span>
                    <span className="text-xs text-white/60">/10</span>
                  </div>
                </div>
              </div>

              {/* Bold stat */}
              <div className="p-6 border-r border-zinc-100 flex flex-col justify-center gap-4">
                <BoldStat score={active.score} percentile={activePercentile} />
                <div className="space-y-2">
                  <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">Your position</p>
                  <div className="relative h-2 rounded-full overflow-hidden bg-zinc-100">
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{
                      width: `${(active.score / 10) * 100}%`,
                      background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)"
                    }} />
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>0</span><span>5</span><span>10</span>
                  </div>
                </div>
              </div>

              {/* Understanding + Score Context */}
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 400 }}>
                <div className="mb-5">
                  <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">
                    Understanding {activeTab}
                  </p>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {PILLAR_DESCRIPTIONS[activeTab]}
                  </p>
                </div>
                <div className="border-t border-zinc-100 pt-4">
                  <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">
                    Score context
                  </p>
                  <ScoreContext metrics={active.metrics} pillar={activeTab} score={active.score} />
                </div>
              </div>
            </div>
          </div>

          {/* Key Strengths */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-black">Key strengths</p>
              <div className="flex gap-1 bg-zinc-100 rounded-full p-1">
                {sectionTabs.map(t => (
                  <button key={t} onClick={() => setStrengthsTab(t)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                      strengthsTab === t ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-black"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {getStrengths(strengthsTab).map(m => (
                <div key={m.name} className="bg-zinc-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: getScoreColor(m.score) }}>
                      {m.score.toFixed(1)}
                    </span>
                    <span className="text-xs text-zinc-400">/10</span>
                  </div>
                  <p className="text-xs text-zinc-700 font-medium leading-tight mb-2">{m.name}</p>
                  <ScoreBar score={m.score} />
                </div>
              ))}
            </div>
          </div>

          {/* Areas of Improvement */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-black">Areas of improvement</p>
              <div className="flex gap-1 bg-zinc-100 rounded-full p-1">
                {sectionTabs.map(t => (
                  <button key={t} onClick={() => setImprovementsTab(t)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                      improvementsTab === t ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-black"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {getImprovements(improvementsTab).length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-4">No significant issues in this category.</p>
              ) : getImprovements(improvementsTab).map((item, i) => {
                const sev = getSeverity(item.impact);
                return (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <span className={`text-xs font-semibold px-2 py-1 rounded flex-shrink-0 ${sev.bg} ${sev.color} border ${sev.border}`}>
                      {sev.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-zinc-800">{item.label}</p>
                        <span className="text-xs font-medium flex-shrink-0" style={{ color: getScoreColor(item.score) }}>
                          {item.score.toFixed(1)}/10
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">{item.description}</p>
                    </div>
                    <span className="text-sm font-semibold text-red-500 flex-shrink-0">{item.impact}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}