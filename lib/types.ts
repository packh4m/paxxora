export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface FaceLandmarks {
  landmarks: Point[];
  imageWidth: number;
  imageHeight: number;
}

export type MetricCategory =
  | "Facial Thirds"
  | "Eyes"
  | "Nose"
  | "Jaw"
  | "Lips"
  | "Brows"
  | "Features";

export type MetricUnit = "%" | "x" | "°" | "mm";

export interface MetricDefinition {
  id: string;
  name: string;
  category: MetricCategory;
  idealMin: number;
  idealMax: number;
  unit: MetricUnit;
  description: string;
  isDetectable: boolean;
  inverseScoring?: boolean;
  asymmetricScoring?: boolean;
}

export interface MetricResult {
  definition: MetricDefinition;
  value: number | null;
  score: number | null;
  displayValue: string;
  jawSlopeLeft?: number;
  jawSlopeRight?: number;
}

export interface AnalysisResult {
  metrics: MetricResult[];
  overallScore: number;
  imageUrl: string;
  analyzedAt: Date;
  landmarks?: Point[];
  imageWidth?: number;
  imageHeight?: number;
  visionScores?: VisionScores;
  visionError?: string;
  finalScore?: number;
}

export interface VisionScores {
  jaw_definition: number;
  cheekbone_prominence: number;
  skin_quality: number;
  sexual_dimorphism: number;
  facial_fat: number;
  overall_harmony: number;
  eye_appeal: number;
  overall_impression: number;
  facial_hair: number;
  neck: number;
  eyebrow_thickness: number;
  nose_masculinity: number;
  brow_ridge: number;
  hairline: number;
  eyes_dimorphism: number;
  lip_masculinity: number;
  face_shape_dimorphism: number;
  jaw_dimorphism: number;
  hair_length: number;
  harmony_dimorphism: number;
  reasoning: string;
}

