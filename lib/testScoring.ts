import { METRIC_DEFINITIONS } from "./types";
import { scoreMetric, calculateOverallScore, getDeviationPercent } from "./scoring";

interface TestResult {
  metricId: string;
  metricName: string;
  testValue: number;
  idealMin: number;
  idealMax: number;
  deviationPercent: number;
  score: number;
}

// =============================================================================
// MODEL PHOTO TEST VALUES
// These simulate a top model's facial metrics - should score 8.0-8.8
// =============================================================================
const MODEL_VALUES: Record<string, number> = {
  // Facial Thirds - near ideal
  "top_third": 45,           // ideal 40-50
  "middle_third": 1.0,       // ideal 0.85-1.15
  "lower_third": 55,         // ideal 50-60
  "face_width_height": 0.67, // ideal 0.62-0.72
  "midface_ratio": 0.82,     // ideal 0.75-0.88
  "bitemporal_width": 89,    // ideal 86.5-92.5
  "bigonial_width": 82,      // ideal 80-85

  // Eyes - excellent
  "eye_aspect_ratio": 3.2,   // ideal 3.0-3.5
  "canthal_tilt": 5.5,       // ideal 3-8
  "eye_separation": 45,      // ideal 42-48
  "one_eye_apart": 1.0,      // ideal 0.95-1.05
  "ipd_mouth_ratio": 0.85,   // ideal 0.83-0.87
  "intercanthal_nasal": 1.1, // ideal 1.04-1.16

  // Nose - good
  "nose_bridge_width": 2.3,  // ideal 1.8-2.8
  "mouth_nose_ratio": 1.46,  // ideal 1.42-1.50
  "nose_tip_position": 1.0,  // ideal 0-3.0
  "alar_angle": 89,          // ideal 86.5-92.5
  "iaa_jfa_deviation": 1.0,  // ideal 0-2.5

  // Jaw - excellent
  "gonial_angle": 125,       // ideal 115-135
  "jaw_frontal_angle": 89,   // ideal 86.5-92.5
  "lower_third_proportion": 55, // ideal 50-60
  "chin_philtrum": 2.0,      // ideal 1.8-2.2
  "neck_width": 95,          // ideal 92-98

  // Lips
  "lip_ratio": 1.5,          // ideal 1.4-1.6

  // Brows
  "eyebrow_tilt": 8.5,       // ideal 6.5-11.0
  "brow_eye_distance": 0.78, // ideal 0.7-0.85
  "brow_length_ratio": 0.72, // ideal 0.69-0.76

  // Features
  "cheekbone_height": 78,    // ideal 75-82
  "cupids_bow_depth": 2.5,   // ideal 2.0-3.0
  "mouth_corner_position": 2.0, // ideal 0-4.0
};

// =============================================================================
// BELOW AVERAGE FACE TEST VALUES
// These simulate a below-average face - should score 3.5-4.5
// =============================================================================
const BELOW_AVG_VALUES: Record<string, number> = {
  // Facial Thirds - outside ideal
  "top_third": 35,           // ideal 40-50 (5% below)
  "middle_third": 0.70,      // ideal 0.85-1.15 (17% below)
  "lower_third": 65,         // ideal 50-60 (8% above)
  "face_width_height": 0.58, // ideal 0.62-0.72 (6% below)
  "midface_ratio": 0.68,     // ideal 0.75-0.88 (9% below)
  "bitemporal_width": 80,    // ideal 86.5-92.5 (7.5% below)
  "bigonial_width": 72,      // ideal 80-85 (10% below)

  // Eyes - poor
  "eye_aspect_ratio": 2.5,   // ideal 3.0-3.5 (17% below)
  "canthal_tilt": 0,         // ideal 3-8 (60% below)
  "eye_separation": 38,      // ideal 42-48 (10% below)
  "one_eye_apart": 0.85,     // ideal 0.95-1.05 (11% below)
  "ipd_mouth_ratio": 0.78,   // ideal 0.83-0.87 (6% below)
  "intercanthal_nasal": 0.95,// ideal 1.04-1.16 (9% below)

  // Nose - poor
  "nose_bridge_width": 1.5,  // ideal 1.8-2.8 (17% below)
  "mouth_nose_ratio": 1.35,  // ideal 1.42-1.50 (5% below)
  "nose_tip_position": 5.0,  // ideal 0-3.0 (67% above)
  "alar_angle": 80,          // ideal 86.5-92.5 (7.5% below)
  "iaa_jfa_deviation": 6.0,  // ideal 0-2.5 (140% above)

  // Jaw - poor
  "gonial_angle": 145,       // ideal 115-135 (7% above)
  "jaw_frontal_angle": 78,   // ideal 86.5-92.5 (10% below)
  "lower_third_proportion": 65, // ideal 50-60 (8% above)
  "chin_philtrum": 2.5,      // ideal 1.8-2.2 (14% above)
  "neck_width": 85,          // ideal 92-98 (8% below)

  // Lips
  "lip_ratio": 1.8,          // ideal 1.4-1.6 (12.5% above)

  // Brows
  "eyebrow_tilt": 4.0,       // ideal 6.5-11.0 (38% below)
  "brow_eye_distance": 0.60, // ideal 0.7-0.85 (14% below)
  "brow_length_ratio": 0.62, // ideal 0.69-0.76 (10% below)

  // Features
  "cheekbone_height": 68,    // ideal 75-82 (9% below)
  "cupids_bow_depth": 1.5,   // ideal 2.0-3.0 (25% below)
  "mouth_corner_position": -2.0, // ideal 0-4.0 (negative = downturned)
};

