import { scoreCard } from './tag-matcher';
import { EvidenceCard, VisionCard } from '../models/card.model';

function makeVision(tags: string[]): VisionCard {
  return { id: 'v1', title: 'Vision', scene: 'A scene', tags };
}

function makeSuspect(id: string, tags: string[]): EvidenceCard {
  return { id, category: 'suspect', name: id, description: '', tags };
}

describe('scoreCard', () => {
  it('returns 0 when vision has no tags', () => {
    const vision = makeVision([]);
    const target = makeSuspect('t', ['dark', 'tall']);
    expect(scoreCard(vision, target, [])).toBe(0);
  });

  it('returns 0 when no tags overlap with target or distractors', () => {
    const vision = makeVision(['forest']);
    const target = makeSuspect('t', ['dark', 'tall']);
    expect(scoreCard(vision, target, [])).toBe(0);
  });

  it('adds +2 for each vision tag that matches the target', () => {
    const vision = makeVision(['dark', 'tall']);
    const target = makeSuspect('t', ['dark', 'tall', 'beard']);
    expect(scoreCard(vision, target, [])).toBe(4);
  });

  it('adds +2 only once per matching tag, not per target tag', () => {
    const vision = makeVision(['dark']);
    const target = makeSuspect('t', ['dark', 'dark']); // duplicate in target — still matches once
    // tags.includes() on target.tags checks existence, so 'dark' found → +2
    expect(scoreCard(vision, target, [])).toBe(2);
  });

  it('subtracts -1 for each vision tag that matches a distractor', () => {
    const vision = makeVision(['dark']);
    const target = makeSuspect('t', ['tall']);
    const distractor = makeSuspect('d', ['dark']);
    expect(scoreCard(vision, target, [distractor])).toBe(-1);
  });

  it('subtracts -1 per distractor that shares the tag (not once total)', () => {
    const vision = makeVision(['dark']);
    const target = makeSuspect('t', ['tall']);
    const d1 = makeSuspect('d1', ['dark']);
    const d2 = makeSuspect('d2', ['dark']);
    expect(scoreCard(vision, target, [d1, d2])).toBe(-2);
  });

  it('combines positive target match and negative distractor penalty', () => {
    const vision = makeVision(['dark', 'forest']);
    const target = makeSuspect('t', ['dark']);
    const distractor = makeSuspect('d', ['forest']);
    // 'dark' +2 (target match), 'forest' -1 (distractor match)
    expect(scoreCard(vision, target, [distractor])).toBe(1);
  });

  it('a tag matching both target and a distractor scores +2 -1 = +1', () => {
    const vision = makeVision(['dark']);
    const target = makeSuspect('t', ['dark']);
    const distractor = makeSuspect('d', ['dark']);
    expect(scoreCard(vision, target, [distractor])).toBe(1);
  });

  it('can produce a negative total score', () => {
    const vision = makeVision(['forest', 'moon']);
    const target = makeSuspect('t', ['dark']);
    const d1 = makeSuspect('d1', ['forest']);
    const d2 = makeSuspect('d2', ['moon', 'forest']);
    // 'forest': -1 (d1) -1 (d2) = -2; 'moon': -1 (d2) = -1 → total -3
    expect(scoreCard(vision, target, [d1, d2])).toBe(-3);
  });
});
