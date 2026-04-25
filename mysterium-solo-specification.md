# Mysterium Solo — Web Application Specification

---

## 1. Overview

**Mysterium Solo** is a browser-based, single-player adaptation of the board game *Mysterium* (Libellud, 2015). The application acts as an AI Ghost — the murdered spirit — and guides one human player acting as a team of Psychics. The Ghost communicates only through dreamlike vision cards (rendered as evocative text scenes or images). The Psychic must use these clues to identify the correct Suspect, Location, and Weapon. Results are exportable as a Markdown file.

---

## 2. Game Concept (Rules Adaptation)

### 2.1 Roles

| Role | Controller | Count |
|------|-----------|-------|
| Ghost | AI (Game Master) | 1 |
| Psychic | Human player | 1–3 (player's choice at setup) |

The Ghost knows the murder solution but cannot speak — it may only send Vision Cards each round.

### 2.2 Game Components (Virtual)

- **Suspects**: 6 character cards (unique names, visual description, personality blurb)
- **Locations**: 6 location cards (unique names, atmospheric description)
- **Weapons**: 6 object/weapon cards (unique names, description)
- **Vision Cards**: 84 dream scenes described as richly illustrated text (see §4.3) — or optionally AI-generated surreal images
- **Progress Track**: 7 rounds maximum
- **Crow Markers**: Each Psychic has 2 per round (used to change a guess after seeing others' choices — irrelevant in solo with 1 Psychic; simplified or removed)

### 2.3 Setup

1. Player chooses number of Psychics (1, 2, or 3) and difficulty level.
2. The GM secretly draws one Suspect + Location + Weapon card for **each** Psychic to solve individually.
3. The Ghost draws 7 Vision Cards per Psychic into its "hand" for the first round.

### 2.4 Round Structure (Rounds 1–7)

For each active Psychic who has not yet identified all three elements:

1. **Ghost sends Vision Cards** — the AI selects 1–3 cards from its hand and presents them to the Psychic as the clue for the current unsolved element (Suspect → Location → Weapon, in order).
2. **Psychic guesses** — the player chooses one of the 6 cards for the current element.
3. **Result revealed** — correct guesses lock in; incorrect guesses allow the player to try again next round. The Ghost draws back up to 7 cards.
4. If all Psychics have solved all three elements before round 7, proceed to the **Final Phase**. If round 7 ends and any Psychic is incomplete, the game is lost.

### 2.5 Difficulty Levels

| Level | Vision Cards per clue | Ghost hand size | Notes |
|-------|-----------------------|-----------------|-------|
| Easy | 1–3 (player's choice) | 7 | Ghost always picks best match |
| Normal | 1–3 (Ghost decides) | 6 | Ghost picks reasonably well |
| Hard | 1 only | 5 | Ghost picks imperfectly |

### 2.6 Final Phase (The Reveal)

Once all Psychics have solved their individual boards:
- The Ghost reveals a set of 3 Vision Cards — one each for the true murder Suspect, Location, and Weapon (one randomly selected from all individual solutions).
- The player must vote: which Psychic's solved board is the true murder?
- Correct vote = **Victory**. Wrong vote = **Defeat**.
- In a 1-Psychic game, the Final Phase is skipped; the single solution is the answer, and the game is won automatically if the Psychic solved their board.

---

## 3. Application Architecture

### 3.1 Tech Stack (Recommended)

- **Frontend**: Single-page application (React or vanilla JS + HTML/CSS)
- **State management**: In-memory JavaScript state + `localStorage` for game persistence
- **AI Ghost logic**: Deterministic card-matching algorithm (no external API required — see §4.4)
- **Export**: Client-side Markdown generation via `Blob` and `URL.createObjectURL`
- **No backend required** — fully static, deployable to GitHub Pages / Netlify / similar

### 3.2 File Structure

```
/
├── index.html
├── app.js          # Game engine + UI controller
├── data/
│   ├── suspects.json
│   ├── locations.json
│   ├── weapons.json
│   └── vision-cards.json
├── styles.css
└── export.js       # Markdown export module
```

---

## 4. Core Features

### 4.1 Game Setup Screen

- Player enters a game name / session title
- Selects number of Psychics (1–3)
- Selects difficulty level
- Optionally: enters names for each Psychic
- "Begin Game" button triggers secret solution assignment and first-round card draw

### 4.2 Main Game Board UI

**Layout (three columns):**

**Left panel — Psychic Overview**
- Active round indicator (1–7) and round progress bar
- Per-Psychic status: which elements are solved (checkmark) vs. pending
- Crow markers remaining (if applicable)

**Center panel — Current Clue**
- Heading: "The Ghost sends you a vision…"
- Vision Card display: one or more richly styled text cards with a title and 3–5 sentence dream description
- Subtle card visual styling (dark, surreal aesthetic — deep purples, misted imagery)

**Right panel — The Evidence Board**
- Six card slots each for Suspects, Locations, Weapons
- Each card shows name + brief descriptor
- Cards are selectable; selected card highlights
- A "Submit Guess" button becomes active when a card is selected
- Correct guesses are locked with a visual marker; incorrect guesses show a subtle shake animation and cost one round

### 4.3 Vision Card Format

Each Vision Card in `vision-cards.json` is structured as:

```json
{
  "id": "vc_042",
  "title": "The Hollow Clock",
  "scene": "A grandfather clock stands alone in a flooded ballroom, its hands melted into spirals. From the bell tower above, moths pour outward like smoke. The floor reflects a sky that does not exist overhead.",
  "tags": ["time", "decay", "indoor", "height", "insects", "mirror", "old"]
}
```

The Ghost's matching algorithm (§4.4) uses `tags` to associate cards with solution elements.

Each Suspect, Location, and Weapon card also carries tags:

```json
{
  "id": "suspect_03",
  "name": "Elara Voss",
  "description": "A retired clockmaker with silver-laced gloves and hollow eyes.",
  "tags": ["time", "hands", "age", "craftsmanship", "silver", "quiet"]
}
```

### 4.4 Ghost AI — Card Selection Logic

The Ghost is a deterministic matching engine, not an LLM. Its goal is to select Vision Cards that share the most tags with the target card while excluding cards that strongly match *other* solution elements (to avoid giving false leads).

**Algorithm per clue:**

1. Compute a **relevance score** for each Vision Card in the Ghost's hand:
   - `+2` for each tag shared with the **target** element card
   - `-1` for each tag shared with any **non-target** element of the same category (e.g., other suspects)
2. Sort by score descending.
3. Select top N cards based on difficulty (see §2.5).
4. Remove selected cards from the Ghost's hand; draw replacements at round end.

**Tie-breaking**: random selection among equal-score cards, seeded for reproducibility.

### 4.5 Game State Persistence

- Game state is saved to `localStorage` on every action.
- On load, if a saved game exists, prompt: "Resume previous game?" or "Start new game."
- State schema:

```json
{
  "sessionId": "uuid",
  "title": "Session title",
  "difficulty": "normal",
  "round": 3,
  "solution": { "suspect": "suspect_03", "location": "loc_01", "weapon": "wpn_05" },
  "psychics": [
    {
      "name": "Player 1",
      "solved": { "suspect": "suspect_03", "location": null, "weapon": null },
      "currentTarget": "location",
      "history": []
    }
  ],
  "ghostHand": ["vc_042", "vc_017"],
  "log": []
}
```

### 4.6 Game Log

All significant events are appended to a structured `log` array:

```json
{
  "round": 2,
  "psychic": "Player 1",
  "target": "suspect",
  "cardsShown": ["vc_042"],
  "guess": "suspect_03",
  "correct": true
}
```

This log is the basis for the Markdown export.

---

## 5. Markdown Export

Triggered by a "Save Result" button visible at game end (and optionally mid-game as a "Save Progress" button).

### 5.1 Output Format

```markdown
# Mysterium Solo — Session Report
**Date:** 2026-04-25
**Title:** The Ashwood Mansion Case
**Difficulty:** Normal
**Outcome:** VICTORY

---

## Players
- Psychic 1: Elena

## Solution
- **Suspect:** Elara Voss
- **Location:** The Cellar
- **Weapon:** The Glass Shard

---

## Round-by-Round Log

### Round 1 — Suspect Clue for Elena
**Vision Cards Shown:**
- *The Hollow Clock* — A grandfather clock stands alone in a flooded ballroom…

**Guess:** Elara Voss ✓

### Round 2 — Location Clue for Elena
**Vision Cards Shown:**
- *Roots That Weep* — A staircase descends into earth…
- *The Drowned Lantern* — A lantern sways in still water…

**Guess:** The Study ✗ (incorrect — 1 round used)

### Round 3 — Location Clue for Elena (retry)
...

---

## Final Phase
The Ghost's final vision pointed to **Elena's board**.
**Player voted:** Elena's board ✓

---

## Statistics
- Rounds used: 5 / 7
- Incorrect guesses: 1
- Cards seen: 11
```

### 5.2 Export Implementation

- File name: `mysterium-{date}-{title-slug}.md`
- Triggered client-side via `Blob` download — no server call
- The "Save Result" button is always available (even mid-game), exporting current progress

---

## 6. UI/UX Design Guidelines

### 6.1 Visual Aesthetic

- Dark theme: near-black background (`#0d0b12`), deep purples, muted amber accents
- Vision Cards styled as physical cards: slightly off-white aged paper texture, serif title font, italic body text
- Suspect/Location/Weapon cards: illustrated style with name and icon
- Transitions: slow fade-ins for card reveals (suggest dreamlike quality)
- No hard borders — soft glows and gradients preferred

### 6.2 Accessibility

- All interactions keyboard navigable
- Vision Card text is readable (minimum 16px, high contrast against card background)
- Screen-reader labels on all interactive elements
- Colour is never the sole indicator of game state

### 6.3 Responsive Layout

- Desktop-first but mobile-friendly
- On small screens: stacked single-column layout with collapsible panels

---

## 7. Edge Cases & Rules Clarifications

| Scenario | Handling |
|----------|----------|
| Player runs out of rounds with unsolved elements | Game Over screen, show correct solution, offer export |
| 1-Psychic game — Final Phase | Skip; automatic win if all 3 elements solved |
| Ghost's hand exhausted | Reshuffle discarded cards (excluding last round's cards) |
| All vision cards share equal relevance score | Random selection with fixed seed for reproducibility |
| Player refreshes mid-game | Restore from `localStorage` automatically |

---

## 8. Out of Scope (v1)

- Multiplayer / networked play
- Actual Mysterium card artwork (use text descriptions only to avoid copyright)
- LLM-powered Ghost (deterministic algorithm is sufficient and avoids API dependency)
- Sound / music
- Accounts or cloud saves
- Mobile app packaging

---

## 9. Deliverables Checklist

- [ ] `suspects.json`, `locations.json`, `weapons.json` — 6 cards each, fully tagged
- [ ] `vision-cards.json` — minimum 42 cards (recommended 84), richly described and tagged
- [ ] Game engine with complete round/phase logic
- [ ] Ghost AI card-selection algorithm
- [ ] Full UI (setup, main board, final phase, game-over screens)
- [ ] `localStorage` save/restore
- [ ] Markdown export
- [ ] Basic test suite for Ghost algorithm and state transitions
