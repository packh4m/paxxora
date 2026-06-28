"use client";

import { useEffect, useCallback } from "react";
import { MetricResult, Point } from "@/lib/types";
import { getScoreColor } from "@/lib/scoring";

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

// Style constants
const LINE_COLOR = "#00CED1"; // Teal/cyan
const LINE_COLOR_SECONDARY = "#00CED180"; // Teal with transparency
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
  // Filter to only detectable metrics for navigation
  const detectableMetrics = metrics.filter((m) => m.value !== null);
  const detectableIndex = detectableMetrics.findIndex(
    (m) => m.definition.id === metric.definition.id
  );

  // Helper to get landmark by 1-indexed FaceIQ index
  const L = useCallback((idx: number): Point => {
    // landmarks array is 0-indexed, but FaceIQ uses 1-indexed
    // So landmarks[0] is empty, landmarks[1] = L[1], etc.
    if (idx >= 0 && idx < landmarks.length && landmarks[idx]) {
      return landmarks[idx];
    }
    return { x: 0, y: 0 };
  }, [landmarks]);

  // Convert image coordinates to percentage for SVG
  const toPercent = useCallback((p: Point): { x: number; y: number } => {
    return {
      x: (p.x / imageWidth) * 100,
      y: (p.y / imageHeight) * 100,
    };
  }, [imageWidth, imageHeight]);

  // Midpoint helper
  const midpoint = (p1: Point, p2: Point): Point => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  });

  // Generate SVG elements for a metric
  const renderMeasurementLines = () => {
    const metricId = metric.definition.id;
    const value = metric.value;
    const unit = metric.definition.unit;
    const valueStr = value !== null
      ? `${value.toFixed(unit === "x" ? 2 : 1)}${unit}`
      : "";

    const elements: JSX.Element[] = [];
    let lineKey = 0;

    // Helper to add a line
    const addLine = (p1: Point, p2: Point, secondary = false) => {
      const pct1 = toPercent(p1);
      const pct2 = toPercent(p2);
      elements.push(
        <line
          key={`line-${lineKey++}`}
          x1={pct1.x}
          y1={pct1.y}
          x2={pct2.x}
          y2={pct2.y}
          stroke={secondary ? LINE_COLOR_SECONDARY : LINE_COLOR}
          strokeWidth={LINE_WIDTH}
          strokeLinecap="round"
        />
      );
    };

    // Helper to add a point
    const addPoint = (p: Point, radius = 0.5) => {
      const pct = toPercent(p);
      elements.push(
        <circle
          key={`point-${lineKey++}`}
          cx={pct.x}
          cy={pct.y}
          r={radius}
          fill={LINE_COLOR}
        />
      );
    };

    // Helper to add a label
    const addLabel = (text: string, p: Point, offsetY = -3) => {
      const pct = toPercent(p);
      elements.push(
        <g key={`label-${lineKey++}`}>
          <rect
            x={pct.x - 6}
            y={pct.y + offsetY - 2}
            width={12}
            height={4}
            fill="rgba(0,0,0,0.7)"
            rx={1}
          />
          <text
            x={pct.x}
            y={pct.y + offsetY}
            fill="white"
            fontSize="2.5"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="system-ui, sans-serif"
            fontWeight="500"
          >
            {text}
          </text>
        </g>
      );
    };

    // Helper to add angle arc
    const addAngleArc = (center: Point, p1: Point, p2: Point, radius = 15, counterclockwise = false) => {
      const pctC = toPercent(center);
      const angle1 = Math.atan2(p1.y - center.y, p1.x - center.x);
      const angle2 = Math.atan2(p2.y - center.y, p2.x - center.x);

      // Calculate arc endpoints in viewBox coordinates
      const r = (radius / imageWidth) * 100;
      const aspectRatio = imageWidth / imageHeight;
      const x1 = pctC.x + r * Math.cos(angle1);
      const y1 = pctC.y + r * Math.sin(angle1) * aspectRatio;
      const x2 = pctC.x + r * Math.cos(angle2);
      const y2 = pctC.y + r * Math.sin(angle2) * aspectRatio;

      const largeArc = Math.abs(angle2 - angle1) > Math.PI ? 1 : 0;
      let sweep = angle2 > angle1 ? 1 : 0;
      if (counterclockwise) sweep = 1 - sweep;

      elements.push(
        <path
          key={`arc-${lineKey++}`}
          d={`M ${x1} ${y1} A ${r} ${r * aspectRatio} 0 ${largeArc} ${sweep} ${x2} ${y2}`}
          stroke={LINE_COLOR}
          strokeWidth={LINE_WIDTH}
          fill="none"
        />
      );
    };

    switch (metricId) {
      case "nose_bridge_width": {
        // Bridge width: L[36]→L[37], Nose width: L[4]→L[5]
        addLine(L(36), L(37));
        addLine(L(4), L(5));
        addPoint(L(36));
        addPoint(L(37));
        addPoint(L(4));
        addPoint(L(5));
        addLabel(valueStr, midpoint(L(36), L(37)));
        break;
      }

      case "ear_protrusion_angle": {
        // Lines from L[8] and L[9] down to baseline
        const baseline = Math.max(L(8).y, L(9).y) + 20;
        addLine(L(8), { x: L(8).x, y: baseline });
        addLine(L(9), { x: L(9).x, y: baseline });
        addLine({ x: L(8).x, y: baseline }, { x: L(9).x, y: baseline }, true);
        addPoint(L(8));
        addPoint(L(9));
        addLabel(valueStr, midpoint(L(8), L(9)), 15);
        break;
      }

      case "ear_protrusion_ratio": {
        // Ear level: L[8]→L[9], Cheekbone: L[51]→L[52]
        addLine(L(8), L(9));
        addLine(L(51), L(52), true);
        addPoint(L(8));
        addPoint(L(9));
        addPoint(L(51));
        addPoint(L(52));
        addLabel(valueStr, midpoint(L(8), L(9)));
        break;
      }

      case "lower_third": {
        // Vertical line L[35]→L[7]
        addLine(L(35), L(7));
        addPoint(L(35));
        addPoint(L(7));
        addLabel(valueStr, midpoint(L(35), L(7)), 5);
        break;
      }

      case "cheekbone_height": {
        // 1) Horizontal eye line at average Y of L[13] and L[24]
        const eyeLineY = (L(13).y + L(24).y) / 2;
        const eyeLineStart = { x: L(13).x, y: eyeLineY };
        const eyeLineEnd = { x: L(24).x, y: eyeLineY };
        addLine(eyeLineStart, eyeLineEnd, true);

        // 2) Horizontal cheekbone line at average Y of L[51] and L[52]
        const cheekLineY = (L(51).y + L(52).y) / 2;
        const cheekLineStart = { x: L(51).x, y: cheekLineY };
        const cheekLineEnd = { x: L(52).x, y: cheekLineY };
        addLine(cheekLineStart, cheekLineEnd);

        // 3) Vertical line from eye line to cupid's bow (L[41]) in center
        const centerX = (L(13).x + L(24).x) / 2;
        const vertStart = { x: centerX, y: eyeLineY };
        const vertEnd = { x: centerX, y: L(41).y };
        addLine(vertStart, vertEnd, true);

        // Points
        addPoint(L(13));
        addPoint(L(24));
        addPoint(L(51));
        addPoint(L(52));
        addPoint(L(41));

        addLabel(valueStr, { x: cheekLineEnd.x + 2, y: cheekLineY }, 0);
        break;
      }

      case "lip_ratio": {
        // Upper lip: L[40]→L[42], Lower lip: L[42]→L[6]
        addLine(L(40), L(42));
        addLine(L(42), L(6));
        addPoint(L(40));
        addPoint(L(42));
        addPoint(L(6));
        addLabel(valueStr, L(42), 15);
        break;
      }

      case "chin_philtrum": {
        // Philtrum: L[35]→L[42], Chin: L[42]→L[7]
        addLine(L(35), L(42));
        addLine(L(42), L(7));
        addPoint(L(35));
        addPoint(L(42));
        addPoint(L(7));
        addLabel(valueStr, midpoint(L(42), L(7)), 5);
        break;
      }

      case "canthal_tilt": {
        // Left eye: L[12](medial)→L[13](lateral), Right eye: L[23](medial)→L[24](lateral)
        addLine(L(12), L(13));
        addLine(L(23), L(24));
        addPoint(L(12));
        addPoint(L(13));
        addPoint(L(23));
        addPoint(L(24));
        addLabel(valueStr, midpoint(L(12), L(13)), -12);
        break;
      }

      case "midface_ratio": {
        // IPD: L[2]→L[3], Vertical: L[34]→L[35]
        addLine(L(2), L(3));
        addLine(L(34), L(35));
        addPoint(L(2));
        addPoint(L(3));
        addPoint(L(34));
        addPoint(L(35));
        addLabel(valueStr, midpoint(L(2), L(3)), -12);
        break;
      }

      case "cupids_bow_depth": {
        // Vertical from L[40] to L[41]
        addLine(L(40), L(41));
        addPoint(L(40));
        addPoint(L(41));
        addLabel(valueStr, L(41), 12);
        break;
      }

      case "top_third": {
        // Vertical L[1]→midpoint(L[18],L[29])
        const glabella = midpoint(L(18), L(29));
        addLine(L(1), glabella);
        addPoint(L(1));
        addPoint(glabella);
        addLabel(valueStr, midpoint(L(1), glabella), 5);
        break;
      }

      case "face_width_height": {
        // Horizontal line L[51]→L[52] (cheekbones)
        addLine(L(51), L(52));
        addPoint(L(51));
        addPoint(L(52));
        // Short vertical centre tick at midpoint
        const fwMid = midpoint(L(51), L(52));
        const tickLength = Math.abs(L(51).y - L(52).y) * 0.5 + 15; // Short tick
        addLine(
          { x: fwMid.x, y: fwMid.y - tickLength },
          { x: fwMid.x, y: fwMid.y + tickLength },
          true
        );
        // Label above the horizontal line
        addLabel(valueStr, fwMid, -5);
        break;
      }

      case "brow_eye_distance": {
        // Vertical from L[20] to L[14]
        addLine(L(20), L(14));
        addLine(L(31), L(25), true);
        addPoint(L(20));
        addPoint(L(14));
        addPoint(L(31));
        addPoint(L(25));
        addLabel(valueStr, midpoint(L(20), L(14)), 5);
        break;
      }

      case "total_face_width_height": {
        // Horizontal L[51]→L[52], Vertical L[1]→L[7]
        addLine(L(51), L(52));
        addLine(L(1), L(7));
        addPoint(L(51));
        addPoint(L(52));
        addPoint(L(1));
        addPoint(L(7));
        addLabel(valueStr, midpoint(L(51), L(52)), -12);
        break;
      }

      case "eye_separation": {
        // IPD: L[2]→L[3], Face width: L[51]→L[52]
        addLine(L(2), L(3));
        addLine(L(51), L(52), true);
        addPoint(L(2));
        addPoint(L(3));
        addPoint(L(51));
        addPoint(L(52));
        addLabel(valueStr, midpoint(L(2), L(3)), -12);
        break;
      }

      case "middle_third": {
        // Vertical midpoint(L[18],L[29])→L[35]
        const glabella = midpoint(L(18), L(29));
        addLine(glabella, L(35));
        addPoint(glabella);
        addPoint(L(35));
        addLabel(valueStr, midpoint(glabella, L(35)), 5);
        break;
      }

      case "bigonial_width": {
        // Bigonial: L[43]→L[44], Bizygomatic: L[51]→L[52]
        addLine(L(43), L(44));
        addLine(L(51), L(52), true);
        addPoint(L(43));
        addPoint(L(44));
        addPoint(L(51));
        addPoint(L(52));
        addLabel(valueStr, midpoint(L(43), L(44)), 12);
        break;
      }

      case "lower_third_proportion": {
        // Vertical L[35]→L[42]
        addLine(L(35), L(42));
        addLine(L(42), L(7), true);
        addPoint(L(35));
        addPoint(L(42));
        addPoint(L(7));
        addLabel(valueStr, midpoint(L(35), L(42)), 5);
        break;
      }

      case "mouth_nose_ratio": {
        // Mouth: L[38]→L[39], Nose: L[4]→L[5]
        addLine(L(38), L(39));
        addLine(L(4), L(5), true);
        addPoint(L(38));
        addPoint(L(39));
        addPoint(L(4));
        addPoint(L(5));
        addLabel(valueStr, midpoint(L(38), L(39)), 12);
        break;
      }

      case "jaw_frontal_angle": {
        // V shape: L[45]→L[47] and L[46]→L[47]
        addLine(L(45), L(47));
        addLine(L(46), L(47));
        addPoint(L(45));
        addPoint(L(46));
        addPoint(L(47));
        addAngleArc(L(47), L(45), L(46), 25);
        addLabel(valueStr, L(47), 35);
        break;
      }

      case "jaw_slope": {
        console.log('jaw_slope metric object:', metric);
        // Left side: L[51] → L[45] → L[47]
        addLine(L(51), L(45));
        addLine(L(45), L(47));
        // Right side: L[52] → L[46] → L[48]
        addLine(L(52), L(46));
        addLine(L(46), L(48));

        // Points
        addPoint(L(51));
        addPoint(L(45));
        addPoint(L(47));
        addPoint(L(52));
        addPoint(L(46));
        addPoint(L(48));

        // Fixed 60° angle arcs centered on bisector
        const fixedSweep = Math.PI / 3; // 60 degrees in radians
        const arcRadius = 20;
        const r = (arcRadius / imageWidth) * 100;
        const aspectRatio = imageWidth / imageHeight;

        // Left arc at L[45]: bisector of L[51]→L[45]→L[47]
        const leftAngle1 = Math.atan2(L(51).y - L(45).y, L(51).x - L(45).x);
        const leftAngle2 = Math.atan2(L(47).y - L(45).y, L(47).x - L(45).x);
        const leftBisector = (leftAngle1 + leftAngle2) / 2;
        const leftStart = leftBisector - fixedSweep / 2;
        const leftEnd = leftBisector + fixedSweep / 2;
        const leftCenter = toPercent(L(45));
        const leftX1 = leftCenter.x + r * Math.cos(leftStart);
        const leftY1 = leftCenter.y + r * Math.sin(leftStart) * aspectRatio;
        const leftX2 = leftCenter.x + r * Math.cos(leftEnd);
        const leftY2 = leftCenter.y + r * Math.sin(leftEnd) * aspectRatio;
        elements.push(
          <path
            key={`arc-left-jaw`}
            d={`M ${leftX1} ${leftY1} A ${r} ${r * aspectRatio} 0 0 1 ${leftX2} ${leftY2}`}
            stroke={LINE_COLOR}
            strokeWidth={LINE_WIDTH}
            fill="none"
          />
        );

        // Right arc at L[46]: bisector of L[52]→L[46]→L[48]
        const rightAngle1 = Math.atan2(L(52).y - L(46).y, L(52).x - L(46).x);
        const rightAngle2 = Math.atan2(L(48).y - L(46).y, L(48).x - L(46).x);
        const rightBisector = (rightAngle1 + rightAngle2) / 2;
        const rightStart = rightBisector - fixedSweep / 2;
        const rightEnd = rightBisector + fixedSweep / 2;
        const rightCenter = toPercent(L(46));
        const rightX1 = rightCenter.x + r * Math.cos(rightStart);
        const rightY1 = rightCenter.y + r * Math.sin(rightStart) * aspectRatio;
        const rightX2 = rightCenter.x + r * Math.cos(rightEnd);
        const rightY2 = rightCenter.y + r * Math.sin(rightEnd) * aspectRatio;
        elements.push(
          <path
            key={`arc-right-jaw`}
            d={`M ${rightX1} ${rightY1} A ${r} ${r * aspectRatio} 0 0 1 ${rightX2} ${rightY2}`}
            stroke={LINE_COLOR}
            strokeWidth={LINE_WIDTH}
            fill="none"
          />
        );

        // Individual angle labels from metric result
        const leftVal = metric.jawSlopeLeft?.toFixed(1) ?? "—";
        const rightVal = metric.jawSlopeRight?.toFixed(1) ?? "—";
        addLabel(`${leftVal}°`, L(45), -15);
        addLabel(`${rightVal}°`, L(46), -15);
        break;
      }

      case "alar_angle": {
        // V shape: L[4]→L[35] and L[5]→L[35]
        addLine(L(4), L(35));
        addLine(L(5), L(35));
        addPoint(L(4));
        addPoint(L(5));
        addPoint(L(35));
        addAngleArc(L(35), L(4), L(5), 20);
        addLabel(valueStr, L(35), 30);
        break;
      }

      case "iaa_jfa_deviation": {
        // IAA triangle (upper): L[16]→L[35]←L[27]
        addLine(L(16), L(35));
        addLine(L(27), L(35));
        addPoint(L(16));
        addPoint(L(27));
        addPoint(L(35));
        addAngleArc(L(35), L(16), L(27), 20);

        // JFA triangle (lower): Find intersection of L[45]→L[47] and L[46]→L[48]
        const x1 = L(45).x, y1 = L(45).y, x2 = L(47).x, y2 = L(47).y;
        const x3 = L(46).x, y3 = L(46).y, x4 = L(48).x, y4 = L(48).y;
        const denom = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
        const t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / denom;
        const jfaApex = { x: x1 + t*(x2-x1), y: y1 + t*(y2-y1) };

        // Draw jaw lines extending to apex
        addLine(L(45), jfaApex, true);
        addLine(L(46), jfaApex, true);
        addPoint(L(45));
        addPoint(L(46));
        addPoint(L(47));
        addPoint(L(48));
        addAngleArc(jfaApex, L(45), L(46), 20);

        // Main deviation label between the two triangles
        addLabel(valueStr, midpoint(L(35), jfaApex), 0);
        break;
      }

      case "eye_aspect_ratio": {
        // Left eye: horizontal line at average Y of canthus points
        const leftEyeY = (L(13).y + L(12).y) / 2;
        const leftEyeStart = { x: L(13).x, y: leftEyeY };
        const leftEyeEnd = { x: L(12).x, y: leftEyeY };
        addLine(leftEyeStart, leftEyeEnd);

        // Right eye: horizontal line at average Y of canthus points
        const rightEyeY = (L(23).y + L(24).y) / 2;
        const rightEyeStart = { x: L(23).x, y: rightEyeY };
        const rightEyeEnd = { x: L(24).x, y: rightEyeY };
        addLine(rightEyeStart, rightEyeEnd);

        // Left eye: vertical height line at midpoint X, from L[14] to L[15]
        const leftMidX = (L(12).x + L(13).x) / 2;
        const leftVertStart = { x: leftMidX, y: L(14).y };
        const leftVertEnd = { x: leftMidX, y: L(15).y };
        addLine(leftVertStart, leftVertEnd);

        // Right eye: vertical height line at midpoint X, from L[25] to L[26]
        const rightMidX = (L(23).x + L(24).x) / 2;
        const rightVertStart = { x: rightMidX, y: L(25).y };
        const rightVertEnd = { x: rightMidX, y: L(26).y };
        addLine(rightVertStart, rightVertEnd);

        // Points
        addPoint(L(12));
        addPoint(L(13));
        addPoint(L(14));
        addPoint(L(15));
        addPoint(L(23));
        addPoint(L(24));
        addPoint(L(25));
        addPoint(L(26));

        // Calculate individual EAR values (width / height)
        const leftWidth = Math.abs(L(12).x - L(13).x);
        const leftHeight = Math.abs(L(14).y - L(15).y);
        const leftEAR = leftHeight > 0 ? (leftWidth / leftHeight).toFixed(2) : "—";

        const rightWidth = Math.abs(L(24).x - L(23).x);
        const rightHeight = Math.abs(L(25).y - L(26).y);
        const rightEAR = rightHeight > 0 ? (rightWidth / rightHeight).toFixed(2) : "—";

        // Labels below each eye
        addLabel(`${leftEAR}x`, { x: leftMidX, y: L(15).y }, 15);
        addLabel(`${rightEAR}x`, { x: rightMidX, y: L(26).y }, 15);
        break;
      }

      case "eyebrow_tilt": {
        // Left brow: midpoint(L[17], L[18]) → midpoint(L[19], L[20])
        const leftStart = { x: (L(17).x + L(18).x) / 2, y: (L(17).y + L(18).y) / 2 };
        const leftEnd = { x: (L(19).x + L(20).x) / 2, y: (L(19).y + L(20).y) / 2 };
        addLine(leftStart, leftEnd);
        addPoint(leftStart);
        addPoint(leftEnd);
        addPoint(L(17));
        addPoint(L(18));
        addPoint(L(19));
        addPoint(L(20));

        // Right brow: midpoint(L[28], L[29]) → midpoint(L[30], L[31])
        const rightStart = { x: (L(28).x + L(29).x) / 2, y: (L(28).y + L(29).y) / 2 };
        const rightEnd = { x: (L(30).x + L(31).x) / 2, y: (L(30).y + L(31).y) / 2 };
        addLine(rightStart, rightEnd);
        addPoint(rightStart);
        addPoint(rightEnd);
        addPoint(L(28));
        addPoint(L(29));
        addPoint(L(30));
        addPoint(L(31));

        // Calculate individual tilt angles for display
        const leftRise = leftStart.y - leftEnd.y;
        const leftRun = Math.abs(leftEnd.x - leftStart.x);
        const leftTilt = Math.atan2(leftRise, leftRun) * (180 / Math.PI);

        const rightRise = rightStart.y - rightEnd.y;
        const rightRun = Math.abs(rightEnd.x - rightStart.x);
        const rightTilt = Math.atan2(rightRise, rightRun) * (180 / Math.PI);

        // Show individual angles below each brow
        addLabel(`${leftTilt.toFixed(1)}°`, midpoint(leftStart, leftEnd), 15);
        addLabel(`${rightTilt.toFixed(1)}°`, midpoint(rightStart, rightEnd), 15);
        break;
      }

      case "neck_width": {
        // Neck: L[49]→L[50], Reference: L[51]→L[52]
        addLine(L(49), L(50));
        addLine(L(51), L(52), true);
        addPoint(L(49));
        addPoint(L(50));
        addPoint(L(51));
        addPoint(L(52));
        addLabel(valueStr, midpoint(L(49), L(50)), 12);
        break;
      }

      case "bitemporal_width": {
        // Bitemporal: L[10]→L[11], Bizygomatic: L[51]→L[52]
        addLine(L(10), L(11));
        addLine(L(51), L(52), true);
        addPoint(L(10));
        addPoint(L(11));
        addPoint(L(51));
        addPoint(L(52));
        addLabel(valueStr, midpoint(L(10), L(11)), -12);
        break;
      }

      case "intercanthal_nasal": {
        // Intercanthal: L[12]→L[23] (medial to medial), Nasal: L[4]→L[5]
        addLine(L(12), L(23));
        addLine(L(4), L(5), true);
        addPoint(L(12));
        addPoint(L(23));
        addPoint(L(4));
        addPoint(L(5));
        addLabel(valueStr, midpoint(L(12), L(23)), -12);
        break;
      }

      case "ipd_mouth_ratio": {
        // IPD: L[2]→L[3], Mouth: L[38]→L[39]
        addLine(L(2), L(3));
        addLine(L(38), L(39), true);
        addPoint(L(2));
        addPoint(L(3));
        addPoint(L(38));
        addPoint(L(39));
        addLabel(valueStr, midpoint(L(2), L(3)), -12);
        break;
      }

      case "mouth_corner_position": {
        // Small lines at L[38] and L[39] showing offset from L[42]
        const mouthCenter = L(42);
        addLine(L(38), { x: L(38).x, y: mouthCenter.y });
        addLine(L(39), { x: L(39).x, y: mouthCenter.y });
        addLine({ x: L(38).x, y: mouthCenter.y }, { x: L(39).x, y: mouthCenter.y }, true);
        addPoint(L(38));
        addPoint(L(39));
        addPoint(L(42));
        addLabel(valueStr, L(42), 15);
        break;
      }

      case "nose_tip_position": {
        // Horizontal line showing L[35] offset from L[34] vertical
        const midlineX = (L(51).x + L(52).x) / 2;
        addLine(L(35), { x: midlineX, y: L(35).y });
        addLine({ x: midlineX, y: L(34).y }, { x: midlineX, y: L(35).y }, true);
        addPoint(L(35));
        addPoint(L(34));
        addLabel(valueStr, L(35), 15);
        break;
      }

      case "brow_length_ratio": {
        // Left brow: L[18]→L[21], Right: L[29]→L[32], Face width: L[51]→L[52]
        addLine(L(18), L(21));
        addLine(L(29), L(32));
        addLine(L(51), L(52), true);
        addPoint(L(18));
        addPoint(L(21));
        addPoint(L(29));
        addPoint(L(32));
        addPoint(L(51));
        addPoint(L(52));
        addLabel(valueStr, midpoint(L(18), L(21)), -12);
        break;
      }

      default: {
        // For any unhandled metric, just show the value
        const center = { x: imageWidth / 2, y: imageHeight / 2 };
        addLabel(valueStr, center);
        break;
      }
    }

    return elements;
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && detectableIndex > 0) {
        const prevMetric = detectableMetrics[detectableIndex - 1];
        const prevIndex = metrics.findIndex((m) => m.definition.id === prevMetric.definition.id);
        onNavigate(prevIndex);
      }
      if (e.key === "ArrowRight" && detectableIndex < detectableMetrics.length - 1) {
        const nextMetric = detectableMetrics[detectableIndex + 1];
        const nextIndex = metrics.findIndex((m) => m.definition.id === nextMetric.definition.id);
        onNavigate(nextIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detectableIndex, detectableMetrics, metrics, onClose, onNavigate]);

  const handlePrev = () => {
    if (detectableIndex > 0) {
      const prevMetric = detectableMetrics[detectableIndex - 1];
      const prevIndex = metrics.findIndex((m) => m.definition.id === prevMetric.definition.id);
      onNavigate(prevIndex);
    }
  };

  const handleNext = () => {
    if (detectableIndex < detectableMetrics.length - 1) {
      const nextMetric = detectableMetrics[detectableIndex + 1];
      const nextIndex = metrics.findIndex((m) => m.definition.id === nextMetric.definition.id);
      onNavigate(nextIndex);
    }
  };

  const scoreColor = getScoreColor(metric.score || 5);
  const idealRange = `${metric.definition.idealMin}${metric.definition.unit} - ${metric.definition.idealMax}${metric.definition.unit}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition-colors"
      >
        <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation arrows */}
      <button
        onClick={handlePrev}
        disabled={detectableIndex === 0}
        className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-800/80 transition-all ${
          detectableIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-zinc-700 hover:scale-110"
        }`}
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={handleNext}
        disabled={detectableIndex === detectableMetrics.length - 1}
        className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-800/80 transition-all ${
          detectableIndex === detectableMetrics.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-zinc-700 hover:scale-110"
        }`}
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Modal content */}
      <div className="w-full max-w-4xl mx-4 bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{metric.definition.name}</h2>
              <p className="text-sm text-zinc-500 mt-1">{metric.definition.description}</p>
            </div>
            <div className="text-sm text-zinc-500">
              {detectableIndex + 1} / {detectableMetrics.length}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row">
          {/* Image with SVG overlay */}
          <div className="relative flex-1 min-h-[300px] md:min-h-[400px] bg-black flex items-center justify-center overflow-hidden">
            <div className="relative max-w-full max-h-[400px]">
              <img
                src={imageUrl}
                alt="Face analysis"
                className="max-w-full max-h-[400px] object-contain"
                style={{ opacity: 0.85 }}
              />
              {/* SVG Overlay */}
              <svg
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                viewBox={`0 0 100 100`}
                preserveAspectRatio="none"
              >
                {renderMeasurementLines()}
              </svg>
            </div>
          </div>

          {/* Metrics panel */}
          <div className="w-full md:w-80 p-6 border-t md:border-t-0 md:border-l border-zinc-800">
            {/* Score display */}
            <div className="text-center mb-6">
              <div
                className="text-5xl font-bold mb-2"
                style={{ color: scoreColor }}
              >
                {metric.score !== null ? metric.score.toFixed(1) : "N/A"}
              </div>
              <div className="text-sm text-zinc-500">Score</div>
            </div>

            {/* Measured value */}
            <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
              <div className="text-sm text-zinc-500 mb-1">Your Measurement</div>
              <div className="text-2xl font-semibold text-white">
                {metric.displayValue}
              </div>
            </div>

            {/* Score bar */}
            <div className="mb-4">
              <div className="relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-red-500 via-yellow-500 to-green-500">
                {/* Ideal range indicator */}
                <div
                  className="absolute top-0 h-full bg-white/20 border-x-2 border-white/40"
                  style={{
                    left: `${(metric.definition.idealMin / (metric.definition.idealMax * 1.5)) * 100}%`,
                    width: `${((metric.definition.idealMax - metric.definition.idealMin) / (metric.definition.idealMax * 1.5)) * 100}%`,
                  }}
                />
                {/* Score marker */}
                {metric.score !== null && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 shadow-lg"
                    style={{
                      left: `${(metric.score / 10) * 100}%`,
                      transform: "translate(-50%, -50%)",
                      borderColor: scoreColor,
                    }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* Ideal range */}
            <div className="text-center">
              <span className="text-sm text-zinc-500">Ideal Range: </span>
              <span className="text-sm font-medium text-zinc-300">{idealRange}</span>
            </div>

            {/* Category badge */}
            <div className="mt-6 flex justify-center">
              <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-400">
                {metric.definition.category}
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
