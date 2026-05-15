# CLAUDE.md — MEGA888 Play For Fun

Read this first. Then read `BRIEF.md` for the full spec.

## Project
A 4-game arcade hub for MEGA888 brand awareness, designed for sharing on Telegram. Hub page → links to 4 games (Dino, Flappy, Snake, Stack Tower). No CTAs inside the games — only a "Join Telegram" button in the shared footer.

## Stack
- Vanilla HTML / CSS / JavaScript only
- HTML5 Canvas for game rendering
- No frameworks (no React, Vue, etc.)
- No build step (no webpack, vite, npm scripts)
- No npm dependencies — files serve as-is from disk
- Cloudflare Pages for hosting (auto-deploys from `main`)

## Working Style
- **Review-and-approve workflow:** the owner reviews before merging. Explain what changed and why.
- **One game at a time:** finish Dino fully, then Flappy, then Snake, then Stack. Don't half-build all four in parallel.
- **No surprise dependencies:** ask before adding anything external.
- **Mobile-first:** assume 60%+ of traffic is Telegram-on-phone.
- **Performance matters:** target 60fps on mid-range Android.

## Code Conventions
- ES6+ JavaScript, no transpilation
- 2-space indentation
- Single quotes for strings, template literals for interpolation
- Functions over classes when possible
- Comment the "why," not the "what"
- File names: lowercase with hyphens
- One concept per file when reasonable

## File Map
- `index.html` — hub page
- `style.css` — shared theme + hub layout
- `shared/header.js` — injects header into every page (MEGA888 logo + PLAY FOR FUN tag)
- `shared/footer.js` — injects footer into every page (Join Telegram button)
- `shared/tracking.js` — affiliate param flow
- `games/[name]/index.html` — game entry point
- `games/[name]/game.js` — game logic
- `games/[name]/style.css` — game-specific styles

## What NOT to Do
- ❌ Don't add React/Vue/Svelte/any framework
- ❌ Don't add a build step or bundler
- ❌ Don't add npm packages
- ❌ Don't add CTAs, popups, or lead-capture forms INSIDE games
- ❌ Don't add Google Analytics or tracking pixels (affiliate params only)
- ❌ Don't add real-money or gambling mechanics in the games — these are play-for-fun only
- ❌ Don't modify `BRIEF.md` without asking
- ❌ Don't commit `.env`, API keys, or secrets
- ❌ Don't use external image assets in Phase 1 — Canvas drawing only

## Build Order (Phase 1)
1. Shared scripts: `header.js`, `footer.js`, `tracking.js`
2. Hub page: `index.html` + `style.css`
3. Game 1: Dino Runner — finish completely, test, commit
4. Game 2: Flappy clone — same flow
5. Game 3: Snake — same flow
6. Game 4: Stack Tower — same flow
7. Final pass: cross-game consistency, mobile testing

Commit after each step with a clear message like `feat(dino): initial game loop` or `fix(snake): swipe controls on iOS`.

## Affiliate Params
Always preserve these from URL → outbound clicks:
- `aff` (e.g., `mega888a`, `tgcampaign01`)
- `utm_source`, `utm_medium`, `utm_campaign`

Flow:
1. Page load → `tracking.js` reads URL params → saves to `sessionStorage` as `mega888_arcade_params`
2. `tracking.js` finds all `.cta-btn` and `.aff-link` elements → appends params to `href`
3. This runs on every page (hub + games) so params persist across navigation
4. With the current header (no CTA) + footer (Telegram only), the Telegram link is the main outbound that receives the params

## High Score Keys (localStorage)
- `mega888_dino_high_score`
- `mega888_flappy_high_score`
- `mega888_snake_high_score`
- `mega888_stack_high_score`

The hub reads all four to display on game cards.

## Shared Color Palette
```css
--bg: #0a0e27;          /* deep navy */
--accent: #d4af37;      /* gold */
--highlight: #ffd700;   /* bright gold */
--danger: #c0392b;      /* red */
--white: #ecf0f1;
--text-on-dark: #ffffff;
--text-on-gold: #0a0e27;
```

Use CSS variables in `style.css` so all pages share the theme.

## Testing Checklist (per game)
- [ ] Plays correctly on Chrome desktop
- [ ] Plays correctly on Chrome Android (DevTools mobile mode is fine for now)
- [ ] No console errors
- [ ] High score persists after refresh
- [ ] "← Back to Arcade" link works
- [ ] Telegram link preserves `?aff=` param
- [ ] Game pauses when tab is hidden
- [ ] 60fps in Chrome DevTools Performance tab

## Brand Voice (for hub copy only — games have no copy)
- Punchy, fun, slightly hyped
- Short and energetic — short attention spans
- Frame everything as "play for fun" — no claims about real winnings, odds, or payouts
- Telegram is the channel of record

## When in Doubt
- Default to simpler
- Prefer fewer files
- Ask before adding complexity
- Mobile UX > desktop UX
