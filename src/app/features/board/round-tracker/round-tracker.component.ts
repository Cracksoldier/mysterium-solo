import { Component, inject, computed } from '@angular/core';
import { GameStore } from '../../../state/game.store';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';

@Component({
  selector: 'app-round-tracker',
  imports: [ProgressBarComponent],
  template: `
    <div class="round-tracker" aria-label="Round progress">
      <span class="label">Round</span>
      <span class="round-num" [attr.aria-label]="'Round ' + store.round() + ' of 7'">
        {{ store.round() }} <em>/ 7</em>
      </span>
      <app-progress-bar [percent]="percent()" label="Round progress" />
    </div>
  `,
  styles: [`
    .round-tracker { display: flex; flex-direction: column; gap: 0.4rem; padding: 0.75rem 1rem; background: var(--color-surface); border: 1px solid var(--color-purple-mid); border-radius: var(--radius); }
    .label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-text-muted); }
    .round-num { font-size: 1.4rem; font-family: var(--font-serif); line-height: 1; }
    .round-num em { font-size: 0.85rem; color: var(--color-text-muted); font-style: normal; }
  `],
})
export class RoundTrackerComponent {
  readonly store = inject(GameStore);
  readonly percent = computed(() => (this.store.round() / 7) * 100);
}
