# Mysterium Solo — Angular 21 Application Architecture

**Date:** 2026-04-25
**Based on:** Mysterium Solo Web Application Specification v1
**Framework:** Angular 21 (Standalone, Signals, Zoneless)
**Constraints:** No external database · Fully offline-capable (PWA)

---

## 1. Technology Decisions

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | Angular 21 | Standalone components, Signals, Zoneless |
| State management | Angular Signals + `effect()` | No NgRx needed at this scope; Signals are fine-grained and built-in |
| Change detection | Zoneless (`provideZonelessChangeDetection()`) | Lower overhead; Signals drive all updates |
| Persistence | `localStorage` (state) + `IndexedDB` (game log/assets) | No server; survives refresh and browser close |
| Offline | Angular PWA (`@angular/pwa`) + Service Worker | Full asset caching; app shell strategy |
| Styling | Angular 21 scoped CSS + CSS custom properties | No CSS framework needed |
| Routing | Angular Router (lazy-loaded feature routes) | Code-split by screen |
| Testing | Jest + Angular Testing Library | Fast, DOM-oriented unit tests |
| Build | Angular CLI (`ng build`) / Vite-backed esbuild | Fast builds; PWA manifest generation |

---

## 2. Project Structure

```
mysterium-solo/
├── src/
│   ├── app/
│   │   ├── core/                         # Singleton services, guards, interceptors
│   │   │   ├── services/
│   │   │   │   ├── persistence.service.ts     # localStorage + IndexedDB façade
│   │   │   │   ├── export.service.ts          # Markdown file generation
│   │   │   │   └── audio.service.ts           # Optional ambient sound (v2)
│   │   │   ├── guards/
│   │   │   │   └── active-game.guard.ts       # Redirect if no game in progress
│   │   │   └── core.providers.ts              # provideCore() factory
│   │   │
│   │   ├── data/                         # Static JSON assets loaded at startup
│   │   │   ├── suspects.json
│   │   │   ├── locations.json
│   │   │   ├── weapons.json
│   │   │   └── vision-cards.json
│   │   │
│   │   ├── domain/                       # Pure TypeScript — no Angular deps
│   │   │   ├── models/
│   │   │   │   ├── card.model.ts
│   │   │   │   ├── game-session.model.ts
│   │   │   │   ├── psychic.model.ts
│   │   │   │   └── log-entry.model.ts
│   │   │   ├── engine/
│   │   │   │   ├── ghost.engine.ts            # Card-selection algorithm
│   │   │   │   ├── game-rules.ts              # Pure round/phase logic
│   │   │   │   └── tag-matcher.ts             # Relevance scoring
│   │   │   └── export/
│   │   │       └── markdown-renderer.ts       # Session → Markdown string
│   │   │
│   │   ├── state/                        # Signal-based application state
│   │   │   ├── game.store.ts              # Central game store (Signals)
│   │   │   ├── ui.store.ts                # UI-only transient state
│   │   │   └── data.store.ts              # Loaded card data (read-only)
│   │   │
│   │   ├── features/                     # Lazy-loaded route features
│   │   │   ├── home/
│   │   │   │   ├── home.component.ts
│   │   │   │   └── home.routes.ts
│   │   │   ├── setup/
│   │   │   │   ├── setup.component.ts
│   │   │   │   ├── difficulty-selector/
│   │   │   │   │   └── difficulty-selector.component.ts
│   │   │   │   ├── psychic-count-selector/
│   │   │   │   │   └── psychic-count-selector.component.ts
│   │   │   │   └── setup.routes.ts
│   │   │   ├── board/
│   │   │   │   ├── board.component.ts         # Layout shell
│   │   │   │   ├── vision-panel/
│   │   │   │   │   ├── vision-panel.component.ts
│   │   │   │   │   └── vision-card/
│   │   │   │   │       └── vision-card.component.ts
│   │   │   │   ├── evidence-panel/
│   │   │   │   │   ├── evidence-panel.component.ts
│   │   │   │   │   └── evidence-card/
│   │   │   │   │       └── evidence-card.component.ts
│   │   │   │   ├── psychic-status/
│   │   │   │   │   └── psychic-status.component.ts
│   │   │   │   ├── round-tracker/
│   │   │   │   │   └── round-tracker.component.ts
│   │   │   │   └── board.routes.ts
│   │   │   ├── final-phase/
│   │   │   │   ├── final-phase.component.ts
│   │   │   │   └── final-phase.routes.ts
│   │   │   └── result/
│   │   │       ├── result.component.ts
│   │   │       └── result.routes.ts
│   │   │
│   │   ├── shared/                       # Reusable UI primitives
│   │   │   ├── components/
│   │   │   │   ├── button/
│   │   │   │   ├── card-frame/
│   │   │   │   ├── modal/
│   │   │   │   ├── progress-bar/
│   │   │   │   └── toast/
│   │   │   └── pipes/
│   │   │       ├── truncate.pipe.ts
│   │   │       └── slug.pipe.ts
│   │   │
│   │   ├── app.component.ts              # Root shell (router-outlet only)
│   │   ├── app.config.ts                 # provideRouter, provideZonelessChangeDetection, etc.
│   │   └── app.routes.ts                 # Top-level lazy routes
│   │
│   ├── assets/
│   │   └── icons/
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── manifest.webmanifest              # PWA manifest
│   ├── ngsw-config.json                  # Service worker cache config
│   └── index.html
├── angular.json
├── tsconfig.json
└── jest.config.ts
```

