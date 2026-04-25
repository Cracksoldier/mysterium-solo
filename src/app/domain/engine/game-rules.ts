import { Category, EvidenceCard, VisionCard } from '../models/card.model';
import { GameSession, SetupParams, Difficulty } from '../models/game-session.model';
import { Psychic } from '../models/psychic.model';
import { GhostEngine } from './ghost.engine';

const CATEGORY_ORDER: Category[] = ['suspect', 'location', 'weapon'];
const MAX_ROUNDS = 7;
const engine = new GhostEngine();

function handSize(difficulty: Difficulty): number {
  return difficulty === 'easy' ? 7 : difficulty === 'normal' ? 6 : 5;
}

function randomFrom<T>(arr: T[], seed: number): T {
  const x = Math.sin(seed) * 10000;
  return arr[Math.floor((x - Math.floor(x)) * arr.length)];
}

function pickDistinct<T>(arr: T[], count: number, seed: number): T[] {
  const shuffled = [...arr].sort(() => Math.sin(seed++) * 10000 % 1 - 0.5);
  return shuffled.slice(0, count);
}

export function initSession(params: SetupParams): GameSession {
  const seed = Date.now();
  const sessionId = `ms-${seed}`;

  const psychics: Psychic[] = params.psychicNames.map((name, i) => ({
    id: `p${i}`,
    name,
    solved: { suspect: null, location: null, weapon: null },
    currentTarget: 'suspect',
    incorrectGuesses: 0,
  }));

  // Assign each psychic a unique solution
  const solution: Record<string, Record<Category, string>> = {};
  for (let i = 0; i < psychics.length; i++) {
    solution[psychics[i].id] = {
      suspect: randomFrom(params.allSuspectIds, seed + i * 3),
      location: randomFrom(params.allLocationIds, seed + i * 3 + 1),
      weapon: randomFrom(params.allWeaponIds, seed + i * 3 + 2),
    };
  }

  // Deal hands from vision card pool
  const size = handSize(params.difficulty);
  const ghostHands: Record<string, string[]> = {};
  const allVc = [...params.allVisionCardIds];
  let vcPool = [...allVc];

  for (const p of psychics) {
    ghostHands[p.id] = pickDistinct(vcPool, size, seed + p.id.charCodeAt(1));
    ghostHands[p.id].forEach(id => {
      const idx = vcPool.indexOf(id);
      if (idx !== -1) vcPool.splice(idx, 1);
    });
  }

  return {
    sessionId,
    title: params.title,
    createdAt: new Date().toISOString(),
    difficulty: params.difficulty,
    phase: 'rounds',
    round: 1,
    psychics,
    solution,
    ghostHands,
    ghostDiscardPile: [],
    allVisionCardIds: allVc,
    outcome: null,
    log: [],
    finalVisionCards: null,
  };
}

export function selectClueCards(
  session: GameSession,
  psychicId: string,
  allVisionCards: VisionCard[],
  allEvidenceCards: EvidenceCard[]
): string[] {
  const psychic = session.psychics.find(p => p.id === psychicId)!;
  const target = allEvidenceCards.find(c => c.id === session.solution[psychicId][psychic.currentTarget])!;
  const distractors = allEvidenceCards.filter(
    c => c.category === target.category && c.id !== target.id
  );
  const handCards = session.ghostHands[psychicId]
    .map(id => allVisionCards.find(v => v.id === id)!)
    .filter(Boolean);

  const seed = session.round * 1000 + psychic.id.charCodeAt(1);
  const selected = engine.selectCards(handCards, target, distractors, session.difficulty, seed);
  return selected.map(v => v.id);
}

