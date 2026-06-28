import { MetricDefinition } from "./types";

// =============================================================================
// GAUSSIAN SCORING SYSTEM
// =============================================================================
// Score = 10 when value is within ideal range
// Score drops off smoothly using Gaussian decay outside the ideal range
// Each metric has a calibrated sigma value to match FaceIQ scoring

// =============================================================================
// SIGMA VALUES PER METRIC (calibrated to match FaceIQ)
// =============================================================================

const METRIC_SIGMA: Record<string, number> = {
  // Calibrated from FaceIQ reference data
  "nose_bridge_width": 0.28,      // value 2.41, ideal 2.06-2.14, score 5.0
  "ear_protrusion_angle": 6.0,    // value 16.4, ideal 10.0-11.5, score 5.6
  "ear_protrusion_ratio": 2.5,    // value 14.5, ideal 8.0-12.0, score 6.0
  "lower_third": 4.0,             // value 38.8, ideal 33.9-37.0, score 6.3
  "cheekbone_height": 10.0,       // value 76.4, ideal 83.0-100.0, score 7.2
  "lip_ratio": 0.4,               // value 1.24, ideal 1.55-1.85, score 8.1
  "chin_philtrum": 0.5,           // value 2.62, ideal 2.15-2.45, score 9.0
  "canthal_tilt": 3.5,            // value 4.9, ideal 6.0-7.7, score ~9.0
  "midface_ratio": 0.12,          // value 1.04, ideal 0.97-1.00, score 9.2
  "cupids_bow_depth": 1.5,        // value 2.06, ideal 2.30-4.00, score 9.2
  "top_third": 2.5,               // value 28.9, ideal 30.0-32.0, score 9.4
  "face_width_height": 0.15,      // value 1.92, ideal 1.96-2.00, score 9.5
  "jaw_slope": 8.0,               // ideal 140.0-142.5
  "brow_eye_distance": 0.3,       // value 0.54, ideal 0.00-0.45, score 9.7
  "total_face_width_height": 0.08, // value 1.33, ideal 1.34-1.37, score 9.8

  // Default sigma values for metrics not specifically calibrated
  // Wide enough that nearby values stay at or near 10
  "middle_third": 3.0,
  "bitemporal_width": 5.0,
  "bigonial_width": 8.0,
  "eye_aspect_ratio": 0.5,
  "eye_separation": 3.0,
  "ipd_mouth_ratio": 0.1,
  "intercanthal_nasal": 0.15,
  "mouth_nose_ratio": 0.2,
  "nose_tip_position": 1.0,
  "alar_angle": 5.0,
  "iaa_jfa_deviation": 5.0,
  "jaw_frontal_angle": 15.0,
  "lower_third_proportion": 3.0,
  "neck_width": 5.0,
  "eyebrow_tilt": 3.0,
  "brow_length_ratio": 0.1,
  "mouth_corner_position": 1.0,
  "angularity_score": 1.0,        // composite score, ideal 8.0-10.0
  "dimorphism_score": 1.0,        // composite score, ideal 8.0-10.0
};

// Default sigma for any metric not in the map
const DEFAULT_SIGMA = 5.0;

// =============================================================================
// CORE GAUSSIAN SCORING FUNCTION
// =============================================================================

/**
 * Score a metric using Gaussian decay
 * Returns 10 when value is inside ideal range
 * Drops off smoothly outside using: 10 * exp(-0.5 * (dist/sigma)^2)
 */
function gaussianScore(
  value: number,
  idealMin: number,
  idealMax: number,
  sigma: number
): number {
  // If within ideal range, perfect score
  if (value >= idealMin && value <= idealMax) {
    return 10.0;
  }

  // Calculate distance from nearest boundary
  const distFromBand = value < idealMin
    ? idealMin - value
    : value - idealMax;

  // Gaussian decay
  const score = 10 * Math.exp(-0.5 * Math.pow(distFromBand / sigma, 2));

  return Math.max(0, score);
}

/**
 * Get the sigma value for a metric
 */
function getSigma(metricId: string): number {
  return METRIC_SIGMA[metricId] ?? DEFAULT_SIGMA;
}

// =============================================================================
// MAIN SCORING FUNCTION
// =============================================================================

/**
 * Score a metric using the Gaussian scoring system
 */
export function scoreMetric(
  value: number,
  idealMin: number,
  idealMax: number,
  def?: MetricDefinition
): number {
  const metricId = def?.id || "";
  const sigma = getSigma(metricId);

  // Handle special inverse scoring (like IAA-JFA deviation where lower is better)
  if (def?.inverseScoring) {
    return scoreInverseMetric(value, idealMin, idealMax, sigma);
  }

  // Handle asymmetric scoring (like mouth corner position)
  if (def?.asymmetricScoring) {
    return scoreAsymmetricMetric(value, idealMin, idealMax, sigma);
  }

  // Standard Gaussian scoring
  const score = gaussianScore(value, idealMin, idealMax, sigma);
  return Math.round(score * 10) / 10;
}

