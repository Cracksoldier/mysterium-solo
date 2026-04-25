import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiStore {
  readonly selectedCardId = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly toastMessage = signal<string | null>(null);
  readonly revealAnimation = signal(false);

  selectCard(id: string): void {
    this.selectedCardId.set(id);
  }

  clearSelection(): void {
    this.selectedCardId.set(null);
  }

  showToast(message: string, durationMs = 3000): void {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), durationMs);
  }
}