---

## 3. Domain Layer (`/domain`)

The domain layer has **zero Angular dependencies** — it is plain TypeScript. This makes it fully unit-testable in isolation and portable.

### 3.1 Core Models

```typescript
// card.model.ts
export type Category = 'suspect' | 'location' | 'weapon';

export interface EvidenceCard {
  id: string;
  category: Category;
  name: string;
  description: string;
  tags: string[];
}

export interface VisionCard {
  id: string;
  title: string;
  scene: string;
  tags: string[];
}

// psychic.model.ts
export interface Psychic {
  id: string;
  name: string;
  solved: Record<Category, string | null>;   // card id or null
  currentTarget: Category;
  incorrectGuesses: number;
}

// game-session.model.ts
export type GamePhase = 'setup' | 'rounds' | 'final' | 'result';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type Outcome = 'victory' | 'defeat' | null;

export interface GameSession {
  sessionId: string;
  title: string;
  createdAt: string;          // ISO 8601
  difficulty: Difficulty;
  phase: GamePhase;
  round: number;              // 1–7
  psychics: Psychic[];
  solution: Record<Category, string>;   // card ids
  ghostHand: string[];        // vision card ids
  ghostDiscardPile: string[];
  outcome: Outcome;
  log: LogEntry[];
}

// log-entry.model.ts
export interface LogEntry {
  round: number;
  psychicId: string;
  target: Category;
  cardsShown: string[];       // vision card ids
  guess: string | null;       // evidence card id
  correct: boolean | null;    // null = final phase vote
}
```

### 3.2 Ghost Engine

```typescript
// ghost.engine.ts
export class GhostEngine {
  selectCards(
    hand: VisionCard[],
    target: EvidenceCard,
    distractors: EvidenceCard[],
    count: number
  ): VisionCard[];
}

// tag-matcher.ts — pure scoring function
export function scoreCard(
  vision: VisionCard,
  target: EvidenceCard,
  distractors: EvidenceCard[]
): number;
  // +2 per shared tag with target
  // -1 per shared tag with any distractor
```

### 3.3 Game Rules

```typescript
// game-rules.ts
export function initSession(params: SetupParams): GameSession;
export function processGuess(session: GameSession, guessCardId: string): GameSession;
export function advanceRound(session: GameSession): GameSession;
export function checkVictoryConditions(session: GameSession): GameSession;
export function processFinalVote(session: GameSession, psychicId: string): GameSession;
```

All functions are **pure** (return new `GameSession` — no mutation). The store calls these and replaces its signal value.

---

## 4. State Layer (`/state`)

State is managed with **Angular Signals** only. No third-party store library.

### 4.1 Game Store

```typescript
// game.store.ts
@Injectable({ providedIn: 'root' })
export class GameStore {

  // --- Writable signals ---
  private _session = signal<GameSession | null>(null);

  // --- Public read-only signals ---
  readonly session = this._session.asReadonly();

  // --- Derived (computed) signals ---
  readonly phase       = computed(() => this._session()?.phase ?? 'setup');
  readonly round       = computed(() => this._session()?.round ?? 0);
  readonly activePsychic = computed(() => /* first unsolved psychic */ );
  readonly ghostHand   = computed(() => /* mapped VisionCard objects */ );
  readonly currentClue = computed(() => /* cards ghost selected this round */ );
  readonly isGameOver  = computed(() => this._session()?.outcome !== null);

  constructor(
    private persistence: PersistenceService,
    private data: DataStore
  ) {
    // Persist on every change
    effect(() => {
      const s = this._session();
      if (s) this.persistence.saveSession(s);
    });
  }

  // --- Mutating methods (call domain functions, replace signal) ---
  startGame(params: SetupParams): void;
  submitGuess(cardId: string): void;
  submitFinalVote(psychicId: string): void;
  abandonGame(): void;
  loadSavedSession(): void;
}
```

