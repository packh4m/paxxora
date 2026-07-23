"use client";

import { useState, useMemo } from "react";
import { AnalysisResult, MetricCategory, VISION_METRIC_LABELS } from "@/lib/types";
import LandmarkOverlay from "./LandmarkOverlay";
import MetricDetailModal from "./MetricDetailModal";
import { calculateAllMetrics } from "@/lib/metrics";
import { getScoreColor, getScoreLabel, calculateOverallScore, getPercentile } from "@/lib/scoring";
import Link from "next/link";

interface ResultsDisplayProps {
  result: AnalysisResult;
  onReset: () => void;
  onResultUpdate?: (updated: AnalysisResult) => void;
}

const HARMONY_CATEGORIES: MetricCategory[] = ["Facial Thirds", "Eyes", "Nose", "Jaw", "Lips", "Brows", "Features"];

type Tab = "harmony" | "angularity" | "dimorphism";

interface CompositeMetricInfo {
  name: string;
  score: number;
  description: string;
  why: string;
}

const ANGULARITY_INFO: Record<string, { description: string; why: string }> = {
  "Jaw Definition": { description: "Measures the sharpness and angularity of the jawline based on jaw frontal angle and jaw slope.", why: "A well-defined jaw creates strong facial structure and is one of the most important markers of masculine attractiveness. It separates the face from the neck cleanly, creating visual impact and dominance." },
  "Chin Definition": { description: "Evaluates chin projection and the philtrum-to-chin ratio relative to the lower face.", why: "A defined chin acts as an anchor for the lower third of the face. It balances the overall facial profile and contributes to a strong, structured appearance." },
  "Cheekbone Prominence": { description: "Assesses how high and projected the cheekbones are relative to total facial height.", why: "High cheekbones cast shadows that create facial depth and dimension. They are a universal marker of attractiveness across cultures and contribute heavily to a chiselled appearance." },
  "Cheek Leanness": { description: "Evaluates facial leanness through midface ratio and jaw width proportions.", why: "Lean cheeks expose underlying bone structure and reduce soft tissue that obscures facial definition. Lower facial fat reveals the angles that make a face appear sculpted." },
  "Submental Definition": { description: "Measures the definition of the neck-jaw transition using neck width and jaw slope.", why: "A clean neck-to-jaw transition is critical for a sharp profile. Excess submental fat or a weak jawline blurs this boundary, reducing overall facial sharpness." },
};

const DIMORPHISM_GEO_INFO: Record<string, { description: string; why: string }> = {
  "Jaw": { description: "Composite of jaw frontal angle, bigonial width, and jaw slope to measure jaw masculinity.", why: "The jaw is the single most important structure for male sexual dimorphism. A wide, angular jaw signals testosterone exposure and genetic fitness, making it the defining feature of a masculine face." },
  "Eyes": { description: "Combines canthal tilt and eye aspect ratio to evaluate eye masculinity.", why: "Positively tilted, narrower eyes (hunter eyes) are a hallmark of masculine faces. They convey intensity and dominance, contrasting with the rounder, more open eyes associated with feminine faces." },
  "Face Shape": { description: "Evaluates overall face shape masculinity using width-to-height ratios.", why: "Masculine faces tend to be wider and more square-shaped. A higher facial width-to-height ratio is associated with dominance, aggression, and testosterone levels." },
  "Nose": { description: "Assesses nose masculinity through intercanthal-nasal ratio and middle third proportions.", why: "Masculine noses tend to be wider and more prominent. Nose size and projection relative to facial width is a key dimorphic trait that signals androgenic development." },
  "Brow Ridge": { description: "Measures brow prominence through eyebrow tilt and brow length ratio.", why: "A prominent, low-set brow ridge is one of the clearest markers of male sexual dimorphism. It creates a shadow over the eyes that enhances the appearance of depth and intensity." },
  "Lips": { description: "Evaluates lip masculinity through chin-to-philtrum ratio and lower third proportion.", why: "Thinner lips relative to the lower face are a masculine trait. The proportion of the philtrum and chin to the lip height contributes to how masculine or feminine the mouth region appears." },
};

