import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameStore } from '../../state/game.store';

@Component({
  selector: 'app-home',
  template: `
    <main class="home">
      <div class="hero">
        <p class="eyebrow">The Ghost awaits</p>
        <h1>Mysterium<br><span>Solo</span></h1>
        <p class="subtitle">A single-player séance. Decode the visions. Solve the murder.</p>
        <div class="actions">
          <button class="btn-primary" (click)="newGame()">Begin a New Séance</button>
          @if (store.hasSavedSession()) {
            <button class="btn-secondary" (click)="resume()">Resume Previous Game</button>
          }
        </div>
      </div>
      <footer class="home-footer">
        Based on <em>Mysterium</em> by Libellud &bull; Solo adaptation
      </footer>
    </main>
  `,
  styles: [`
    .home { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; background: radial-gradient(ellipse at 50% 30%, #2a1040 0%, var(--color-bg) 70%); }
    .hero { text-align: center; animation: fadeIn 0.8s ease; }
    .eyebrow { font-size: 0.8rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-amber); margin-bottom: 1rem; }
    h1 { font-size: clamp(3rem, 10vw, 6rem); font-family: var(--font-serif); color: var(--color-text); line-height: 1; }
    h1 span { color: var(--color-purple-light); }
    .subtitle { color: var(--color-text-muted); font-size: 1.1rem; margin: 1.5rem 0 2.5rem; max-width: 420px; }
    .actions { display: flex; flex-direction: column; gap: 1rem; align-items: center; }
    .home-footer { position: absolute; bottom: 1.5rem; font-size: 0.8rem; color: var(--color-text-muted); }
  `],
})
export class HomeComponent {
  readonly store = inject(GameStore);
  private readonly router = inject(Router);

  newGame(): void { this.router.navigate(['/setup']); }
  resume(): void { this.store.loadSavedSession(); }
}
