"use client";

import { useMemo, useEffect, useRef } from "react";
import { AnalysisResult, VISION_METRIC_LABELS } from "@/lib/types";
import { getScoreColor, getScoreLabel, calculateOverallScore, getPercentile } from "@/lib/scoring";
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

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden bg-zinc-100">
      <div className="absolute inset-y-0 left-0 rounded-full" style={{
        width: `${pct}%`,
        background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)"
      }} />
    </div>
  );
}

function PopulationChart({ score }: { score: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw bell curve
    const mean = 4.5;
    const std = 1.4;
    const points: [number, number][] = [];

    for (let x = 0; x <= w; x++) {
      const val = (x / w) * 10;
      const y = Math.exp(-0.5 * Math.pow((val - mean) / std, 2));
      points.push([x, h - y * (h * 0.8) - 10]);
    }

    // Fill under curve
    ctx.beginPath();
    ctx.moveTo(0, h);
    points.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = "rgba(209,213,219,0.3)";
    ctx.fill();

    // Stroke curve
    ctx.beginPath();
    points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Score line
    const scoreX = (score / 10) * w;
    ctx.beginPath();
    ctx.moveTo(scoreX, 0);
    ctx.lineTo(scoreX, h);
    ctx.strokeStyle = getScoreColor(score);
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Score dot on curve
    const scoreVal = score;
    const dotY = h - Math.exp(-0.5 * Math.pow((scoreVal - mean) / std, 2)) * (h * 0.8) - 10;
    ctx.beginPath();
    ctx.arc(scoreX, dotY, 5, 0, Math.PI * 2);
    ctx.fillStyle = getScoreColor(score);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // X axis labels
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    [0, 2, 4, 6, 8, 10].forEach(v => {
      ctx.fillText(String(v), (v / 10) * w, h - 2);
    });
  }, [score]);

  return <canvas ref={canvasRef} width={280} height={100} className="w-full" />;
}

