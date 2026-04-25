import {
  initSession,
  selectClueCards,
  processGuess,
  advanceRound,
  checkVictoryConditions,
  processFinalVote,
} from './game-rules';
import { GameSession, SetupParams } from '../models/game-session.model';
import { Category, EvidenceCard, VisionCard } from '../models/card.model';
import { Psychic } from '../models/psychic.model';

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makeSuspect(i: number): EvidenceCard {
  return { id: `s${i}`, category: 'suspect', name: `Suspect ${i}`, description: '', tags: [`stag${i}`, 'suspect-common'] };
}

function makeLocation(i: number): EvidenceCard {
  return { id: `l${i}`, category: 'location', name: `Location ${i}`, description: '', tags: [`ltag${i}`, 'location-common'] };
}

function makeWeapon(i: number): EvidenceCard {
  return { id: `w${i}`, category: 'weapon', name: `Weapon ${i}`, description: '', tags: [`wtag${i}`, 'weapon-common'] };
}

function makeVisionCard(i: number): VisionCard {
  return { id: `v${i}`, title: `Vision ${i}`, scene: '', tags: [`vtag${i}`] };
}

const suspects = Array.from({ length: 6 }, (_, i) => makeSuspect(i));
const locations = Array.from({ length: 6 }, (_, i) => makeLocation(i));
const weapons = Array.from({ length: 6 }, (_, i) => makeWeapon(i));
const visionCards = Array.from({ length: 40 }, (_, i) => makeVisionCard(i));
const allEvidenceCards = [...suspects, ...locations, ...weapons];

function makeParams(psychicNames: string[], difficulty: SetupParams['difficulty'] = 'easy'): SetupParams {
  return {
    title: 'Test Session',
    difficulty,
    psychicNames,
    allSuspectIds: suspects.map(c => c.id),
    allLocationIds: locations.map(c => c.id),
    allWeaponIds: weapons.map(c => c.id),
    allVisionCardIds: visionCards.map(c => c.id),
  };
}

function fullyResolvedPsychic(p: Psychic, sol: Record<Category, string>): Psychic {
  return {
    ...p,
    solved: { suspect: sol['suspect'], location: sol['location'], weapon: sol['weapon'] },
    currentTarget: 'weapon',
  };
}

// ---------------------------------------------------------------------------
// initSession
// ---------------------------------------------------------------------------

