import { TrainingAnnotation, LANDMARK_NAMES, NUM_LANDMARKS, LandmarkData } from './supabase';

// ============================================================
// DATA QUALITY CHECKS
// ============================================================

export interface QualityIssue {
  annotationId: string;
  imageUrl: string;
  issue: string;
  severity: 'warning' | 'error';
}

export interface QualityReport {
  totalAnnotations: number;
  validAnnotations: number;
  issues: QualityIssue[];
  passedChecks: boolean;
}

export function runQualityChecks(annotations: TrainingAnnotation[]): QualityReport {
  const issues: QualityIssue[] = [];

  for (const annotation of annotations) {
    const landmarks = annotation.landmarks;

    // Check 1: Missing landmarks
    if (!landmarks || landmarks.length < NUM_LANDMARKS) {
      issues.push({
        annotationId: annotation.id,
        imageUrl: annotation.photo_url,
        issue: `Missing landmarks: has ${landmarks?.length || 0}, expected ${NUM_LANDMARKS}`,
        severity: 'error',
      });
      continue;
    }

    // Check 2: Landmarks outside image bounds (0-1 range)
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (lm.x < 0 || lm.x > 1 || lm.y < 0 || lm.y > 1) {
        issues.push({
          annotationId: annotation.id,
          imageUrl: annotation.photo_url,
          issue: `Landmark ${i} (${LANDMARK_NAMES[i]}) outside bounds: (${lm.x.toFixed(3)}, ${lm.y.toFixed(3)})`,
          severity: 'error',
        });
      }
    }

    // Check 3: Geometric sanity checks
    const geometryIssues = checkGeometry(landmarks, annotation.id, annotation.photo_url);
    issues.push(...geometryIssues);
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;

  return {
    totalAnnotations: annotations.length,
    validAnnotations: annotations.length - errorCount,
    issues,
    passedChecks: errorCount === 0,
  };
}

function checkGeometry(landmarks: LandmarkData[], id: string, url: string): QualityIssue[] {
  const issues: QualityIssue[] = [];

  // Left eye outer (0) should be to the left of left eye inner (1)
  // Note: In image coordinates, smaller x = more left
  if (landmarks[0] && landmarks[1] && landmarks[0].x > landmarks[1].x) {
    issues.push({
      annotationId: id,
      imageUrl: url,
      issue: 'Left eye outer corner is to the right of inner corner',
      severity: 'warning',
    });
  }

  // Right eye inner (5) should be to the left of right eye outer (4)
  if (landmarks[4] && landmarks[5] && landmarks[5].x > landmarks[4].x) {
    issues.push({
      annotationId: id,
      imageUrl: url,
      issue: 'Right eye inner corner is to the right of outer corner',
      severity: 'warning',
    });
  }

  // Left eye (avg) should be to the left of right eye (avg)
  const leftEyeX = (landmarks[0]?.x + landmarks[1]?.x) / 2;
  const rightEyeX = (landmarks[4]?.x + landmarks[5]?.x) / 2;
  if (leftEyeX && rightEyeX && leftEyeX > rightEyeX) {
    issues.push({
      annotationId: id,
      imageUrl: url,
      issue: 'Left eye center is to the right of right eye center',
      severity: 'error',
    });
  }

  // Nose tip (13) should be roughly centered between eyes
  if (landmarks[13] && leftEyeX && rightEyeX) {
    const eyeMidpoint = (leftEyeX + rightEyeX) / 2;
    const noseDev = Math.abs(landmarks[13].x - eyeMidpoint);
    if (noseDev > 0.15) {
      issues.push({
        annotationId: id,
        imageUrl: url,
        issue: `Nose tip is far from center (deviation: ${(noseDev * 100).toFixed(1)}%)`,
        severity: 'warning',
      });
    }
  }

  // Chin (22) should be below the mouth
  if (landmarks[22] && landmarks[19] && landmarks[22].y < landmarks[19].y) {
    issues.push({
      annotationId: id,
      imageUrl: url,
      issue: 'Chin is above the upper lip',
      severity: 'error',
    });
  }

  return issues;
}

// ============================================================
// TRAIN/VAL/TEST SPLIT
// ============================================================

export interface DatasetSplit {
  train: TrainingAnnotation[];
  val: TrainingAnnotation[];
  test: TrainingAnnotation[];
}

