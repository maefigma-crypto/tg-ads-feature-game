# MegaGamee — Project Brief

## Overview
A browser-based mini-game arcade for MegaGamee brand awareness, designed to be shared on Telegram. Players visit a **hub page**, choose from 4 games, and play. The games themselves contain **no CTAs, no popups, no lead capture**. The only outbound link lives in a persistent footer (Join Telegram). The header carries the MegaGamee logo and a small "PLAY FOR FUN" tag, no outbound CTA.

## Goals
1. **Engagement** — fun, replayable games that get shared on Telegram
2. **Brand exposure** — MegaGamee logo always visible without interrupting gameplay
3. **Affiliate attribution** — `?aff=...`, `?utm_*` passed through to the Telegram outbound link
4. **Lightweight** — fast loads on Malaysian 4G, mobile-first

## Tech Stack
- Vanilla **HTML / CSS / JavaScript** only
- HTML5 Canvas for game rendering
- No frameworks, no npm dependencies, no build step
- `localStorage` for high scores
- `sessionStorage` for affiliate params
- Deployed via **GitHub → Cloudflare Pages** (auto-deploy on push to `main`)

---

## Architecture

```
/
├── index.html                  # Hub page (grid of games)
├── style.css                   # Shared styles
├── shared/
│   ├── header.js               # Injects header into every page
│   ├── footer.js               # Injects footer into every page
│   └── tracking.js             # Affiliate param handler
├── games/
│   ├── dino/
│   │   ├── index.html
│   │   ├── game.js
│   │   └── style.css
│   ├── flappy/
│   │   ├── index.html
│   │   ├── game.js
│   │   └── style.css
│   ├── snake/
│   │   ├── index.html
│   │   ├── game.js
│   │   └── style.css
│   └── stack/
│       ├── index.html
│       ├── game.js
│       └── style.css
└── assets/
    └── thumbnails/             # 4 game cover images (placeholder OK)
```

### Why this structure
- Each game is self-contained → easy to add/remove
- Shared header/footer injected via JS → update once, applies everywhere
- No CTAs inside games → cleaner gameplay, less ad-fatigue

---

## Hub Page (`index.html`)

### Layout
```
┌─────────────────────────────────────────────┐
│  [MegaGamee Logo]              [PLAY FOR FUN] │  ← header
├─────────────────────────────────────────────┤
│                                             │
│           🎮 MegaGamee                       │
│       Pick a game. Beat your high score.    │
│                                             │
│   ┌───────┐  ┌───────┐                      │
│   │ DINO  │  │FLAPPY │                      │
│   │  🦖   │  │  🐦   │                      │
│   │  HS:  │  │  HS:  │                      │
│   └───────┘  └───────┘                      │
│   ┌───────┐  ┌───────┐                      │
│   │ SNAKE │  │ STACK │                      │
│   │  🐍   │  │  📦   │                      │
│   │  HS:  │  │  HS:  │                      │
│   └───────┘  └───────┘                      │
│                                             │
├─────────────────────────────────────────────┤
│                [Join Telegram]              │  ← footer
└─────────────────────────────────────────────┘
```

### Features
- Header always visible (sticky on scroll)
- Game card grid: 2x2 on mobile, 4x1 on desktop
- Each card shows: emoji, game name, current high score (from localStorage)
- Tap card → navigates to `/games/[name]/index.html`
- Footer with Join Telegram button (the only outbound link)

---

## Shared Header (`shared/header.js`)

### Behavior
- Injected into every page (hub + all 4 games)
- Contains:
  - **MegaGamee logo** (top-left, links to hub `/`)
  - **"PLAY FOR FUN" tag** (top-right, decorative — not a link)
- Sticky position
- Mobile: compact, no clutter

### Example
```html
<header class="ocs8-header">
  <a href="/" class="logo" aria-label="MegaGamee home">Mega<span>Gamee</span></a>
  <span class="brand-tag">PLAY FOR FUN</span>
</header>
```

---

## Shared Footer (`shared/footer.js`)

### Behavior
- Injected into every page
- Contains:
  - "Join Telegram" button (link to MegaGamee Telegram channel)
- Bottom of viewport on hub
- Bottom of viewport on game pages but **minimized / collapsible** so it doesn't obstruct gameplay (tap the small tab to expand)

---

## Affiliate Tracking (`shared/tracking.js`)

### Logic
On page load:
1. Read URL params: `aff`, `utm_source`, `utm_medium`, `utm_campaign`
2. If present, save to `sessionStorage` as `megagamee_arcade_params`
3. Find all elements with class `cta-btn` or `aff-link`
4. Append stored params to their `href`

The Join Telegram button has class `aff-link`, so it picks up the params on every page. If future outbound links are added, they just need the `cta-btn` or `aff-link` class to participate.

Example: a player landing on `/?aff=mega888a&utm_source=telegram` and clicking "Join Telegram" on any game page hits `https://t.me/mega888?aff=mega888a&utm_source=telegram`.

---

## GAME 1: Dino Runner

**Path:** `/games/dino/`

