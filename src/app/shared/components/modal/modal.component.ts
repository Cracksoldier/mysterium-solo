import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    <div class="overlay" (click)="close.emit()" role="dialog" aria-modal="true">
      <div class="panel" (click)="$event.stopPropagation()">
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 500; }
    .panel { background: var(--color-surface); border: 1px solid var(--color-purple-mid); border-radius: 12px; padding: 2rem; max-width: 500px; width: 90%; }
  `],
})
export class ModalComponent {
  readonly close = output<void>();
}
