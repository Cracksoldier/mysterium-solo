# Mysterium Solo

A browser-based, single-player adaptation of the board game *Mysterium* (Libellud, 2015). An AI Ghost — the murdered spirit — guides you through a murder mystery using only dreamlike vision cards as clues. No server required; runs fully offline as a PWA.

---

## Table of Contents

- [How to Play](#how-to-play)
- [Setup Guide](#setup-guide)
- [Development](#development)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)

---

## How to Play

### The Premise

A murder has occurred. You play as one or more Psychics trying to identify the **Suspect**, **Location**, and **Weapon** behind the crime. An AI Ghost knows the truth but cannot speak — it communicates only through surreal vision cards each round.

### Game Setup

1. Open the app and click **New Game**.
2. Enter a session title (used in the exported report).
3. Choose the number of Psychics: **1, 2, or 3**. Each Psychic gets their own secret solution to solve independently.
4. Choose a difficulty level:

| Difficulty | Vision cards per clue | Ghost hand size | Notes |
|-----------|----------------------|-----------------|-------|
| Easy      | 1–3 (your choice)    | 7               | Ghost always picks the best match |
| Normal    | 1–3 (Ghost decides)  | 6               | Ghost picks reasonably well |
| Hard      | 1 only               | 5               | Ghost picks imperfectly |

5. Click **Begin Game**.

### Each Round (up to 7 rounds)

For each Psychic who hasn't fully solved their board:

1. **The Ghost sends a vision** — one or more dream-scene cards appear in the centre panel. These are your clues.
2. **Make a guess** — select one of the six cards in the current category (Suspect → Location → Weapon, in order) on the right panel.
3. **Result** — a correct guess locks that element in. An incorrect guess costs one round; the Ghost will try again next round with different vision cards.

If all Psychics solve all three elements before round 7 ends, you advance to the Final Phase. If round 7 runs out with any unsolved elements, the game is **lost**.

### Final Phase (2–3 Psychics only)

Once every Psychic has solved their own board, the Ghost reveals a final set of three vision cards — one for each element of the *true* murder. You must vote on which Psychic's board matches the real solution.

- Correct vote → **Victory**
- Wrong vote → **Defeat**

In a single-Psychic game the Final Phase is skipped; solving your board is an automatic win.

### Saving Results

A **Save Result** button is available at game end (and as **Save Progress** at any time during play). This downloads a Markdown report named `mysterium-{date}-{title-slug}.md` containing the full round-by-round log, the solution, and game statistics.

### Resuming a Game

If you close or refresh the browser mid-game, the app detects the saved session on next load and asks whether you want to **Resume** or **Start New Game**.

---

## Setup Guide

### Prerequisites

- **Node.js** 20 or later
- **npm** 11 or later (bundled with Node 20+)
- **Angular CLI** 21 — install globally if not already present:

```bash
npm install -g @angular/cli@21
```

### Install

```bash
git clone <repo-url> mysterium-solo
cd mysterium-solo
npm install
```

### Run the development server

```bash
npm start
# or
ng serve
```

Open `http://localhost:4200/` in your browser. The app reloads automatically on file changes.

### Production build

```bash
npm run build
# or
ng build --configuration production
```

Artifacts are written to `dist/mysterium-solo/browser/`. This is a self-contained set of static files — no server is required. Deploy to GitHub Pages, Netlify, Vercel, or any static host.

### Run unit tests

```bash
npm test
# or
jest
```

Tests cover the domain layer (Ghost engine, tag-matching scoring, game-rules state transitions) with Jest. No Angular `TestBed` spin-up needed for the pure domain functions.

---

## Project Structure

```
mysterium-solo/
├── src/
│   ├── app/
│   │   ├── core/               # Singleton services and route guards
│   │   │   ├── services/
│   │   │   │   ├── persistence.service.ts   # localStorage + IndexedDB façade
│   │   │   │   └── export.service.ts        # Markdown file download
│   │   │   └── guards/
│   │   │       └── active-game.guard.ts     # Redirects if no game is in progress
│   │   │
│   │   ├── data/               # Static JSON card assets
│   │   │   ├── suspects.json
│   │   │   ├── locations.json
│   │   │   ├── weapons.json
│   │   │   └── vision-cards.json
│   │   │
│   │   ├── domain/             # Pure TypeScript — zero Angular dependencies
│   │   │   ├── models/         # Shared interfaces (EvidenceCard, GameSession, …)
│   │   │   ├── engine/
│   │   │   │   ├── ghost.engine.ts          # Vision card selection algorithm
│   │   │   │   ├── game-rules.ts            # Pure round/phase state transitions
│   │   │   │   └── tag-matcher.ts           # Relevance scoring (+2 target / -1 distractor)
│   │   │   └── export/
│   │   │       └── markdown-renderer.ts     # GameSession → Markdown string
│   │   │
│   │   ├── state/              # Angular Signals store
│   │   │   ├── game.store.ts   # Central game state (session, phase, round, psychics)
│   │   │   ├── data.store.ts   # Loaded card data (read-only after init)
│   │   │   └── ui.store.ts     # Transient UI state (selection, toast, animation)
│   │   │
│   │   ├── features/           # Lazy-loaded route screens
│   │   │   ├── home/           # Landing screen
│   │   │   ├── setup/          # Game configuration form
│   │   │   ├── board/          # Main game board (vision panel, evidence panel, status)
│   │   │   ├── final-phase/    # Final vote screen (2–3 psychics)
│   │   │   └── result/         # Victory / defeat + export
│   │   │
│   │   └── shared/             # Reusable UI primitives (modal, progress-bar, toast)
│   │
│   └── styles.css              # Global dark-theme CSS custom properties
```

---

## Architecture Overview

### Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Angular 21 — standalone components, no NgModules |
| State | Angular Signals (`signal`, `computed`, `effect`) — no NgRx |
| Change detection | Zoneless (`provideZonelessChangeDetection()`) |
| Persistence | `localStorage` (active session) + `IndexedDB` (completed game history) |
| Offline | Angular PWA / Service Worker — full asset caching |
| Testing | Jest + Angular Testing Library |
| Build | Angular CLI / esbuild |

### Ghost AI

The Ghost is a **deterministic tag-matching engine**, not an LLM. Every vision card and every evidence card carries a list of thematic tags. When the Ghost selects clue cards it scores each card in its hand:

- **+2** for each tag shared with the target evidence card
- **−1** for each tag shared with any other evidence card in the same category

The top-scoring cards are selected. Difficulty controls how many cards are shown and how large the Ghost's hand is. Ties are broken with a fixed random seed for reproducibility.

### State Flow

All game state lives in `GameStore` as a single `signal<GameSession | null>`. Domain functions in `game-rules.ts` are **pure** — they receive the current session and return a new one. The store replaces its signal value with the result, and an `effect()` automatically persists to `localStorage` on every change.

### Route Flow

```
/ (home)
 → New Game  →  /setup
 → Resume    →  /board

/setup  →  /board

/board
 → all psychics solved (2–3)  →  /final
 → 1 psychic + solved         →  /result
 → round 7 exhausted          →  /result (defeat)

/final  →  /result

/result
 → Save Result   → downloads .md file
 → Play Again    → /setup
```

### Persistence

| Storage | Used for |
|---------|----------|
| `localStorage` | Active session — fast, synchronous, survives refresh |
| `IndexedDB` | Completed game history — async, handles larger log payloads |

### PWA / Offline

After the first load the Service Worker caches the app shell and all JSON card data. The app runs fully offline on subsequent visits — there are no runtime network calls.
