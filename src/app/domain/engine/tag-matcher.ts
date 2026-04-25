import { EvidenceCard, VisionCard } from '../models/card.model';

export function scoreCard(
  vision: VisionCard,
  target: EvidenceCard,
  distractors: EvidenceCard[]
): number {
  let score = 0;
  for (const tag of vision.tags) {
    if (target.tags.includes(tag)) score += 2;
    for (const d of distractors) {
      if (d.tags.includes(tag)) score -= 1;
    }
  }
  return score;
}
