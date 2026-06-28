import { TrainingAnnotation, LandmarkData, NUM_LANDMARKS } from './supabase';

// Generate realistic demo landmarks for testing
function generateDemoLandmarks(): LandmarkData[] {
  const landmarks: LandmarkData[] = [];

  // Base positions for a centered face (normalized 0-1)
  const basePositions = [
    // Eyes (8 points)
    { x: 0.35, y: 0.40 },  // 0: left outer eye
    { x: 0.42, y: 0.40 },  // 1: left inner eye
    { x: 0.385, y: 0.38 }, // 2: left eye top
    { x: 0.385, y: 0.42 }, // 3: left eye bottom
    { x: 0.65, y: 0.40 },  // 4: right outer eye
    { x: 0.58, y: 0.40 },  // 5: right inner eye
    { x: 0.615, y: 0.38 }, // 6: right eye top
    { x: 0.615, y: 0.42 }, // 7: right eye bottom

    // Brows (4 points)
    { x: 0.40, y: 0.34 },  // 8: left brow inner
    { x: 0.30, y: 0.35 },  // 9: left brow outer
    { x: 0.60, y: 0.34 },  // 10: right brow inner
    { x: 0.70, y: 0.35 },  // 11: right brow outer

    // Nose (4 points)
    { x: 0.50, y: 0.38 },  // 12: nose bridge top
    { x: 0.50, y: 0.55 },  // 13: nose tip
    { x: 0.44, y: 0.54 },  // 14: left alar
    { x: 0.56, y: 0.54 },  // 15: right alar

    // Mouth (4 points)
    { x: 0.40, y: 0.65 },  // 16: left mouth corner
    { x: 0.60, y: 0.65 },  // 17: right mouth corner
    { x: 0.50, y: 0.62 },  // 18: upper lip top
    { x: 0.50, y: 0.70 },  // 19: lower lip bottom

    // Jaw (3 points)
    { x: 0.28, y: 0.65 },  // 20: left jaw corner
    { x: 0.72, y: 0.65 },  // 21: right jaw corner
    { x: 0.50, y: 0.85 },  // 22: chin centre

    // Cheekbones and temples (4 points)
    { x: 0.30, y: 0.48 },  // 23: left cheekbone
    { x: 0.70, y: 0.48 },  // 24: right cheekbone
    { x: 0.25, y: 0.35 },  // 25: left temple
    { x: 0.75, y: 0.35 },  // 26: right temple

    // Ears (2 points)
    { x: 0.18, y: 0.42 },  // 27: left ear outer
    { x: 0.82, y: 0.42 },  // 28: right ear outer

    // Additional (3 points)
    { x: 0.50, y: 0.34 },  // 29: glabella
    { x: 0.50, y: 0.58 },  // 30: subnasale
    { x: 0.30, y: 0.80 },  // 31: left neck edge
    { x: 0.70, y: 0.80 },  // 32: right neck edge
  ];

  // Add slight random variation to make it realistic
  for (const pos of basePositions) {
    landmarks.push({
      x: pos.x + (Math.random() - 0.5) * 0.02,
      y: pos.y + (Math.random() - 0.5) * 0.02,
    });
  }

  return landmarks;
}

// Generate demo annotations
export function generateDemoAnnotations(count: number = 25): TrainingAnnotation[] {
  const annotations: TrainingAnnotation[] = [];
  const annotators = ['demo_user_1', 'demo_user_2', 'demo_user_3'];

  const startDate = new Date('2024-01-01');

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor(i * 3));

    annotations.push({
      id: `demo_${i + 1}`,
      photo_url: `https://picsum.photos/seed/face${i + 1}/800/600`,
      landmarks: generateDemoLandmarks(),
      annotated_by: annotators[i % annotators.length],
      created_at: date.toISOString(),
      image_width: 800,
      image_height: 600,
    });
  }

  return annotations;
}

// Generate some with quality issues for testing
export function generateDemoAnnotationsWithIssues(): TrainingAnnotation[] {
  const goodAnnotations = generateDemoAnnotations(20);

  // Add some problematic annotations
  const badAnnotations: TrainingAnnotation[] = [
    {
      id: 'demo_bad_1',
      photo_url: 'https://picsum.photos/seed/bad1/800/600',
      landmarks: generateDemoLandmarks().slice(0, 20), // Missing landmarks
      annotated_by: 'demo_user_1',
      created_at: new Date().toISOString(),
      image_width: 800,
      image_height: 600,
    },
    {
      id: 'demo_bad_2',
      photo_url: 'https://picsum.photos/seed/bad2/800/600',
      landmarks: [
        { x: 0.65, y: 0.40 },  // Left eye outer - wrong side!
        { x: 0.35, y: 0.40 },  // Left eye inner - wrong side!
        ...generateDemoLandmarks().slice(2),
      ],
      annotated_by: 'demo_user_2',
      created_at: new Date().toISOString(),
      image_width: 800,
      image_height: 600,
    },
    {
      id: 'demo_bad_3',
      photo_url: 'https://picsum.photos/seed/bad3/800/600',
      landmarks: generateDemoLandmarks().map((lm, i) =>
        i === 5 ? { x: 1.5, y: 0.4 } : lm // Out of bounds
      ),
      annotated_by: 'demo_user_3',
      created_at: new Date().toISOString(),
      image_width: 800,
      image_height: 600,
    },
  ];

  return [...goodAnnotations, ...badAnnotations];
}
