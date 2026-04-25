import { Component, inject, computed } from '@angular/core';
import { GameStore } from '../../state/game.store';
import { DataStore } from '../../state/data.store';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-final-phase',
  template: `
    <main class="final-phase">
      <div class="final-card">
        <p class="eyebrow">{{ t()('final.eyebrow') }}</p>
        <h2>{{ t()('final.title') }}</h2>
        <p class="intro">{{ t()('final.intro') }}</p>

        @if (finalVisions()) {
          <div class="vision-trio">
            @for (cat of categories; track cat) {
              <div class="vision-item">
                <span class="cat-label">{{ t()('cat.' + cat) }}</span>
                @if (getVisionCard(cat); as vc) {
                  <div class="mini-vision-card">
                    <strong>{{ vc.title }}</strong>
                    <p>{{ vc.scene }}</p>
                  </div>
                }
              </div>
            }
          </div>
        }

        <div class="vote-section">
          <h3>{{ t()('final.vote-heading') }}</h3>
          <div class="psychic-votes">
            @for (p of psychics(); track p.id) {
              <button class="vote-btn" (click)="vote(p.id)">
                <span class="p-name">{{ p.name }}</span>
                <div class="solved-summary">
                  <span>{{ getSolvedName('suspect', p) }}</span>
                  <span>{{ getSolvedName('location', p) }}</span>
                  <span>{{ getSolvedName('weapon', p) }}</span>
                </div>
              </button>
            }
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .final-phase { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: radial-gradient(ellipse at 50% 50%, #1e0a30 0%, var(--color-bg) 70%); }
    .final-card { max-width: 680px; width: 100%; background: var(--color-surface); border: 1px solid var(--color-purple-mid); border-radius: 12px; padding: 2.5rem; animation: fadeIn 0.5s ease; }
    .eyebrow { font-size: 0.8rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-amber); margin-bottom: 0.5rem; }
    h2 { font-family: var(--font-serif); font-size: 2rem; margin-bottom: 0.75rem; }
    .intro { color: var(--color-text-muted); margin-bottom: 2rem; }
    .vision-trio { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .vision-item { flex: 1; min-width: 180px; }
    .cat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-amber); display: block; margin-bottom: 0.4rem; }
    .mini-vision-card { background: #f5f0e8; color: #1a1208; padding: 1rem; border-radius: 8px; }
    .mini-vision-card strong { font-family: var(--font-serif); display: block; margin-bottom: 0.4rem; font-size: 0.9rem; }
    .mini-vision-card p { font-style: italic; font-size: 0.78rem; line-height: 1.5; }
    h3 { font-family: var(--font-serif); font-size: 1.2rem; margin-bottom: 1rem; }
    .psychic-votes { display: flex; flex-direction: column; gap: 0.75rem; }
    .vote-btn { width: 100%; text-align: left; padding: 1rem 1.25rem; background: var(--color-surface-raised); border: 1px solid var(--color-purple-mid); border-radius: var(--radius); color: var(--color-text); }
    .vote-btn:hover { border-color: var(--color-amber); background: var(--color-purple-dark); }
    .p-name { font-size: 1rem; font-weight: 600; display: block; margin-bottom: 0.4rem; }
    .solved-summary { display: flex; gap: 1rem; font-size: 0.78rem; color: var(--color-text-muted); flex-wrap: wrap; }
  `],
})
export class FinalPhaseComponent {
  readonly store = inject(GameStore);
  readonly data = inject(DataStore);
  protected readonly t = inject(I18nService).t;
  readonly categories = ['suspect', 'location', 'weapon'] as const;
  readonly psychics = computed(() => this.store.session()?.psychics ?? []);
  readonly finalVisions = computed(() => this.store.session()?.finalVisionCards);

  getVisionCard(cat: 'suspect' | 'location' | 'weapon') {
    const id = this.finalVisions()?.[cat];
    return id ? this.data.findVision(id) : undefined;
  }

  getSolvedName(cat: 'suspect' | 'location' | 'weapon', p: any): string {
    const id = p.solved[cat];
    if (!id) return '—';
    return this.data.findEvidence(id)?.name ?? id;
  }

  vote(psychicId: string): void {
    this.store.submitFinalVote(psychicId);
  }
}
