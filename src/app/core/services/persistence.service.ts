import { Injectable } from '@angular/core';
import { GameSession } from '../../domain/models/game-session.model';

const SESSION_KEY = 'ms_active_session';
const DB_NAME = 'mysterium-solo';
const STORE_NAME = 'completed-games';

@Injectable({ providedIn: 'root' })
export class PersistenceService {

  saveSession(session: GameSession): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch { /* quota exceeded — ignore */ }
  }

  loadSession(): GameSession | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as GameSession; } catch { return null; }
  }

  clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
  }

  saveCompletedGame(session: GameSession): Promise<void> {
    return this.withStore('readwrite', store => store.put(session));
  }

  listCompletedGames(): Promise<GameSession[]> {
    return new Promise((resolve, reject) => {
      this.openDb().then(db => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result as GameSession[]);
        req.onerror = () => reject(req.error);
      }).catch(reject);
    });
  }

  deleteCompletedGame(sessionId: string): Promise<void> {
    return this.withStore('readwrite', store => store.delete(sessionId));
  }

  private withStore(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      this.openDb().then(db => {
        const tx = db.transaction(STORE_NAME, mode);
        const req = fn(tx.objectStore(STORE_NAME));
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }).catch(reject);
    });
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = e => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'sessionId' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('outcome', 'outcome');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}