### Mechanics
- Character auto-runs left to right
- **Space / tap** → jump
- **Down arrow / swipe down** → duck
- Obstacles: ground obstacles (jump over) and flying obstacles (duck under)
- Speed increases every 500 points
- Collision = game over

### Visuals
- Dark navy background (`#0a0e27`)
- Gold character + ground line (`#d4af37`)
- Red ground obstacles (chip stacks shape)
- White flying obstacles (card shape)
- Simple parallax: 2 background layers

### Scoring
- +1 per frame alive
- High score saved as `megagamee_dino_high_score`

### Game Over
- Shows: "GAME OVER · Score: X · High: Y · [PLAY AGAIN] [← BACK TO ARCADE]"
- **No bonus CTA, no input fields, no popups**

---

## GAME 2: Flappy Bird Clone

**Path:** `/games/flappy/`

### Mechanics
- Bird falls due to gravity
- **Space / tap** → flap (small upward boost)
- Pipes scroll left, gap between top and bottom pipe
- Pass through gap = +1 score
- Hit pipe or ground = game over

### Visuals
- Dark navy background with stars
- Gold bird (simple circle with wing animation)
- Red pipes
- Score in top-center, large

### Scoring
- +1 per pipe passed
- High score saved as `megagamee_flappy_high_score`

### Game Over
- Shows: "GAME OVER · Score: X · High: Y · [PLAY AGAIN] [← BACK TO ARCADE]"

---

## GAME 3: Snake

**Path:** `/games/snake/`

### Mechanics
- Snake moves on a grid
- **Arrow keys / swipe** → change direction
- Eat food = grow by 1 segment + score
- Hit wall or own body = game over
- Grid: 20×20 cells

### Visuals
- Dark navy grid background
- Gold snake segments
- Red food dot (chip icon)
- Optional: brief flash effect when eating

### Scoring
- +10 per food eaten
- High score saved as `megagamee_snake_high_score`

### Controls
- Desktop: arrow keys (+ WASD)
- Mobile: swipe gestures (4 directions)

### Game Over
- Shows: "GAME OVER · Score: X · High: Y · [PLAY AGAIN] [← BACK TO ARCADE]"

---

## GAME 4: Stack Tower

**Path:** `/games/stack/`

### Mechanics
- A block slides horizontally above the tower
- **Tap / Space** → drop the block
- If misaligned, the overhang portion **falls off** and the next block is narrower
- If perfectly aligned, no shrinking + bonus points
- Block too small to land = game over
- Tower grows upward; camera scrolls up

### Visuals
- Dark navy background
- Gold/red alternating block colors (or gradient hue per level)
- Tower base at bottom
- Smooth camera scroll as tower grows

### Scoring
- +1 per block stacked
- +5 bonus for perfect alignment
- High score saved as `megagamee_stack_high_score`

### Controls
- Desktop: spacebar
- Mobile: tap anywhere

### Game Over
- Shows: "GAME OVER · Height: X · Best: Y · [PLAY AGAIN] [← BACK TO ARCADE]"

---

## Shared Game Conventions

All 4 games must follow these rules:

1. **No CTAs inside the game canvas** — header/footer only
2. **"← BACK TO ARCADE" link** visible at all times (top-left under header)
3. **Pause on tab switch** — pause game when `document.hidden` is true
4. **Responsive** — works on screens 320px to 1920px wide
5. **Touch-friendly** — all controls must work on mobile
6. **60fps target** on mid-range Android
7. **No external assets** in Phase 1 — use Canvas drawing only (shapes, colors)
8. **High score** persists in localStorage with key `megagamee_[game]_high_score`
9. **Theme consistency** — same color palette across all games

### Shared Color Palette
- Background: `#0a0e27` (deep navy)
- Primary accent: `#d4af37` (gold)
- Highlight: `#ffd700` (bright gold)
- Danger / obstacles: `#c0392b` (red)
- White elements: `#ecf0f1`
- Text: `#ffffff` on dark, `#0a0e27` on gold

---

## Phase 1 Scope (build this first)

- [x] Hub page with 4 game cards
- [x] Shared header + footer + tracking scripts
- [x] Dino Runner (functional, placeholder shapes)
- [x] Flappy clone (functional)
- [x] Snake (functional)
- [x] Stack Tower (functional)
- [x] All games show high scores on hub
- [x] Affiliate params flow through every page → Telegram link
- [x] Mobile-responsive
- [ ] Deployable to Cloudflare Pages

## Phase 2 (later)
- Real MegaGamee brand assets / icons replacing emoji
- Sound effects (with mute toggle)
- Cloudflare Worker + KV for global leaderboard
- "Daily challenge" featured game on hub
- Telegram share button per game (deep-link with score)
- Service worker for offline play

## Out of Scope
- No user accounts / login
- No payment integration
- No real-money mechanics — all games are play-for-fun
- No tracking pixels beyond affiliate params
- No third-party scripts

---

## Acceptance Criteria
- All 4 games playable end-to-end
- Hub navigation works on mobile and desktop
- Join Telegram button preserves `?aff=` param from hub through to outbound click
- Page weight per game under 50KB (HTML + CSS + JS)
- No console errors
- No npm dependencies
- Deploys to Cloudflare Pages with zero config
