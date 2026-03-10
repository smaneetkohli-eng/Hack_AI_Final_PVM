  -- Tesseract Database Schema

-- User Profiles
-- metadata JSONB stores: { display_name, avatar_url, pinned_skill_ids[] }
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  field TEXT,
  current_skills JSONB DEFAULT '[]',
  experience_level TEXT,
  career_goal TEXT,
  preferred_languages JSONB DEFAULT '["en"]',
  metadata JSONB DEFAULT '{}',
  profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Skills / Folders
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scope TEXT,
  prior_knowledge TEXT,
  experience_level TEXT,
  learning_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own skills" ON skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skills" ON skills FOR DELETE USING (auth.uid() = user_id);

-- Roadmap Nodes / Modules
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  node_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  tier INTEGER,
  estimated_time TEXT,
  key_topics JSONB,
  prerequisites JSONB,
  status TEXT DEFAULT 'available',
  position_x FLOAT,
  position_y FLOAT,
  ai_explanation TEXT,
  module_order INTEGER,
  resource_counts JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own nodes" ON nodes FOR SELECT
  USING (EXISTS (SELECT 1 FROM skills WHERE skills.id = nodes.skill_id AND skills.user_id = auth.uid()));
CREATE POLICY "Users can insert own nodes" ON nodes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM skills WHERE skills.id = nodes.skill_id AND skills.user_id = auth.uid()));
CREATE POLICY "Users can update own nodes" ON nodes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM skills WHERE skills.id = nodes.skill_id AND skills.user_id = auth.uid()));
CREATE POLICY "Users can delete own nodes" ON nodes FOR DELETE
  USING (EXISTS (SELECT 1 FROM skills WHERE skills.id = nodes.skill_id AND skills.user_id = auth.uid()));

-- User Notes per Node
CREATE TABLE node_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE node_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notes" ON node_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON node_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON node_notes FOR UPDATE USING (auth.uid() = user_id);

-- Cached Resources per Node
CREATE TABLE node_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  url TEXT,
  source_name TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  description TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE node_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own resources" ON node_resources FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM nodes JOIN skills ON skills.id = nodes.skill_id
    WHERE nodes.id = node_resources.node_id AND skills.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own resources" ON node_resources FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM nodes JOIN skills ON skills.id = nodes.skill_id
    WHERE nodes.id = node_resources.node_id AND skills.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own resources" ON node_resources FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM nodes JOIN skills ON skills.id = nodes.skill_id
    WHERE nodes.id = node_resources.node_id AND skills.user_id = auth.uid()
  ));

-- Chat History
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chats" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chats" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Learning Events
CREATE TABLE learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  skill_id UUID REFERENCES skills(id),
  node_id UUID REFERENCES nodes(id),
  event_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own events" ON learning_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON learning_events FOR INSERT WITH CHECK (auth.uid() = user_id);