/**
 * Inverse scoring for metrics where lower is better (e.g., deviation metrics)
 * 0 = perfect score of 10, higher values = lower scores
 */
function scoreInverseMetric(
  value: number,
  idealMin: number,
  idealMax: number,
  sigma: number
): number {
  // Within ideal range: score based on proximity to idealMin (0)
  if (value >= idealMin && value <= idealMax) {
    const proportion = (value - idealMin) / (idealMax - idealMin || 0.001);
    // Linear from 10 at idealMin to 9.0 at idealMax
    return Math.round((10 - proportion) * 10) / 10;
  }

  // Above ideal max: Gaussian decay
  if (value > idealMax) {
    const dist = value - idealMax;
    const score = 9.0 * Math.exp(-0.5 * Math.pow(dist / sigma, 2));
    return Math.round(Math.max(0, score) * 10) / 10;
  }

  // Below idealMin (shouldn't happen for deviation metrics)
  return 10.0;
}

/**
 * Asymmetric scoring for metrics like mouth corner position
 * Positive values within range = good
 * Negative values = penalized more heavily
 */
function scoreAsymmetricMetric(
  value: number,
  idealMin: number,
  idealMax: number,
  sigma: number
): number {
  // Within ideal range: full score
  if (value >= idealMin && value <= idealMax) {
    return 10.0;
  }

  // Above ideal max (too much): standard Gaussian decay
  if (value > idealMax) {
    const dist = value - idealMax;
    const score = 10 * Math.exp(-0.5 * Math.pow(dist / sigma, 2));
    return Math.round(Math.max(0, score) * 10) / 10;
  }

  // Below idealMin: heavier penalty (use sigma * 0.7 for faster decay)
  if (value < idealMin) {
    const dist = idealMin - value;
    const score = 10 * Math.exp(-0.5 * Math.pow(dist / (sigma * 0.7), 2));
    return Math.round(Math.max(0, score) * 10) / 10;
  }

  return 5.0;
}

// =============================================================================
// OVERALL SCORE CALCULATION
// =============================================================================

/**
 * Calculate overall score using weighted geometric mean
 */
export function calculateOverallScore(
  scores: (number | null)[],
  metricIds?: string[]
): number {
  // Filter out null scores
  const validScores = scores.filter((s): s is number => s !== null);

  if (validScores.length === 0) return 0;

  // Calculate geometric mean
  // Geometric mean = (∏ x_i)^(1/n)
  let sumLog = 0;

  for (const score of validScores) {
    // Clamp score to minimum 0.1 to avoid log(0)
    const clampedScore = Math.max(0.1, score);
    sumLog += Math.log(clampedScore);
  }

  const geometricMean = Math.exp(sumLog / validScores.length);

  return Math.round(geometricMean * 10) / 10;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate deviation percentage for logging/debugging
 */
export function getDeviationPercent(
  value: number,
  idealMin: number,
  idealMax: number
): number {
  if (value >= idealMin && value <= idealMax) {
    return 0;
  }

  const idealRange = idealMax - idealMin;
  let deviation: number;

  if (value < idealMin) {
    deviation = idealMin - value;
  } else {
    deviation = value - idealMax;
  }

  return (deviation / idealRange) * 100;
}

/**
 * Get color based on score
 */
export function getScoreColor(score: number): string {
  if (score >= 9) return "#22c55e"; // green-500 (excellent)
  if (score >= 8) return "#4ade80"; // green-400 (very good)
  if (score >= 7) return "#84cc16"; // lime-500 (good)
  if (score >= 6) return "#a3e635"; // lime-400 (above average)
  if (score >= 5) return "#facc15"; // yellow-400 (average)
  if (score >= 4) return "#f59e0b"; // amber-500 (below average)
  if (score >= 3) return "#f97316"; // orange-500 (poor)
  return "#ef4444"; // red-500 (very poor)
}

/**
 * Get label based on score
 */
export function getScoreLabel(score: number): string {
  if (score >= 9.5) return "Exceptional";
  if (score >= 9) return "Excellent";
  if (score >= 8) return "Very Good";
  if (score >= 7) return "Good";
  if (score >= 6) return "Above Average";
  if (score >= 5) return "Average";
  if (score >= 4) return "Below Average";
  if (score >= 3) return "Poor";
  return "Very Poor";
}

/**
 * Format metric value for display
 */
export function formatMetricValue(
  value: number | null,
  unit: string
): string {
  if (value === null) return "N/A";

  switch (unit) {
    case "%":
      return `${value.toFixed(1)}%`;
    case "x":
      return `${value.toFixed(2)}x`;
    case "°":
      return `${value.toFixed(1)}°`;
    case "mm":
      return `${value.toFixed(1)}mm`;
    default:
      return value.toFixed(2);
  }
}
