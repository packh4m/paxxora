import {
  FaceLandmarks,
  Point,
  MetricResult,
  METRIC_DEFINITIONS,
} from "./types";
import { scoreMetric, formatMetricValue } from "./scoring";

// ============================================================
// 52-POINT LANDMARK SYSTEM (1-indexed, FaceIQ compatible)
// Access landmarks directly as landmarks[1] through landmarks[52]
//
// 1=Hairline (Trichion)
// 2=Left Pupil, 3=Right Pupil
// 4=Left Ala Nasi, 5=Right Ala Nasi
// 6=Labrale Inferius, 7=Menton
// 8=Left Tragion, 9=Right Tragion
// 10=Left Temple, 11=Right Temple
// 12=Left Medial Canthus, 13=Left Lateral Canthus
// 14=Left Upper Eyelid, 15=Left Lower Eyelid, 16=Left Eyelid Hood
// 17=Left Brow Head, 18=Left Brow Inner, 19=Left Brow Arch
// 20=Left Brow Peak, 21=Left Brow Tail, 22=Left Eyelid Crease
// 23=Right Medial Canthus, 24=Right Lateral Canthus
// 25=Right Upper Eyelid, 26=Right Lower Eyelid, 27=Right Eyelid Hood
// 28=Right Brow Head, 29=Right Brow Inner, 30=Right Brow Arch
// 31=Right Brow Peak, 32=Right Brow Tail, 33=Right Eyelid Crease
// 34=Sellion, 35=Subnasale
// 36=Left Dorsum Nasi, 37=Right Dorsum Nasi
// 38=Left Cheilion, 39=Right Cheilion
// 40=Labrale Superius, 41=Cupid's Bow, 42=Mouth Middle
// 43=Left Gonion Superior, 44=Right Gonion Superior
// 45=Left Gonion Inferior, 46=Right Gonion Inferior
// 47=Left Mentum Lateralis, 48=Right Mentum Lateralis
// 49=Left Cervical Lateralis, 50=Right Cervical Lateralis
// 51=Left Zygion, 52=Right Zygion
// ============================================================

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function midpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

// ============================================================
// CORE METRIC CALCULATIONS
// ============================================================

export interface CoreMetrics {
  faceWidthToHeight: number;
  eyeAspectRatio: number;
  canthalTiltLeft: number;
  canthalTiltRight: number;
  canthalTiltAvg: number;
  interpupillaryDistance: number;
  noseWidth: number;
  mouthWidth: number;
  raw: {
    faceWidth: number;
    faceHeight: number;
    leftEyeWidth: number;
    leftEyeHeight: number;
    rightEyeWidth: number;
    rightEyeHeight: number;
    ipd: number;
    noseWidthPx: number;
    mouthWidthPx: number;
  };
}

