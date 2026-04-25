import { EvidenceCard, VisionCard } from '../models/card.model';
import { Difficulty } from '../models/game-session.model';
import { scoreCard } from './tag-matcher';

export class GhostEngine {
  selectCards(
    hand: VisionCard[],
    target: EvidenceCard,
    distractors: EvidenceCard[],
    difficulty: Difficulty,
    seed: number
  ): VisionCard[] {
    const count = cardCount(difficulty);
    const scored = hand
      .map(v => ({ card: v, score: scoreCard(v, target, distractors) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return seededRandom(seed + a.card.id.charCodeAt(0)) - seededRandom(seed + b.card.id.charCodeAt(0));
      });

    if (difficulty === 'hard') {
      // Imperfect: pick best, then fill rest randomly
      const best = scored[0];
      const rest = shuffleSeeded(scored.slice(1).map(s => s.card), seed);
      return [best.card, ...rest].slice(0, count);
    }

    return scored.slice(0, count).map(s => s.card);
  }
}

function cardCount(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy': return 3;
    case 'normal': return 2;
    case 'hard': return 1;
  }
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function shuffleSeeded<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
