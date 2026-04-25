import { Component, input } from '@angular/core';
import { VisionCard } from '../../../../domain/models/card.model';

@Component({
  selector: 'app-vision-card',
  template: `
    <article class="vision-card">
      <h3 class="vc-title">{{ card().title }}</h3>
      <p class="vc-scene">{{ card().scene }}</p>
      <div class="vc-tags">
        @for (tag of card().tags.slice(0, 4); track tag) {
          <span class="tag">{{ tag }}</span>
        }
      </div>
    </article>
  `,
  styles: [`
    .vision-card {
      background: #f5f0e8;
      color: #1a1208;
      border-radius: 10px;
      padding: 1.5rem;
      box-shadow: 0 8px 32px rgba(0,0,0,0.7), inset 0 0 60px rgba(0,0,0,0.05);
      animation: fadeIn 0.6s ease;
      border: 1px solid rgba(200,146,42,0.3);
    }
    .vc-title { font-family: var(--font-serif); font-size: 1.1rem; margin-bottom: 0.75rem; color: #2a1a08; }
    .vc-scene { font-style: italic; font-size: 0.95rem; line-height: 1.7; color: #3a2a12; }
    .vc-tags { margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .tag { font-size: 0.7rem; padding: 0.2rem 0.5rem; background: rgba(61,31,92,0.12); color: #5a3a88; border-radius: 4px; letter-spacing: 0.04em; }
  `],
})
export class VisionCardComponent {
  readonly card = input.required<VisionCard>();
}
