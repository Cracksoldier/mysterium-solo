import { Category } from './card.model';

export interface LogEntry {
  round: number;
  psychicId: string;
  target: Category;
  cardsShown: string[];
  guess: string | null;
  correct: boolean | null;
}
