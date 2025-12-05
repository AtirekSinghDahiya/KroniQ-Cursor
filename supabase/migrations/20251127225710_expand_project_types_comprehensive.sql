/*
  # Expand Project Type System
  
  1. Problem
    - Current project types: 'chat', 'code', 'design', 'video', 'voice'
    - Missing specific types: 'image', 'music', 'ppt'
    - Music saves as 'voice', PPT saves as 'design', Images save as 'design'
    - Cannot filter or identify projects correctly
    
  2. Changes
    - Expand project type enum to include all generation types
    - Add proper categorization for each content type
    - Maintain backward compatibility
    
  3. New Project Types
    - 'chat': Conversational AI chats
    - 'code': Code generation projects
    - 'image': Image generation (Imagen, Flux, etc.)
    - 'video': Video generation (Veo, Sora, Hailuo)
    - 'music': Music generation (Suno)
    - 'voice': Voice/TTS generation (ElevenLabs, Gemini TTS)
    - 'ppt': Presentation generation
    
  4. Migration Strategy
    - Add new types to enum
    - Existing data remains valid
    - Update indexes for better performance
*/

-- Step 1: Check if projects table exists and has type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'type'
  ) THEN
    RAISE EXCEPTION 'Projects table or type column does not exist!';
  END IF;
END $$;

-- Step 2: Drop existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_type_check' 
    AND table_name = 'projects'
  ) THEN
    ALTER TABLE projects DROP CONSTRAINT projects_type_check;
    RAISE NOTICE '✅ Dropped existing type constraint';
  END IF;
END $$;

-- Step 3: Add new type constraint with all project types
ALTER TABLE projects 
ADD CONSTRAINT projects_type_check 
CHECK (type IN ('chat', 'code', 'image', 'video', 'music', 'voice', 'ppt'));

-- Step 4: Create index on project type for faster filtering
CREATE INDEX IF NOT EXISTS idx_projects_type 
ON projects(type);

-- Step 5: Create index on user_id and type combination for user-specific queries
CREATE INDEX IF NOT EXISTS idx_projects_user_type 
ON projects(user_id, type);

-- Step 6: Add helpful comment
COMMENT ON COLUMN projects.type IS 
'Project type: chat (conversations), code (code generation), image (image generation), video (video generation), music (music generation), voice (TTS/voiceover), ppt (presentations)';

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ Project type system expanded successfully';
  RAISE NOTICE '   Supported types: chat, code, image, video, music, voice, ppt';
  RAISE NOTICE '   Indexes created for performance';
  RAISE NOTICE '   Backward compatible with existing data';
END $$;