const DIMORPHISM_VISION_INFO: Record<string, { description: string; why: string }> = {
  facial_hair: { description: "AI assessment of facial hair presence and density.", why: "Facial hair is the most overt signal of male sexual maturity and testosterone levels. A full, dense beard dramatically enhances perceived masculinity and dominance." },
  neck: { description: "AI assessment of neck thickness and muscular definition.", why: "A thick, muscular neck signals physical strength and androgenic development. It contributes to an overall powerful appearance and is a secondary sexual characteristic in males." },
  eyebrow_thickness: { description: "AI assessment of eyebrow thickness and density.", why: "Thicker, denser eyebrows are a masculine trait linked to androgen sensitivity. They frame the eyes more strongly and contribute to a more intense, dominant expression." },
  nose_masculinity: { description: "AI assessment of overall nose masculinity.", why: "A wider, more prominent nose with a straighter bridge is a masculine feature. Nose size scales with overall facial size, which is itself a marker of androgenic development." },
  brow_ridge: { description: "AI assessment of brow ridge prominence.", why: "The supraorbital ridge is one of the most reliable skeletal markers of sexual dimorphism. Its prominence is driven by testosterone during puberty and creates the hooded, intense eye appearance associated with masculinity." },
  hairline: { description: "AI assessment of hairline masculinity and definition.", why: "A defined, masculine hairline with temples that frame the face contributes to overall facial structure. Paradoxically, some hairline recession can signal elevated androgens in certain contexts." },
  eyes_dimorphism: { description: "AI assessment of eye masculinity — depth, hooding, and canthal tilt.", why: "Deep-set, hooded eyes with a positive canthal tilt (hunter eyes) are strongly associated with masculine attractiveness. They convey predatory intensity and are a consistent preference in attraction research." },
  lip_masculinity: { description: "AI assessment of lip masculinity.", why: "Thinner, less defined lips are a masculine trait. Overly full lips on a male face can feminise the appearance, while thinner lips reinforce the angular, structured look of a masculine face." },
  face_shape_dimorphism: { description: "AI assessment of overall face shape masculinity.", why: "A square, angular face shape is driven by bone structure developed under androgenic influence. It is one of the most universally recognised markers of male attractiveness and dominance." },
  jaw_dimorphism: { description: "AI assessment of jaw masculinity specifically.", why: "The jaw is the cornerstone of male facial attractiveness. Width, squareness, and definition of the jaw directly signal testosterone exposure and genetic quality to potential mates." },
  hair_length: { description: "AI assessment of how masculine the hair length and style appears.", why: "Shorter hair traditionally emphasises facial structure and is associated with masculinity. Longer hair can soften facial features and reduce the perception of masculine sharpness." },
  skin_quality: { description: "AI assessment of skin clarity and smoothness.", why: "Clear, smooth skin signals health and genetic fitness. It is a universal marker of attractiveness that correlates with hormonal balance and overall physical health." },
  facial_fat: { description: "AI assessment of facial leanness.", why: "A lean face exposes underlying bone structure and enhances facial definition. Lower facial fat is strongly associated with perceived attractiveness and health in males." },
  overall_impression: { description: "AI overall aesthetic impression based on bone structure.", why: "The overall impression captures how all facial features work together to create an attractive appearance. It reflects the holistic impact of facial structure beyond individual metrics." },
};

const ALL_DIMORPHISM_VISION_KEYS: Array<keyof typeof VISION_METRIC_LABELS> = [
  "facial_hair", "neck", "eyebrow_thickness", "nose_masculinity",
  "brow_ridge", "hairline", "eyes_dimorphism", "lip_masculinity",
  "face_shape_dimorphism", "jaw_dimorphism", "hair_length",
  "skin_quality", "facial_fat", "overall_impression",
];

function GradientBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  return (
    <div className="relative flex-1 h-2 rounded-full overflow-hidden" style={{
      background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #22c55e, #eab308, #f97316, #ef4444)"
    }}>
      <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-zinc-300 rounded-full shadow"
        style={{ left: `calc(${pct}% - 6px)` }} />
    </div>
  );
}

function MetricRow({ name, value, score, onClick }: { name: string; value?: string; score: number; onClick?: () => void }) {
  const color = getScoreColor(score);
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 py-3 px-4 text-left transition-all hover:bg-zinc-50 border-b border-zinc-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-700 truncate">{name}</p>
        {value && <span className="text-xs text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">{value}</span>}
      </div>
      <div className="w-28 flex-shrink-0"><GradientBar score={score} /></div>
      <span className="text-sm font-semibold w-10 text-right flex-shrink-0" style={{ color }}>{score.toFixed(2)}</span>
      <svg className="w-4 h-4 text-zinc-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function CompositeMetricModal({ metric, onClose }: { metric: CompositeMetricInfo; onClose: () => void }) {
  const color = getScoreColor(metric.score);
  const pct = (metric.score / 10) * 100;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-zinc-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-black">{metric.name}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 border-b border-zinc-100">
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-semibold" style={{ color }}>{metric.score.toFixed(2)}</span>
            <span className="text-sm text-zinc-400 mb-1">/10</span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden mb-1" style={{
            background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #22c55e, #eab308, #f97316, #ef4444)"
          }}>
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-zinc-300 rounded-full shadow"
              style={{ left: `calc(${pct}% - 6px)` }} />
          </div>
          <p className="text-xs text-zinc-400 mt-1">{getScoreLabel(metric.score)}</p>
        </div>
        <div className="px-6 py-4 border-b border-zinc-100">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">What it measures</p>
          <p className="text-sm text-zinc-600 leading-relaxed">{metric.description}</p>
        </div>
        <div className="px-6 py-4">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Why it matters</p>
          <p className="text-sm text-zinc-600 leading-relaxed">{metric.why}</p>
        </div>
      </div>
    </div>
  );
}

