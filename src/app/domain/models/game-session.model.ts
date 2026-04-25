import { Category } from './card.model';
import { Psychic } from './psychic.model';
import { LogEntry } from './log-entry.model';

export type GamePhase = 'setup' | 'rounds' | 'final' | 'result';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type Outcome = 'victory' | 'defeat' | null;

export interface SetupParams {
  title: string;
  difficulty: Difficulty;
  psychicNames: string[];
  allSuspectIds: string[];
  allLocationIds: string[];
  allWeaponIds: string[];
  allVisionCardIds: string[];
}

export interface GameSession {
  sessionId: string;
  title: string;
  createdAt: string;
  difficulty: Difficulty;
  phase: GamePhase;
  round: number;
  psychics: Psychic[];
  solution: Record<string, Record<Category, string>>;
  ghostHands: Record<string, string[]>;
  ghostDiscardPile: string[];
  allVisionCardIds: string[];
  outcome: Outcome;
  log: LogEntry[];
  finalVisionCards: Record<Category, string> | null;
}
