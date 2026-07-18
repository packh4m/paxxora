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
const LINE_COLOR_SECONDARY = "#00CED180";
const LINE_WIDTH = 0.4;

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

  const toPercent = useCallback((p: Point) => ({
    x: (p.x / imageWidth) * 100,
    y: (p.y / imageHeight) * 100,
  }), [imageWidth, imageHeight]);

  const midpoint = (p1: Point, p2: Point): Point => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  });

  const renderMeasurementLines = () => {
    const metricId = metric.definition.id;
    const value = metric.value;
    const unit = metric.definition.unit;
    const valueStr = value !== null ? `${value.toFixed(unit === "x" ? 2 : 1)}${unit}` : "";
    const elements: JSX.Element[] = [];
    let lineKey = 0;

    const addLine = (p1: Point, p2: Point, secondary = false) => {
      const pct1 = toPercent(p1);
      const pct2 = toPercent(p2);
      elements.push(
        <line key={`line-${lineKey++}`} x1={pct1.x} y1={pct1.y} x2={pct2.x} y2={pct2.y}
          stroke={secondary ? LINE_COLOR_SECONDARY : LINE_COLOR} strokeWidth={LINE_WIDTH} strokeLinecap="round" />
      );
    };

    const addPoint = (p: Point, radius = 0.5) => {
      const pct = toPercent(p);
      elements.push(<circle key={`point-${lineKey++}`} cx={pct.x} cy={pct.y} r={radius} fill={LINE_COLOR} />);
    };

    const addLabel = (text: string, p: Point, offsetY = -3) => {
      const pct = toPercent(p);
      elements.push(
        <g key={`label-${lineKey++}`}>
          <rect x={pct.x - 6} y={pct.y + offsetY - 2} width={12} height={4} fill="rgba(0,0,0,0.7)" rx={1} />
          <text x={pct.x} y={pct.y + offsetY} fill="white" fontSize="2.5" textAnchor="middle"
            dominantBaseline="middle" fontFamily="system-ui, sans-serif" fontWeight="500">{text}</text>
        </g>
      );
    };

    const addAngleArc = (center: Point, p1: Point, p2: Point, radius = 15) => {
      const pctC = toPercent(center);
      const angle1 = Math.atan2(p1.y - center.y, p1.x - center.x);
      const angle2 = Math.atan2(p2.y - center.y, p2.x - center.x);
      const r = (radius / imageWidth) * 100;
      const aspectRatio = imageWidth / imageHeight;
      const x1 = pctC.x + r * Math.cos(angle1);
      const y1 = pctC.y + r * Math.sin(angle1) * aspectRatio;
      const x2 = pctC.x + r * Math.cos(angle2);
      const y2 = pctC.y + r * Math.sin(angle2) * aspectRatio;
      const largeArc = Math.abs(angle2 - angle1) > Math.PI ? 1 : 0;
      const sweep = angle2 > angle1 ? 1 : 0;
      elements.push(
        <path key={`arc-${lineKey++}`} d={`M ${x1} ${y1} A ${r} ${r * aspectRatio} 0 ${largeArc} ${sweep} ${x2} ${y2}`}
          stroke={LINE_COLOR} strokeWidth={LINE_WIDTH} fill="none" />
      );
    };

    switch (metricId) {
      case "nose_bridge_width": addLine(L(36), L(37)); addLine(L(4), L(5)); addPoint(L(36)); addPoint(L(37)); addPoint(L(4)); addPoint(L(5)); addLabel(valueStr, midpoint(L(36), L(37))); break;
      case "lower_third": addLine(L(35), L(7)); addPoint(L(35)); addPoint(L(7)); addLabel(valueStr, midpoint(L(35), L(7)), 5); break;
      case "lip_ratio": addLine(L(40), L(42)); addLine(L(42), L(6)); addPoint(L(40)); addPoint(L(42)); addPoint(L(6)); addLabel(valueStr, L(42), 15); break;
      case "chin_philtrum": addLine(L(35), L(42)); addLine(L(42), L(7)); addPoint(L(35)); addPoint(L(42)); addPoint(L(7)); addLabel(valueStr, midpoint(L(42), L(7)), 5); break;
      case "canthal_tilt": addLine(L(12), L(13)); addLine(L(23), L(24)); addPoint(L(12)); addPoint(L(13)); addPoint(L(23)); addPoint(L(24)); addLabel(valueStr, midpoint(L(12), L(13)), -12); break;
      case "midface_ratio": addLine(L(2), L(3)); addLine(L(34), L(35)); addPoint(L(2)); addPoint(L(3)); addPoint(L(34)); addPoint(L(35)); addLabel(valueStr, midpoint(L(2), L(3)), -12); break;
      case "cupids_bow_depth": addLine(L(40), L(41)); addPoint(L(40)); addPoint(L(41)); addLabel(valueStr, L(41), 12); break;
      case "top_third": { const g = midpoint(L(18), L(29)); addLine(L(1), g); addPoint(L(1)); addPoint(g); addLabel(valueStr, midpoint(L(1), g), 5); break; }
      case "face_width_height": { addLine(L(51), L(52)); addPoint(L(51)); addPoint(L(52)); const m = midpoint(L(51), L(52)); addLabel(valueStr, m, -5); break; }
      case "brow_eye_distance": addLine(L(20), L(14)); addLine(L(31), L(25), true); addPoint(L(20)); addPoint(L(14)); addPoint(L(31)); addPoint(L(25)); addLabel(valueStr, midpoint(L(20), L(14)), 5); break;
      case "total_face_width_height": addLine(L(51), L(52)); addLine(L(1), L(7)); addPoint(L(51)); addPoint(L(52)); addPoint(L(1)); addPoint(L(7)); addLabel(valueStr, midpoint(L(51), L(52)), -12); break;
      case "eye_separation": addLine(L(2), L(3)); addLine(L(51), L(52), true); addPoint(L(2)); addPoint(L(3)); addPoint(L(51)); addPoint(L(52)); addLabel(valueStr, midpoint(L(2), L(3)), -12); break;
      case "middle_third": { const g = midpoint(L(18), L(29)); addLine(g, L(35)); addPoint(g); addPoint(L(35)); addLabel(valueStr, midpoint(g, L(35)), 5); break; }
      case "bigonial_width": addLine(L(43), L(44)); addLine(L(51), L(52), true); addPoint(L(43)); addPoint(L(44)); addPoint(L(51)); addPoint(L(52)); addLabel(valueStr, midpoint(L(43), L(44)), 12); break;
      case "lower_third_proportion": addLine(L(35), L(42)); addLine(L(42), L(7), true); addPoint(L(35)); addPoint(L(42)); addPoint(L(7)); addLabel(valueStr, midpoint(L(35), L(42)), 5); break;
      case "mouth_nose_ratio": addLine(L(38), L(39)); addLine(L(4), L(5), true); addPoint(L(38)); addPoint(L(39)); addPoint(L(4)); addPoint(L(5)); addLabel(valueStr, midpoint(L(38), L(39)), 12); break;
      case "jaw_frontal_angle": addLine(L(45), L(47)); addLine(L(46), L(47)); addPoint(L(45)); addPoint(L(46)); addPoint(L(47)); addAngleArc(L(47), L(45), L(46), 25); addLabel(valueStr, L(47), 35); break;
      case "alar_angle": addLine(L(4), L(35)); addLine(L(5), L(35)); addPoint(L(4)); addPoint(L(5)); addPoint(L(35)); addAngleArc(L(35), L(4), L(5), 20); addLabel(valueStr, L(35), 30); break;
      case "neck_width": addLine(L(49), L(50)); addLine(L(51), L(52), true); addPoint(L(49)); addPoint(L(50)); addPoint(L(51)); addPoint(L(52)); addLabel(valueStr, midpoint(L(49), L(50)), 12); break;
      case "bitemporal_width": addLine(L(10), L(11)); addLine(L(51), L(52), true); addPoint(L(10)); addPoint(L(11)); addPoint(L(51)); addPoint(L(52)); addLabel(valueStr, midpoint(L(10), L(11)), -12); break;
      case "intercanthal_nasal": addLine(L(12), L(23)); addLine(L(4), L(5), true); addPoint(L(12)); addPoint(L(23)); addPoint(L(4)); addPoint(L(5)); addLabel(valueStr, midpoint(L(12), L(23)), -12); break;
      case "ipd_mouth_ratio": addLine(L(2), L(3)); addLine(L(38), L(39), true); addPoint(L(2)); addPoint(L(3)); addPoint(L(38)); addPoint(L(39)); addLabel(valueStr, midpoint(L(2), L(3)), -12); break;
      case "brow_length_ratio": addLine(L(18), L(21)); addLine(L(29), L(32)); addLine(L(51), L(52), true); addPoint(L(18)); addPoint(L(21)); addPoint(L(29)); addPoint(L(32)); addPoint(L(51)); addPoint(L(52)); addLabel(valueStr, midpoint(L(18), L(21)), -12); break;
      case "cheekbone_height": {
        const eyeY = (L(13).y + L(24).y) / 2;
        addLine({ x: L(13).x, y: eyeY }, { x: L(24).x, y: eyeY }, true);
        const cheekY = (L(51).y + L(52).y) / 2;
        addLine({ x: L(51).x, y: cheekY }, { x: L(52).x, y: cheekY });
        addPoint(L(51)); addPoint(L(52)); addPoint(L(13)); addPoint(L(24));
        addLabel(valueStr, { x: L(52).x + 2, y: cheekY }, 0);
        break;
      }
      case "eye_aspect_ratio": {
        const lY = (L(13).y + L(12).y) / 2;
        addLine({ x: L(13).x, y: lY }, { x: L(12).x, y: lY });
        const rY = (L(23).y + L(24).y) / 2;
        addLine({ x: L(23).x, y: rY }, { x: L(24).x, y: rY });
        const lX = (L(12).x + L(13).x) / 2;
        addLine({ x: lX, y: L(14).y }, { x: lX, y: L(15).y });
        const rX = (L(23).x + L(24).x) / 2;
        addLine({ x: rX, y: L(25).y }, { x: rX, y: L(26).y });
        addPoint(L(12)); addPoint(L(13)); addPoint(L(14)); addPoint(L(15));
        addPoint(L(23)); addPoint(L(24)); addPoint(L(25)); addPoint(L(26));
        const lW = Math.abs(L(12).x - L(13).x); const lH = Math.abs(L(14).y - L(15).y);
        const rW = Math.abs(L(24).x - L(23).x); const rH = Math.abs(L(25).y - L(26).y);
        addLabel(`${lH > 0 ? (lW / lH).toFixed(2) : "—"}x`, { x: lX, y: L(15).y }, 15);
        addLabel(`${rH > 0 ? (rW / rH).toFixed(2) : "—"}x`, { x: rX, y: L(26).y }, 15);
        break;
      }
      case "eyebrow_tilt": {
        const ls = { x: (L(17).x + L(18).x) / 2, y: (L(17).y + L(18).y) / 2 };
        const le = { x: (L(19).x + L(20).x) / 2, y: (L(19).y + L(20).y) / 2 };
        addLine(ls, le); addPoint(ls); addPoint(le);
        const rs = { x: (L(28).x + L(29).x) / 2, y: (L(28).y + L(29).y) / 2 };
        const re = { x: (L(30).x + L(31).x) / 2, y: (L(30).y + L(31).y) / 2 };
        addLine(rs, re); addPoint(rs); addPoint(re);
        const lT = Math.atan2(ls.y - le.y, Math.abs(le.x - ls.x)) * (180 / Math.PI);
        const rT = Math.atan2(rs.y - re.y, Math.abs(re.x - rs.x)) * (180 / Math.PI);
        addLabel(`${lT.toFixed(1)}°`, midpoint(ls, le), 15);
        addLabel(`${rT.toFixed(1)}°`, midpoint(rs, re), 15);
        break;
      }
      case "jaw_slope": {
        addLine(L(51), L(45)); addLine(L(45), L(47));
        addLine(L(52), L(46)); addLine(L(46), L(48));
        addPoint(L(51)); addPoint(L(45)); addPoint(L(47));
        addPoint(L(52)); addPoint(L(46)); addPoint(L(48));
        const lV = (metric as any).jawSlopeLeft?.toFixed(1) ?? "—";
        const rV = (metric as any).jawSlopeRight?.toFixed(1) ?? "—";
        addLabel(`${lV}°`, L(45), -15);
        addLabel(`${rV}°`, L(46), -15);
        break;
      }
      case "iaa_jfa_deviation": {
        addLine(L(16), L(35)); addLine(L(27), L(35));
        addPoint(L(16)); addPoint(L(27)); addPoint(L(35));
        addAngleArc(L(35), L(16), L(27), 20);
        const x1 = L(45).x, y1 = L(45).y, x2 = L(47).x, y2 = L(47).y;
        const x3 = L(46).x, y3 = L(46).y, x4 = L(48).x, y4 = L(48).y;
        const denom = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
        const t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / denom;
        const apex = { x: x1 + t*(x2-x1), y: y1 + t*(y2-y1) };
        addLine(L(45), apex, true); addLine(L(46), apex, true);
        addPoint(L(45)); addPoint(L(46)); addPoint(L(47)); addPoint(L(48));
        addAngleArc(apex, L(45), L(46), 20);
        addLabel(valueStr, midpoint(L(35), apex), 0);
        break;
      }
      default: addLabel(valueStr, { x: imageWidth / 2, y: imageHeight / 2 }); break;
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

      {/* Prev arrow */}
      <button onClick={handlePrev} disabled={detectableIndex === 0}
        className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-zinc-200 shadow flex items-center justify-center transition-all ${detectableIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:shadow-md"}`}>
        <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next arrow */}
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

          {/* Left — photo */}
          <div className="flex-1 bg-zinc-900 flex items-center justify-center overflow-hidden" style={{ minHeight: 300 }}>
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img src={imageUrl} alt="Face analysis" className="max-w-full max-h-full object-contain" style={{ maxHeight: "65vh", opacity: 0.9 }} />
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                {renderMeasurementLines()}
              </svg>
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

              {/* Gradient bar */}
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

            {/* Measurement */}
            <div className="px-5 py-4 border-b border-zinc-100">
              <p className="text-xs text-zinc-400 mb-1 uppercase tracking-widest font-mono">Your Value</p>
              <p className="text-2xl font-semibold text-black">{metric.displayValue ?? "—"}</p>
              <p className="text-xs text-zinc-400 mt-1">
                Ideal: {metric.definition.idealMin}{metric.definition.unit} – {metric.definition.idealMax}{metric.definition.unit}
              </p>
            </div>

            {/* About */}
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