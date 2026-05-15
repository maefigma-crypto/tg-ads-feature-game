// Stack Tower — OCS8 Arcade
// Drop sliding blocks onto a growing tower. Misaligned overhangs fall off.

(function () {
  'use strict';

  const HS_KEY = 'mega888_stack_high_score';
  const LOGICAL_W = 400;
  const LOGICAL_H = 600;

  // Tuning
  const BLOCK_H = 30;
  const BASE_W = 220;
  const BASE_SPEED = 200;        // px/s horizontal speed of moving block
  const SPEED_RAMP = 6;          // +px/s per stacked block
  const MAX_SPEED = 520;
  const PERFECT_TOLERANCE = 4;   // px — within this, treated as perfect
  const CAMERA_HEAD_ROOM = 220;  // how far from top we keep the moving block
  const GRAVITY = 1600;          // px/s^2 for overhang fall-off animation

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMsg = document.getElementById('overlay-msg');
  const playBtn = document.getElementById('play-btn');
  const scoreEl = document.getElementById('score');
  const hsEl = document.getElementById('hs');

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const sx = canvas.width / LOGICAL_W;
    const sy = canvas.height / LOGICAL_H;
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
  }

  let state = 'ready';
  let lastT = 0;
  let paused = false;

  // Tower coordinates use a world-Y axis where 0 = ground level at bottom
  // of the canvas. Stacks grow with increasing worldY.
  // Camera offset shifts the world up so the player sees the active block.
  let blocks = [];       // each: { x, w, worldY }  (worldY = bottom of block)
  let moving = null;     // { x, w, worldY, vx, dir }
  let falling = [];      // animated overhang debris
  let score = 0;
  let highScore = Math.floor(Number(localStorage.getItem(HS_KEY) || 0));
  let cameraY = 0;       // current displayed camera offset (smoothed)
  let cameraTargetY = 0;

  hsEl.textContent = `BEST ${highScore}`;
  scoreEl.textContent = '0';

  // ---------- Init / Reset ----------
  function reset() {
    score = 0;
    scoreEl.textContent = '0';
    cameraY = 0;
    cameraTargetY = 0;
    falling = [];
    const startX = (LOGICAL_W - BASE_W) / 2;
    blocks = [{ x: startX, w: BASE_W, worldY: BLOCK_H }]; // base sits 0..BLOCK_H
    spawnMoving();
  }

  function spawnMoving() {
    const top = blocks[blocks.length - 1];
    const w = top.w;
    // Start the moving block on the side opposite to the previous direction
    // for a touch of variety.
    const startLeft = Math.random() < 0.5;
    const x = startLeft ? -w + 10 : LOGICAL_W - 10;
    const dir = startLeft ? 1 : -1;
    const speed = Math.min(MAX_SPEED, BASE_SPEED + score * SPEED_RAMP);
    moving = {
      x,
      w,
      worldY: top.worldY + BLOCK_H,
      vx: dir * speed,
      dir,
    };
  }

  // ---------- Input ----------
  function drop() {
    if (state !== 'playing' || !moving) return;
    const top = blocks[blocks.length - 1];
    const leftOverlap = Math.max(moving.x, top.x);
    const rightOverlap = Math.min(moving.x + moving.w, top.x + top.w);
    const overlap = rightOverlap - leftOverlap;

    if (overlap <= 0) {
      // Whole block missed — falls off entirely.
      falling.push({
        x: moving.x, w: moving.w, worldY: moving.worldY,
        vx: moving.vx * 0.3, vy: 0,
        color: blockColor(blocks.length),
      });
      moving = null;
      gameOver();
      return;
    }

    const perfectish = Math.abs(moving.x - top.x) <= PERFECT_TOLERANCE
      && Math.abs((moving.x + moving.w) - (top.x + top.w)) <= PERFECT_TOLERANCE;

    if (perfectish) {
      // Snap to exact alignment, no shrink, +5 bonus
      blocks.push({ x: top.x, w: top.w, worldY: moving.worldY });
      score += 5 + 1;
    } else {
      // Drop the overhang as a falling chunk
      if (moving.x < top.x) {
        const overhangW = top.x - moving.x;
        falling.push({
          x: moving.x, w: overhangW, worldY: moving.worldY,
          vx: -120, vy: 0,
          color: blockColor(blocks.length),
        });
      } else if (moving.x + moving.w > top.x + top.w) {
        const overhangW = (moving.x + moving.w) - (top.x + top.w);
        falling.push({
          x: top.x + top.w, w: overhangW, worldY: moving.worldY,
          vx: 120, vy: 0,
          color: blockColor(blocks.length),
        });
      }
      blocks.push({ x: leftOverlap, w: overlap, worldY: moving.worldY });
      score += 1;
    }

    scoreEl.textContent = String(score);

    // Camera follow: keep the active top of the tower at CAMERA_HEAD_ROOM
    // from the top of the canvas.
    const towerTopWorldY = blocks[blocks.length - 1].worldY;
    cameraTargetY = Math.max(0, towerTopWorldY - CAMERA_HEAD_ROOM);

    spawnMoving();
  }

  function handleAction() {
    if (state === 'ready' || state === 'gameover') {
      startGame();
    } else {
      drop();
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowDown') {
      e.preventDefault();
      handleAction();
    }
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleAction();
  }, { passive: false });

  canvas.addEventListener('mousedown', () => handleAction());

  playBtn.addEventListener('click', startGame);

  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused && state === 'playing') {
      lastT = performance.now();
      requestAnimationFrame(loop);
    }
  });

  window.addEventListener('resize', resizeCanvas);

  // ---------- Game flow ----------
  function startGame() {
    state = 'playing';
    reset();
    overlay.classList.add('hidden');
    lastT = performance.now();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    state = 'gameover';
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(HS_KEY, String(highScore));
      hsEl.textContent = `BEST ${highScore}`;
    }
    overlayTitle.textContent = 'GAME OVER';
    overlayMsg.innerHTML = `Height: <b>${score}</b> &middot; Best: <b>${highScore}</b>`;
    playBtn.textContent = 'PLAY AGAIN';
    overlay.classList.remove('hidden');
  }

  // ---------- Loop ----------
  function loop(now) {
    if (paused) return;
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    update(dt);
    render();
    if (state === 'playing' || falling.length > 0) {
      requestAnimationFrame(loop);
    }
  }

  function update(dt) {
    // Camera ease toward target
    cameraY += (cameraTargetY - cameraY) * Math.min(1, dt * 6);

    // Moving block: bounce within edges, but allow overhang past edges
    if (moving && state === 'playing') {
      moving.x += moving.vx * dt;
      const leftLimit = -moving.w * 0.7; // can extend ~70% off-screen
      const rightLimit = LOGICAL_W - moving.w * 0.3;
      if (moving.x < leftLimit) { moving.x = leftLimit; moving.vx = Math.abs(moving.vx); }
      else if (moving.x > rightLimit) { moving.x = rightLimit; moving.vx = -Math.abs(moving.vx); }
    }

    // Falling overhangs
    for (const f of falling) {
      f.vy += GRAVITY * dt;
      f.x += f.vx * dt;
      f.worldY -= f.vy * dt; // worldY shrinks as it falls down on screen
    }
    falling = falling.filter((f) => {
      // Remove once well below the visible camera region.
      const screenY = worldToScreenY(f.worldY);
      return screenY < LOGICAL_H + 200;
    });
  }

  // ---------- Render ----------
  function worldToScreenY(worldY) {
    // World 0 is at bottom of canvas; growing worldY moves up.
    // After applying camera shift, content scrolls down on screen as tower grows.
    return LOGICAL_H - (worldY - cameraY);
  }

  function blockColor(index) {
    // Alternate gold/red with a slow hue shift as the tower grows.
    const palette = [
      '#d4af37', '#c0392b',
      '#e0b94a', '#a8321f',
      '#ffd700', '#922c1a',
    ];
    return palette[index % palette.length];
  }

  function drawBlock(b, color) {
    const top = worldToScreenY(b.worldY);
    const bottom = worldToScreenY(b.worldY - BLOCK_H);
    if (bottom < -10 || top > LOGICAL_H + 10) return;
    ctx.fillStyle = color;
    ctx.fillRect(b.x, top, b.w, BLOCK_H);
    // Subtle top highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(b.x, top, b.w, 3);
    // Subtle bottom shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(b.x, top + BLOCK_H - 3, b.w, 3);
  }

  function render() {
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    // Background
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Subtle horizon stripe at bottom for orientation
    ctx.fillStyle = 'rgba(212, 175, 55, 0.05)';
    const horizonScreen = worldToScreenY(0);
    if (horizonScreen > 0 && horizonScreen < LOGICAL_H) {
      ctx.fillRect(0, horizonScreen, LOGICAL_W, LOGICAL_H - horizonScreen);
    }

    // Stacked blocks (skip ones off-screen)
    for (let i = 0; i < blocks.length; i++) {
      drawBlock(blocks[i], blockColor(i));
    }

    // Falling overhangs
    for (const f of falling) {
      const top = worldToScreenY(f.worldY);
      ctx.fillStyle = f.color;
      ctx.fillRect(f.x, top, f.w, BLOCK_H);
    }

    // Moving block
    if (moving && state === 'playing') {
      drawBlock(moving, blockColor(blocks.length));
      // Vertical alignment hint: a faint line from moving block down to the top of the tower
      const top = blocks[blocks.length - 1];
      const moveScreenBottom = worldToScreenY(moving.worldY - BLOCK_H);
      const topScreenTop = worldToScreenY(top.worldY);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.18)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(moving.x + moving.w / 2, moveScreenBottom);
      ctx.lineTo(moving.x + moving.w / 2, topScreenTop);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ---------- Boot ----------
  resizeCanvas();
  reset();
  render();
})();
