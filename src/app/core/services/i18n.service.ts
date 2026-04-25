import { Injectable, signal, computed } from '@angular/core';

export type Lang = 'en' | 'de';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>('en');
  private readonly _trs = signal<Record<string, string>>({});

  readonly t = computed(() => {
    const trs = this._trs();
    return (key: string) => trs[key] ?? key;
  });

  async setLanguage(lang: Lang): Promise<void> {
    const res = await fetch(`i18n/${lang}.json`);
    const data = await res.json();
    this._trs.set(data);
    this.lang.set(lang);
    localStorage.setItem('mysterium-lang', lang);
  }

  async init(): Promise<void> {
    const saved = localStorage.getItem('mysterium-lang') as Lang | null;
    await this.setLanguage(saved === 'de' ? 'de' : 'en');
  }
}
