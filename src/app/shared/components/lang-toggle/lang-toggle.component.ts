import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';
import { DataStore } from '../../../state/data.store';

@Component({
  selector: 'app-lang-toggle',
  template: `
    <div class="lang-toggle" role="group" aria-label="Language">
      <button
        class="lang-btn"
        [class.active]="i18n.lang() === 'en'"
        (click)="setLang('en')"
        [attr.aria-pressed]="i18n.lang() === 'en'">
        EN
      </button>
      <span class="sep" aria-hidden="true">|</span>
      <button
        class="lang-btn"
        [class.active]="i18n.lang() === 'de'"
        (click)="setLang('de')"
        [attr.aria-pressed]="i18n.lang() === 'de'">
        DE
      </button>
    </div>
  `,
  styles: [`
    .lang-toggle { display: flex; align-items: center; gap: 0.25rem; }
    .lang-btn { background: none; border: none; font-size: 0.75rem; letter-spacing: 0.1em; color: var(--color-text-muted); cursor: pointer; padding: 0.2rem 0.4rem; border-radius: 4px; transition: color 0.2s; }
    .lang-btn:hover { color: var(--color-text); }
    .lang-btn.active { color: var(--color-amber); font-weight: 700; }
    .sep { font-size: 0.75rem; color: var(--color-text-muted); opacity: 0.4; }
  `],
})
export class LangToggleComponent {
  readonly i18n = inject(I18nService);
  private readonly data = inject(DataStore);

  async setLang(lang: 'en' | 'de'): Promise<void> {
    if (this.i18n.lang() === lang) return;
    await this.i18n.setLanguage(lang);
    await this.data.loadAllCards(lang);
  }
}
