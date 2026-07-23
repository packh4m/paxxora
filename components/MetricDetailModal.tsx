"use client";

import { useEffect, useCallback, useState } from "react";
import { MetricResult, Point } from "@/lib/types";
import { getScoreColor, getScoreLabel } from "@/lib/scoring";
import LandmarkEditor from "./LandmarkEditor";

interface MetricDetailModalProps {
  metric: MetricResult;
  metrics: MetricResult[];
  currentIndex: number;
  imageUrl: string;
  landmarks: Point[];
  imageWidth: number;
  imageHeight: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onLandmarksUpdate?: (updatedLandmarks: Point[]) => void;
}

const LINE_COLOR = "#00CED1";
const LINE_COLOR_SECONDARY = "rgba(0,206,209,0.5)";
const LINE_WIDTH = 2;

const METRIC_LANDMARKS: Record<string, number[]> = {
  midface_ratio: [2, 3, 40],
  nose_bridge_width: [36, 37, 4, 5],
  lower_third: [35, 7],
  lip_ratio: [40, 6, 38, 42, 39],  
  chin_philtrum: [35, 42, 7],
  canthal_tilt: [12, 13, 23, 24],
  middle_third: [17, 18, 28, 29, 35, 1, 7],
  top_third: [1, 7, 17, 18, 28, 29],
  cupids_bow_depth: [40, 41],
  face_width_height: [51, 52, 34, 7],
  total_face_width_height: [51, 52, 1, 7],
  eye_separation: [2, 3, 51, 52],
  bigonial_width: [43, 44, 51, 52],
  lower_third_proportion: [35, 42, 7],
  mouth_nose_ratio: [38, 39, 4, 5],
  jaw_frontal_angle: [45, 46, 47, 48],
  alar_angle: [16, 27, 35],
  neck_width: [49, 50, 51, 52],
  bitemporal_width: [10, 11, 51, 52],
  intercanthal_nasal: [12, 23, 4, 5],
  ipd_mouth_ratio: [2, 3, 38, 39],
  brow_length_ratio: [18, 21, 29, 32, 51, 52],
  cheekbone_height: [51, 52, 13, 24],
  eye_aspect_ratio: [12, 13, 14, 15, 23, 24, 25, 26],
  eyebrow_tilt: [17, 18, 19, 20, 28, 29, 30, 31],
  jaw_slope: [51, 45, 47, 52, 46, 48],
  iaa_jfa_deviation: [16, 27, 35, 45, 46, 47, 48],
  ear_protrusion_ratio: [8, 9, 51, 52],
  ear_protrusion_angle: [8, 9, 42, 51, 52],};

const LANDMARK_NAMES: Record<number, string> = {
  1: "Hairline", 2: "Left Pupil", 3: "Right Pupil", 4: "Left Nose Side",
  5: "Right Nose Side", 6: "Lower Lip Center", 7: "Chin Bottom",
  8: "Left Outer Ear", 9: "Right Outer Ear", 10: "Left Temple", 11: "Right Temple",
  12: "Left Medial Canthus", 13: "Left Lateral Canthus", 14: "Left Upper Eyelid",
  15: "Left Lower Eyelid", 16: "Left Eyelid Hood", 17: "Left Brow Head",
  18: "Left Brow Inner Corner", 19: "Left Brow Arch", 20: "Left Brow Peak",
  21: "Left Brow Tail", 22: "Left Eyelid Crease", 23: "Right Medial Canthus",
  24: "Right Lateral Canthus", 25: "Right Upper Eyelid", 26: "Right Lower Eyelid",
  27: "Right Eyelid Hood", 28: "Right Brow Head", 29: "Right Brow Inner Corner",
  30: "Right Brow Arch", 31: "Right Brow Peak", 32: "Right Brow Tail",
  33: "Right Eyelid Crease", 34: "Nasal Base", 35: "Nose Bottom",
  36: "Left Nose Bridge", 37: "Right Nose Bridge", 38: "Left Mouth Corner",
  39: "Right Mouth Corner", 40: "Cupid's Bow", 41: "Inner Cupid's Bow",
  42: "Mouth Middle", 43: "Left Upper Jaw Angle", 44: "Right Upper Jaw Angle",
  45: "Left Lower Jaw Angle", 46: "Right Lower Jaw Angle", 47: "Left Chin",
  48: "Right Chin", 49: "Left Neck Point", 50: "Right Neck Point",
  51: "Left Cheekbone", 52: "Right Cheekbone",
};

