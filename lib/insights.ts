export interface Insight {
  condition: (score: number) => boolean;
  label: string;
  description: string;
  impact: string;
  type: "positive" | "negative";
}

export const METRIC_INSIGHTS: Record<string, Insight[]> = {
  top_third: [
    { condition: s => s >= 8, label: "Ideal upper third", description: "Your upper third is proportionally balanced, creating a harmonious facial structure.", impact: "+4.2%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly short upper third", description: "The upper third is marginally short, subtly affecting overall facial balance.", impact: "-1.8%", type: "negative" },
    { condition: s => s < 5, label: "Short upper third", description: "The upper third is notably short, creating an imbalanced facial ratio.", impact: "-4.5%", type: "negative" },
  ],
  middle_third: [
    { condition: s => s >= 8, label: "Ideal middle third", description: "Your middle third is well-proportioned, contributing to strong facial harmony.", impact: "+3.8%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly elongated middle third", description: "The middle third is marginally long, slightly softening overall facial balance.", impact: "-2.1%", type: "negative" },
    { condition: s => s < 5, label: "Elongated middle third", description: "The middle third is notably long, creating disproportionate facial ratios.", impact: "-5.2%", type: "negative" },
  ],
  lower_third: [
    { condition: s => s >= 8, label: "Ideal lower third", description: "Your lower third sits within the ideal range, creating a balanced lower face.", impact: "+4.0%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly long lower third", description: "The lower jaw is marginally too long, creating a slightly heavy lower face.", impact: "-2.8%", type: "negative" },
    { condition: s => s < 5, label: "Elongated lower jaw", description: "The lower face is too tall, creating an elongated chin and jaw that disrupts facial harmony.", impact: "-6.1%", type: "negative" },
  ],
  face_width_height: [
    { condition: s => s >= 8, label: "Strong facial width ratio", description: "Your face has an ideal width-to-height ratio, projecting strength and masculinity.", impact: "+5.1%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly narrow face", description: "The face is marginally narrow relative to its height, slightly reducing masculine impact.", impact: "-2.3%", type: "negative" },
    { condition: s => s < 5, label: "Narrow facial structure", description: "The face is noticeably narrow, reducing the appearance of masculine bone structure.", impact: "-5.8%", type: "negative" },
  ],
  total_face_width_height: [
    { condition: s => s >= 8, label: "Ideal facial proportions", description: "Your total facial height-to-width ratio is well balanced.", impact: "+3.5%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly elongated face", description: "The face is marginally long relative to its width.", impact: "-2.0%", type: "negative" },
    { condition: s => s < 5, label: "Elongated face shape", description: "The face is notably elongated, reducing the impact of masculine bone structure.", impact: "-4.9%", type: "negative" },
  ],
  midface_ratio: [
    { condition: s => s >= 8, label: "Compact midface", description: "Your midface proportions are ideal, creating a harmonious central facial region.", impact: "+4.3%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly wide midface", description: "The midface is marginally wide, subtly affecting central facial harmony.", impact: "-1.9%", type: "negative" },
    { condition: s => s < 5, label: "Wide midface", description: "The midface is notably wide, disrupting the balance between eye distance and nose length.", impact: "-4.7%", type: "negative" },
  ],
  bitemporal_width: [
    { condition: s => s >= 8, label: "Strong temple width", description: "Your temporal region is well-proportioned relative to cheekbone width.", impact: "+2.8%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate temple width", description: "Temple width is acceptable but could be wider for stronger facial framing.", impact: "-1.5%", type: "negative" },
    { condition: s => s < 5, label: "Narrow temples", description: "Narrow temples reduce the overall width of the upper face, weakening facial frame.", impact: "-3.9%", type: "negative" },
  ],
  bigonial_width: [
    { condition: s => s >= 8, label: "Strong jaw width", description: "Your bigonial width relative to cheekbones creates a powerful, masculine lower face.", impact: "+4.8%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate jaw width", description: "Jaw width is acceptable but a wider jaw would enhance masculine facial structure.", impact: "-2.2%", type: "negative" },
    { condition: s => s < 5, label: "Narrow jaw", description: "A narrow jaw relative to cheekbones significantly reduces masculine facial impact.", impact: "-5.5%", type: "negative" },
  ],
  eye_aspect_ratio: [
    { condition: s => s >= 8, label: "Ideal eye shape", description: "Your eyes have an excellent width-to-height ratio, projecting intensity and masculinity.", impact: "+4.6%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly round eyes", description: "The eyes are marginally round, slightly reducing the hunter-eye appearance.", impact: "-2.4%", type: "negative" },
    { condition: s => s < 5, label: "Round eye shape", description: "Round eyes significantly reduce masculine facial impact and perceived dominance.", impact: "-6.2%", type: "negative" },
  ],
  canthal_tilt: [
    { condition: s => s >= 8, label: "Positive canthal tilt", description: "Your lateral canthi sit above the medial canthi, creating an intense hunter-eye appearance.", impact: "+5.8%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Neutral canthal tilt", description: "Your canthal tilt is neutral — a positive tilt would significantly enhance eye appeal.", impact: "-2.9%", type: "negative" },
    { condition: s => s < 5, label: "Negative canthal tilt", description: "Downward-slanting eyes significantly reduce masculine appeal and perceived dominance.", impact: "-7.1%", type: "negative" },
  ],
  eye_separation: [
    { condition: s => s >= 8, label: "Ideal eye spacing", description: "Your eyes are ideally spaced relative to face width, contributing to facial harmony.", impact: "+3.2%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly wide-set eyes", description: "Eyes are marginally wide-set, slightly affecting central facial harmony.", impact: "-1.7%", type: "negative" },
    { condition: s => s < 5, label: "Wide-set eyes", description: "Wide-set eyes noticeably affect facial balance and central harmony.", impact: "-4.1%", type: "negative" },
  ],
  ipd_mouth_ratio: [
    { condition: s => s >= 8, label: "Ideal mouth-to-eye ratio", description: "Your mouth width relative to eye spacing is well-proportioned.", impact: "+3.1%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly wide mouth", description: "Mouth width is marginally wide relative to eye spacing.", impact: "-1.6%", type: "negative" },
    { condition: s => s < 5, label: "Disproportionate mouth width", description: "Mouth width is noticeably disproportionate relative to interpupillary distance.", impact: "-3.8%", type: "negative" },
  ],
  intercanthal_nasal: [
    { condition: s => s >= 8, label: "Ideal nasal width", description: "Your nose width relative to inner eye distance is well proportioned.", impact: "+3.4%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly wide nose", description: "The nose is marginally wide relative to inner eye spacing.", impact: "-1.9%", type: "negative" },
    { condition: s => s < 5, label: "Wide nose", description: "A notably wide nose relative to inner eye spacing disrupts central facial harmony.", impact: "-4.6%", type: "negative" },
  ],
  nose_bridge_width: [
    { condition: s => s >= 8, label: "Ideal nose bridge", description: "Your nose bridge-to-base ratio is well-proportioned, creating a refined nasal structure.", impact: "+2.9%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly wide bridge", description: "The nose bridge is marginally wide relative to the base.", impact: "-1.5%", type: "negative" },
    { condition: s => s < 5, label: "Wide nose bridge", description: "A wide nose bridge relative to the base reduces nasal refinement.", impact: "-3.7%", type: "negative" },
  ],
  mouth_nose_ratio: [
    { condition: s => s >= 8, label: "Ideal mouth-to-nose ratio", description: "Your mouth width relative to nose width is well-balanced.", impact: "+2.7%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly wide mouth", description: "The mouth is marginally wide relative to nose width.", impact: "-1.4%", type: "negative" },
    { condition: s => s < 5, label: "Disproportionate mouth", description: "A notably wide mouth relative to nose width disrupts lower facial harmony.", impact: "-3.5%", type: "negative" },
  ],
  alar_angle: [
    { condition: s => s >= 8, label: "Ideal alar angle", description: "Your alar angle is within the ideal range, indicating well-balanced midface proportions.", impact: "+3.8%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly acute alar angle", description: "The alar angle is marginally acute, suggesting a slightly compact midface.", impact: "-2.1%", type: "negative" },
    { condition: s => s < 5, label: "Acute alar angle", description: "A notably acute alar angle indicates compressed midface proportions.", impact: "-5.0%", type: "negative" },
  ],
  jaw_frontal_angle: [
    { condition: s => s >= 8, label: "Sharp jaw angle", description: "Your jaw frontal angle is well-defined, projecting strength and masculine structure.", impact: "+5.4%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate jaw angle", description: "The jaw angle is acceptable but a sharper angle would significantly enhance masculine impact.", impact: "-2.7%", type: "negative" },
    { condition: s => s < 5, label: "Weak jaw angle", description: "A wide or undefined jaw angle significantly reduces masculine facial impact.", impact: "-6.8%", type: "negative" },
  ],
  jaw_slope: [
    { condition: s => s >= 8, label: "Strong jaw slope", description: "Your jaw slope creates a well-defined transition from cheekbone to chin.", impact: "+4.2%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate jaw slope", description: "The jaw slope is acceptable but a steeper angle would enhance definition.", impact: "-2.1%", type: "negative" },
    { condition: s => s < 5, label: "Soft jaw slope", description: "A soft jaw slope reduces overall facial sharpness and masculine definition.", impact: "-5.3%", type: "negative" },
  ],
  lower_third_proportion: [
    { condition: s => s >= 8, label: "Ideal lip-to-chin ratio", description: "Your philtrum-to-chin proportion is well-balanced within the lower third.", impact: "+3.6%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly long philtrum", description: "The philtrum is marginally long relative to the chin.", impact: "-1.8%", type: "negative" },
    { condition: s => s < 5, label: "Long philtrum", description: "A notably long philtrum relative to chin height disrupts lower facial proportions.", impact: "-4.4%", type: "negative" },
  ],
  chin_philtrum: [
    { condition: s => s >= 8, label: "Strong chin projection", description: "Your chin-to-philtrum ratio indicates a well-projected, defined chin.", impact: "+4.5%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate chin projection", description: "Chin projection is acceptable but stronger projection would enhance lower face definition.", impact: "-2.3%", type: "negative" },
    { condition: s => s < 5, label: "Weak chin", description: "A weak chin relative to philtrum height significantly reduces lower face definition.", impact: "-5.9%", type: "negative" },
  ],
  neck_width: [
    { condition: s => s >= 8, label: "Defined neck-jaw transition", description: "Your neck width relative to jaw creates a clean, defined submental region.", impact: "+3.9%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate neck definition", description: "Neck-to-jaw transition is acceptable but a leaner neck would sharpen the profile.", impact: "-2.0%", type: "negative" },
    { condition: s => s < 5, label: "Soft neck-jaw transition", description: "A wide neck relative to jaw blurs the submental boundary, reducing facial sharpness.", impact: "-5.1%", type: "negative" },
  ],
  lip_ratio: [
    { condition: s => s >= 8, label: "Ideal lip balance", description: "Your lower-to-upper lip ratio is well-proportioned, creating a harmonious mouth.", impact: "+3.3%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly unbalanced lips", description: "The lip ratio is marginally off-balance, slightly affecting mouth harmony.", impact: "-1.7%", type: "negative" },
    { condition: s => s < 5, label: "Unbalanced lips", description: "A notably unbalanced lip ratio disrupts lower facial harmony.", impact: "-4.2%", type: "negative" },
  ],
  eyebrow_tilt: [
    { condition: s => s >= 8, label: "Strong brow tilt", description: "Your eyebrow tilt enhances masculine facial expression and intensity.", impact: "+3.7%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate brow tilt", description: "Brow tilt is acceptable but a stronger angle would enhance masculine expression.", impact: "-1.9%", type: "negative" },
    { condition: s => s < 5, label: "Flat brows", description: "Flat or arched brows reduce masculine expression and facial intensity.", impact: "-4.8%", type: "negative" },
  ],
  brow_length_ratio: [
    { condition: s => s >= 8, label: "Ideal brow length", description: "Your brow length relative to face width is well-proportioned.", impact: "+2.8%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly short brows", description: "Brows are marginally short relative to face width.", impact: "-1.4%", type: "negative" },
    { condition: s => s < 5, label: "Short brows", description: "Short brows relative to face width reduce the framing of the eyes.", impact: "-3.6%", type: "negative" },
  ],
  cheekbone_height: [
    { condition: s => s >= 8, label: "High cheekbones", description: "Your cheekbones sit high on the face, casting shadows that enhance definition.", impact: "+5.2%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate cheekbone height", description: "Cheekbone height is acceptable but higher placement would significantly enhance definition.", impact: "-2.6%", type: "negative" },
    { condition: s => s < 5, label: "Low cheekbones", description: "Low cheekbones reduce facial definition and the appearance of structured bone architecture.", impact: "-6.3%", type: "negative" },
  ],
  cupids_bow_depth: [
    { condition: s => s >= 8, label: "Defined Cupid's bow", description: "A well-defined Cupid's bow enhances upper lip aesthetics and facial refinement.", impact: "+2.5%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate Cupid's bow", description: "Cupid's bow definition is acceptable but deeper definition would enhance lip aesthetics.", impact: "-1.3%", type: "negative" },
    { condition: s => s < 5, label: "Flat Cupid's bow", description: "A flat Cupid's bow reduces upper lip definition and aesthetic refinement.", impact: "-3.2%", type: "negative" },
  ],
  iaa_jfa_deviation: [
    { condition: s => s >= 8, label: "Harmonious facial angles", description: "Your alar and jaw angles are well-matched, creating structural facial harmony.", impact: "+3.5%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate angle deviation", description: "There is a marginal mismatch between alar and jaw angles.", impact: "-1.8%", type: "negative" },
    { condition: s => s < 5, label: "Significant angle deviation", description: "A notable mismatch between alar and jaw angles disrupts structural facial harmony.", impact: "-4.6%", type: "negative" },
  ],
  ear_protrusion_ratio: [
    { condition: s => s >= 8, label: "Ideal ear position", description: "Your ear protrusion is within the ideal range.", impact: "+2.1%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Slightly protruding ears", description: "Ears are marginally prominent, slightly affecting facial symmetry.", impact: "-1.2%", type: "negative" },
    { condition: s => s < 5, label: "Prominent ears", description: "Notably prominent ears draw attention away from facial features.", impact: "-3.0%", type: "negative" },
  ],
  ear_protrusion_angle: [
    { condition: s => s >= 8, label: "Ideal ear angle", description: "Your ear angle relative to the face is well-proportioned.", impact: "+1.9%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate ear angle", description: "Ear angle is within acceptable range but could be closer to the head.", impact: "-1.0%", type: "negative" },
    { condition: s => s < 5, label: "Wide ear angle", description: "A wide ear angle increases the appearance of ear protrusion.", impact: "-2.8%", type: "negative" },
  ],
  // Angularity composites
  "Jaw Definition": [
    { condition: s => s >= 8, label: "Sharp jaw definition", description: "Your jaw angle and slope combine to create a well-defined, angular jawline.", impact: "+5.4%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate jaw definition", description: "Jaw definition is acceptable but sharper angles would significantly enhance masculine impact.", impact: "-2.7%", type: "negative" },
    { condition: s => s < 5, label: "Weak jaw definition", description: "Soft jaw angles significantly reduce masculine facial structure and definition.", impact: "-6.8%", type: "negative" },
  ],
  "Chin Definition": [
    { condition: s => s >= 8, label: "Well-defined chin", description: "Your chin projects well and creates a strong lower face anchor.", impact: "+4.5%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate chin definition", description: "Chin definition is acceptable but stronger projection would improve lower face structure.", impact: "-2.3%", type: "negative" },
    { condition: s => s < 5, label: "Weak chin", description: "A weak chin significantly reduces lower facial definition and overall facial balance.", impact: "-5.9%", type: "negative" },
  ],
  "Cheekbone Prominence": [
    { condition: s => s >= 8, label: "Prominent cheekbones", description: "High, well-defined cheekbones create strong facial architecture.", impact: "+5.2%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate cheekbone prominence", description: "Cheekbones are present but higher placement would enhance facial definition.", impact: "-2.6%", type: "negative" },
    { condition: s => s < 5, label: "Low cheekbone prominence", description: "Low or flat cheekbones significantly reduce facial definition and structure.", impact: "-6.3%", type: "negative" },
  ],
  "Cheek Leanness": [
    { condition: s => s >= 8, label: "Lean facial structure", description: "Low facial fat reveals strong underlying bone architecture.", impact: "+4.8%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate cheek leanness", description: "Facial fat is within range but reduction would expose more bone structure.", impact: "-2.2%", type: "negative" },
    { condition: s => s < 5, label: "Excess facial fat", description: "Excess cheek fat obscures bone structure and significantly reduces facial definition.", impact: "-5.5%", type: "negative" },
  ],
  "Submental Definition": [
    { condition: s => s >= 8, label: "Clean neck-jaw line", description: "A sharp neck-to-jaw transition creates strong submental definition.", impact: "+3.9%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate submental definition", description: "The neck-jaw boundary is acceptable but could be sharper.", impact: "-2.0%", type: "negative" },
    { condition: s => s < 5, label: "Soft submental region", description: "A blurred neck-jaw boundary significantly reduces facial sharpness.", impact: "-5.1%", type: "negative" },
  ],
  // Dimorphism composites
  "Jaw": [
    { condition: s => s >= 8, label: "Highly masculine jaw", description: "Your jaw width, angle and slope all signal strong androgenic development.", impact: "+6.2%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderately masculine jaw", description: "Jaw masculinity is acceptable but width and angularity could be stronger.", impact: "-2.8%", type: "negative" },
    { condition: s => s < 5, label: "Low jaw masculinity", description: "A narrow or soft jaw significantly reduces masculine facial impact.", impact: "-7.1%", type: "negative" },
  ],
  "Eyes": [
    { condition: s => s >= 8, label: "Strong hunter eyes", description: "Your eye shape and canthal tilt strongly signal masculine dominance.", impact: "+5.8%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate eye masculinity", description: "Eye shape is acceptable but more hooding or tilt would enhance masculine appeal.", impact: "-2.9%", type: "negative" },
    { condition: s => s < 5, label: "Feminine eye shape", description: "Round or downward-slanting eyes significantly reduce masculine facial appeal.", impact: "-7.1%", type: "negative" },
  ],
  "Face Shape": [
    { condition: s => s >= 8, label: "Masculine face shape", description: "Your facial width-to-height ratio signals strong androgenic bone development.", impact: "+5.1%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate face shape masculinity", description: "Face shape is acceptable but wider proportions would enhance masculine impact.", impact: "-2.3%", type: "negative" },
    { condition: s => s < 5, label: "Feminine face shape", description: "An elongated or narrow face shape significantly reduces masculine facial impact.", impact: "-5.8%", type: "negative" },
  ],
  "Nose": [
    { condition: s => s >= 8, label: "Masculine nose", description: "Your nose width and prominence signal strong androgenic development.", impact: "+3.4%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate nose masculinity", description: "Nose masculinity is acceptable but wider proportions would enhance dimorphism.", impact: "-1.9%", type: "negative" },
    { condition: s => s < 5, label: "Feminine nose", description: "A narrow or small nose relative to the face reduces masculine facial impact.", impact: "-4.6%", type: "negative" },
  ],
  "Brow Ridge": [
    { condition: s => s >= 8, label: "Strong brow ridge", description: "Your brow tilt and length create a prominent, masculine brow ridge.", impact: "+3.7%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate brow ridge", description: "Brow ridge is acceptable but more prominence would enhance masculine expression.", impact: "-1.9%", type: "negative" },
    { condition: s => s < 5, label: "Weak brow ridge", description: "A flat or arched brow ridge significantly reduces masculine facial expression.", impact: "-4.8%", type: "negative" },
  ],
  "Lips": [
    { condition: s => s >= 8, label: "Masculine lip proportion", description: "Your lip-to-chin proportions signal masculine lower facial structure.", impact: "+3.6%", type: "positive" },
    { condition: s => s >= 5 && s < 8, label: "Moderate lip masculinity", description: "Lip proportions are acceptable but thinner lips relative to chin would enhance masculinity.", impact: "-1.8%", type: "negative" },
    { condition: s => s < 5, label: "Feminine lip proportion", description: "Full lips relative to chin height reduce masculine lower facial impact.", impact: "-4.4%", type: "negative" },
  ],
};

export function getSeverity(impactStr: string): { label: string; color: string; bg: string; border: string } {
  const val = Math.abs(parseFloat(impactStr.replace("%", "")));
  if (val >= 5.5) return { label: "EXTREME", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
  if (val >= 3.5) return { label: "SEVERE", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" };
  if (val >= 2.0) return { label: "MODERATE", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" };
  return { label: "MINOR", color: "text-zinc-500", bg: "bg-zinc-50", border: "border-zinc-200" };
}