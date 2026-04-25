import { Injectable, signal, computed } from '@angular/core';
import { EvidenceCard, VisionCard } from '../domain/models/card.model';

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

  async loadAllCards(): Promise<void> {
    const [suspects, locations, weapons, visionCards] = await Promise.all([
      fetch('data/suspects.json').then(r => r.json()),
      fetch('data/locations.json').then(r => r.json()),
      fetch('data/weapons.json').then(r => r.json()),
      fetch('data/vision-cards.json').then(r => r.json()),
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
