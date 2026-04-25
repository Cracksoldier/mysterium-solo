import { GhostEngine } from './ghost.engine';
import { EvidenceCard, VisionCard } from '../models/card.model';

const engine = new GhostEngine();
const SEED = 12345;

function makeVision(id: string, tags: string[]): VisionCard {
  return { id, title: id, scene: '', tags };
}

function makeSuspect(id: string, tags: string[]): EvidenceCard {
  return { id, category: 'suspect', name: id, description: '', tags };
}

const target = makeSuspect('target', ['moonlight', 'fog', 'cold']);
const distractors = [
  makeSuspect('d1', ['fire', 'warm']),
  makeSuspect('d2', ['desert', 'sand']),
  makeSuspect('d3', ['loud', 'crowd']),
  makeSuspect('d4', ['garden', 'quiet']),
  makeSuspect('d5', ['ocean', 'waves']),
];

// Best card: shares 3 tags with target, 0 with distractors → score 6
const best = makeVision('best', ['moonlight', 'fog', 'cold']);
// Good card: shares 2 tags → score 4
const good = makeVision('good', ['moonlight', 'fog', 'heat']);
// Neutral card: shares 1 tag → score 2
const neutral = makeVision('neutral', ['cold', 'warmth', 'bread']);
// Penalty card: no target match, distractor match → negative
const worst = makeVision('worst', ['fire', 'warm', 'desert']);

const hand = [neutral, worst, best, good];

describe('GhostEngine.selectCards', () => {
  describe('card count by difficulty', () => {
    it('returns 3 cards on easy', () => {
      const result = engine.selectCards(hand, target, distractors, 'easy', SEED);
      expect(result).toHaveLength(3);
    });

    it('returns 2 cards on normal', () => {
      const result = engine.selectCards(hand, target, distractors, 'normal', SEED);
      expect(result).toHaveLength(2);
    });

    it('returns 1 card on hard', () => {
      const result = engine.selectCards(hand, target, distractors, 'hard', SEED);
      expect(result).toHaveLength(1);
    });
  });

  describe('card selection quality', () => {
    it('selects the highest-scoring card first on easy', () => {
      const result = engine.selectCards(hand, target, distractors, 'easy', SEED);
      expect(result[0].id).toBe('best');
    });

    it('selects the highest-scoring card first on normal', () => {
      const result = engine.selectCards(hand, target, distractors, 'normal', SEED);
      expect(result[0].id).toBe('best');
    });

    it('always includes the best card on hard', () => {
      const result = engine.selectCards(hand, target, distractors, 'hard', SEED);
      expect(result[0].id).toBe('best');
    });

    it('never includes the worst-scoring card in the top 2 on normal when clearly better cards exist', () => {
      const result = engine.selectCards(hand, target, distractors, 'normal', SEED);
      const ids = result.map(c => c.id);
      expect(ids).not.toContain('worst');
    });

    it('all selected cards come from the hand', () => {
      const result = engine.selectCards(hand, target, distractors, 'easy', SEED);
      const handIds = new Set(hand.map(c => c.id));
      result.forEach(c => expect(handIds.has(c.id)).toBe(true));
    });
  });

  describe('determinism', () => {
    it('returns the same cards for the same seed', () => {
      const r1 = engine.selectCards(hand, target, distractors, 'easy', SEED);
      const r2 = engine.selectCards(hand, target, distractors, 'easy', SEED);
      expect(r1.map(c => c.id)).toEqual(r2.map(c => c.id));
    });

    it('may return different cards for a different seed', () => {
      const r1 = engine.selectCards(hand, target, distractors, 'easy', 1);
      const r2 = engine.selectCards(hand, target, distractors, 'easy', 999999);
      // Both must still start with the best card; only tie-breaking differs
      expect(r1[0].id).toBe('best');
      expect(r2[0].id).toBe('best');
    });
  });

  describe('edge cases', () => {
    it('returns all cards when hand is smaller than the difficulty count', () => {
      const tinyHand = [best];
      const result = engine.selectCards(tinyHand, target, distractors, 'easy', SEED);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('best');
    });

    it('returns empty array for empty hand', () => {
      const result = engine.selectCards([], target, distractors, 'easy', SEED);
      expect(result).toHaveLength(0);
    });

    it('handles a hand of all equally-tagged cards without throwing', () => {
      const sameTagHand = [
        makeVision('v1', ['fog']),
        makeVision('v2', ['fog']),
        makeVision('v3', ['fog']),
      ];
      expect(() =>
        engine.selectCards(sameTagHand, target, distractors, 'easy', SEED)
      ).not.toThrow();
    });
  });
});