export function calculateCoreMetrics(faceLandmarks: FaceLandmarks): CoreMetrics {
  const L = faceLandmarks.landmarks; // L[1] through L[52]

  // Face width: Left Zygion (51) to Right Zygion (52)
  const faceWidth = distance(L[51], L[52]);

  // Face height: Sellion (34) to Menton (7)
  const faceHeight = distance(L[34], L[7]);
  const faceWidthToHeight = faceWidth / faceHeight;

  // Left eye dimensions
  const leftEyeWidth = distance(L[13], L[12]);   // Lateral to Medial Canthus
  const leftEyeHeight = distance(L[14], L[15]);  // Upper to Lower Eyelid

  // Right eye dimensions
  const rightEyeWidth = distance(L[24], L[23]);  // Lateral to Medial Canthus
  const rightEyeHeight = distance(L[25], L[26]); // Upper to Lower Eyelid

  const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2;
  const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;
  const eyeAspectRatio = avgEyeWidth / avgEyeHeight;

  // Canthal tilt: lateral relative to medial
  // Left eye: L[12] (medial), L[13] (lateral)
  console.log('L12 (left medial canthus):', L[12]);
  console.log('L13 (left lateral canthus):', L[13]);
  console.log('L23 (right medial canthus):', L[23]);
  console.log('L24 (right lateral canthus):', L[24]);
  const leftDX = L[12].x - L[13].x;
  const leftDY = L[12].y - L[13].y;
  console.log('leftDX:', leftDX, 'leftDY:', leftDY);
  console.log('atan2 result degrees:', Math.atan2(leftDY, leftDX) * (180 / Math.PI));
  const leftTiltRad = Math.atan2(
    L[12].y - L[13].y,  // medial.y - lateral.y
    L[12].x - L[13].x   // medial.x - lateral.x
  );
  const canthalTiltLeft = leftTiltRad * (180 / Math.PI);

  // Right eye: L[23] (medial), L[24] (lateral)
  // For right eye, lateral (L[24]) is to the right of medial (L[23])
  const rightTiltRad = Math.atan2(
    L[24].y - L[23].y,  // lateral.y - medial.y
    L[24].x - L[23].x   // lateral.x - medial.x
  );
  const canthalTiltRight = -rightTiltRad * (180 / Math.PI);

  const canthalTiltAvg = (canthalTiltLeft + canthalTiltRight) / 2;
  console.log('canthalTiltAvg calculated:', canthalTiltAvg, 'left:', canthalTiltLeft, 'right:', canthalTiltRight);

  // IPD: Left Pupil (2) to Right Pupil (3)
  const ipd = distance(L[2], L[3]);
  const interpupillaryDistance = (ipd / faceWidth) * 100;

  // Nose width: Left Ala Nasi (4) to Right Ala Nasi (5)
  const noseWidthPx = distance(L[4], L[5]);
  const noseWidth = (noseWidthPx / faceWidth) * 100;

  // Mouth width: Left Cheilion (38) to Right Cheilion (39)
  const mouthWidthPx = distance(L[38], L[39]);
  const mouthWidth = (mouthWidthPx / faceWidth) * 100;

  return {
    faceWidthToHeight,
    eyeAspectRatio,
    canthalTiltLeft,
    canthalTiltRight,
    canthalTiltAvg,
    interpupillaryDistance,
    noseWidth,
    mouthWidth,
    raw: {
      faceWidth,
      faceHeight,
      leftEyeWidth,
      leftEyeHeight,
      rightEyeWidth,
      rightEyeHeight,
      ipd,
      noseWidthPx,
      mouthWidthPx,
    },
  };
}

// ============================================================
// FULL METRIC CALCULATIONS
// ============================================================