export default function ResultsDisplay({ result, onReset, onResultUpdate }: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<Tab>("harmony");
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [selectedMetricIndex, setSelectedMetricIndex] = useState<number | null>(null);
  const [selectedComposite, setSelectedComposite] = useState<CompositeMetricInfo | null>(null);

  const getScore = (id: string) => result.metrics.find(r => r.definition.id === id)?.score ?? 5.0;

  const { harmonyScore, harmonyMetrics } = useMemo(() => {
    const harmonyMetrics = HARMONY_CATEGORIES.map(category => ({
      category,
      metrics: result.metrics.filter(m => m.definition.category === category),
    }));
    const harmonyScores = harmonyMetrics.flatMap(c => c.metrics).filter(m => m.score !== null).map(m => m.score as number);
    const harmonyIds = harmonyMetrics.flatMap(c => c.metrics).map(m => m.definition.id);
    const harmonyScore = calculateOverallScore(harmonyScores, harmonyIds);
    return { harmonyScore, harmonyMetrics };
  }, [result.metrics]);

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

  const angularityScore = useMemo(() => {
    const scores = Object.values(angularitySubScores);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [angularitySubScores]);

  const dimorphismScore = useMemo(() => {
    const geoScores = Object.values(dimorphismSubScores);
    const visionScores = result.visionScores
      ? ALL_DIMORPHISM_VISION_KEYS.map(k => result.visionScores![k] as number).filter(v => v !== undefined)
      : [];
    const all = [...geoScores, ...visionScores];
    return all.reduce((a, b) => a + b, 0) / all.length;
  }, [dimorphismSubScores, result.visionScores]);

  const finalScore = result.finalScore ?? result.overallScore;

  const tabs: { id: Tab; label: string; score: number }[] = [
    { id: "harmony", label: "Harmony", score: harmonyScore },
    { id: "angularity", label: "Angularity", score: angularityScore },
    { id: "dimorphism", label: "Dimorphism", score: dimorphismScore },
  ];

  const activeScore = tabs.find(t => t.id === activeTab)?.score ?? 0;

  const sortedHarmonyMetrics = useMemo(() =>
    harmonyMetrics.flatMap(({ metrics }) => metrics)
      .filter(m => m.score !== null)
      .sort((a, b) => (a.score ?? 0) - (b.score ?? 0)),
    [harmonyMetrics]
  );

  const sortedAngularityEntries = useMemo(() =>
    Object.entries(angularitySubScores).sort((a, b) => a[1] - b[1]),
    [angularitySubScores]
  );

  const sortedDimorphismItems = useMemo(() => {
    const geoItems = Object.entries(dimorphismSubScores).map(([name, score]) => ({
      name, score, type: "geo" as const,
    }));
    const visionItems = result.visionScores
      ? ALL_DIMORPHISM_VISION_KEYS
          .filter(key => result.visionScores![key] !== undefined)
          .map(key => ({
            name: VISION_METRIC_LABELS[key],
            score: result.visionScores![key] as number,
            type: "vision" as const,
            key,
          }))
      : [];
    return [...geoItems, ...visionItems].sort((a, b) => a.score - b.score);
  }, [dimorphismSubScores, result.visionScores]);

  const handleMetricClick = (metricId: string) => {
    const index = result.metrics.findIndex(m => m.definition.id === metricId);
    if (index !== -1 && result.metrics[index].value !== null) setSelectedMetricIndex(index);
  };

  const handleAngularityClick = (name: string, score: number) => {
    const info = ANGULARITY_INFO[name];
    if (info) setSelectedComposite({ name, score, ...info });
  };

  const handleDimorphismGeoClick = (name: string, score: number) => {
    const info = DIMORPHISM_GEO_INFO[name];
    if (info) setSelectedComposite({ name, score, ...info });
  };

  const handleDimorphismVisionClick = (key: keyof typeof VISION_METRIC_LABELS, score: number) => {
    const info = DIMORPHISM_VISION_INFO[key as string];
    if (info) setSelectedComposite({ name: VISION_METRIC_LABELS[key], score, ...info });
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
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all border ${
                  activeTab === tab.id ? "bg-black text-white border-black" : "text-zinc-500 border-transparent hover:text-black"
                }`}>
                {tab.label}
              </button>
            ))}
            <button onClick={onReset} className="ml-3 px-3 py-1.5 text-sm text-zinc-400 hover:text-black transition-colors">
              New Analysis
            </button>
          </div>
        </div>
      </header>

      <div className="flex-shrink-0 bg-white border-b border-zinc-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-8">
          <div className="flex-shrink-0">
            <p className="text-xs text-zinc-400 mb-0.5">Overall</p>
            <p className="text-2xl font-semibold leading-none" style={{ color: getScoreColor(finalScore) }}>
              {finalScore.toFixed(2)}<span className="text-xs text-zinc-400 font-normal ml-1">/10</span>
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">{getScoreLabel(finalScore)}</p>
          </div>
          <div className="w-px h-10 bg-zinc-200 flex-shrink-0" />
          <div className="flex items-center gap-6">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="text-left">
                <p className={`text-xs mb-0.5 transition-colors ${activeTab === tab.id ? "text-black font-medium" : "text-zinc-400"}`}>
                  {tab.label}
                </p>
                <p className="text-lg font-semibold leading-none" style={{ color: getScoreColor(tab.score) }}>
                  {tab.score.toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full p-4 gap-4">
        <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-sm">
          <div className="flex-shrink-0 px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">{tabs.find(t => t.id === activeTab)?.label} score</p>
              <p className="text-xl font-semibold" style={{ color: getScoreColor(activeScore) }}>
                {activeScore.toFixed(2)}<span className="text-xs text-zinc-400 font-normal ml-1">/10</span>
              </p>
            </div>
            <button onClick={() => setShowLandmarks(!showLandmarks)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                showLandmarks ? "bg-black text-white border-black" : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400"
              }`}>
              {showLandmarks ? "Landmarks ON" : "Landmarks OFF"}
            </button>
          </div>
          <div className="flex-1 relative overflow-hidden rounded-b-2xl">
            {showLandmarks && result.landmarks && result.imageWidth && result.imageHeight ? (
              <LandmarkOverlay imageUrl={result.imageUrl} landmarks={result.landmarks} imageWidth={result.imageWidth} imageHeight={result.imageHeight} />
            ) : (
              <img src={result.imageUrl} alt="Analyzed photo" className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-sm">
          <div className="flex-shrink-0 px-6 py-3 border-b border-zinc-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-black">Your {tabs.find(t => t.id === activeTab)?.label} ratios</p>
            <p className="text-xs text-zinc-400">
              {activeTab === "harmony" ? sortedHarmonyMetrics.length :
               activeTab === "angularity" ? sortedAngularityEntries.length :
               sortedDimorphismItems.length} metrics
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "harmony" && sortedHarmonyMetrics.map(metric => (
              <MetricRow key={metric.definition.id} name={metric.definition.name}
                value={metric.value !== null ? String(metric.value.toFixed(2)) : undefined}
                score={metric.score!} onClick={() => handleMetricClick(metric.definition.id)} />
            ))}

            {activeTab === "angularity" && sortedAngularityEntries.map(([name, score]) => (
              <MetricRow key={name} name={name} score={score} onClick={() => handleAngularityClick(name, score)} />
            ))}

            {activeTab === "dimorphism" && (
              <>
                {sortedDimorphismItems.map(item =>
                  item.type === "geo" ? (
                    <MetricRow key={item.name} name={item.name} score={item.score}
                      onClick={() => handleDimorphismGeoClick(item.name, item.score)} />
                  ) : (
                    <MetricRow key={item.name} name={item.name} score={item.score}
                      onClick={() => handleDimorphismVisionClick((item as any).key, item.score)} />
                  )
                )}
                {!result.visionScores && !result.visionError && (
                  <div className="flex items-center gap-3 p-6">
                    <svg className="w-5 h-5 text-zinc-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <p className="text-sm text-zinc-500">Loading AI vision scores...</p>
                  </div>
                )}
              </>
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
          onLandmarksUpdate={(updatedLandmarks) => {
            const newMetrics = calculateAllMetrics({
              landmarks: updatedLandmarks,
              imageWidth: result.imageWidth!,
              imageHeight: result.imageHeight!,
            });
            const scores = newMetrics.map(m => m.score);
            const metricIds = newMetrics.map(m => m.definition.id);
            const newOverallScore = calculateOverallScore(scores, metricIds);
            onResultUpdate?.({
              ...result,
              metrics: newMetrics,
              overallScore: newOverallScore,
              landmarks: updatedLandmarks,
              finalScore: result.visionScores
                ? (newOverallScore * 0.5) + ((result.finalScore ?? result.overallScore) - result.overallScore * 0.5)
                : newOverallScore,
            });
          }}
        />
      )}

      {selectedComposite && (
        <CompositeMetricModal metric={selectedComposite} onClose={() => setSelectedComposite(null)} />
      )}
    </div>
  );
}