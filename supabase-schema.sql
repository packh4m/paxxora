-- LooksLadder Training Annotations Schema
-- Run this in your Supabase SQL Editor to create the required table

-- Create the training_annotations table
CREATE TABLE IF NOT EXISTS training_annotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_url TEXT NOT NULL,
  landmarks JSONB NOT NULL,
  annotated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  image_width INTEGER,
  image_height INTEGER
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_training_annotations_created_at
  ON training_annotations(created_at);

CREATE INDEX IF NOT EXISTS idx_training_annotations_annotated_by
  ON training_annotations(annotated_by);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE training_annotations ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (adjust based on your needs)
CREATE POLICY "Allow all operations" ON training_annotations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Example insert (for testing)
-- INSERT INTO training_annotations (photo_url, landmarks, annotated_by, image_width, image_height)
-- VALUES (
--   'https://example.com/photo.jpg',
--   '[{"x": 0.35, "y": 0.40}, {"x": 0.42, "y": 0.40}, ...]'::jsonb,
--   'test_user',
--   800,
--   600
-- );

-- Query to view annotations
-- SELECT id, photo_url, landmarks, annotated_by, created_at
-- FROM training_annotations
-- ORDER BY created_at ASC;