export default function OverviewDisplay({ result, onReset, onGoToAnalysis }: OverviewDisplayProps) {
  const getScore = (id: string) => result.metrics.find(r => r.definition.id === id)?.score ?? 5.0;

  const harmonyScore = useMemo(() => {
    const metrics = HARMONY_CATEGORIES.flatMap(cat =>
      result.metrics.filter(m => m.definition.category === cat)
    ).filter(m => m.score !== null);
    const scores = metrics.map(m => m.score as number);
    const ids = metrics.map(m => m.definition.id);
    return calculateOverallScore(scores, ids);
  }, [result.metrics]);

  const angularitySubScores = {
    "Jaw Definition": (getScore("jaw_frontal_angle") * 0.5) + (getScore("jaw_slope") * 0.5),
    "Chin Definition": (getScore("chin_philtrum") * 0.6) + (getScore("lower_third_proportion") * 0.4),
    "Cheekbone Prominence": (getScore("cheekbone_height") * 0.6) + (getScore("face_width_height") * 0.4),
    "Cheek Leanness": (getScore("midface_ratio") * 0.5) + (getScore("bigonial_width") * 0.5),
    "Submental Definition": (getScore("neck_width") * 0.6) + (getScore("jaw_slope") * 0.4),
  };

  const dimorphismGeoScores = {
    "Jaw": (getScore("jaw_frontal_angle") * 0.4) + (getScore("bigonial_width") * 0.3) + (getScore("jaw_slope") * 0.3),
    "Eyes": (getScore("canthal_tilt") * 0.5) + (getScore("eye_aspect_ratio") * 0.5),
    "Face Shape": (getScore("face_width_height") * 0.5) + (getScore("total_face_width_height") * 0.5),
    "Nose": (getScore("intercanthal_nasal") * 0.6) + (getScore("middle_third") * 0.4),
    "Brow Ridge": (getScore("eyebrow_tilt") * 0.6) + (getScore("brow_length_ratio") * 0.4),
    "Lips": (getScore("chin_philtrum") * 0.5) + (getScore("lower_third_proportion") * 0.5),
  };

  const angularityScore = useMemo(() => {
    const s = Object.values(angularitySubScores);
    return s.reduce((a, b) => a + b, 0) / s.length;
  }, [result.metrics]);

  const dimorphismScore = useMemo(() => {
    const geoScores = Object.values(dimorphismGeoScores);
    const visionScores = result.visionScores
      ? ALL_DIMORPHISM_VISION_KEYS.map(k => result.visionScores![k] as number).filter(Boolean)
      : [];
    const all = [...geoScores, ...visionScores];
    return all.reduce((a, b) => a + b, 0) / all.length;
  }, [result.metrics, result.visionScores]);

  const finalScore = result.finalScore ?? result.overallScore;

  const pillars = [
    { label: "Harmony", score: harmonyScore, description: "Facial proportions and symmetry" },
    { label: "Angularity", score: angularityScore, description: "Jaw definition and structure" },
    { label: "Dimorphism", score: dimorphismScore, description: "Masculine sexual dimorphism" },
  ];

  const topMetrics = [...result.metrics]
    .filter(m => m.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);

  const weakestMetrics = [...result.metrics]
    .filter(m => m.score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 3);

  return (
    <div className="flex flex-col bg-[#f7f7f5]" style={{ height: "100vh", overflow: "hidden" }}>
      {/* Header */}
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
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

          {/* Overall score + pillars */}
          <div className="grid grid-cols-4 gap-4">
            {/* Overall */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Overall Score</p>
                <p className="text-5xl font-semibold" style={{ color: getScoreColor(finalScore) }}>
                  {finalScore.toFixed(2)}
                </p>
                <p className="text-sm text-zinc-400 mt-1">/10 · {getScoreLabel(finalScore)}</p>
              </div>
              <div className="mt-4">
                <p className="text-xs text-zinc-400 mb-1">Better than {getPercentile(finalScore)}% of males</p>
                <ScoreBar score={finalScore} />
              </div>
            </div>

            {/* Pillars */}
            {pillars.map(p => (
              <button key={p.label} onClick={onGoToAnalysis}
                className="bg-white rounded-2xl border border-zinc-200 p-5 text-left hover:border-zinc-400 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">{p.label}</p>
                  <svg className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-3xl font-semibold mb-1" style={{ color: getScoreColor(p.score) }}>
                  {p.score.toFixed(2)}
                </p>
                <p className="text-xs text-zinc-400 mb-3">{p.description}</p>
                <ScoreBar score={p.score} />
                <p className="text-xs text-zinc-400 mt-2">Top {100 - getPercentile(p.score)}%</p>
              </button>
            ))}
          </div>

          {/* Photo + population chart + strengths/weaknesses */}
          <div className="grid grid-cols-3 gap-4">
            {/* Photo */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden" style={{ height: 320 }}>
              <img src={result.imageUrl} alt="Your photo" className="w-full h-full object-cover" />
            </div>

            {/* Population distribution */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1">Population Distribution</p>
              <p className="text-xs text-zinc-500 mb-4">Where your overall score sits</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-semibold" style={{ color: getScoreColor(finalScore) }}>{finalScore.toFixed(2)}</span>
                <span className="text-xs text-zinc-400">· Top {100 - getPercentile(finalScore)}%</span>
              </div>
              <PopulationChart score={finalScore} />
              <div className="flex justify-between text-xs text-zinc-400 mt-1">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* Strengths + Weaknesses */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex-1">
                <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Top Strengths</p>
                <div className="space-y-3">
                  {topMetrics.map(m => (
                    <div key={m.definition.id}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs text-zinc-700 truncate flex-1 mr-2">{m.definition.name}</p>
                        <span className="text-xs font-semibold flex-shrink-0" style={{ color: getScoreColor(m.score!) }}>{m.score!.toFixed(1)}</span>
                      </div>
                      <ScoreBar score={m.score!} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex-1">
                <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Weakest Areas</p>
                <div className="space-y-3">
                  {weakestMetrics.map(m => (
                    <div key={m.definition.id}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs text-zinc-700 truncate flex-1 mr-2">{m.definition.name}</p>
                        <span className="text-xs font-semibold flex-shrink-0" style={{ color: getScoreColor(m.score!) }}>{m.score!.toFixed(1)}</span>
                      </div>
                      <ScoreBar score={m.score!} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pillar breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {pillars.map(p => {
              const entries = p.label === "Harmony"
                ? null
                : p.label === "Angularity"
                ? Object.entries(angularitySubScores)
                : Object.entries(dimorphismGeoScores);

              const harmonyMetrics = p.label === "Harmony"
                ? HARMONY_CATEGORIES.flatMap(cat =>
                    result.metrics.filter(m => m.definition.category === cat && m.score !== null)
                  ).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5)
                : null;

              return (
                <div key={p.label} className="bg-white rounded-2xl border border-zinc-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-black">{p.label}</p>
                    <span className="text-sm font-semibold" style={{ color: getScoreColor(p.score) }}>{p.score.toFixed(2)}</span>
                  </div>
                  <div className="space-y-3">
                    {harmonyMetrics ? harmonyMetrics.map(m => (
                      <div key={m.definition.id}>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs text-zinc-600 truncate flex-1 mr-2">{m.definition.name}</p>
                          <span className="text-xs font-semibold flex-shrink-0" style={{ color: getScoreColor(m.score!) }}>{m.score!.toFixed(1)}</span>
                        </div>
                        <ScoreBar score={m.score!} />
                      </div>
                    )) : entries?.slice(0, 5).map(([name, score]) => (
                      <div key={name}>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs text-zinc-600 truncate flex-1 mr-2">{name}</p>
                          <span className="text-xs font-semibold flex-shrink-0" style={{ color: getScoreColor(score) }}>{score.toFixed(1)}</span>
                        </div>
                        <ScoreBar score={score} />
                      </div>
                    ))}
                  </div>
                  <button onClick={onGoToAnalysis} className="mt-4 w-full text-xs text-zinc-400 hover:text-black transition-colors text-center">
                    View all →
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}