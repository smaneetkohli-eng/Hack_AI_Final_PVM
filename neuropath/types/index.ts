export interface RoadmapNode {
  id: string;
  label: string;
  description: string;
  tier: number;
  estimatedTime: string;
  prerequisites: string[];
  keyTopics: string[];
  isInUserKnowledge: boolean;
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
}

export interface Roadmap {
  skill: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

export interface ModuleData {
  id: string;
  order: number;
  label: string;
  description: string;
  estimatedTime: string;
  keyTopics: string[];
  prerequisites?: string[];
  resourceCounts: {
    lessons: number;
    exercises: number;
    projects: number;
    readings: number;
  };
}

export interface ModuleRoadmap {
  skill: string;
  modules: ModuleData[];
}

export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'complete' | 'known';

export interface DBNode {
  id: string;
  skill_id: string;
  node_key: string;
  label: string;
  description: string | null;
  tier: number | null;
  estimated_time: string | null;
  key_topics: string[] | null;
  prerequisites: string[] | null;
  status: NodeStatus;
  position_x: number | null;
  position_y: number | null;
  ai_explanation: string | null;
  module_order: number | null;
  resource_counts: {
    lessons: number;
    exercises: number;
    projects: number;
    readings: number;
  } | null;
  created_at: string;
}

export interface DBSkill {
  id: string;
  user_id: string;
  name: string;
  scope: string | null;
  prior_knowledge: string | null;
  experience_level: string | null;
  learning_preferences: {
    timePerWeek?: string;
    learningStyle?: string[];
    language?: string;
  } | null;
  created_at: string;
}

export interface DBNodeNote {
  id: string;
  node_id: string;
  user_id: string;
  content: string | null;
  updated_at: string;
}

export type ResourceType = 'video' | 'article' | 'doc' | 'lesson' | 'exercise' | 'project' | 'user_suggested';

export interface DBNodeResource {
  id: string;
  node_id: string;
  type: ResourceType;
  title: string | null;
  url: string | null;
  source_name: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  description: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface DBChatMessage {
  id: string;
  skill_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface DBLearningEvent {
  id: string;
  user_id: string;
  skill_id: string | null;
  node_id: string | null;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface DBUserProfile {
  id: string;
  user_id: string;
  field: string | null;
  current_skills: string[];
  experience_level: string | null;
  career_goal: string | null;
  preferred_languages: string[];
  metadata: Record<string, unknown>;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface SkillIntakeData {
  skillName: string;
  scope: string;
  experienceLevel: string;
  priorKnowledge: string;
  timePerWeek: string;
  learningStyle: string[];
  language: string;
}
