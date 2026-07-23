"use client";

import { Point, MetricResult } from "@/lib/types";

const LINE_COLOR = "#00CED1";
const LINE_COLOR_SECONDARY = "rgba(0,206,209,0.5)";
const LINE_WIDTH = 2;

interface MeasurementOverlayProps {
  metric: MetricResult;
  landmarks: Point[];
  imageWidth: number;
  imageHeight: number;
}

export default function MeasurementOverlay({ metric, landmarks, imageWidth, imageHeight }: MeasurementOverlayProps) {
  const L = (idx: number): Point => {
    if (idx >= 0 && idx < landmarks.length && landmarks[idx]) return landmarks[idx];
    return { x: 0, y: 0 };
  };

  const mid = (p1: Point, p2: Point): Point => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  });

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
    case "top_third": { const browMidY = (L(17).y + L(18).y + L(28).y + L(29).y) / 4; const browMidX = (L(17).x + L(18).x + L(28).x + L(29).x) / 4; line(L(1), { x: L(1).x, y: browMidY }); dot(L(1)); dot(L(17)); dot(L(18)); dot(L(28)); dot(L(29)); label(valueStr, { x: L(1).x, y: (L(1).y + browMidY) / 2 }, 0); break; }
    case "face_width_height": line(L(51), L(52)); dot(L(51)); dot(L(52)); label(valueStr, mid(L(51), L(52)), -14); break;
    case "brow_eye_distance": line(L(18), L(2)); line(L(29), L(3), true); dot(L(18)); dot(L(2)); dot(L(29)); dot(L(3)); label(valueStr, mid(L(18), L(2)), 16); break;
    case "total_face_width_height": line(L(51), L(52)); line(L(1), L(7)); dot(L(51)); dot(L(52)); dot(L(1)); dot(L(7)); label(valueStr, mid(L(51), L(52)), -14); break;
    case "eye_separation": line(L(2), L(3)); line(L(51), L(52), true); dot(L(2)); dot(L(3)); dot(L(51)); dot(L(52)); label(valueStr, mid(L(2), L(3)), -14); break;
    case "middle_third": { const browMidY = (L(17).y + L(18).y + L(28).y + L(29).y) / 4; const browMidX = (L(17).x + L(18).x + L(28).x + L(29).x) / 4; line({ x: browMidX, y: browMidY }, L(35)); dot(L(17)); dot(L(18)); dot(L(28)); dot(L(29)); dot(L(35)); label(valueStr, { x: browMidX, y: (browMidY + L(35).y) / 2 }, 0); break; }
    case "bigonial_width": line(L(43), L(44)); line(L(51), L(52), true); dot(L(43)); dot(L(44)); dot(L(51)); dot(L(52)); label(valueStr, mid(L(43), L(44)), 16); break;
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
    default: break;
  }

  if (elements.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {elements}
    </svg>
  );
}