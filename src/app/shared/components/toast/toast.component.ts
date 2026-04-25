import { Component, inject } from '@angular/core';
import { UiStore } from '../../../state/ui.store';

@Component({
  selector: 'app-toast',
  template: `
    @if (ui.toastMessage()) {
      <div class="toast">{{ ui.toastMessage() }}</div>
    }
  `,
  styles: [`
    .toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-purple-mid);
      color: var(--color-text);
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 0.95rem;
      box-shadow: 0 4px 24px rgba(0,0,0,0.5);
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  `],
})
export class ToastComponent {
  readonly ui = inject(UiStore);
}
