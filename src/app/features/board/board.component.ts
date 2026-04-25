import { Component, inject, computed, signal } from '@angular/core';
import { GameStore } from '../../state/game.store';
import { UiStore } from '../../state/ui.store';
import { I18nService } from '../../core/services/i18n.service';
import { VisionPanelComponent } from './vision-panel/vision-panel.component';
import { EvidencePanelComponent } from './evidence-panel/evidence-panel.component';
import { PsychicStatusComponent } from './psychic-status/psychic-status.component';
import { RoundTrackerComponent } from './round-tracker/round-tracker.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-board',
  imports: [VisionPanelComponent, EvidencePanelComponent, PsychicStatusComponent, RoundTrackerComponent, ModalComponent],
  template: `
    <div class="board-layout">
      <!-- Left sidebar -->
      <aside class="sidebar-left">
        <app-round-tracker />
        <app-psychic-status />
        <div class="target-hint">
          {{ t()('board.guessing') }} <strong>{{ currentTarget() }}</strong>
          for <em>{{ store.activePsychic()?.name }}</em>
        </div>
        <button class="btn-danger abandon-btn" (click)="showAbandon.set(true)">{{ t()('board.abandon') }}</button>
      </aside>

      <!-- Center: vision cards -->
      <main class="center-panel">
        <app-vision-panel />
      </main>

      <!-- Right: evidence board -->
      <aside class="sidebar-right">
        <app-evidence-panel />
      </aside>
    </div>

    @if (showAbandon()) {
      <app-modal (close)="showAbandon.set(false)">
        <h3 style="margin-bottom:1rem; font-family: var(--font-serif)">{{ t()('board.abandon-confirm') }}</h3>
        <p style="color: var(--color-text-muted); margin-bottom:1.5rem">{{ t()('board.abandon-warning') }}</p>
        <div style="display:flex; gap:1rem; justify-content:flex-end">
          <button class="btn-secondary" (click)="showAbandon.set(false)">{{ t()('board.cancel') }}</button>
          <button class="btn-danger" (click)="abandon()">{{ t()('board.abandon-action') }}</button>
        </div>
      </app-modal>
    }
  `,
  styles: [`
    .board-layout { display: grid; grid-template-columns: 220px 1fr 280px; gap: 1.5rem; padding: 1.5rem; min-height: 100vh; max-width: 1400px; margin: 0 auto; }
    .sidebar-left { display: flex; flex-direction: column; gap: 1rem; }
    .center-panel { overflow-y: auto; }
    .sidebar-right { overflow-y: auto; }
    .target-hint { font-size: 0.85rem; color: var(--color-text-muted); padding: 0.5rem; }
    .target-hint strong { color: var(--color-amber-light); text-transform: capitalize; }
    .target-hint em { color: var(--color-text); font-style: normal; }
    .abandon-btn { margin-top: auto; }
    @media (max-width: 900px) {
      .board-layout { grid-template-columns: 1fr; }
      .sidebar-left { flex-direction: row; flex-wrap: wrap; }
    }
  `],
})
export class BoardComponent {
  readonly store = inject(GameStore);
  readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  readonly showAbandon = signal(false);

  readonly currentTarget = computed(() => {
    const cat = this.store.activePsychic()?.currentTarget;
    if (!cat) return '';
    const translated = this.t()(`cat.${cat}`);
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  });

  abandon(): void {
    this.store.abandonGame();
  }
}
