import { Injectable, inject } from '@angular/core';
import { GameSession } from '../../domain/models/game-session.model';
import { DataStore } from '../../state/data.store';
import { renderMarkdown } from '../../domain/export/markdown-renderer';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly data = inject(DataStore);

  downloadMarkdown(session: GameSession): void {
    const content = renderMarkdown(session, this.data.allEvidence(), this.data.visionCards());
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = session.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const date = new Date(session.createdAt).toISOString().slice(0, 10);
    a.href = url;
    a.download = `mysterium-${date}-${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