### 4.2 Data Store

Loaded once at app startup via `APP_INITIALIZER`.

```typescript
// data.store.ts
@Injectable({ providedIn: 'root' })
export class DataStore {
  readonly suspects  = signal<EvidenceCard[]>([]);
  readonly locations = signal<EvidenceCard[]>([]);
  readonly weapons   = signal<EvidenceCard[]>([]);
  readonly visionCards = signal<VisionCard[]>([]);

  readonly allEvidence = computed(() => [
    ...this.suspects(),
    ...this.locations(),
    ...this.weapons()
  ]);

  findCard(id: string): EvidenceCard | VisionCard | undefined;
}
```

### 4.3 UI Store

```typescript
// ui.store.ts
@Injectable({ providedIn: 'root' })
export class UiStore {
  readonly selectedCardId  = signal<string | null>(null);
  readonly isSubmitting    = signal(false);
  readonly toastMessage    = signal<string | null>(null);
  readonly revealAnimation = signal(false);

  selectCard(id: string): void;
  clearSelection(): void;
  showToast(message: string, durationMs?: number): void;
}
```

---

## 5. Core Services (`/core/services`)

### 5.1 Persistence Service

Abstracts both `localStorage` (small, frequent) and `IndexedDB` (log, history).

```typescript
@Injectable({ providedIn: 'root' })
export class PersistenceService {

  // localStorage — fast, synchronous
  saveSession(session: GameSession): void;
  loadSession(): GameSession | null;
  clearSession(): void;

  // IndexedDB via native API — async
  saveCompletedGame(session: GameSession): Promise<void>;
  listCompletedGames(): Promise<GameSummary[]>;
  loadCompletedGame(sessionId: string): Promise<GameSession | null>;
  deleteCompletedGame(sessionId: string): Promise<void>;
}
```

**IndexedDB schema (`mysterium-solo` database, version 1):**

| Store | Key | Indices |
|-------|-----|---------|
| `completed-games` | `sessionId` | `createdAt`, `outcome` |

### 5.2 Export Service

```typescript
@Injectable({ providedIn: 'root' })
export class ExportService {
  downloadMarkdown(session: GameSession, data: DataStore): void;
  // delegates rendering to domain/export/markdown-renderer.ts
  // triggers browser download via Blob + URL.createObjectURL
}
```

---

## 6. Application Bootstrap (`app.config.ts`)

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      appRoutes,
      withPreloading(QuicklinkStrategy),  // preload adjacent routes
      withComponentInputBinding()
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: (data: DataStore) => () => data.loadAllCards(),
      deps: [DataStore],
      multi: true
    }
  ]
};
```

---

## 7. Routing Architecture

```typescript
// app.routes.ts
export const appRoutes: Routes = [
  { path: '',          loadChildren: () => import('./features/home/home.routes') },
  { path: 'setup',     loadChildren: () => import('./features/setup/setup.routes') },
  {
    path: 'board',
    canActivate: [activeGameGuard],
    loadChildren: () => import('./features/board/board.routes')
  },
  {
    path: 'final',
    canActivate: [activeGameGuard],
    loadChildren: () => import('./features/final-phase/final-phase.routes')
  },
  { path: 'result',   loadChildren: () => import('./features/result/result.routes') },
  { path: '**',        redirectTo: '' }
];
```

### Route Flow

```
/  (home)
  → "New Game"  →  /setup
  → "Resume"    →  /board   (guard checks localStorage)

/setup
  → form submit →  /board

/board
  → all psychics solved       →  /final  (2–3 psychics)
  → 1 psychic + all solved    →  /result
  → round 7 exhausted         →  /result (defeat)

/final
  → vote submitted             →  /result

/result
  → "Save Result"              →  triggers ExportService.downloadMarkdown()
  → "Play Again"               →  /setup
  → "Home"                     →  /
