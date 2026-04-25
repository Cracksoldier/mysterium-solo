import { Component, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  template: `
    <div class="track" [attr.aria-label]="label()">
      <div class="fill" [style.width.%]="percent()"></div>
    </div>
  `,
  styles: [`
    .track { background: rgba(255,255,255,0.1); border-radius: 4px; height: 6px; overflow: hidden; }
    .fill { height: 100%; background: var(--color-amber); border-radius: 4px; transition: width 0.4s ease; }
  `],
})
export class ProgressBarComponent {
  readonly percent = input<number>(0);
  readonly label = input<string>('Progress');
}
