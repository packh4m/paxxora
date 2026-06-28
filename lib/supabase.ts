import { createBrowserClient } from '@supabase/ssr';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Lazy singleton for client-side only
let _supabase: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!_supabase && supabaseUrl && supabaseAnonKey) {
    _supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// For backwards compatibility - deprecated, use getSupabase() instead
// This export exists only for type compatibility
export const supabase = null as ReturnType<typeof getSupabase>;

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey;
}

// Types for training annotations
export interface TrainingAnnotation {
  id: string;
  photo_url: string;
  landmarks: LandmarkData[];
  annotated_by: string;
  created_at: string;
  image_width?: number;
  image_height?: number;
}

export interface LandmarkData {
  x: number;  // Normalized 0-1
  y: number;  // Normalized 0-1
}

// Landmark names in order (34 points matching annotation tool)
// These match LANDMARK_POINTS in FaceReferenceImage.tsx
export const LANDMARK_NAMES = [
  "left_outer_eye_corner",     // 0
  "left_inner_eye_corner",     // 1
  "left_eye_top",              // 2
  "left_eye_bottom",           // 3
  "right_outer_eye_corner",    // 4
  "right_inner_eye_corner",    // 5
  "right_eye_top",             // 6
  "right_eye_bottom",          // 7
  "left_brow_inner",           // 8
  "left_brow_outer",           // 9
  "right_brow_inner",          // 10
  "right_brow_outer",          // 11
  "nose_bridge_top",           // 12 (sellion)
  "nose_tip",                  // 13 (pronasale)
  "left_alar",                 // 14
  "right_alar",                // 15
  "subnasale",                 // 16
  "left_mouth_corner",         // 17
  "right_mouth_corner",        // 18
  "upper_lip_top",             // 19
  "upper_lip_bottom",          // 20
  "lower_lip_bottom",          // 21
  "chin_centre",               // 22 (menton)
  "left_jaw_corner",           // 23 (gonion)
  "right_jaw_corner",          // 24 (gonion)
  "left_cheekbone",            // 25
  "right_cheekbone",           // 26
  "left_temple",               // 27
  "right_temple",              // 28
  "glabella",                  // 29
  "left_ear_top",              // 30
  "left_ear_bottom",           // 31
  "right_ear_top",             // 32
  "right_ear_bottom",          // 33
  "left_neck_edge",            // 34
  "right_neck_edge",           // 35
] as const;

export const NUM_LANDMARKS = LANDMARK_NAMES.length;

// Fetch all training annotations
export async function fetchTrainingAnnotations(): Promise<TrainingAnnotation[]> {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }

  const { data, error } = await client
    .from('training_annotations')
    .select('id, photo_url, landmarks, annotated_by, created_at, image_width, image_height')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching annotations:', error);
    throw error;
  }

  return data || [];
}
