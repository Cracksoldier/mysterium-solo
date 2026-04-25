import { Component, inject, computed } from '@angular/core';
import { GameStore } from '../../../state/game.store';
import { DataStore } from '../../../state/data.store';
import { I18nService } from '../../../core/services/i18n.service';
import { Category } from '../../../domain/models/card.model';

const CATEGORIES: Category[] = ['suspect', 'location', 'weapon'];

@Component({
  selector: 'app-psychic-status',
  template: `
    <aside class="psychic-status" [attr.aria-label]="t()('psychic.aria')">
      <h3 class="section-label">{{ t()('psychic.label') }}</h3>
      @for (p of session()?.psychics ?? []; track p.id) {
        <div class="psychic-row" [class.active]="store.activePsychic()?.id === p.id">
          <span class="psychic-name">{{ p.name }}</span>
          <div class="progress-dots">
            @for (cat of categories; track cat) {
              <span
                class="dot"
                [class.solved]="p.solved[cat] !== null"
                [attr.title]="cat">
              </span>
            }
          </div>
          @if (p.incorrectGuesses > 0) {
            <span class="misses" [attr.aria-label]="p.incorrectGuesses + ' ' + t()('psychic.incorrect-aria')">
              ✗ {{ p.incorrectGuesses }}
            </span>
          }
        </div>
      }
    </aside>
  `,
  styles: [`
    .psychic-status { background: var(--color-surface); border: 1px solid var(--color-purple-mid); border-radius: var(--radius); padding: 1rem; }
    .section-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-text-muted); margin-bottom: 0.75rem; }
    .psychic-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.5rem; border-radius: 6px; margin-bottom: 0.25rem; }
    .psychic-row.active { background: var(--color-purple-dark); }
    .psychic-name { flex: 1; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .progress-dots { display: flex; gap: 0.35rem; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-surface-raised); border: 1px solid var(--color-purple-mid); transition: background 0.3s; }
    .dot.solved { background: var(--color-success); border-color: var(--color-success); }
    .misses { font-size: 0.75rem; color: var(--color-error); }
  `],
})
export class PsychicStatusComponent {
  readonly store = inject(GameStore);
  readonly data = inject(DataStore);
  readonly session = this.store.session;
  readonly categories = CATEGORIES;
  protected readonly t = inject(I18nService).t;
}
