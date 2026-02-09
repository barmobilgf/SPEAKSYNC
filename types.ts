
export enum ProficiencyLevel {
  A1 = 'A1 (Principiante)',
  A2 = 'A2 (Básico)',
  B1 = 'B1 (Intermedio)',
  B2 = 'B2 (Intermedio Alto)',
  C1 = 'C1 (Avanzado)',
  C2 = 'C2 (Maestría)'
}

export enum LessonTone {
  SURVIVAL = 'Survival (Urgente)',
  GEZELLIG = 'Gezellig (Social)',
  PRO = 'Pro (Laboral)'
}

export enum VocabMastery {
  NEW = 'new',
  LEARNING = 'learning',
  MASTERED = 'mastered',
  CRITICAL = 'critical'
}

export enum SyncSource {
  ROADMAP = 'roadmap',
  AI_SYNC = 'ai_sync',
  NEWS = 'news',
  CIVIC = 'civic',
  ROLEPLAY = 'roleplay'
}

export interface VocabularyItem {
  id?: string;
  dutch: string;
  spanish: string;
  type: string;
  pronunciation?: string;
  mastery?: VocabMastery;
  sync_count?: number;
  last_practiced?: string;
  category?: string;
}

export interface TrainingQuestion {
  id: string;
  type: 'writing' | 'choice' | 'context';
  prompt: string;
  correctAnswer: string;
  context?: string;
  options?: string[];
  explanation?: string;
  vocabId: string;
}

export type AppMode = 'dashboard' | 'roadmap' | 'generator' | 'improver' | 'news' | 'integration' | 'roleplay' | 'vault' | 'flashsync';

export interface HistoryItem { 
  id: string; 
  topic: string; 
  level: ProficiencyLevel; 
  content: string; 
  timestamp: number; 
  source?: SyncSource;
}

export interface DailyQuest {
  id: string;
  title: string;
  target: number;
  current: number;
  xpReward: number;
  icon: string;
  completed?: boolean;
}

export interface SkillMastery {
  writing: number;
  speaking: number;
  listening: number;
  culture: number;
}

export interface Chapter { id: string; title: string; description: string; isExam?: boolean; }
export interface Module { id: string; title: string; chapters: Chapter[]; }
export interface CurriculumLevel { level: ProficiencyLevel; modules: Module[]; }
export interface QuizQuestion { question: string; options: string[]; correctAnswer: number; explanation: string; }
export interface ScriptImprovementResponse { 
  originalWithCorrections: string; 
  improvedVersion: string; 
  feedback: string; 
  detectedTopic: string;
  category: string;
}
export interface NewsItem { id: string; title: string; summary: string; url: string; source: string; category: string; }
export interface IntegrationTopic { id: string; title: string; summary: string; details: string; category: 'knm' | 'ona' | 'map' | 'legal'; }
export interface RoleplayObjective { id: string; description: string; completed: boolean; }
export interface RoleplayScenario { id: string; title: string; roles: string; summary: string; objectives: RoleplayObjective[]; initialMessage: string; icon: string; }
export interface RoleplayMessage { role: 'user' | 'model'; text: string; audio?: string; }
export interface RoleplayTurnResponse { 
  reply: string; 
  completedObjectiveIds: string[]; 
  grammar_feedback: string; 
  cultural_feedback: string; 
  vocabulary_feedback: string;
  suggestion: string; 
}