/**
 * Test with model photo values - should score 8.0-8.8
 */
export function testModelPhoto(): { results: TestResult[]; overallScore: number } {
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                    MODEL PHOTO TEST (Expected: 8.0-8.8)                      ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════════╝");
  console.log("");

  return runTestWithValues(MODEL_VALUES, "Model Photo", 8.0, 8.8);
}

/**
 * Test with below-average values - should score 3.5-4.5
 */
export function testBelowAverage(): { results: TestResult[]; overallScore: number } {
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                 BELOW AVERAGE TEST (Expected: 3.5-4.5)                       ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════════╝");
  console.log("");

  return runTestWithValues(BELOW_AVG_VALUES, "Below Average", 3.5, 4.5);
}

function runTestWithValues(
  values: Record<string, number>,
  label: string,
  expectedMin: number,
  expectedMax: number
): { results: TestResult[]; overallScore: number } {
  const results: TestResult[] = [];

  console.log("  Metric                        │   Value   │ Ideal Range    │  Score  │ Impact");
  console.log("  ──────────────────────────────┼───────────┼────────────────┼─────────┼────────");

  METRIC_DEFINITIONS.forEach((def) => {
    if (!def.isDetectable) return;

    const testValue = values[def.id];
    if (testValue === undefined) return;

    const score = scoreMetric(testValue, def.idealMin, def.idealMax, def);
    const deviationPercent = getDeviationPercent(testValue, def.idealMin, def.idealMax);

    // Determine impact level
    const highImpact = ["canthal_tilt", "gonial_angle", "face_width_height", "eye_aspect_ratio", "bigonial_width"];
    const medHighImpact = ["lower_third", "middle_third", "jaw_frontal_angle", "eye_separation", "chin_philtrum"];
    const medImpact = ["one_eye_apart", "ipd_mouth_ratio", "intercanthal_nasal", "brow_length_ratio", "eyebrow_tilt", "midface_ratio"];

    let impact = "Low";
    if (highImpact.includes(def.id)) impact = "HIGH";
    else if (medHighImpact.includes(def.id)) impact = "Med-Hi";
    else if (medImpact.includes(def.id)) impact = "Med";

    results.push({
      metricId: def.id,
      metricName: def.name,
      testValue,
      idealMin: def.idealMin,
      idealMax: def.idealMax,
      deviationPercent,
      score,
    });

    const name = def.name.substring(0, 28).padEnd(28);
    const val = testValue.toFixed(2).padStart(9);
    const idealRange = `${def.idealMin}-${def.idealMax}${def.unit}`.padStart(14);
    const scoreStr = score.toFixed(1).padStart(5);

    // Score indicator
    let indicator = " ";
    if (score >= 9) indicator = "✓";
    else if (score < 5) indicator = "✗";

    console.log(`  ${name} │ ${val} │ ${idealRange} │ ${indicator}${scoreStr}  │ ${impact}`);
  });

  const scores = results.map((r) => r.score);
  const metricIds = results.map((r) => r.metricId);
  const overallScore = calculateOverallScore(scores, metricIds);

  console.log("  ──────────────────────────────┴───────────┴────────────────┴─────────┴────────");
  console.log("");

  // Score distribution
  const excellent = scores.filter(s => s >= 9).length;
  const veryGood = scores.filter(s => s >= 8 && s < 9).length;
  const good = scores.filter(s => s >= 7 && s < 8).length;
  const average = scores.filter(s => s >= 5 && s < 7).length;
  const belowAvg = scores.filter(s => s < 5).length;

  console.log("  Score Distribution:");
  console.log(`    9-10 (Excellent):  ${excellent} metrics`);
  console.log(`    8-9  (Very Good):  ${veryGood} metrics`);
  console.log(`    7-8  (Good):       ${good} metrics`);
  console.log(`    5-7  (Average):    ${average} metrics`);
  console.log(`    <5   (Below Avg):  ${belowAvg} metrics`);
  console.log("");

  const passed = overallScore >= expectedMin && overallScore <= expectedMax;
  console.log(`  ═══════════════════════════════════════════════════════`);
  console.log(`  OVERALL SCORE: ${overallScore.toFixed(1)}/10`);
  console.log(`  Expected: ${expectedMin}-${expectedMax}: ${passed ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`  ═══════════════════════════════════════════════════════`);
  console.log("");

  return { results, overallScore };
}

/**
 * Run both tests
 */
export function runAllScoringTests(): void {
  testModelPhoto();
  testBelowAverage();
}

// Legacy exports for backwards compatibility
export function runScoringTest(mode: "perfect" | "poor" | "average"): {
  results: TestResult[];
  overallScore: number;
} {
  console.log(`\n========== SCORING TEST: ${mode.toUpperCase()} ==========\n`);

  const results: TestResult[] = [];

  METRIC_DEFINITIONS.forEach((def) => {
    if (!def.isDetectable) return;

    const idealMid = (def.idealMin + def.idealMax) / 2;
    let testValue: number;

    switch (mode) {
      case "perfect":
        testValue = idealMid;
        break;
      case "poor":
        testValue = def.idealMax + (idealMid * 0.30);
        break;
      case "average":
        testValue = def.idealMax + (idealMid * 0.10);
        break;
    }

    const score = scoreMetric(testValue, def.idealMin, def.idealMax, def);
    const deviationPercent = getDeviationPercent(testValue, def.idealMin, def.idealMax);

    results.push({
      metricId: def.id,
      metricName: def.name,
      testValue,
      idealMin: def.idealMin,
      idealMax: def.idealMax,
      deviationPercent,
      score,
    });

    console.log(
      `${def.name.padEnd(28)} | ` +
      `Value: ${testValue.toFixed(2).padStart(8)} | ` +
      `Ideal: ${def.idealMin}-${def.idealMax} | ` +
      `Dev: ${deviationPercent.toFixed(1).padStart(5)}% | ` +
      `Score: ${score.toFixed(1)}`
    );
  });

  const scores = results.map((r) => r.score);
  const metricIds = results.map((r) => r.metricId);
  const overallScore = calculateOverallScore(scores, metricIds);

  console.log("\n--- SUMMARY ---");
  console.log(`Mode: ${mode}`);
  console.log(`Metrics tested: ${results.length}`);
  console.log(`Score range: ${Math.min(...scores).toFixed(1)} - ${Math.max(...scores).toFixed(1)}`);
  console.log(`OVERALL SCORE: ${overallScore.toFixed(1)}`);

  const expectedRanges = {
    perfect: { min: 9.5, max: 10, desc: "Expected: 9.5-10" },
    poor: { min: 2.5, max: 4.5, desc: "Expected: 2.5-4.5" },
    average: { min: 6, max: 8, desc: "Expected: 6.0-8.0" },
  };

  const expected = expectedRanges[mode];
  const passed = overallScore >= expected.min && overallScore <= expected.max;
  console.log(`${expected.desc}: ${passed ? "✅ PASS" : "❌ FAIL"}`);
  console.log("\n============================================\n");

  return { results, overallScore };
}

export function testDeviationScoring(): void {
  console.log("\n========== DEVIATION SCORING TEST ==========\n");
  console.log("Testing how different deviation percentages map to scores:\n");

  // Use a high-impact metric (canthal_tilt: ideal 3-8°, max deduction 4.0)
  const idealMin = 3;
  const idealMax = 8;
  const idealRange = idealMax - idealMin;

  const testCases = [
    { label: "At midpoint", value: 5.5 },
    { label: "At min boundary", value: 3 },
    { label: "At max boundary", value: 8 },
    { label: "0.5x range outside", value: 8 + (idealRange * 0.5) },
    { label: "1x range outside", value: 8 + idealRange },
    { label: "1.5x range outside", value: 8 + (idealRange * 1.5) },
    { label: "2x range outside", value: 8 + (idealRange * 2) },
    { label: "3x range outside", value: 8 + (idealRange * 3) },
  ];

  console.log("Canthal Tilt (High Impact, max deduction 4.0)");
  console.log("Test Case          │ Value  │ Score │ Penalty");
  console.log("───────────────────┼────────┼───────┼────────");

  testCases.forEach((tc) => {
    const def = METRIC_DEFINITIONS.find(d => d.id === "canthal_tilt");
    const score = scoreMetric(tc.value, idealMin, idealMax, def);
    const penalty = 10 - score;

    console.log(
      `${tc.label.padEnd(18)} │ ${tc.value.toFixed(1).padStart(6)}° │ ${score.toFixed(1).padStart(5)} │ -${penalty.toFixed(1)}`
    );
  });

  console.log("\n============================================\n");
}
