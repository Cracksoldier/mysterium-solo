import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { GameStore } from '../../state/game.store';
import { DataStore } from '../../state/data.store';
import { ExportService } from '../../core/services/export.service';

@Component({
  selector: 'app-result',
  template: `
    <main class="result" [class.victory]="isVictory()" [class.defeat]="!isVictory()">
      <div class="result-card">
        <div class="outcome-badge">{{ isVictory() ? 'Victory' : 'Defeat' }}</div>
        <h1>{{ isVictory() ? 'The Truth Revealed' : 'The Ghost Falls Silent' }}</h1>
        <p class="subtitle">
          @if (isVictory()) {
            The séance is complete. The murder is solved.
          } @else {
            The rounds are exhausted. The mystery endures.
          }
        </p>

        @for (p of psychics(); track p.id) {
          <div class="solution-block">
            <h3>{{ p.name }}'s Board</h3>
            <ul>
              @for (cat of categories; track cat) {
                <li>
                  <span class="cat-name">{{ cat }}</span>
                  <span class="card-name">{{ getSolvedName(cat, p.id) }}</span>
                </li>
              }
            </ul>
          </div>
        }

        <div class="stats">
          <div class="stat">
            <span class="stat-val">{{ session()?.round ?? 0 }}</span>
            <span class="stat-label">Rounds used</span>
          </div>
          <div class="stat">
            <span class="stat-val">{{ totalIncorrect() }}</span>
            <span class="stat-label">Incorrect guesses</span>
          </div>
          <div class="stat">
            <span class="stat-val">{{ uniqueCardsShown() }}</span>
            <span class="stat-label">Vision cards seen</span>
          </div>
        </div>

        <div class="action-row">
          <button class="btn-primary" (click)="export()">Save Report (Markdown)</button>
          <button class="btn-secondary" (click)="playAgain()">Play Again</button>
          <button class="btn-secondary" (click)="home()">Home</button>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .result { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .result.victory { background: radial-gradient(ellipse at 50% 30%, #0a2a1a 0%, var(--color-bg) 70%); }
    .result.defeat { background: radial-gradient(ellipse at 50% 30%, #2a0a0a 0%, var(--color-bg) 70%); }
    .result-card { max-width: 560px; width: 100%; background: var(--color-surface); border-radius: 12px; padding: 2.5rem; animation: fadeIn 0.6s ease; text-align: center; }
    .outcome-badge { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700; padding: 0.3rem 1rem; border-radius: 20px; display: inline-block; margin-bottom: 1rem; }
    .victory .outcome-badge { background: rgba(76,175,136,0.15); color: var(--color-success); border: 1px solid var(--color-success); }
    .defeat .outcome-badge { background: rgba(207,72,72,0.15); color: var(--color-error); border: 1px solid var(--color-error); }
    h1 { font-family: var(--font-serif); font-size: 2rem; margin-bottom: 0.75rem; }
    .subtitle { color: var(--color-text-muted); margin-bottom: 2rem; }
    .solution-block { text-align: left; background: var(--color-surface-raised); border-radius: var(--radius); padding: 1rem; margin-bottom: 1rem; }
    .solution-block h3 { font-family: var(--font-serif); font-size: 1rem; margin-bottom: 0.5rem; color: var(--color-amber-light); }
    .solution-block ul { list-style: none; display: flex; flex-direction: column; gap: 0.35rem; }
    .solution-block li { display: flex; justify-content: space-between; font-size: 0.9rem; }
    .cat-name { color: var(--color-text-muted); text-transform: capitalize; }
    .card-name { font-weight: 500; }
    .stats { display: flex; gap: 1.5rem; justify-content: center; margin: 1.5rem 0; }
    .stat { display: flex; flex-direction: column; align-items: center; }
    .stat-val { font-size: 2rem; font-family: var(--font-serif); color: var(--color-amber-light); }
    .stat-label { font-size: 0.75rem; color: var(--color-text-muted); }
    .action-row { display: flex; flex-direction: column; gap: 0.75rem; }
  `],
})
export class ResultComponent {
  readonly store = inject(GameStore);
  readonly data = inject(DataStore);
  readonly exportService = inject(ExportService);
  readonly router = inject(Router);

  readonly categories = ['suspect', 'location', 'weapon'] as const;
  readonly session = this.store.session;
  readonly psychics = computed(() => this.session()?.psychics ?? []);
  readonly isVictory = computed(() => this.session()?.outcome === 'victory');
  readonly totalIncorrect = computed(() =>
    this.psychics().reduce((s, p) => s + p.incorrectGuesses, 0)
  );
  readonly uniqueCardsShown = computed(() =>
    new Set(this.session()?.log.flatMap(e => e.cardsShown) ?? []).size
  );

  getSolvedName(cat: 'suspect' | 'location' | 'weapon', psychicId: string): string {
    const sol = this.session()?.solution[psychicId];
    const id = sol?.[cat];
    if (!id) return '—';
    return this.data.findEvidence(id)?.name ?? id;
  }

  export(): void {
    const s = this.session();
    if (s) this.exportService.downloadMarkdown(s);
  }

  playAgain(): void {
    this.store.abandonGame();
    this.router.navigate(['/setup']);
  }

  home(): void {
    this.store.abandonGame();
  }
}