describe('initSession', () => {
  it('creates the correct number of psychics', () => {
    const session = initSession(makeParams(['Alice', 'Bob']));
    expect(session.psychics).toHaveLength(2);
  });

  it('assigns sequential ids starting at p0', () => {
    const session = initSession(makeParams(['Alice', 'Bob', 'Carol']));
    expect(session.psychics.map(p => p.id)).toEqual(['p0', 'p1', 'p2']);
  });

  it('all psychics start targeting suspect with nothing solved', () => {
    const session = initSession(makeParams(['Alice', 'Bob']));
    for (const p of session.psychics) {
      expect(p.currentTarget).toBe('suspect');
      expect(p.solved).toEqual({ suspect: null, location: null, weapon: null });
      expect(p.incorrectGuesses).toBe(0);
    }
  });

  it('starts in rounds phase at round 1', () => {
    const session = initSession(makeParams(['Alice']));
    expect(session.phase).toBe('rounds');
    expect(session.round).toBe(1);
  });

  it('outcome is null at start', () => {
    const session = initSession(makeParams(['Alice']));
    expect(session.outcome).toBeNull();
  });

  it('log and discard pile are empty at start', () => {
    const session = initSession(makeParams(['Alice']));
    expect(session.log).toHaveLength(0);
    expect(session.ghostDiscardPile).toHaveLength(0);
  });

  it('finalVisionCards is null at start', () => {
    const session = initSession(makeParams(['Alice']));
    expect(session.finalVisionCards).toBeNull();
  });

  describe('hand sizes', () => {
    it('deals 7 cards per psychic on easy', () => {
      const session = initSession(makeParams(['Alice'], 'easy'));
      expect(session.ghostHands['p0']).toHaveLength(7);
    });

    it('deals 6 cards per psychic on normal', () => {
      const session = initSession(makeParams(['Alice'], 'normal'));
      expect(session.ghostHands['p0']).toHaveLength(6);
    });

    it('deals 5 cards per psychic on hard', () => {
      const session = initSession(makeParams(['Alice'], 'hard'));
      expect(session.ghostHands['p0']).toHaveLength(5);
    });
  });

  it('hands do not overlap between psychics', () => {
    const session = initSession(makeParams(['Alice', 'Bob', 'Carol']));
    const handP0 = new Set(session.ghostHands['p0']);
    const handP1 = new Set(session.ghostHands['p1']);
    const handP2 = new Set(session.ghostHands['p2']);
    for (const id of handP1) expect(handP0.has(id)).toBe(false);
    for (const id of handP2) {
      expect(handP0.has(id)).toBe(false);
      expect(handP1.has(id)).toBe(false);
    }
  });

  it('solution keys map to valid card ids', () => {
    const session = initSession(makeParams(['Alice']));
    const sol = session.solution['p0'];
    const suspectIds = new Set(suspects.map(c => c.id));
    const locationIds = new Set(locations.map(c => c.id));
    const weaponIds = new Set(weapons.map(c => c.id));
    expect(suspectIds.has(sol['suspect'])).toBe(true);
    expect(locationIds.has(sol['location'])).toBe(true);
    expect(weaponIds.has(sol['weapon'])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// selectClueCards
// ---------------------------------------------------------------------------

describe('selectClueCards', () => {
  it('returns ids that are all in the psychic hand', () => {
    const session = initSession(makeParams(['Alice'], 'easy'));
    const selected = selectClueCards(session, 'p0', visionCards, allEvidenceCards);
    const handSet = new Set(session.ghostHands['p0']);
    for (const id of selected) expect(handSet.has(id)).toBe(true);
  });

  it('returns 3 ids on easy', () => {
    const session = initSession(makeParams(['Alice'], 'easy'));
    const selected = selectClueCards(session, 'p0', visionCards, allEvidenceCards);
    expect(selected).toHaveLength(3);
  });

  it('returns 2 ids on normal', () => {
    const session = initSession(makeParams(['Alice'], 'normal'));
    const selected = selectClueCards(session, 'p0', visionCards, allEvidenceCards);
    expect(selected).toHaveLength(2);
  });

  it('returns 1 id on hard', () => {
    const session = initSession(makeParams(['Alice'], 'hard'));
    const selected = selectClueCards(session, 'p0', visionCards, allEvidenceCards);
    expect(selected).toHaveLength(1);
  });

  it('returns no duplicate ids', () => {
    const session = initSession(makeParams(['Alice'], 'easy'));
    const selected = selectClueCards(session, 'p0', visionCards, allEvidenceCards);
    expect(new Set(selected).size).toBe(selected.length);
  });
});

// ---------------------------------------------------------------------------
// processGuess — correct guesses
// ---------------------------------------------------------------------------

describe('processGuess (correct)', () => {
  let session: GameSession;
  let psyId: string;
  let sol: Record<Category, string>;

  beforeEach(() => {
    session = initSession(makeParams(['Alice'], 'easy'));
    psyId = 'p0';
    sol = session.solution[psyId];
  });

  it('marks the suspect as solved after a correct guess', () => {
    const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['suspect'], shown);
    expect(session.psychics[0].solved['suspect']).toBe(sol['suspect']);
  });

  it('advances currentTarget from suspect to location after correct suspect guess', () => {
    const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['suspect'], shown);
    expect(session.psychics[0].currentTarget).toBe('location');
  });

  it('advances currentTarget from location to weapon', () => {
    const shown1 = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['suspect'], shown1);
    const shown2 = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['location'], shown2);
    expect(session.psychics[0].currentTarget).toBe('weapon');
  });

  it('keeps currentTarget as weapon after the final correct guess', () => {
    const shown1 = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['suspect'], shown1);
    const shown2 = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['location'], shown2);
    const shown3 = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['weapon'], shown3);
    expect(session.psychics[0].currentTarget).toBe('weapon');
  });

  it('does not increment incorrectGuesses on a correct guess', () => {
    const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['suspect'], shown);
    expect(session.psychics[0].incorrectGuesses).toBe(0);
  });

  it('appends a log entry with correct: true', () => {
    const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['suspect'], shown);
    const entry = session.log[0];
    expect(entry.correct).toBe(true);
    expect(entry.psychicId).toBe(psyId);
    expect(entry.target).toBe('suspect');
    expect(entry.guess).toBe(sol['suspect']);
    expect(entry.cardsShown).toEqual(shown);
  });

  it('moves shown cards to the discard pile', () => {
    const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['suspect'], shown);
    for (const id of shown) {
      expect(session.ghostDiscardPile).toContain(id);
    }
  });

  it('shown cards are removed from the hand after the guess', () => {
    const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['suspect'], shown);
    for (const id of shown) {
      expect(session.ghostHands[psyId]).not.toContain(id);
    }
  });

  it('replenishes the hand to its original size', () => {
    const originalSize = session.ghostHands[psyId].length;
    const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['suspect'], shown);
    expect(session.ghostHands[psyId]).toHaveLength(originalSize);
  });
});

