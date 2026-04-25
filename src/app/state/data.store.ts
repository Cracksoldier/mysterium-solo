import { Injectable, signal, computed } from '@angular/core';
import { EvidenceCard, VisionCard } from '../domain/models/card.model';
import { Lang } from '../core/services/i18n.service';

@Injectable({ providedIn: 'root' })
export class DataStore {
  readonly suspects = signal<EvidenceCard[]>([]);
  readonly locations = signal<EvidenceCard[]>([]);
  readonly weapons = signal<EvidenceCard[]>([]);
  readonly visionCards = signal<VisionCard[]>([]);

  readonly allEvidence = computed(() => [
    ...this.suspects(),
    ...this.locations(),
    ...this.weapons(),
  ]);

  async loadAllCards(lang: Lang = 'en'): Promise<void> {
    const base = lang === 'en' ? 'data' : `data/${lang}`;
    const [suspects, locations, weapons, visionCards] = await Promise.all([
      fetch(`${base}/suspects.json`).then(r => r.json()),
      fetch(`${base}/locations.json`).then(r => r.json()),
      fetch(`${base}/weapons.json`).then(r => r.json()),
      fetch(`${base}/vision-cards.json`).then(r => r.json()),
    ]);
    this.suspects.set(suspects);
    this.locations.set(locations);
    this.weapons.set(weapons);
    this.visionCards.set(visionCards);
  }

  findEvidence(id: string): EvidenceCard | undefined {
    return this.allEvidence().find(c => c.id === id);
  }

  findVision(id: string): VisionCard | undefined {
    return this.visionCards().find(v => v.id === id);
  }
}
