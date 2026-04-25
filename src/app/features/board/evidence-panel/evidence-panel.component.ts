import { Component, inject, computed } from '@angular/core';
import { GameStore } from '../../../state/game.store';
import { DataStore } from '../../../state/data.store';
import { UiStore } from '../../../state/ui.store';
import { I18nService } from '../../../core/services/i18n.service';
import { EvidenceCardComponent } from './evidence-card/evidence-card.component';
import { Category } from '../../../domain/models/card.model';

@Component({
  selector: 'app-evidence-panel',
  imports: [EvidenceCardComponent],
  template: `
    <section class="evidence-panel" [attr.aria-label]="t()('evidence.aria')">
      <div class="category-group">
        <h3 class="cat-heading">{{ t()('evidence.suspects') }}</h3>
        <div class="card-grid">
          @for (card of data.suspects(); track card.id) {
            <app-evidence-card
              [card]="card"
              [selected]="ui.selectedCardId() === card.id"
              [solved]="isSolved(card.id)"
              [disabled]="isSolved(card.id) || targetCategory() !== 'suspect'"
              (select)="onSelect($event)" />
          }
        </div>
      </div>
      <div class="category-group">
        <h3 class="cat-heading">{{ t()('evidence.locations') }}</h3>
        <div class="card-grid">
          @for (card of data.locations(); track card.id) {
            <app-evidence-card
              [card]="card"
              [selected]="ui.selectedCardId() === card.id"
              [solved]="isSolved(card.id)"
              [disabled]="isSolved(card.id) || targetCategory() !== 'location'"
              (select)="onSelect($event)" />
          }
        </div>
      </div>
      <div class="category-group">
        <h3 class="cat-heading">{{ t()('evidence.weapons') }}</h3>
        <div class="card-grid">
          @for (card of data.weapons(); track card.id) {
            <app-evidence-card
              [card]="card"
              [selected]="ui.selectedCardId() === card.id"
              [solved]="isSolved(card.id)"
              [disabled]="isSolved(card.id) || targetCategory() !== 'weapon'"
              (select)="onSelect($event)" />
          }
        </div>
      </div>

      <button
        class="btn-primary submit-btn"
        [disabled]="!ui.selectedCardId() || ui.isSubmitting()"
        (click)="submit()">
        {{ t()('evidence.submit') }}
      </button>
    </section>
  `,
  styles: [`
    .evidence-panel { display: flex; flex-direction: column; gap: 1.25rem; }
    .cat-heading { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-muted); margin-bottom: 0.5rem; }
    .card-grid { display: flex; flex-direction: column; gap: 0.4rem; }
    .submit-btn { width: 100%; margin-top: 0.5rem; }
    .category-group { opacity: 1; transition: opacity 0.3s; }
    .category-group[data-inactive="true"] { opacity: 0.4; pointer-events: none; }
  `],
})
export class EvidencePanelComponent {
  readonly store = inject(GameStore);
  readonly data = inject(DataStore);
  readonly ui = inject(UiStore);
  protected readonly t = inject(I18nService).t;

  readonly targetCategory = computed((): Category =>
    this.store.activePsychic()?.currentTarget ?? 'suspect'
  );

  isSolved(cardId: string): boolean {
    const p = this.store.activePsychic();
    if (!p) return false;
    return Object.values(p.solved).includes(cardId);
  }

  onSelect(id: string): void {
    this.ui.selectCard(id);
  }

  submit(): void {
    const id = this.ui.selectedCardId();
    if (!id) return;
    this.ui.isSubmitting.set(true);
    this.store.submitGuess(id);
    this.ui.clearSelection();
    this.ui.isSubmitting.set(false);
  }
}