export function splitDataset(
  annotations: TrainingAnnotation[],
  trainRatio = 0.8,
  valRatio = 0.1,
  seed = 42
): DatasetSplit {
  // Seeded random shuffle
  const shuffled = seededShuffle([...annotations], seed);

  const trainEnd = Math.floor(shuffled.length * trainRatio);
  const valEnd = trainEnd + Math.floor(shuffled.length * valRatio);

  return {
    train: shuffled.slice(0, trainEnd),
    val: shuffled.slice(trainEnd, valEnd),
    test: shuffled.slice(valEnd),
  };
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const random = seededRandom(seed);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// ============================================================
// EXPORT FORMAT: COCO KEYPOINTS JSON
// ============================================================

export interface COCODataset {
  info: {
    description: string;
    version: string;
    date_created: string;
  };
  images: COCOImage[];
  annotations: COCOAnnotation[];
  categories: COCOCategory[];
}

interface COCOImage {
  id: number;
  file_name: string;
  width: number;
  height: number;
  url: string;
}

interface COCOAnnotation {
  id: number;
  image_id: number;
  keypoints: number[];  // [x1, y1, v1, x2, y2, v2, ...]
  num_keypoints: number;
  landmarks: Record<string, { x: number; y: number }>;
}

interface COCOCategory {
  id: number;
  name: string;
  keypoints: string[];
}

export function exportToCOCO(annotations: TrainingAnnotation[]): COCODataset {
  const today = new Date().toISOString().split('T')[0];

  const images: COCOImage[] = annotations.map((ann, idx) => ({
    id: idx + 1,
    file_name: `photo_${String(idx + 1).padStart(3, '0')}.jpg`,
    width: ann.image_width || 800,  // Default if not stored
    height: ann.image_height || 600,
    url: ann.photo_url,
  }));

  const cocoAnnotations: COCOAnnotation[] = annotations.map((ann, idx) => {
    // Convert landmarks to COCO keypoints format: [x1, y1, v1, x2, y2, v2, ...]
    // v = visibility: 0 = not labeled, 1 = labeled but not visible, 2 = labeled and visible
    const keypoints: number[] = [];
    const landmarksObj: Record<string, { x: number; y: number }> = {};

    for (let i = 0; i < NUM_LANDMARKS; i++) {
      const lm = ann.landmarks[i];
      if (lm) {
        keypoints.push(lm.x, lm.y, 2);  // x, y, visible
        landmarksObj[LANDMARK_NAMES[i]] = { x: lm.x, y: lm.y };
      } else {
        keypoints.push(0, 0, 0);  // Not labeled
      }
    }

    return {
      id: idx + 1,
      image_id: idx + 1,
      keypoints,
      num_keypoints: ann.landmarks?.length || 0,
      landmarks: landmarksObj,
    };
  });

  return {
    info: {
      description: "LooksLadder Facial Landmarks",
      version: "1.0",
      date_created: today,
    },
    images,
    annotations: cocoAnnotations,
    categories: [
      {
        id: 1,
        name: "face",
        keypoints: [...LANDMARK_NAMES],
      },
    ],
  };
}

// ============================================================
// EXPORT FORMAT: CSV
// ============================================================

export function exportToCSV(annotations: TrainingAnnotation[]): string {
  // Header: image_id, image_url, p1_x, p1_y, p2_x, p2_y, ...
  const headers = ['image_id', 'image_url'];
  for (let i = 0; i < NUM_LANDMARKS; i++) {
    headers.push(`p${i + 1}_x`, `p${i + 1}_y`);
  }

  const rows = [headers.join(',')];

  annotations.forEach((ann, idx) => {
    const row = [String(idx + 1), `"${ann.photo_url}"`];

    for (let i = 0; i < NUM_LANDMARKS; i++) {
      const lm = ann.landmarks[i];
      if (lm) {
        row.push(lm.x.toFixed(6), lm.y.toFixed(6));
      } else {
        row.push('', '');
      }
    }

    rows.push(row.join(','));
  });

  return rows.join('\n');
}

// ============================================================
// EXPORT FORMAT: PyTorch ZIP (generates file contents)
// ============================================================

export interface PyTorchExportFiles {
  'dataset.yaml': string;
  'train.txt': string;
  'val.txt': string;
  'test.txt': string;
  labels: Record<string, string>;  // filename -> content
}

export function generatePyTorchFiles(
  split: DatasetSplit
): PyTorchExportFiles {
  const datasetYaml = `# LooksLadder Facial Landmarks Dataset
path: ./dataset
train: train.txt
val: val.txt
test: test.txt

nc: 1
names: ['face']

kpt_shape: [${NUM_LANDMARKS}, 2]
keypoint_names:
${LANDMARK_NAMES.map(name => `  - ${name}`).join('\n')}
`;

  const generateFileLists = (annotations: TrainingAnnotation[], prefix: string) => {
    return annotations.map((_, idx) => `images/${prefix}_${String(idx + 1).padStart(4, '0')}.jpg`).join('\n');
  };

  const trainTxt = generateFileLists(split.train, 'train');
  const valTxt = generateFileLists(split.val, 'val');
  const testTxt = generateFileLists(split.test, 'test');

  // Generate label files (one per image)
  const labels: Record<string, string> = {};

  const generateLabels = (annotations: TrainingAnnotation[], prefix: string) => {
    annotations.forEach((ann, idx) => {
      const filename = `${prefix}_${String(idx + 1).padStart(4, '0')}.txt`;
      const lines = ann.landmarks.map((lm, i) => `${i} ${lm.x.toFixed(6)} ${lm.y.toFixed(6)}`);
      labels[filename] = lines.join('\n');
    });
  };

  generateLabels(split.train, 'train');
  generateLabels(split.val, 'val');
  generateLabels(split.test, 'test');

  return {
    'dataset.yaml': datasetYaml,
    'train.txt': trainTxt,
    'val.txt': valTxt,
    'test.txt': testTxt,
    labels,
  };
}

// ============================================================
// DATASET STATISTICS
// ============================================================

export interface DatasetStats {
  totalAnnotations: number;
  avgLandmarksPerPhoto: number;
  dateRange: {
    earliest: string;
    latest: string;
  } | null;
  annotatorBreakdown: Record<string, number>;
  modelReadiness: {
    current: number;
    recommended: number;
    status: 'ready' | 'almost' | 'needs_more';
    message: string;
  };
}

export function calculateStats(annotations: TrainingAnnotation[]): DatasetStats {
  if (annotations.length === 0) {
    return {
      totalAnnotations: 0,
      avgLandmarksPerPhoto: 0,
      dateRange: null,
      annotatorBreakdown: {},
      modelReadiness: {
        current: 0,
        recommended: 500,
        status: 'needs_more',
        message: 'No annotations yet. 500+ recommended for training.',
      },
    };
  }

  // Average landmarks
  const totalLandmarks = annotations.reduce((sum, ann) => sum + (ann.landmarks?.length || 0), 0);
  const avgLandmarks = totalLandmarks / annotations.length;

  // Date range
  const dates = annotations.map(a => new Date(a.created_at).getTime());
  const earliest = new Date(Math.min(...dates)).toISOString().split('T')[0];
  const latest = new Date(Math.max(...dates)).toISOString().split('T')[0];

  // Annotator breakdown
  const annotatorBreakdown: Record<string, number> = {};
  annotations.forEach(ann => {
    const key = ann.annotated_by || 'unknown';
    annotatorBreakdown[key] = (annotatorBreakdown[key] || 0) + 1;
  });

  // Model readiness
  const recommended = 500;
  const current = annotations.length;
  let status: 'ready' | 'almost' | 'needs_more';
  let message: string;

  if (current >= recommended) {
    status = 'ready';
    message = `Great! You have ${current} annotations, which exceeds the ${recommended} recommended.`;
  } else if (current >= recommended * 0.6) {
    status = 'almost';
    message = `You have ${current}/${recommended} annotations. Getting close!`;
  } else {
    status = 'needs_more';
    message = `You have ${current}/${recommended} annotations. Keep collecting data.`;
  }

  return {
    totalAnnotations: annotations.length,
    avgLandmarksPerPhoto: Math.round(avgLandmarks * 10) / 10,
    dateRange: { earliest, latest },
    annotatorBreakdown,
    modelReadiness: {
      current,
      recommended,
      status,
      message,
    },
  };
}