export default function MetricDetailModal({
  metric,
  metrics,
  currentIndex,
  imageUrl,
  landmarks,
  imageWidth,
  imageHeight,
  onClose,
  onNavigate,
  onLandmarksUpdate,
}: MetricDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "edit">("overview");
  const [editingLandmarkIndex, setEditingLandmarkIndex] = useState<number | null>(null);

  const detectableMetrics = metrics.filter((m) => m.value !== null);
  const detectableIndex = detectableMetrics.findIndex(
    (m) => m.definition.id === metric.definition.id
  );

  const usedLandmarks = METRIC_LANDMARKS[metric.definition.id] ?? [];

  const L = useCallback((idx: number): Point => {
    if (idx >= 0 && idx < landmarks.length && landmarks[idx]) return landmarks[idx];
    return { x: 0, y: 0 };
  }, [landmarks]);

  const mid = (p1: Point, p2: Point): Point => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  });

  const renderMeasurementLines = () => {
    const metricId = metric.definition.id;
    const value = metric.value;
    const unit = metric.definition.unit;
    const valueStr = value !== null ? `${value.toFixed(unit === "x" ? 2 : 1)}${unit}` : "";
    const elements: JSX.Element[] = [];
    let k = 0;

    const line = (p1: Point, p2: Point, secondary = false) => {
      elements.push(
        <line key={`l${k++}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          stroke={secondary ? LINE_COLOR_SECONDARY : LINE_COLOR}
          strokeWidth={LINE_WIDTH} strokeLinecap="round" />
      );
    };

    const dot = (p: Point, r = 4) => {
      elements.push(<circle key={`d${k++}`} cx={p.x} cy={p.y} r={r} fill={LINE_COLOR} />);
    };

    const label = (text: string, p: Point, offsetY = -12) => {
      elements.push(
        <g key={`lb${k++}`}>
          <rect x={p.x - 20} y={p.y + offsetY - 8} width={40} height={16} fill="rgba(0,0,0,0.7)" rx={4} />
          <text x={p.x} y={p.y + offsetY} fill="white" fontSize="11" textAnchor="middle"
            dominantBaseline="middle" fontFamily="system-ui, sans-serif" fontWeight="500">{text}</text>
        </g>
      );
    };

    switch (metricId) {
      case "mouth_corner_position": line(L(38), { x: L(38).x, y: L(42).y }); line(L(39), { x: L(39).x, y: L(42).y }, true); dot(L(38)); dot(L(39)); dot(L(42)); label(valueStr, mid(L(38), L(39)), 16); break;
      case "nose_bridge_width": line(L(36), L(37)); line(L(4), L(5)); dot(L(36)); dot(L(37)); dot(L(4)); dot(L(5)); label(valueStr, mid(L(36), L(37))); break;
      case "lower_third": line(L(35), L(7)); dot(L(35)); dot(L(7)); label(valueStr, mid(L(35), L(7)), 16); break;
      case "lip_ratio": line(L(40), L(42)); line(L(42), L(6)); dot(L(40)); dot(L(42)); dot(L(6)); label(valueStr, L(42), 20); break;
      case "chin_philtrum": line(L(35), L(42)); line(L(42), L(7)); dot(L(35)); dot(L(42)); dot(L(7)); label(valueStr, mid(L(42), L(7)), 16); break;
      case "canthal_tilt": line(L(12), L(13)); line(L(23), L(24)); dot(L(12)); dot(L(13)); dot(L(23)); dot(L(24)); label(valueStr, mid(L(12), L(13)), -14); break;
      case "midface_ratio": { const midX = (L(2).x + L(3).x) / 2; const midY = (L(2).y + L(3).y) / 2; line(L(2), L(3)); line({ x: midX, y: midY }, { x: midX, y: L(40).y }); dot(L(2)); dot(L(3)); dot(L(40)); label(valueStr, { x: midX, y: midY }, -14); break; }
case "top_third": {
  const browMidY = (L(17).y + L(18).y + L(28).y + L(29).y) / 4;
  const browMidX = (L(17).x + L(18).x + L(28).x + L(29).x) / 4;
  line(L(1), { x: L(1).x, y: browMidY });
  dot(L(1)); dot(L(17)); dot(L(18)); dot(L(28)); dot(L(29));
  label(valueStr, { x: L(1).x, y: (L(1).y + browMidY) / 2 }, 0);
  break;
}      case "face_width_height": line(L(51), L(52)); dot(L(51)); dot(L(52)); label(valueStr, mid(L(51), L(52)), -14); break;
      case "brow_eye_distance": line(L(18), L(2)); line(L(29), L(3), true); dot(L(18)); dot(L(2)); dot(L(29)); dot(L(3)); label(valueStr, mid(L(18), L(2)), 16); break;
      case "total_face_width_height": line(L(51), L(52)); line(L(1), L(7)); dot(L(51)); dot(L(52)); dot(L(1)); dot(L(7)); label(valueStr, mid(L(51), L(52)), -14); break;
      case "eye_separation": line(L(2), L(3)); line(L(51), L(52), true); dot(L(2)); dot(L(3)); dot(L(51)); dot(L(52)); label(valueStr, mid(L(2), L(3)), -14); break;
case "middle_third": {
  const browMidY = (L(17).y + L(18).y + L(28).y + L(29).y) / 4;
  const browMidX = (L(17).x + L(18).x + L(28).x + L(29).x) / 4;
  line({ x: browMidX, y: browMidY }, L(35));
  dot(L(17)); dot(L(18)); dot(L(28)); dot(L(29)); dot(L(35));
  label(valueStr, { x: browMidX, y: (browMidY + L(35).y) / 2 }, 0);
  break;
}      case "bigonial_width": line(L(43), L(44)); line(L(51), L(52), true); dot(L(43)); dot(L(44)); dot(L(51)); dot(L(52)); label(valueStr, mid(L(43), L(44)), 16); break;
      case "lower_third_proportion": line(L(35), L(42)); line(L(42), L(7), true); dot(L(35)); dot(L(42)); dot(L(7)); label(valueStr, mid(L(35), L(42)), 16); break;
      case "mouth_nose_ratio": line(L(38), L(39)); line(L(4), L(5), true); dot(L(38)); dot(L(39)); dot(L(4)); dot(L(5)); label(valueStr, mid(L(38), L(39)), 16); break;
      case "jaw_frontal_angle": line(L(45), L(47)); line(L(46), L(48)); dot(L(45)); dot(L(46)); dot(L(47)); dot(L(48)); label(valueStr, mid(L(45), L(47)), 16); break;
      case "alar_angle": line(L(16), L(35)); line(L(27), L(35)); dot(L(16)); dot(L(27)); dot(L(35)); label(valueStr, L(35), 20); break;
      case "neck_width": line(L(49), L(50)); line(L(51), L(52), true); dot(L(49)); dot(L(50)); dot(L(51)); dot(L(52)); label(valueStr, mid(L(49), L(50)), 16); break;
      case "bitemporal_width": line(L(10), L(11)); line(L(51), L(52), true); dot(L(10)); dot(L(11)); dot(L(51)); dot(L(52)); label(valueStr, mid(L(10), L(11)), -14); break;
      case "intercanthal_nasal": line(L(12), L(23)); line(L(4), L(5), true); dot(L(12)); dot(L(23)); dot(L(4)); dot(L(5)); label(valueStr, mid(L(12), L(23)), -14); break;
      case "ipd_mouth_ratio": line(L(2), L(3)); line(L(38), L(39), true); dot(L(2)); dot(L(3)); dot(L(38)); dot(L(39)); label(valueStr, mid(L(2), L(3)), -14); break;
      case "brow_length_ratio": line(L(18), L(21)); line(L(29), L(32)); line(L(51), L(52), true); dot(L(18)); dot(L(21)); dot(L(29)); dot(L(32)); dot(L(51)); dot(L(52)); label(valueStr, mid(L(18), L(21)), -14); break;
      case "cheekbone_height": {
        const eyeY = (L(13).y + L(24).y) / 2;
        line({ x: L(13).x, y: eyeY }, { x: L(24).x, y: eyeY }, true);
        const cheekY = (L(51).y + L(52).y) / 2;
        line({ x: L(51).x, y: cheekY }, { x: L(52).x, y: cheekY });
        dot(L(51)); dot(L(52)); dot(L(13)); dot(L(24));
        label(valueStr, { x: (L(51).x + L(52).x) / 2, y: cheekY }, -14);
        break;
      }
      case "eye_aspect_ratio": {
        const lX = (L(12).x + L(13).x) / 2;
        line({ x: L(13).x, y: (L(13).y + L(12).y) / 2 }, { x: L(12).x, y: (L(12).y + L(13).y) / 2 });
        line({ x: lX, y: L(14).y }, { x: lX, y: L(15).y });
        const rX = (L(23).x + L(24).x) / 2;
        line({ x: L(23).x, y: (L(23).y + L(24).y) / 2 }, { x: L(24).x, y: (L(24).y + L(23).y) / 2 });
        line({ x: rX, y: L(25).y }, { x: rX, y: L(26).y });
        dot(L(12)); dot(L(13)); dot(L(14)); dot(L(15));
        dot(L(23)); dot(L(24)); dot(L(25)); dot(L(26));
        label(valueStr, { x: lX, y: L(15).y }, 16);
        break;
      }
      case "eyebrow_tilt": {
        const ls = mid(L(17), L(18));
        const le = mid(L(19), L(20));
        line(ls, le); dot(ls); dot(le);
        const rs = mid(L(28), L(29));
        const re = mid(L(30), L(31));
        line(rs, re); dot(rs); dot(re);
        label(valueStr, mid(ls, le), -14);
        break;
      }
      case "jaw_slope": {
        line(L(51), L(45)); line(L(45), L(47));
        line(L(52), L(46)); line(L(46), L(48));
        dot(L(51)); dot(L(45)); dot(L(47));
        dot(L(52)); dot(L(46)); dot(L(48));
        label(valueStr, L(45), -14);
        break;
      }
      case "iaa_jfa_deviation": {
        line(L(16), L(35)); line(L(27), L(35));
        dot(L(16)); dot(L(27)); dot(L(35));
        line(L(45), L(47)); line(L(46), L(48));
        dot(L(45)); dot(L(46)); dot(L(47)); dot(L(48));
        label(valueStr, L(35), -14);
        break;
      }
      default:
        label(valueStr, { x: imageWidth / 2, y: imageHeight / 2 });
        break;
    }

    return elements;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingLandmarkIndex !== null) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && detectableIndex > 0) {
        const prev = detectableMetrics[detectableIndex - 1];
        onNavigate(metrics.findIndex(m => m.definition.id === prev.definition.id));
      }
      if (e.key === "ArrowRight" && detectableIndex < detectableMetrics.length - 1) {
        const next = detectableMetrics[detectableIndex + 1];
        onNavigate(metrics.findIndex(m => m.definition.id === next.definition.id));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detectableIndex, detectableMetrics, metrics, onClose, onNavigate, editingLandmarkIndex]);

  const handlePrev = () => {
    if (detectableIndex > 0) {
      const prev = detectableMetrics[detectableIndex - 1];
      onNavigate(metrics.findIndex(m => m.definition.id === prev.definition.id));
    }
  };

  const handleNext = () => {
    if (detectableIndex < detectableMetrics.length - 1) {
      const next = detectableMetrics[detectableIndex + 1];
      onNavigate(metrics.findIndex(m => m.definition.id === next.definition.id));
    }
  };

  const handleLandmarkDone = (updatedLandmarks: Point[]) => {
    setEditingLandmarkIndex(null);
    onLandmarksUpdate?.(updatedLandmarks);
  };

  const scoreColor = getScoreColor(metric.score ?? 5);
  const pct = ((metric.score ?? 0) / 10) * 100;

  if (editingLandmarkIndex !== null) {
    return (
      <LandmarkEditor
        imageUrl={imageUrl}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        landmarks={landmarks}
        editingIndex={editingLandmarkIndex}
        relevantIndices={usedLandmarks}
        onDone={handleLandmarkDone}
        onBack={() => setEditingLandmarkIndex(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>

      <button onClick={handlePrev} disabled={detectableIndex === 0}
        className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-zinc-200 shadow flex items-center justify-center transition-all ${detectableIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:shadow-md"}`}>
        <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button onClick={handleNext} disabled={detectableIndex === detectableMetrics.length - 1}
        className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-zinc-200 shadow flex items-center justify-center transition-all ${detectableIndex === detectableMetrics.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:shadow-md"}`}>
        <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-zinc-200">

        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-mono">{detectableIndex + 1} / {detectableMetrics.length}</span>
            <h2 className="text-lg font-semibold text-black">{metric.definition.name}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row" style={{ maxHeight: "75vh" }}>

          <div className="flex-1 bg-zinc-900 flex items-center justify-center overflow-hidden relative" style={{ minHeight: 300 }}>
            <div className="relative inline-block p-4">
              <img
                src={imageUrl}
                alt="Face analysis"
                className="max-w-full object-contain"
                style={{ maxHeight: "65vh", opacity: 0.9, display: "block" }}
              />
              <svg
                className="absolute top-4 left-4 pointer-events-none"
                style={{ width: "calc(100% - 32px)", height: "calc(100% - 32px)" }}
                viewBox={`0 0 ${imageWidth} ${imageHeight}`}
                preserveAspectRatio="none"
              >
                {renderMeasurementLines()}
              </svg>
            </div>
          </div>

          <div className="w-full md:w-72 flex flex-col overflow-y-auto border-t md:border-t-0 md:border-l border-zinc-100">

            <div className="flex border-b border-zinc-100">
              {(["overview", "edit"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                    activeTab === tab ? "border-black text-black" : "border-transparent text-zinc-400 hover:text-black"
                  }`}>
                  {tab === "edit" ? "Edit Landmarks" : "Overview"}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <>
                <div className="px-5 py-5 border-b border-zinc-100">
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-4xl font-semibold" style={{ color: scoreColor }}>
                      {metric.score !== null ? metric.score.toFixed(1) : "—"}
                    </span>
                    <span className="text-sm text-zinc-400 mb-1">/10</span>
                  </div>
                  <p className="text-xs text-zinc-400">{getScoreLabel(metric.score ?? 0)}</p>
                  <div className="mt-3">
                    <div className="relative h-2 rounded-full overflow-hidden" style={{
                      background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #22c55e, #eab308, #f97316, #ef4444)"
                    }}>
                      <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-zinc-300 rounded-full shadow"
                        style={{ left: `calc(${pct}% - 6px)` }} />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400 mt-1">
                      <span>0</span><span>5</span><span>10</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 border-b border-zinc-100">
                  <p className="text-xs text-zinc-400 mb-1 uppercase tracking-widest font-mono">Your Value</p>
                  <p className="text-2xl font-semibold text-black">{metric.displayValue ?? "—"}</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Ideal: {metric.definition.idealMin}{metric.definition.unit} – {metric.definition.idealMax}{metric.definition.unit}
                  </p>
                </div>

                <div className="px-5 py-4 border-b border-zinc-100">
                  <p className="text-xs text-zinc-400 mb-2 uppercase tracking-widest font-mono">About this ratio</p>
                  <p className="text-sm text-zinc-600 leading-relaxed">{metric.definition.description}</p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-xs text-zinc-400 mb-2 uppercase tracking-widest font-mono">Category</p>
                  <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 text-xs rounded-full border border-zinc-200">
                    {metric.definition.category}
                  </span>
                </div>
              </>
            )}

            {activeTab === "edit" && (
              <div className="flex-1 overflow-y-auto">
                <div className="px-5 py-4 border-b border-zinc-100">
                  <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1">Landmarks used</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    These points define this ratio. If one looks misplaced, tap the edit icon to adjust it — the value and score will update instantly.
                  </p>
                </div>
                <div>
                  {usedLandmarks.map(idx => (
                    <div key={idx} className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="text-sm text-zinc-700">{LANDMARK_NAMES[idx]}</span>
                      </div>
                      <button
                        onClick={() => setEditingLandmarkIndex(idx)}
                        className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}