// ---------------------------------------------------------------------------
// processGuess — wrong guesses
// ---------------------------------------------------------------------------

describe('processGuess (wrong)', () => {
  let session: GameSession;
  let psyId: string;
  let sol: Record<Category, string>;

  beforeEach(() => {
    session = initSession(makeParams(['Alice'], 'easy'));
    psyId = 'p0';
    sol = session.solution[psyId];
  });

  function wrongSuspectId(): string {
    return suspects.find(c => c.id !== sol['suspect'])!.id;
  }

  it('does not mark the suspect as solved', () => {
    const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, wrongSuspectId(), shown);
    expect(session.psychics[0].solved['suspect']).toBeNull();
  });

  it('keeps currentTarget unchanged after a wrong guess', () => {
    const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, wrongSuspectId(), shown);
    expect(session.psychics[0].currentTarget).toBe('suspect');
  });

  it('increments incorrectGuesses by 1', () => {
    const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, wrongSuspectId(), shown);
    expect(session.psychics[0].incorrectGuesses).toBe(1);
  });

  it('accumulates incorrectGuesses across multiple wrong guesses', () => {
    for (let i = 0; i < 3; i++) {
      const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
      session = processGuess(session, psyId, wrongSuspectId(), shown);
    }
    expect(session.psychics[0].incorrectGuesses).toBe(3);
  });

  it('appends a log entry with correct: false', () => {
    const wrong = wrongSuspectId();
    const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, wrong, shown);
    const entry = session.log[0];
    expect(entry.correct).toBe(false);
    expect(entry.guess).toBe(wrong);
    expect(entry.target).toBe('suspect');
  });

  it('replenishes the hand after a wrong guess', () => {
    const originalSize = session.ghostHands[psyId].length;
    const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, wrongSuspectId(), shown);
    expect(session.ghostHands[psyId]).toHaveLength(originalSize);
  });
});

// ---------------------------------------------------------------------------
// advanceRound
// ---------------------------------------------------------------------------

