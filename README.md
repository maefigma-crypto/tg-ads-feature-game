# MEGA888 Play For Fun

A mini-game arcade hub for MEGA888 brand awareness, optimized for sharing on Telegram. Players land on the hub, pick a game, play, come back. The only outbound link is a "Join Telegram" button in the footer — never inside the games.

## What's in this repo

- **Hub page** — grid of game cards, MEGA888 logo + "PLAY FOR FUN" tag in header
- **4 games** — Dino Runner, Flappy, Snake, Stack Tower
- **Shared header/footer** — MEGA888 branding + Telegram link
- **Affiliate tracking** — `?aff=` / `?utm_*` params preserved on the Telegram link

## Tech
- Vanilla HTML, CSS, JavaScript only
- No frameworks, no build step
- HTML5 Canvas for game rendering
- Deployed via GitHub → Cloudflare Pages

## Quick start

```bash
git clone https://github.com/maefigma-crypto/tg-ads-feature-game.git
cd tg-ads-feature-game
# Just open index.html in a browser, or:
npx serve .
```

## Project docs
- `BRIEF.md` — full project spec (read this first)
- `CLAUDE.md` — Claude Code working rules
- `DEPLOY.md` — GitHub + Cloudflare deployment steps

## File structure
```
/
├── index.html              # Hub page
├── style.css               # Shared styles
├── shared/
│   ├── header.js           # Header with MEGA888 logo + PLAY FOR FUN tag
│   ├── footer.js           # Footer with Join Telegram button
│   └── tracking.js         # Affiliate param handler
├── games/
│   ├── dino/
│   ├── flappy/
│   ├── snake/
│   └── stack/
└── assets/
    └── thumbnails/
```
