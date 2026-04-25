import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameStore } from '../../state/game.store';
import { DataStore } from '../../state/data.store';
import { Difficulty } from '../../domain/models/game-session.model';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-setup',
  imports: [FormsModule],
  template: `
    <main class="setup">
      <div class="setup-card">
        <a class="back-link" (click)="router.navigate(['/'])" role="button" tabindex="0" (keydown.enter)="router.navigate(['/'])">{{ t()('setup.back') }}</a>
        <h2>{{ t()('setup.heading') }}</h2>

        <section class="field">
          <label for="title">{{ t()('setup.session-title') }}</label>
          <input id="title" [(ngModel)]="title" [placeholder]="t()('setup.title-placeholder')" maxlength="60" />
        </section>

        <section class="field">
          <label>{{ t()('setup.difficulty') }}</label>
          <div class="difficulty-grid">
            @for (d of difficulties(); track d.value) {
              <button
                class="diff-btn"
                [class.selected]="difficulty() === d.value"
                (click)="difficulty.set(d.value)"
                [attr.aria-pressed]="difficulty() === d.value">
                <strong>{{ d.label }}</strong>
                <span>{{ d.hint }}</span>
              </button>
            }
          </div>
        </section>

        <section class="field">
          <label>{{ t()('setup.psychic-count') }}</label>
          <div class="count-grid">
            @for (n of [1, 2, 3]; track n) {
              <button
                class="count-btn"
                [class.selected]="psychicCount() === n"
                (click)="setPsychicCount(n)"
                [attr.aria-pressed]="psychicCount() === n">
                {{ n }}
              </button>
            }
          </div>
        </section>

        <section class="field">
          <label>{{ t()('setup.psychic-names') }}</label>
          @for (i of psychicIndexes(); track i) {
            <input
              [id]="'name-' + i"
              [(ngModel)]="psychicNames[i]"
              [placeholder]="t()('setup.psychic-placeholder') + ' ' + (i + 1)"
              style="margin-bottom: 0.5rem; display: block; width: 100%;" />
          }
        </section>

        <button class="btn-primary start-btn" (click)="start()" [disabled]="!canStart()">
          {{ t()('setup.begin') }}
        </button>
      </div>
    </main>
  `,
  styles: [`
    .setup { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: radial-gradient(ellipse at 50% 20%, #2a1040 0%, var(--color-bg) 70%); }
    .setup-card { background: var(--color-surface); border: 1px solid var(--color-purple-mid); border-radius: 12px; padding: 2rem; width: 100%; max-width: 480px; animation: fadeIn 0.4s ease; }
    .back-link { color: var(--color-text-muted); font-size: 0.85rem; cursor: pointer; display: inline-block; margin-bottom: 1.5rem; }
    h2 { font-family: var(--font-serif); font-size: 1.8rem; margin-bottom: 1.5rem; color: var(--color-text); }
    .field { margin-bottom: 1.5rem; }
    label { display: block; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-muted); margin-bottom: 0.5rem; }
    input { width: 100%; }
    .difficulty-grid, .count-grid { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .diff-btn { flex: 1; min-width: 120px; padding: 0.75rem; background: var(--color-surface-raised); border: 1px solid var(--color-purple-mid); border-radius: var(--radius); color: var(--color-text); display: flex; flex-direction: column; gap: 0.25rem; text-align: left; }
    .diff-btn strong { font-size: 0.95rem; }
    .diff-btn span { font-size: 0.75rem; color: var(--color-text-muted); }
    .diff-btn.selected { border-color: var(--color-amber); box-shadow: 0 0 12px rgba(200,146,42,0.3); }
    .count-btn { width: 56px; height: 56px; background: var(--color-surface-raised); border: 1px solid var(--color-purple-mid); border-radius: 50%; color: var(--color-text); font-size: 1.2rem; }
    .count-btn.selected { border-color: var(--color-amber); background: var(--color-purple-dark); box-shadow: 0 0 12px rgba(200,146,42,0.3); }
    .start-btn { width: 100%; margin-top: 0.5rem; }
  `],
})
export class SetupComponent {
  readonly store = inject(GameStore);
  readonly data = inject(DataStore);
  readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  title = '';
  psychicNames: string[] = ['', '', ''];
  readonly difficulty = signal<Difficulty>('normal');
  readonly psychicCount = signal(1);

  readonly difficulties = computed(() => {
    const t = this.t();
    return [
      { value: 'easy' as Difficulty, label: t('difficulty.easy'), hint: t('difficulty.easy.hint') },
      { value: 'normal' as Difficulty, label: t('difficulty.normal'), hint: t('difficulty.normal.hint') },
      { value: 'hard' as Difficulty, label: t('difficulty.hard'), hint: t('difficulty.hard.hint') },
    ];
  });

  psychicIndexes() {
    return Array.from({ length: this.psychicCount() }, (_, i) => i);
  }

  setPsychicCount(n: number): void {
    this.psychicCount.set(n);
  }

  canStart(): boolean {
    return this.title.trim().length > 0;
  }

  start(): void {
    const placeholder = this.t()('setup.psychic-placeholder');
    const names = Array.from({ length: this.psychicCount() }, (_, i) =>
      this.psychicNames[i]?.trim() || `${placeholder} ${i + 1}`
    );
    this.store.startGame({
      title: this.title.trim(),
      difficulty: this.difficulty(),
      psychicNames: names,
      allSuspectIds: this.data.suspects().map(c => c.id),
      allLocationIds: this.data.locations().map(c => c.id),
      allWeaponIds: this.data.weapons().map(c => c.id),
      allVisionCardIds: this.data.visionCards().map(v => v.id),
    });
  }
}