```

---

## 8. Component Communication Patterns

| Pattern | Used when |
|---------|-----------|
| `input()` / `output()` | Parent → child data, child → parent events |
| Injected store signal | Any component reads `GameStore.session` directly |
| `computed()` in component | Derive local view-model from store signals |
| `effect()` in component | Trigger animations on signal change |
| Router navigation | Cross-feature transitions |

No `@Input` decorator — Angular 21 uses the `input()` signal function exclusively.

---

## 9. Offline / PWA Configuration

### 9.1 Service Worker Strategy (`ngsw-config.json`)

```json
{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app-shell",
      "installMode": "prefetch",
      "updateMode": "prefetch",
      "resources": {
        "files": ["/favicon.ico", "/index.html", "/*.css", "/*.js"]
      }
    },
    {
      "name": "game-data",
      "installMode": "prefetch",
      "updateMode": "lazy",
      "resources": {
        "files": ["/assets/**", "/data/**"]
      }
    }
  ]
}
```

All routes are served from the cached app shell. The application has no network calls at runtime — all card data is bundled as static JSON assets prefetched on install.

### 9.2 PWA Manifest (`manifest.webmanifest`)

```json
{
  "name": "Mysterium Solo",
  "short_name": "Mysterium",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0d0b12",
  "theme_color": "#3d1f5c",
  "icons": [
    { "src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 10. Data Initialisation Flow

```
app bootstrap
  └─ APP_INITIALIZER fires DataStore.loadAllCards()
       ├─ fetch('/data/suspects.json')    → DataStore.suspects.set(...)
       ├─ fetch('/data/locations.json')   → DataStore.locations.set(...)
       ├─ fetch('/data/weapons.json')     → DataStore.weapons.set(...)
       └─ fetch('/data/vision-cards.json')→ DataStore.visionCards.set(...)

Service Worker intercepts all fetches above on subsequent loads
→ app works fully offline after first visit
```

---

## 11. Key Angular 21 Patterns Used

| Feature | Usage in this app |
|---------|-------------------|
| Standalone components | Every component — no NgModules anywhere |
| `input()` / `output()` signals | All component I/O |
| `signal()` / `computed()` / `effect()` | All state and derived view-models |
| `provideZonelessChangeDetection()` | App-wide; no Zone.js |
| New control flow (`@if`, `@for`, `@switch`) | All templates |
| `inject()` function | Service injection inside functions/guards |
| Functional guards (`activeGameGuard`) | Route protection without classes |
| `APP_INITIALIZER` | Card data preload before first render |
| `loadChildren` lazy routes | Code-split per feature |

---

## 12. Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Domain (engine, rules, renderer) | Jest | Pure function unit tests — no Angular |
| Stores | Jest + `TestBed` (minimal) | Signal transitions, effect side-effects |
| Components | Angular Testing Library | User-event-driven DOM tests |
| Guards | Jest + `RouterTestingHarness` | Route access control |
| E2E (optional) | Playwright | Full game flow smoke test |

---

## 13. Build & Deployment

```bash
# Development
ng serve

# Production build (outputs to dist/)
ng build --configuration production

# Deploy (static hosting — no server needed)
# GitHub Pages, Netlify, Vercel, or any static file host
```

The production build is a self-contained directory of static files. The Service Worker handles all caching — the app can be deployed to any CDN or even served from a USB drive.

---

## 14. Dependency Summary

```json
{
  "dependencies": {
    "@angular/core":            "~21.0.0",
    "@angular/common":          "~21.0.0",
    "@angular/router":          "~21.0.0",
    "@angular/platform-browser":"~21.0.0",
    "@angular/service-worker":  "~21.0.0"
  },
  "devDependencies": {
    "@angular/cli":             "~21.0.0",
    "@angular/build":           "~21.0.0",
    "jest":                     "^29.0.0",
    "@testing-library/angular": "^17.0.0",
    "typescript":               "~5.7.0"
  }
}
```

Zero runtime dependencies beyond Angular itself. No NgRx, no RxJS-heavy patterns, no UI component library.

---

## 15. Architecture Decision Log

| Decision | Alternative Considered | Reason Chosen |
|----------|----------------------|---------------|
| Signals over NgRx | NgRx Signal Store | Simpler for this scope; no need for devtools at game scale |
| localStorage + IndexedDB over single store | Only localStorage | localStorage has ~5 MB limit; full log history fits better in IndexedDB |
| Static JSON assets over runtime DB | SQLite WASM | No query complexity justifies the ~800 KB WASM overhead |
| Zoneless | Default Zone.js | Signals already drive all updates; Zone.js overhead is unnecessary |
| Pure domain layer | Domain inside services | Enables full unit testing without Angular TestBed spin-up |
| Functional guards | Class-based guards | Angular 21 best practice; simpler with `inject()` |