export function calculateAllMetrics(faceLandmarks: FaceLandmarks): MetricResult[] {
  const L = faceLandmarks.landmarks; // L[1] through L[52]
  const results: MetricResult[] = [];

  const core = calculateCoreMetrics(faceLandmarks);
  const pixelsPerMm = core.raw.faceWidth > 0 ? core.raw.faceWidth / 130 : 1;

  // Extra data for specific metrics
  let jawSlopeLeft: number | undefined;
  let jawSlopeRight: number | undefined;

  for (const def of METRIC_DEFINITIONS) {
    let value: number | null = null;

    if (!def.isDetectable) {
      results.push({
        definition: def,
        value: null,
        score: null,
        displayValue: "N/A",
      });
      continue;
    }

    try {
      switch (def.id) {
        // ============ FACIAL THIRDS ============
        // Projected onto trichion→menton axis for accuracy regardless of head tilt
        // Glabella proxy = midpoint of L[18] (Left Brow Inner) and L[29] (Right Brow Inner)
        case "top_third": {
  const browMidY = (L[17].y + L[18].y + L[28].y + L[29].y) / 4;
  const totalHeight = distance(L[1], L[7]);
  const topThirdHeight = Math.abs(browMidY - L[1].y);
  value = (topThirdHeight / totalHeight) * 100;
  break;
}

        case "middle_third": {
  const browMidY = (L[17].y + L[18].y + L[28].y + L[29].y) / 4;
  const totalHeight = distance(L[1], L[7]);
  const middleThirdHeight = Math.abs(L[35].y - browMidY);
  value = (middleThirdHeight / totalHeight) * 100;
  break;
}

        case "lower_third": {
  const totalHeight = distance(L[1], L[7]);
  const lowerThirdHeight = Math.abs(L[7].y - L[35].y);
  value = (lowerThirdHeight / totalHeight) * 100;
  break;
}

        case "face_width_height":
          // Bizygomatic width (51-52) to sellion-menton height (34-7) ratio
          value = core.faceWidthToHeight;
          break;

        case "total_face_width_height": {
          // Total height (L[1]-L[7]: hairline to menton) to bizygomatic width (L[51]-L[52]: cheekbones)
          const faceWidth = distance(L[51], L[52]);
          const faceHeight = distance(L[1], L[7]);
          value = faceHeight / faceWidth;
          break;
        }

        case "midface_ratio": {
          const interpupillary = distance(L[2], L[3]);
          const avgPupilX = (L[2].x + L[3].x) / 2;
          const avgPupilY = (L[2].y + L[3].y) / 2;
          const pupilToCupidsBow = distance(
          { x: avgPupilX, y: avgPupilY },
          { x: avgPupilX, y: L[40].y }
        );
          value = interpupillary / pupilToCupidsBow;
          break;
        }

        case "bitemporal_width": {
          // Bitemporal (10-11) to bizygomatic (51-52) ratio
          const bitemporalWidth = distance(L[10], L[11]);
          value = (bitemporalWidth / core.raw.faceWidth) * 100;
          break;
        }

        case "bigonial_width": {
          // Bigonial (43-44: Gonion Superior) to bizygomatic (51-52) ratio
          const bigonialWidth = distance(L[43], L[44]);
          value = (bigonialWidth / core.raw.faceWidth) * 100;
          break;
        }

        // ============ EYES ============
        case "eye_aspect_ratio": {
          // Left eye
          const leftMidX = (L[13].x + L[12].x) / 2;
          const leftEyeHeight = Math.abs(L[14].y - L[15].y);
          const leftEyeWidth = distance(L[13], L[12]);
          const leftEAR = leftEyeWidth / leftEyeHeight;

          // Right eye
          const rightMidX = (L[24].x + L[23].x) / 2;
          const rightEyeHeight = Math.abs(L[25].y - L[26].y);
          const rightEyeWidth = distance(L[24], L[23]);
          const rightEAR = rightEyeWidth / rightEyeHeight;

          value = (leftEAR + rightEAR) / 2;
          console.log('eye_aspect_ratio - leftEAR:', leftEAR, 'rightEAR:', rightEAR, 'avg:', value);
          break;
        }

        case "canthal_tilt":
          value = core.canthalTiltAvg;
          console.log('canthalTiltAvg at assignment:', core.canthalTiltAvg);
          break;

        case "eye_separation":
          value = core.interpupillaryDistance;
          break;

        case "ipd_mouth_ratio": {
          value = core.raw.mouthWidthPx / core.raw.ipd;
          console.log('ipd_mouth_ratio:', value, 'mouthWidthPx:', core.raw.mouthWidthPx, 'ipd:', core.raw.ipd);
          break;
        }

        case "intercanthal_nasal": {
          const intercanthal = distance(L[12], L[23]); // Left to Right Medial Canthus
          value = core.raw.noseWidthPx / intercanthal;
          console.log('intercanthal_nasal:', value, 'noseWidthPx:', core.raw.noseWidthPx, 'intercanthal:', intercanthal);
          break;
        }

        // ============ NOSE ============
        case "nose_bridge_width": {
          // Nose base (4-5) to bridge (36-37) width ratio
          const bridgeWidth = distance(L[36], L[37]);
          value = core.raw.noseWidthPx / bridgeWidth;
          break;
        }

        case "mouth_nose_ratio":
          value = core.raw.mouthWidthPx / core.raw.noseWidthPx;
          break;

        case "nose_tip_position": {
          // Deviation of subnasale (35) from facial midline
          const midlineX = (L[51].x + L[52].x) / 2;
          const deviation = Math.abs(L[35].x - midlineX);
          value = deviation / pixelsPerMm;
          break;
        }

        case "alar_angle": {
  const leftAngle = Math.atan2(
    Math.abs(L[35].y - L[16].y),
    Math.abs(L[35].x - L[16].x)
  ) * (180 / Math.PI);
  const rightAngle = Math.atan2(
    Math.abs(L[35].y - L[27].y),
    Math.abs(L[35].x - L[27].x)
  ) * (180 / Math.PI);
  value = (leftAngle + rightAngle) / 2;
  break;
}

        case "iaa_jfa_deviation": {
          // IAA: angle at subnasale (L[35]) between left eyelid hood (L[16]) and right eyelid hood (L[27])
          const iaaLeftVecX = L[16].x - L[35].x;
          const iaaLeftVecY = L[16].y - L[35].y;
          const iaaRightVecX = L[27].x - L[35].x;
          const iaaRightVecY = L[27].y - L[35].y;
          const iaaLeftLen = Math.hypot(iaaLeftVecX, iaaLeftVecY);
          const iaaRightLen = Math.hypot(iaaRightVecX, iaaRightVecY);
          const iaaDot = (iaaLeftVecX * iaaRightVecX + iaaLeftVecY * iaaRightVecY) / (iaaLeftLen * iaaRightLen);
          const iaa = Math.acos(Math.max(-1, Math.min(1, iaaDot))) * (180 / Math.PI);

          // JFA: Find intersection of lines L[45]→L[47] and L[46]→L[48]
          const x1 = L[45].x, y1 = L[45].y, x2 = L[47].x, y2 = L[47].y;
          const x3 = L[46].x, y3 = L[46].y, x4 = L[48].x, y4 = L[48].y;
          const denom = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
          const t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / denom;
          const apexX = x1 + t*(x2-x1);
          const apexY = y1 + t*(y2-y1);

          // Angle at apex between the two lines
          const jfaLeftVecX = L[45].x - apexX;
          const jfaLeftVecY = L[45].y - apexY;
          const jfaRightVecX = L[46].x - apexX;
          const jfaRightVecY = L[46].y - apexY;
          const jfaLeftLen = Math.hypot(jfaLeftVecX, jfaLeftVecY);
          const jfaRightLen = Math.hypot(jfaRightVecX, jfaRightVecY);
          const jfaDot = (jfaLeftVecX * jfaRightVecX + jfaLeftVecY * jfaRightVecY) / (jfaLeftLen * jfaRightLen);
          const jfa = Math.acos(Math.max(-1, Math.min(1, jfaDot))) * (180 / Math.PI);

          console.log('IAA:', iaa, 'JFA:', jfa, 'deviation:', Math.abs(iaa - jfa));
          value = Math.abs(iaa - jfa);
          break;
        }

        // ============ JAW ============
        case "jaw_frontal_angle": {
          // Apex is intersection of lines L[45]→L[47] and L[46]→L[48]
          const x1 = L[45].x, y1 = L[45].y, x2 = L[47].x, y2 = L[47].y;
          const x3 = L[46].x, y3 = L[46].y, x4 = L[48].x, y4 = L[48].y;
          const denom = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
          const t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / denom;
          const apexX = x1 + t*(x2-x1);
          const apexY = y1 + t*(y2-y1);

          // Angle at apex between L[45] and L[46]
          const leftVecX = L[45].x - apexX;
          const leftVecY = L[45].y - apexY;
          const rightVecX = L[46].x - apexX;
          const rightVecY = L[46].y - apexY;
          const leftLen = Math.hypot(leftVecX, leftVecY);
          const rightLen = Math.hypot(rightVecX, rightVecY);
          const dot = (leftVecX * rightVecX + leftVecY * rightVecY) / (leftLen * rightLen);
          value = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
          console.log('jaw_frontal_angle raw value:', value);
          break;
        }

        case "jaw_slope": {
          // Left side: angle at L[45] between L[51]→L[45] and L[45]→L[47]
          const leftVec1X = L[51].x - L[45].x;
          const leftVec1Y = L[51].y - L[45].y;
          const leftVec2X = L[47].x - L[45].x;
          const leftVec2Y = L[47].y - L[45].y;
          const leftLen1 = Math.hypot(leftVec1X, leftVec1Y);
          const leftLen2 = Math.hypot(leftVec2X, leftVec2Y);
          const leftDot = (leftVec1X * leftVec2X + leftVec1Y * leftVec2Y) / (leftLen1 * leftLen2);
          console.log('leftDot:', leftDot, 'acos degrees:', Math.acos(Math.max(-1, Math.min(1, leftDot))) * (180 / Math.PI));
          const leftAngle = Math.acos(Math.max(-1, Math.min(1, leftDot))) * (180 / Math.PI);

          // Right side: angle at L[46] between L[52]→L[46] and L[46]→L[48]
          const rightVec1X = L[52].x - L[46].x;
          const rightVec1Y = L[52].y - L[46].y;
          const rightVec2X = L[48].x - L[46].x;
          const rightVec2Y = L[48].y - L[46].y;
          const rightLen1 = Math.hypot(rightVec1X, rightVec1Y);
          const rightLen2 = Math.hypot(rightVec2X, rightVec2Y);
          const rightDot = (rightVec1X * rightVec2X + rightVec1Y * rightVec2Y) / (rightLen1 * rightLen2);
          const rightAngle = Math.acos(Math.max(-1, Math.min(1, rightDot))) * (180 / Math.PI);

          console.log('leftDot:', leftDot, 'leftAcos:', Math.acos(Math.max(-1, Math.min(1, leftDot))) * (180 / Math.PI));
          console.log('rightDot:', rightDot, 'rightAcos:', Math.acos(Math.max(-1, Math.min(1, rightDot))) * (180 / Math.PI));
          console.log('leftJawSlope:', leftAngle, 'rightJawSlope:', rightAngle);
          jawSlopeLeft = leftAngle;
          jawSlopeRight = rightAngle;
          value = (leftAngle + rightAngle) / 2;
          break;
        }

        case "lower_third_proportion": {
          // Subnasale to midlip as % of subnasale to menton
          const subnasaleToMidlip = distance(L[35], L[42]);
          const subnasaleToMenton = distance(L[35], L[7]);
          value = (subnasaleToMidlip / subnasaleToMenton) * 100;
          console.log('lower_third_proportion raw value:', value);
          break;
        }

        case "chin_philtrum": {
          const philtrumHeight = Math.abs(L[42].y - L[35].y); // mouth middle to subnasale
          const chinHeight = Math.abs(L[7].y - L[42].y);      // menton to mouth middle
          console.log('philtrumHeight:', philtrumHeight, 'chinHeight:', chinHeight);
          value = chinHeight / philtrumHeight;
          break;
        }

        case "neck_width": {
          const neckWidth = distance(L[49], L[50]);
          const gonionWidth = distance(L[43], L[44]);
          console.log('neckWidth:', neckWidth, 'gonionWidth:', gonionWidth);
          value = (neckWidth / gonionWidth) * 100;
          break;
        }

        // ============ LIPS ============
        case "lip_ratio": {
  const upperLipHeight = Math.abs(L[42].y - L[40].y);
  const lowerLipHeight = Math.abs(L[6].y - L[42].y);
  if (upperLipHeight > 0 && lowerLipHeight > 0) {
    value = lowerLipHeight / upperLipHeight;
  } else {
    value = 1.5;
  }
  break;
}
        

        // ============ BROWS ============
        case "eyebrow_tilt": {
          // Use midpoints for more stable measurement
          // Left: midpoint(L[17], L[18]) → midpoint(L[19], L[20])
          const leftStartX = (L[17].x + L[18].x) / 2;
          const leftStartY = (L[17].y + L[18].y) / 2;
          const leftEndX = (L[19].x + L[20].x) / 2;
          const leftEndY = (L[19].y + L[20].y) / 2;
          const leftRise = leftStartY - leftEndY;
          const leftRun = Math.abs(leftEndX - leftStartX);
          const leftTilt = Math.atan2(leftRise, leftRun) * (180 / Math.PI);

          // Right: midpoint(L[28], L[29]) → midpoint(L[30], L[31])
          const rightStartX = (L[28].x + L[29].x) / 2;
          const rightStartY = (L[28].y + L[29].y) / 2;
          const rightEndX = (L[30].x + L[31].x) / 2;
          const rightEndY = (L[30].y + L[31].y) / 2;
          const rightRise = rightStartY - rightEndY;
          const rightRun = Math.abs(rightEndX - rightStartX);
          const rightTilt = Math.atan2(rightRise, rightRun) * (180 / Math.PI);

          console.log('=== EYEBROW TILT DEBUG ===');
          console.log('Left start midpoint:', leftStartX.toFixed(1), leftStartY.toFixed(1));
          console.log('Left end midpoint:', leftEndX.toFixed(1), leftEndY.toFixed(1));
          console.log('Right start midpoint:', rightStartX.toFixed(1), rightStartY.toFixed(1));
          console.log('Right end midpoint:', rightEndX.toFixed(1), rightEndY.toFixed(1));
          console.log('Left: rise=', leftRise.toFixed(1), 'run=', leftRun.toFixed(1), 'tilt=', leftTilt.toFixed(1));
          console.log('Right: rise=', rightRise.toFixed(1), 'run=', rightRun.toFixed(1), 'tilt=', rightTilt.toFixed(1));
          console.log('Average tilt:', ((leftTilt + rightTilt) / 2).toFixed(1));
          value = Math.abs((leftTilt + rightTilt) / 2);
          break;
        }

        case "brow_length_ratio": {
          // Brow length (18 to 21, 29 to 32) / face width (51 to 52)
          const leftLength = distance(L[18], L[21]);
          const rightLength = distance(L[29], L[32]);
          value = (leftLength + rightLength) / core.raw.faceWidth;
          break;
        }

        // ============ FEATURES ============
        case "cheekbone_height": {
          // How high cheekbones sit between eye line and cupid's bow (100 = at eye line)
          const avgCheekY = (L[51].y + L[52].y) / 2;
          const eyeLineY = (L[13].y + L[24].y) / 2;
          value = 100 - ((avgCheekY - eyeLineY) / (L[41].y - eyeLineY)) * 100;
          console.log('cheekbone_height:', value, 'avgCheekY:', avgCheekY, 'eyeLineY:', eyeLineY, 'L[41].y:', L[41].y);
          break;
        }

        case "cupids_bow_depth": {
          // Using Cupid's Bow (41) depth relative to Labrale Superius (40)
          value = Math.abs(L[41].y - L[40].y) / pixelsPerMm;
          break;
        }

        case "ear_protrusion_ratio": {
          // Ear protrusion relative to ear-to-ear width
          const earToEarWidth = distance(L[8], L[9]);
          const leftProtrusion = (distance(L[8], L[51]) / earToEarWidth) * 100;
          const rightProtrusion = (distance(L[9], L[52]) / earToEarWidth) * 100;
          value = (leftProtrusion + rightProtrusion) / 2;
          console.log('ear_protrusion_ratio:', value, 'left:', leftProtrusion, 'right:', rightProtrusion);
          break;
        }

        case "ear_protrusion_angle": {
          // Ear angle from vertical - using tragion position relative to temple
          // This is simplified since we only have one point per ear
          value = 10.75; // Default to ideal midpoint
          break;
        }

        case "angularity_score": {
          // Composite metric using scores from other metrics
          // Helper to get score from results array
          const getScore = (metricId: string): number => {
            const result = results.find(r => r.definition.id === metricId);
            return result?.score ?? 5.0; // Default to 5.0 if not found
          };

          // Sub-scores (each 0-10)
          const jawDefinition = (getScore("jaw_frontal_angle") * 0.5) + (getScore("jaw_slope") * 0.5);
          const chinDefinition = (getScore("chin_philtrum") * 0.6) + (getScore("lower_third_proportion") * 0.4);
          const cheekboneProminence = (getScore("cheekbone_height") * 0.6) + (getScore("face_width_height") * 0.4);
          const cheekLeanness = (getScore("midface_ratio") * 0.5) + (getScore("bigonial_width") * 0.5);
          const submentalDefinition = (getScore("neck_width") * 0.6) + (getScore("jaw_slope") * 0.4);

          // Final weighted score
          value = (jawDefinition * 0.25) +
                  (chinDefinition * 0.20) +
                  (cheekboneProminence * 0.20) +
                  (cheekLeanness * 0.20) +
                  (submentalDefinition * 0.15);

          console.log('angularity_score:', value.toFixed(2),
            'jaw:', jawDefinition.toFixed(2),
            'chin:', chinDefinition.toFixed(2),
            'cheek:', cheekboneProminence.toFixed(2),
            'lean:', cheekLeanness.toFixed(2),
            'submental:', submentalDefinition.toFixed(2));
          break;
        }

        case "dimorphism_score": {
          // Composite metric for sexual dimorphism using scores from other metrics
          const getScore = (metricId: string): number => {
            const result = results.find(r => r.definition.id === metricId);
            return result?.score ?? 5.0;
          };

          // Sub-scores (each 0-10)
          const jawScore = (getScore("jaw_frontal_angle") * 0.4) + (getScore("bigonial_width") * 0.3) + (getScore("jaw_slope") * 0.3);
          const eyesScore = (getScore("canthal_tilt") * 0.5) + (getScore("eye_aspect_ratio") * 0.5);
          const faceShapeScore = (getScore("face_width_height") * 0.5) + (getScore("total_face_width_height") * 0.5);
          const noseScore = (getScore("intercanthal_nasal") * 0.6) + (getScore("middle_third") * 0.4);
          const browRidgeScore = (getScore("eyebrow_tilt") * 0.6) + (getScore("brow_length_ratio") * 0.4);
          const lipsScore = (getScore("chin_philtrum") * 0.5) + (getScore("lower_third_proportion") * 0.5);

          // Final weighted score
          value = (jawScore * 0.25) +
                  (eyesScore * 0.20) +
                  (faceShapeScore * 0.20) +
                  (noseScore * 0.15) +
                  (browRidgeScore * 0.10) +
                  (lipsScore * 0.10);

          console.log('dimorphism_score:', value.toFixed(2),
            'jaw:', jawScore.toFixed(2),
            'eyes:', eyesScore.toFixed(2),
            'faceShape:', faceShapeScore.toFixed(2),
            'nose:', noseScore.toFixed(2),
            'browRidge:', browRidgeScore.toFixed(2),
            'lips:', lipsScore.toFixed(2));
          break;
        }

        default:
          value = null;
      }
    } catch (e) {
      value = null;
    }

    // For composite metrics, the value IS the score (already 0-10)
    // Don't run them through scoreMetric again
    const isCompositeMetric = def.id === "angularity_score" || def.id === "dimorphism_score";
    const score = value !== null
      ? (isCompositeMetric ? Math.round(value * 10) / 10 : scoreMetric(value, def.idealMin, def.idealMax, def))
      : null;

    results.push({
      definition: def,
      value,
      score,
      displayValue: formatMetricValue(value, def.unit),
      ...(def.id === "jaw_slope" && { jawSlopeLeft, jawSlopeRight }),
    });
  }

  return results;
}
