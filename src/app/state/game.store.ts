import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameSession, SetupParams } from '../domain/models/game-session.model';
import { Category, EvidenceCard, VisionCard } from '../domain/models/card.model';
import { Psychic } from '../domain/models/psychic.model';
import {
  initSession,
  selectClueCards,
  processGuess,
  advanceRound,
  checkVictoryConditions,
  processFinalVote,
} from '../domain/engine/game-rules';
import { DataStore } from './data.store';
import { PersistenceService } from '../core/services/persistence.service';

@Injectable({ providedIn: 'root' })
export class GameStore {
  private readonly data = inject(DataStore);
  private readonly persistence = inject(PersistenceService);
  private readonly router = inject(Router);

  private readonly _session = signal<GameSession | null>(null);
  // Vision card IDs selected by ghost for current psychic's current turn
  private readonly _currentClueIds = signal<string[]>([]);

  readonly session = this._session.asReadonly();
  readonly currentClueIds = this._currentClueIds.asReadonly();

  readonly phase = computed(() => this._session()?.phase ?? 'setup');
  readonly round = computed(() => this._session()?.round ?? 0);
  readonly isGameOver = computed(() => {
    const s = this._session();
    return s !== null && s.outcome !== null;
  });

  readonly activePsychic = computed((): Psychic | null => {
    const s = this._session();
    if (!s) return null;
    return s.psychics.find(p => !this.isSolved(p)) ?? null;
  });

  readonly currentClueCards = computed((): VisionCard[] =>
    this._currentClueIds()
      .map(id => this.data.findVision(id))
      .filter((v): v is VisionCard => v !== undefined)
  );

  constructor() {
    effect(() => {
      const s = this._session();
      if (s) this.persistence.saveSession(s);
    });
  }

  hasSavedSession(): boolean {
    return this.persistence.loadSession() !== null;
  }

  startGame(params: SetupParams): void {
    const session = initSession(params);
    this._session.set(session);
    this.drawClueForActivePsychic(session);
    this.router.navigate(['/board']);
  }

  loadSavedSession(): void {
    const session = this.persistence.loadSession();
    if (!session) return;
    this._session.set(session);
    this.drawClueForActivePsychic(session);
    this.router.navigate(['/board']);
  }

  submitGuess(cardId: string): void {
    const session = this._session();
    const psychic = this.activePsychic();
    if (!session || !psychic) return;

    const shownIds = this._currentClueIds();
    const updated = processGuess(session, psychic.id, cardId, shownIds);
    const checked = checkVictoryConditions(updated, this.data.visionCards());
    this._session.set(checked);

    if (checked.phase === 'result') {
      this.router.navigate(['/result']);
    } else if (checked.phase === 'final') {
      this.router.navigate(['/final']);
    } else {
      const newActivePsychic = checked.psychics.find(p => !this.isSolved(p));
      if (newActivePsychic) {
        this.drawClueForActivePsychic(checked);
      } else {
        // All psychics done for this round — advance
        const advanced = advanceRound(checked);
        this._session.set(advanced);
        if (advanced.phase === 'result') {
          this.router.navigate(['/result']);
        } else {
          this.drawClueForActivePsychic(advanced);
        }
      }
    }
  }

  submitFinalVote(psychicId: string): void {
    const session = this._session();
    if (!session) return;
    const result = processFinalVote(session, psychicId);
    this._session.set(result);
    this.router.navigate(['/result']);
  }

  abandonGame(): void {
    this.persistence.clearSession();
    this._session.set(null);
    this._currentClueIds.set([]);
    this.router.navigate(['/']);
  }

  saveCompletedGame(): void {
    const session = this._session();
    if (session) this.persistence.saveCompletedGame(session);
  }

  private drawClueForActivePsychic(session: GameSession): void {
    const psychic = session.psychics.find(p => !this.isSolved(p));
    if (!psychic) { this._currentClueIds.set([]); return; }
    const ids = selectClueCards(
      session,
      psychic.id,
      this.data.visionCards(),
      this.data.allEvidence()
    );
    this._currentClueIds.set(ids);
  }

  private isSolved(p: Psychic): boolean {
    return ['suspect', 'location', 'weapon'].every(
      cat => p.solved[cat as Category] !== null
    );
  }
}
