import { Component, input, output } from '@angular/core';
import { EvidenceCard } from '../../../../domain/models/card.model';

@Component({
  selector: 'app-evidence-card',
  template: `
    <button
      class="evidence-card"
      [class.selected]="selected()"
      [class.solved]="solved()"
      [class.shake]="shake()"
      [attr.aria-pressed]="selected()"
      [disabled]="solved() || disabled()"
      (click)="select.emit(card().id)">
      <span class="ev-name">{{ card().name }}</span>
      <span class="ev-desc">{{ card().description }}</span>
      @if (solved()) { <span class="check-mark" aria-label="Solved">✓</span> }
    </button>
  `,
  styles: [`
    .evidence-card {
      display: block; width: 100%; text-align: left; padding: 0.75rem 1rem;
      background: var(--color-surface-raised); border: 1px solid var(--color-purple-mid);
      border-radius: var(--radius); color: var(--color-text); position: relative;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .evidence-card:hover:not(:disabled) { border-color: var(--color-purple-light); }
    .evidence-card.selected { border-color: var(--color-amber); box-shadow: 0 0 12px rgba(200,146,42,0.35); }
    .evidence-card.solved { border-color: var(--color-success); opacity: 0.7; }
    .evidence-card.shake { animation: shake 0.4s ease; }
    .ev-name { display: block; font-weight: 600; font-size: 0.95rem; }
    .ev-desc { display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-top: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .check-mark { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--color-success); font-size: 1.1rem; }
  `],
})
export class EvidenceCardComponent {
  readonly card = input.required<EvidenceCard>();
  readonly selected = input(false);
  readonly solved = input(false);
  readonly shake = input(false);
  readonly disabled = input(false);
  readonly select = output<string>();
}
