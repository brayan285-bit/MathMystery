export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  password?: string; // In a real app, never store plain password on frontend
  lives?: number;
  score?: number;
  level?: number; // 1-5 difficulty
}

export enum MathTopic {
  ALGEBRA = 'Álgebra',
  GEOMETRY = 'Geometría',
  CALCULUS = 'Cálculo',
  STATISTICS = 'Estadística',
  TRIGONOMETRY = 'Trigonometría'
}

export interface Question {
  id: string;
  topic: MathTopic;
  difficulty: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GameState {
  lives: number;
  score: number;
  currentLevel: number; // Difficulty 1-5
  correctStreak: number;
  topic: MathTopic | null;
  isPlaying: boolean;
}

// --- AI Features Types ---

export interface SearchResult {
  text: string;
  sources: { uri: string; title: string }[];
}