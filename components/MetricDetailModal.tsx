"use client";

import { useEffect, useCallback } from "react";
import { MetricResult, Point } from "@/lib/types";
import { getScoreColor, getScoreLabel } from "@/lib/scoring";

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
}

const LINE_COLOR = "#00CED1";
const LINE_COLOR_SECONDARY = "rgba(0,206,209,0.5)";
const LINE_WIDTH = 2;

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
}: MetricDetailModalProps) {
  const detectableMetrics = metrics.filter((m) => m.value !== null);
  const detectableIndex = detectableMetrics.findIndex(
    (m) => m.definition.id === metric.definition.id
  );

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
      case "nose_bridge_width": line(L(36), L(37)); line(L(4), L(5)); dot(L(36)); dot(L(37)); dot(L(4)); dot(L(5)); label(valueStr, mid(L(36), L(37))); break;
      case "lower_third": line(L(35), L(7)); dot(L(35)); dot(L(7)); label(valueStr, mid(L(35), L(7)), 16); break;
      case "lip_ratio": line(L(40), L(42)); line(L(42), L(6)); dot(L(40)); dot(L(42)); dot(L(6)); label(valueStr, L(42), 20); break;
      case "chin_philtrum": line(L(35), L(42)); line(L(42), L(7)); dot(L(35)); dot(L(42)); dot(L(7)); label(valueStr, mid(L(42), L(7)), 16); break;
      case "canthal_tilt": line(L(12), L(13)); line(L(23), L(24)); dot(L(12)); dot(L(13)); dot(L(23)); dot(L(24)); label(valueStr, mid(L(12), L(13)), -14); break;
      case "midface_ratio": line(L(2), L(3)); line(L(34), L(35)); dot(L(2)); dot(L(3)); dot(L(34)); dot(L(35)); label(valueStr, mid(L(2), L(3)), -14); break;
      case "cupids_bow_depth": line(L(40), L(41)); dot(L(40)); dot(L(41)); label(valueStr, L(41), 16); break;
      case "top_third": { const g = mid(L(18), L(29)); line(L(1), g); dot(L(1)); dot(g); label(valueStr, mid(L(1), g), 16); break; }
      case "face_width_height": line(L(51), L(52)); dot(L(51)); dot(L(52)); label(valueStr, mid(L(51), L(52)), -14); break;
      case "brow_eye_distance": line(L(20), L(14)); line(L(31), L(25), true); dot(L(20)); dot(L(14)); dot(L(31)); dot(L(25)); label(valueStr, mid(L(20), L(14)), 16); break;
      case "total_face_width_height": line(L(51), L(52)); line(L(1), L(7)); dot(L(51)); dot(L(52)); dot(L(1)); dot(L(7)); label(valueStr, mid(L(51), L(52)), -14); break;
      case "eye_separation": line(L(2), L(3)); line(L(51), L(52), true); dot(L(2)); dot(L(3)); dot(L(51)); dot(L(52)); label(valueStr, mid(L(2), L(3)), -14); break;
      case "middle_third": { const g = mid(L(18), L(29)); line(g, L(35)); dot(g); dot(L(35)); label(valueStr, mid(g, L(35)), 16); break; }
      case "bigonial_width": line(L(43), L(44)); line(L(51), L(52), true); dot(L(43)); dot(L(44)); dot(L(51)); dot(L(52)); label(valueStr, mid(L(43), L(44)), 16); break;
      case "lower_third_proportion": line(L(35), L(42)); line(L(42), L(7), true); dot(L(35)); dot(L(42)); dot(L(7)); label(valueStr, mid(L(35), L(42)), 16); break;
      case "mouth_nose_ratio": line(L(38), L(39)); line(L(4), L(5), true); dot(L(38)); dot(L(39)); dot(L(4)); dot(L(5)); label(valueStr, mid(L(38), L(39)), 16); break;
      case "jaw_frontal_angle": {
        line(L(45), L(47)); line(L(46), L(48));
        dot(L(45)); dot(L(46)); dot(L(47)); dot(L(48));
        label(valueStr, mid(L(45), L(47)), 16);
        break;
      }
      case "alar_angle": line(L(4), L(35)); line(L(5), L(35)); dot(L(4)); dot(L(5)); dot(L(35)); label(valueStr, L(35), 20); break;
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
  }, [detectableIndex, detectableMetrics, metrics, onClose, onNavigate]);

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

  const scoreColor = getScoreColor(metric.score ?? 5);
  const pct = ((metric.score ?? 0) / 10) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>

      {/* Prev */}
      <button onClick={handlePrev} disabled={detectableIndex === 0}
        className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-zinc-200 shadow flex items-center justify-center transition-all ${detectableIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:shadow-md"}`}>
        <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next */}
      <button onClick={handleNext} disabled={detectableIndex === detectableMetrics.length - 1}
        className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-zinc-200 shadow flex items-center justify-center transition-all ${detectableIndex === detectableMetrics.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:shadow-md"}`}>
        <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Modal */}
      <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-zinc-200">

        {/* Header */}
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

        {/* Body */}
        <div className="flex flex-col md:flex-row" style={{ maxHeight: "75vh" }}>

          {/* Left — photo with SVG overlay using actual image dimensions */}
          <div className="flex-1 bg-zinc-900 flex items-center justify-center overflow-hidden relative" style={{ minHeight: 300 }}>
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <div className="relative inline-block">
                <img
                  src={imageUrl}
                  alt="Face analysis"
                  className="max-w-full object-contain"
                  style={{ maxHeight: "65vh", opacity: 0.9, display: "block" }}
                />
                <svg
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  viewBox={`0 0 ${imageWidth} ${imageHeight}`}
                  preserveAspectRatio="none"
                >
                  {renderMeasurementLines()}
                </svg>
              </div>
            </div>
          </div>

          {/* Right — info */}
          <div className="w-full md:w-72 flex flex-col overflow-y-auto border-t md:border-t-0 md:border-l border-zinc-100">

            {/* Score */}
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
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            {/* Value */}
            <div className="px-5 py-4 border-b border-zinc-100">
              <p className="text-xs text-zinc-400 mb-1 uppercase tracking-widest font-mono">Your Value</p>
              <p className="text-2xl font-semibold text-black">{metric.displayValue ?? "—"}</p>
              <p className="text-xs text-zinc-400 mt-1">
                Ideal: {metric.definition.idealMin}{metric.definition.unit} – {metric.definition.idealMax}{metric.definition.unit}
              </p>
            </div>

            {/* Description */}
            <div className="px-5 py-4 border-b border-zinc-100">
              <p className="text-xs text-zinc-400 mb-2 uppercase tracking-widest font-mono">About this ratio</p>
              <p className="text-sm text-zinc-600 leading-relaxed">{metric.definition.description}</p>
            </div>

            {/* Category */}
            <div className="px-5 py-4">
              <p className="text-xs text-zinc-400 mb-2 uppercase tracking-widest font-mono">Category</p>
              <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 text-xs rounded-full border border-zinc-200">
                {metric.definition.category}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}