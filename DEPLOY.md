# DEPLOY.md — GitHub + Cloudflare Pages Setup

Step-by-step to get from zero to live URL.

## Prerequisites
- GitHub account
- Cloudflare account (free tier)
- Git for Windows (already installed)
- Claude Code installed

---

## Step 1: Project folder

If you're cloning fresh:

```bash
git clone https://github.com/maefigma-crypto/tg-ads-feature-game.git
cd tg-ads-feature-game
```

Or if you're starting from a local working copy:

```bash
cd "Tg Ads Feature"   # or whatever your local folder is named
git init
git branch -M main
git add .
git commit -m "Initial project brief and Claude Code config"
```

---

## Step 2: GitHub repo

The repo is at `https://github.com/maefigma-crypto/tg-ads-feature-game`. If you need to (re)connect locally:

```bash
git remote add origin https://github.com/maefigma-crypto/tg-ads-feature-game.git
git push -u origin main
```

---

## Step 3: Run Claude Code

In the repo folder:

```bash
claude
```

Tell Claude Code:

> Read CLAUDE.md and BRIEF.md. Start with Phase 1. Build the shared scripts (header, footer, tracking) and the hub page first. Then we'll build games one at a time, starting with Dino Runner.

Review each step, test locally (open `index.html` in a browser or run `npx serve .`), then commit.

After hub is working:
> Now build Game 1: Dino Runner per the spec in BRIEF.md.

After Dino works:
> Now build Game 2: Flappy clone.

...and so on through Snake and Stack Tower.

---

## Step 4: Connect Cloudflare Pages

1. Go to **dash.cloudflare.com → Workers & Pages → Create → Pages**
2. Click **Connect to Git**
3. Authorize GitHub if needed, select `tg-ads-feature-game`
4. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
   - **Root directory:** `/`
5. Click **Save and Deploy**

You'll get a URL like `tg-ads-feature-game.pages.dev` within ~30 seconds.

Every `git push origin main` auto-deploys. Pull requests get preview URLs.

---

## Step 5: Custom domain (optional)

In Cloudflare Pages project:
1. **Custom domains → Set up a custom domain**
2. Enter a subdomain, e.g.:
   - `play.mega888.com`
   - `arcade.mega888.com`
   - `games.mega888.com`
3. Cloudflare auto-configures DNS if the domain is on Cloudflare
4. SSL/HTTPS is automatic

---

## Step 6: Test the live URL

Open the URL in your phone browser. Check:
- Hub loads, all 4 game cards visible
- Tap each card → game opens and plays
- MegaGamee header visible on every page
- "Join Telegram" footer button visible (collapsed strip on game pages)
- Test affiliate params: `https://your-url.com/?aff=mega888a&utm_source=test`
  - Click a game, then click the Telegram footer button
  - Outbound URL should include `?aff=mega888a&utm_source=test`

---

## Branch Workflow (recommended)

- `main` — production (auto-deploys to live URL)
- `dev` — staging (auto-deploys to preview URL)
- Feature branches: `feature/dino`, `feature/snake`, `fix/mobile-controls`

For Claude Code sessions on new features:

```bash
git checkout -b feature/snake
claude
# ... let Claude Code build ...
git add .
git commit -m "feat(snake): initial game with swipe controls"
git push origin feature/snake
# Open PR on GitHub → review → merge to main → auto-deploys
```

---

## Quick local testing

No build step needed. Two options:

**Option A — open file directly:**
Double-click `index.html` (some browsers restrict localStorage with `file://` URLs — option B is safer)

**Option B — local server:**
```bash
npx serve .
# Opens at http://localhost:3000
```

Or using Python (no Node required):

```bash
python -m http.server 8765
# Opens at http://localhost:8765
```

---

## Cost estimate

- **GitHub:** free (public repo)
- **Cloudflare Pages:** free (unlimited requests, 500 builds/month)
- Custom domain: just normal domain registration cost

**Total: $0/month** for Phase 1.

Phase 2 (when adding Worker + KV for leaderboard):
- Workers: free up to 100k requests/day, then $5/month for 10M
- KV: free up to 100k reads/day, 1k writes/day

---

## Troubleshooting

**Build fails on Cloudflare Pages**
→ Make sure build command is **empty** and output dir is `/`

**Page loads but games don't show**
→ Check browser console; likely a path issue. Use relative paths (`./game.js`) not absolute (`/game.js`)

**Affiliate params dropped between hub and game**
→ Check that `tracking.js` runs on page load **before** any redirects. The Telegram link is the main outbound — confirm it has class `aff-link`.

**Game lags on mobile**
→ Profile in Chrome DevTools Performance tab; usually too many objects rendered per frame or no `requestAnimationFrame`

**Local file:// breaks localStorage**
→ Use `npx serve .` or `python -m http.server` instead of opening the HTML file directly
