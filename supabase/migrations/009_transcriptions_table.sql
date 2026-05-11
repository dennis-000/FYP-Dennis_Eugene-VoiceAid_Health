-- Create transcriptions table
CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  patient_id UUID REFERENCES patients(id) NULL,
  
  -- Transcription Content
  text TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  
  -- Metadata
  confidence_score FLOAT,
  model_used VARCHAR(100),
  is_live_mode BOOLEAN DEFAULT true,
  
  -- Audio (Future proofing)
  audio_url TEXT,
  duration_seconds INT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own transcriptions"
  ON transcriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own transcriptions"
  ON transcriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transcriptions"
  ON transcriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_transcriptions_user_created ON transcriptions(user_id, created_at DESC);
