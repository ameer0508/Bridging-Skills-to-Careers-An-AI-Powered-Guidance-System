/** A practice question for an exam pilot (E2, E3). Written by SkillBridge, never an official question. */
export type PracticeAnswer =
  /** Single correct option. */
  | { index: number }
  /** Multiple select: the exact set; no partial credit. */
  | { indices: number[] }
  /** Numerical answer, correct within ±tolerance. */
  | { value: number; tolerance: number };

export interface PracticeQuestion {
  id: string;
  examId: string;
  sectionId: string;
  topicId: string;
  type: 'mcq' | 'msq' | 'nat';
  /** Marks for a correct answer: 1 or 2 for GATE, 2 for SSC CGL Tier-I. */
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  stem: string;
  /** Display-only code, never executed. */
  code?: string;
  options?: string[];
  answer: PracticeAnswer;
  explanation: string;
}