describe('advanceRound', () => {
  function sessionAtRound(round: number): GameSession {
    return { ...initSession(makeParams(['Alice'])), round };
  }

  it('increments round by 1', () => {
    const s = advanceRound(sessionAtRound(1));
    expect(s.round).toBe(2);
  });

  it('round 6 → 7 does not trigger defeat', () => {
    const s = advanceRound(sessionAtRound(6));
    expect(s.round).toBe(7);
    expect(s.phase).toBe('rounds');
    expect(s.outcome).toBeNull();
  });

  it('round 7 → 8 triggers defeat', () => {
    const s = advanceRound(sessionAtRound(7));
    expect(s.round).toBe(8);
    expect(s.phase).toBe('result');
    expect(s.outcome).toBe('defeat');
  });

  it('does not mutate the original session', () => {
    const original = sessionAtRound(3);
    advanceRound(original);
    expect(original.round).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// checkVictoryConditions
// ---------------------------------------------------------------------------

describe('checkVictoryConditions', () => {
  it('returns the session unchanged when psychics are not fully solved', () => {
    const session = initSession(makeParams(['Alice']));
    const result = checkVictoryConditions(session, visionCards);
    expect(result.phase).toBe('rounds');
    expect(result.outcome).toBeNull();
  });

  it('sets victory for a single fully-solved psychic', () => {
    let session = initSession(makeParams(['Alice']));
    const sol = session.solution['p0'];
    session = {
      ...session,
      psychics: [fullyResolvedPsychic(session.psychics[0], sol)],
    };
    const result = checkVictoryConditions(session, visionCards);
    expect(result.phase).toBe('result');
    expect(result.outcome).toBe('victory');
  });

  it('enters final phase for two fully-solved psychics', () => {
    let session = initSession(makeParams(['Alice', 'Bob']));
    session = {
      ...session,
      psychics: session.psychics.map(p =>
        fullyResolvedPsychic(p, session.solution[p.id])
      ),
    };
    const result = checkVictoryConditions(session, visionCards);
    expect(result.phase).toBe('final');
    expect(result.outcome).toBeNull();
  });

  it('populates finalVisionCards when entering final phase', () => {
    let session = initSession(makeParams(['Alice', 'Bob']));
    session = {
      ...session,
      psychics: session.psychics.map(p =>
        fullyResolvedPsychic(p, session.solution[p.id])
      ),
    };
    const result = checkVictoryConditions(session, visionCards);
    expect(result.finalVisionCards).not.toBeNull();
    expect(result.finalVisionCards!['suspect']).toBeTruthy();
    expect(result.finalVisionCards!['location']).toBeTruthy();
    expect(result.finalVisionCards!['weapon']).toBeTruthy();
  });

  it('returns unchanged session when only one of two psychics is solved', () => {
    let session = initSession(makeParams(['Alice', 'Bob']));
    session = {
      ...session,
      psychics: [
        fullyResolvedPsychic(session.psychics[0], session.solution['p0']),
        session.psychics[1], // unsolved
      ],
    };
    const result = checkVictoryConditions(session, visionCards);
    expect(result.phase).toBe('rounds');
  });
});

// ---------------------------------------------------------------------------
// processFinalVote
// ---------------------------------------------------------------------------

describe('processFinalVote', () => {
  function twoPlayerFinalSession(): GameSession {
    let session = initSession(makeParams(['Alice', 'Bob']));
    session = {
      ...session,
      phase: 'final',
      psychics: session.psychics.map(p =>
        fullyResolvedPsychic(p, session.solution[p.id])
      ),
    };
    return session;
  }

  it('always sets phase to result', () => {
    const session = twoPlayerFinalSession();
    const r1 = processFinalVote(session, 'p0');
    const r2 = processFinalVote(session, 'p1');
    expect(r1.phase).toBe('result');
    expect(r2.phase).toBe('result');
  });

  it('returns victory when the voted psychic solved their board', () => {
    const session = twoPlayerFinalSession();
    // Both psychics solved their board; the first matching solved psychic is "correct"
    const result = processFinalVote(session, 'p0');
    expect(result.outcome).toBe('victory');
  });

  it('returns defeat when the voted psychic is not the correct one', () => {
    const session = twoPlayerFinalSession();
    // Vote for a non-existent id to guarantee defeat
    const result = processFinalVote(session, 'nonexistent');
    expect(result.outcome).toBe('defeat');
  });

  it('does not mutate the original session', () => {
    const session = twoPlayerFinalSession();
    const phaseBefore = session.phase;
    processFinalVote(session, 'p0');
    expect(session.phase).toBe(phaseBefore);
  });
});

// ---------------------------------------------------------------------------
// Integration: full single-psychic game → victory
// ---------------------------------------------------------------------------

describe('full game integration', () => {
  it('plays a complete single-psychic game with all correct guesses and wins', () => {
    let session = initSession(makeParams(['Alice'], 'easy'));
    const psyId = 'p0';
    const sol = session.solution[psyId];

    // Guess suspect
    let shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['suspect'], shown);
    expect(session.psychics[0].solved['suspect']).toBe(sol['suspect']);

    // Guess location
    shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['location'], shown);
    expect(session.psychics[0].solved['location']).toBe(sol['location']);

    // Guess weapon
    shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, sol['weapon'], shown);
    expect(session.psychics[0].solved['weapon']).toBe(sol['weapon']);

    // Victory check
    session = checkVictoryConditions(session, visionCards);
    expect(session.phase).toBe('result');
    expect(session.outcome).toBe('victory');
  });

  it('plays a complete single-psychic game with wrong guesses until defeat', () => {
    let session = initSession(makeParams(['Alice'], 'easy'));
    const psyId = 'p0';
    const sol = session.solution[psyId];
    const wrongSuspect = suspects.find(c => c.id !== sol['suspect'])!.id;

    // Keep guessing wrong and advancing rounds until defeat
    for (let round = 1; round <= 7; round++) {
      const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
      session = processGuess(session, psyId, wrongSuspect, shown);
      session = checkVictoryConditions(session, visionCards);
      if (session.phase !== 'result') {
        session = advanceRound(session);
      }
    }

    expect(session.phase).toBe('result');
    expect(session.outcome).toBe('defeat');
  });

  it('plays a two-psychic game through the final phase to a victory vote', () => {
    let session = initSession(makeParams(['Alice', 'Bob'], 'easy'));

    for (const psyId of ['p0', 'p1']) {
      const sol = session.solution[psyId];
      for (const category of ['suspect', 'location', 'weapon'] as Category[]) {
        const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
        session = processGuess(session, psyId, sol[category], shown);
      }
    }

    session = checkVictoryConditions(session, visionCards);
    expect(session.phase).toBe('final');

    // The correct psychic is the first one whose solved board matches their solution
    const correctPsychic = session.psychics.find(p => {
      const sol = session.solution[p.id];
      return (['suspect', 'location', 'weapon'] as Category[]).every(
        cat => p.solved[cat] === sol[cat]
      );
    })!;

    session = processFinalVote(session, correctPsychic.id);
    expect(session.phase).toBe('result');
    expect(session.outcome).toBe('victory');
  });

  it('logs one entry per guess throughout the game', () => {
    let session = initSession(makeParams(['Alice'], 'easy'));
    const psyId = 'p0';
    const sol = session.solution[psyId];
    const wrongSuspect = suspects.find(c => c.id !== sol['suspect'])!.id;

    // One wrong guess
    let shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
    session = processGuess(session, psyId, wrongSuspect, shown);
    expect(session.log).toHaveLength(1);

    // Three correct guesses
    for (const category of ['suspect', 'location', 'weapon'] as Category[]) {
      shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
      session = processGuess(session, psyId, sol[category], shown);
    }
    expect(session.log).toHaveLength(4);

    const correctEntries = session.log.filter(e => e.correct);
    const wrongEntries = session.log.filter(e => !e.correct);
    expect(correctEntries).toHaveLength(3);
    expect(wrongEntries).toHaveLength(1);
  });

  it('round advances correctly when all psychics finish a round', () => {
    let session = initSession(makeParams(['Alice', 'Bob'], 'easy'));

    // Wrong guesses for both psychics in round 1 — manually advance round
    for (const psyId of ['p0', 'p1']) {
      const sol = session.solution[psyId];
      const wrong = suspects.find(c => c.id !== sol['suspect'])!.id;
      const shown = selectClueCards(session, psyId, visionCards, allEvidenceCards);
      session = processGuess(session, psyId, wrong, shown);
    }

    session = advanceRound(session);
    expect(session.round).toBe(2);
    expect(session.phase).toBe('rounds');
  });
});