export const VISION_METRIC_LABELS: Record<keyof Omit<VisionScores, "reasoning">, string> = {
  jaw_definition: "Jaw Definition",
  cheekbone_prominence: "Cheekbone Prominence",
  skin_quality: "Skin Quality",
  sexual_dimorphism: "Sexual Dimorphism",
  facial_fat: "Facial Leanness",
  overall_harmony: "Overall Harmony",
  eye_appeal: "Eye Appeal",
  overall_impression: "Overall Impression",
  facial_hair: "Facial Hair",
  neck: "Neck",
  eyebrow_thickness: "Eyebrow Thickness",
  nose_masculinity: "Nose",
  brow_ridge: "Brow Ridge",
  hairline: "Hairline",
  eyes_dimorphism: "Eyes",
  lip_masculinity: "Lips",
  face_shape_dimorphism: "Face Shape",
  jaw_dimorphism: "Jaw",
  hair_length: "Hair Length",
  harmony_dimorphism: "Harmony",
};

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  // ===================== FACIAL THIRDS =====================
  { id: "top_third", name: "Top Third", category: "Facial Thirds", idealMin: 30.0, idealMax: 32.0, unit: "%", description: "Trichion to glabella as % of trichion-to-menton height", isDetectable: true },
  { id: "middle_third", name: "Middle Third", category: "Facial Thirds", idealMin: 31.4, idealMax: 33.4, unit: "%", description: "Glabella to subnasale as % of trichion-to-menton height", isDetectable: true },
  { id: "lower_third", name: "Lower Third", category: "Facial Thirds", idealMin: 33.0, idealMax: 38.0, unit: "%", description: "Subnasale to menton as % of trichion-to-menton height", isDetectable: true },
  { id: "total_face_width_height", name: "Total Facial Width to Height Ratio", category: "Facial Thirds", idealMin: 1.34, idealMax: 1.37, unit: "x", description: "Bizygomatic width to hairline-menton height ratio", isDetectable: true },
  { id: "midface_ratio", name: "Midface Ratio", category: "Facial Thirds", idealMin: 0.97, idealMax: 1.00, unit: "x", description: "Midface width to bizygomatic width ratio", isDetectable: true },
  { id: "bitemporal_width", name: "Bitemporal Width", category: "Facial Thirds", idealMin: 86.5, idealMax: 92.5, unit: "%", description: "Bitemporal to bizygomatic width ratio", isDetectable: true },
  { id: "bigonial_width", name: "Bigonial Width", category: "Facial Thirds", idealMin: 87.5, idealMax: 91.5, unit: "%", description: "Jaw width to bizygomatic width ratio", isDetectable: true },

  // ===================== EYES =====================
  { id: "eye_aspect_ratio", name: "Eye Aspect Ratio", category: "Eyes", idealMin: 3.0, idealMax: 3.5, unit: "x", description: "Eye width to height ratio", isDetectable: true },
  { id: "canthal_tilt", name: "Lateral Canthal Tilt", category: "Eyes", idealMin: 6.0, idealMax: 7.7, unit: "°", description: "Angle of eye axis from horizontal", isDetectable: true },
  { id: "eye_separation", name: "Eye Separation Ratio", category: "Eyes", idealMin: 42, idealMax: 48, unit: "%", description: "Interpupillary distance to face width", isDetectable: true },
  { id: "ipd_mouth_ratio", name: "Interpupillary-Mouth Width Ratio", category: "Eyes", idealMin: 0.83, idealMax: 0.87, unit: "x", description: "Interpupillary distance to mouth width ratio", isDetectable: true },
  { id: "intercanthal_nasal", name: "Intercanthal-Nasal Width Ratio", category: "Eyes", idealMin: 1.04, idealMax: 1.16, unit: "x", description: "Intercanthal distance to nasal width ratio", isDetectable: true },

  // ===================== NOSE =====================
  { id: "nose_bridge_width", name: "Nose Bridge to Nose Width", category: "Nose", idealMin: 2.06, idealMax: 2.14, unit: "x", description: "Nose base width to bridge width ratio", isDetectable: true },
  { id: "mouth_nose_ratio", name: "Mouth Width to Nose Width Ratio", category: "Nose", idealMin: 1.42, idealMax: 1.50, unit: "x", description: "Mouth width to nose width ratio", isDetectable: true },
  { id: "nose_tip_position", name: "Nose Tip Position", category: "Nose", idealMin: 0, idealMax: 3.0, unit: "mm", description: "Deviation of nose tip from midline (0 = centered)", isDetectable: true },
  { id: "alar_angle", name: "Ipsilateral Alar Angle", category: "Nose", idealMin: 86.5, idealMax: 92.5, unit: "°", description: "Angle of alar base", isDetectable: true },
  { id: "iaa_jfa_deviation", name: "Deviation IAA-JFA", category: "Nose", idealMin: 0.0, idealMax: 2.5, unit: "°", description: "Deviation between alar angle and jaw frontal angle", isDetectable: true, inverseScoring: true },

  // ===================== JAW =====================
  { id: "jaw_frontal_angle", name: "Jaw Frontal Angle", category: "Jaw", idealMin: 86.5, idealMax: 92.5, unit: "°", description: "Jaw width angle from front view", isDetectable: true },
  { id: "jaw_slope", name: "Jaw Slope", category: "Jaw", idealMin: 140.0, idealMax: 142.5, unit: "°", description: "Angle at gonion inferior between jaw line and chin line", isDetectable: true },
  { id: "lower_third_proportion", name: "Lower Third Proportion", category: "Jaw", idealMin: 31.0, idealMax: 33.5, unit: "%", description: "Subnasale to midlip distance as % of subnasale to menton distance", isDetectable: true },
  { id: "chin_philtrum", name: "Chin to Philtrum Ratio", category: "Jaw", idealMin: 2.15, idealMax: 2.45, unit: "x", description: "Chin height to philtrum height ratio", isDetectable: true },
  { id: "neck_width", name: "Neck Width", category: "Jaw", idealMin: 92.0, idealMax: 98.0, unit: "%", description: "Neck width relative to jaw width", isDetectable: true },

  // ===================== LIPS =====================
  { id: "lip_ratio", name: "Lower Lip to Upper Lip Ratio", category: "Lips", idealMin: 1.55, idealMax: 1.85, unit: "x", description: "Lower lip to upper lip height ratio", isDetectable: true },

  // ===================== BROWS =====================
  { id: "eyebrow_tilt", name: "Eyebrow Tilt", category: "Brows", idealMin: 6.5, idealMax: 11.0, unit: "°", description: "Upward angle of brow from medial to lateral", isDetectable: true },
  { id: "brow_length_ratio", name: "Brow Length to Face Width Ratio", category: "Brows", idealMin: 0.69, idealMax: 0.76, unit: "x", description: "Brow length relative to face width", isDetectable: true },

  // ===================== FEATURES =====================
  { id: "cheekbone_height", name: "Cheekbone Height", category: "Features", idealMin: 83.0, idealMax: 100.0, unit: "%", description: "Cheekbone position relative to sellion-menton height", isDetectable: true },
  { id: "cupids_bow_depth", name: "Cupid's Bow Depth", category: "Features", idealMin: 2.30, idealMax: 4.00, unit: "mm", description: "Depth of cupid's bow curve", isDetectable: true },
  { id: "ear_protrusion_ratio", name: "Ear Protrusion Ratio", category: "Features", idealMin: 8.0, idealMax: 12.0, unit: "%", description: "Ear protrusion relative to face width", isDetectable: true },
  { id: "ear_protrusion_angle", name: "Ear Protrusion Angle", category: "Features", idealMin: 10.0, idealMax: 11.5, unit: "°", description: "Angle of ear from skull", isDetectable: true },

  // ===================== COMPOSITE =====================
];