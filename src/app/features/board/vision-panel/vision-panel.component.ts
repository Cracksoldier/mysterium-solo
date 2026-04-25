import { Component, inject } from '@angular/core';
import { GameStore } from '../../../state/game.store';
import { VisionCardComponent } from './vision-card/vision-card.component';

@Component({
  selector: 'app-vision-panel',
  imports: [VisionCardComponent],
  template: `
    <section class="vision-panel" aria-label="Vision Cards">
      <p class="ghost-label">The Ghost sends you a vision…</p>
      <div class="cards-list">
        @for (card of store.currentClueCards(); track card.id) {
          <app-vision-card [card]="card" />
        }
        @if (store.currentClueCards().length === 0) {
          <p class="empty-hint">Awaiting the Ghost's vision…</p>
        }
      </div>
    </section>
  `,
  styles: [`
    .vision-panel { display: flex; flex-direction: column; gap: 1rem; }
    .ghost-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--color-amber); margin-bottom: 0.5rem; }
    .cards-list { display: flex; flex-direction: column; gap: 1rem; }
    .empty-hint { color: var(--color-text-muted); font-style: italic; }
  `],
})
export class VisionPanelComponent {
  readonly store = inject(GameStore);
}
