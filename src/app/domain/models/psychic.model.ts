import { Category } from './card.model';

export interface Psychic {
  id: string;
  name: string;
  solved: Record<Category, string | null>;
  currentTarget: Category;
  incorrectGuesses: number;
}