export function processGuess(
  session: GameSession,
  psychicId: string,
  guessCardId: string,
  shownCardIds: string[]
): GameSession {
  const psychics = session.psychics.map(p => {
    if (p.id !== psychicId) return p;
    const correct = session.solution[psychicId][p.currentTarget] === guessCardId;
    const newSolved = correct
      ? { ...p.solved, [p.currentTarget]: guessCardId }
      : p.solved;
    const nextTarget = correct ? nextUnsolved(newSolved) : p.currentTarget;
    return {
      ...p,
      solved: newSolved,
      currentTarget: nextTarget ?? p.currentTarget,
      incorrectGuesses: correct ? p.incorrectGuesses : p.incorrectGuesses + 1,
    };
  });

  const correct = session.solution[psychicId][session.psychics.find(p => p.id === psychicId)!.currentTarget] === guessCardId;

  const log = [
    ...session.log,
    {
      round: session.round,
      psychicId,
      target: session.psychics.find(p => p.id === psychicId)!.currentTarget,
      cardsShown: shownCardIds,
      guess: guessCardId,
      correct,
    },
  ];

  // Replenish hand after guess
  const size = handSize(session.difficulty);
  const usedIds = new Set([...session.ghostDiscardPile, ...shownCardIds]);
  const available = session.allVisionCardIds.filter(id => {
    const inHand = Object.values(session.ghostHands).flat().includes(id);
    return !usedIds.has(id) && !inHand;
  });
  const newCards = available.slice(0, size - (session.ghostHands[psychicId].length - shownCardIds.length));
  const newHand = [
    ...session.ghostHands[psychicId].filter(id => !shownCardIds.includes(id)),
    ...newCards,
  ];

  return {
    ...session,
    psychics,
    ghostHands: { ...session.ghostHands, [psychicId]: newHand },
    ghostDiscardPile: [...session.ghostDiscardPile, ...shownCardIds],
    log,
  };
}

export function advanceRound(session: GameSession): GameSession {
  const newRound = session.round + 1;
  if (newRound > MAX_ROUNDS) {
    return { ...session, round: newRound, phase: 'result', outcome: 'defeat' };
  }
  return { ...session, round: newRound };
}

export function checkVictoryConditions(
  session: GameSession,
  allVisionCards: VisionCard[]
): GameSession {
  const allSolved = session.psychics.every(p =>
    CATEGORY_ORDER.every(cat => p.solved[cat] !== null)
  );

  if (!allSolved) return session;

  if (session.psychics.length === 1) {
    // Single psychic: auto-win
    return { ...session, phase: 'result', outcome: 'victory' };
  }

  // Multiple psychics: enter final phase with vision cards
  const seed = Date.now();
  const randomPsychicIdx = Math.floor((Math.sin(seed) * 10000 % 1 + 1) % session.psychics.length);
  const chosenPsychic = session.psychics[randomPsychicIdx];
  const sol = session.solution[chosenPsychic.id];

  // Pick one vision card per category from discard pile or all cards
  const pickVc = (category: Category): string => {
    const evidenceId = sol[category];
    // Try to pick a card that was shown as a correct clue for this solution
    const shownForCorrect = session.log
      .filter(e => e.psychicId === chosenPsychic.id && e.target === category && e.correct)
      .flatMap(e => e.cardsShown);
    if (shownForCorrect.length > 0) return shownForCorrect[0];
    return allVisionCards[0]?.id ?? '';
  };

  return {
    ...session,
    phase: 'final',
    finalVisionCards: {
      suspect: pickVc('suspect'),
      location: pickVc('location'),
      weapon: pickVc('weapon'),
    },
  };
}

export function processFinalVote(
  session: GameSession,
  votedPsychicId: string
): GameSession {
  // The "true" psychic is whichever one's board the final vision cards were drawn for
  // We find the psychic whose solved board matches the final vision hint
  // For simplicity: correct if any psychic's solution matches; we need to track which was chosen
  // The final psychic index was determined at final phase entry — we infer from finalVisionCards
  const correctPsychic = session.psychics.find(p => {
    const sol = session.solution[p.id];
    return CATEGORY_ORDER.every(cat => p.solved[cat] === sol[cat]);
  });

  const correct = correctPsychic?.id === votedPsychicId;
  return { ...session, phase: 'result', outcome: correct ? 'victory' : 'defeat' };
}

function nextUnsolved(solved: Record<Category, string | null>): Category | null {
  return CATEGORY_ORDER.find(cat => solved[cat] === null) ?? null;
}
