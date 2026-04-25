import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { LangToggleComponent } from './shared/components/lang-toggle/lang-toggle.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, LangToggleComponent],
  template: `
    <router-outlet />
    <app-toast />
    <div class="lang-overlay">
      <app-lang-toggle />
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
    .lang-overlay { position: fixed; top: 0.75rem; right: 1rem; z-index: 100; }
  `],
})
export class App {}
