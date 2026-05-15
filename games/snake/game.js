// Snake — OCS8 Arcade
// 20x20 grid, tick-based movement, arrow keys + swipe.

(function () {
  'use strict';

  const HS_KEY = 'megagamee_snake_high_score';
  const GRID = 20;
  const CELL = 20;
  const LOGICAL_W = GRID * CELL; // 400
  const LOGICAL_H = GRID * CELL; // 400

  const BASE_TICK_MS = 130;  // first move every 130ms
  const MIN_TICK_MS = 65;    // floor — gets fast but stays playable
  const SPEED_RAMP = 3;      // ms shaved off per food eaten

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
  let snake = [];           // [{x, y}, ...] head at index 0
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = { x: 10, y: 10 };
  let score = 0;
  let highScore = Math.floor(Number(localStorage.getItem(HS_KEY) || 0));
  let tickMs = BASE_TICK_MS;
  let accum = 0;
  let lastT = 0;
  let paused = false;
  let eatFlash = 0; // 0..1, fades after eating

  hsEl.textContent = `HS ${highScore}`;

  // ---------- Init / Reset ----------
  function reset() {
    snake = [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    tickMs = BASE_TICK_MS;
    accum = 0;
    eatFlash = 0;
    placeFood();
    scoreEl.textContent = '0';
  }

  function placeFood() {
    // Choose an empty cell uniformly.
    const occupied = new Set(snake.map((s) => s.y * GRID + s.x));
    const free = [];
    for (let i = 0; i < GRID * GRID; i++) {
      if (!occupied.has(i)) free.push(i);
    }
    if (free.length === 0) {
      // Board fully filled — player wins. Treat as game over with bonus.
      gameOver(true);
      return;
    }
    const pick = free[Math.floor(Math.random() * free.length)];
    food = { x: pick % GRID, y: Math.floor(pick / GRID) };
  }

  // ---------- Input ----------
  function setDir(x, y) {
    // Disallow reversing into yourself (only relative to *committed* dir).
    if (x === -dir.x && y === -dir.y) return;
    nextDir = { x, y };
  }

  window.addEventListener('keydown', (e) => {
    if (state === 'ready' || state === 'gameover') {
      if (e.code === 'Space' || e.code.startsWith('Arrow')) {
        e.preventDefault();
        startGame();
        return;
      }
    }
    if (state !== 'playing') return;
    switch (e.code) {
      case 'ArrowUp': case 'KeyW':    e.preventDefault(); setDir(0, -1); break;
      case 'ArrowDown': case 'KeyS':  e.preventDefault(); setDir(0,  1); break;
      case 'ArrowLeft': case 'KeyA':  e.preventDefault(); setDir(-1, 0); break;
      case 'ArrowRight': case 'KeyD': e.preventDefault(); setDir( 1, 0); break;
    }
  });

  // Swipe input
  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (state === 'ready' || state === 'gameover') {
      startGame();
      return;
    }
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    if (!touchStart) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const TH = 24; // swipe threshold in px
    if (Math.abs(dx) < TH && Math.abs(dy) < TH) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      setDir(dx > 0 ? 1 : -1, 0);
    } else {
      setDir(0, dy > 0 ? 1 : -1);
    }
    // Reset start so a continuous drag can turn again.
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: false });

  canvas.addEventListener('touchend', () => { touchStart = null; });

  playBtn.addEventListener('click', startGame);
  canvas.addEventListener('mousedown', () => {
    if (state === 'ready' || state === 'gameover') startGame();
  });

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
    reset();
    state = 'playing';
    overlay.classList.add('hidden');
    lastT = performance.now();
    requestAnimationFrame(loop);
  }

  function gameOver(won) {
    state = 'gameover';
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(HS_KEY, String(highScore));
      hsEl.textContent = `HS ${highScore}`;
    }
    overlayTitle.textContent = won ? 'YOU WIN!' : 'GAME OVER';
    overlayMsg.innerHTML = `Score: <b>${score}</b> &middot; High: <b>${highScore}</b>`;
    playBtn.textContent = 'PLAY AGAIN';
    overlay.classList.remove('hidden');
  }

  // ---------- Loop ----------
  function loop(now) {
    if (paused || state !== 'playing') return;
    const dt = Math.min((now - lastT), 100); // cap dt at 100ms
    lastT = now;
    accum += dt;
    while (accum >= tickMs) {
      accum -= tickMs;
      step();
      if (state !== 'playing') break;
    }
    eatFlash = Math.max(0, eatFlash - dt / 200);
    render();
    if (state === 'playing') requestAnimationFrame(loop);
  }

  function step() {
    dir = nextDir;
    const head = snake[0];
    const nx = head.x + dir.x;
    const ny = head.y + dir.y;

    // Walls
    if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) {
      gameOver(false);
      return;
    }
    // Self-bite — check against all segments EXCEPT the tail-tip,
    // because that cell will vacate this tick (when not eating).
    const willEat = (nx === food.x && ny === food.y);
    const tailIdx = snake.length - 1;
    for (let i = 0; i < snake.length; i++) {
      if (!willEat && i === tailIdx) continue;
      if (snake[i].x === nx && snake[i].y === ny) {
        gameOver(false);
        return;
      }
    }

    snake.unshift({ x: nx, y: ny });
    if (willEat) {
      score += 10;
      scoreEl.textContent = String(score);
      tickMs = Math.max(MIN_TICK_MS, tickMs - SPEED_RAMP);
      eatFlash = 1;
      placeFood();
    } else {
      snake.pop();
    }
  }

  // ---------- Render ----------
  function render() {
    // Background
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < GRID; i++) {
      ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, LOGICAL_H);
      ctx.moveTo(0, i * CELL); ctx.lineTo(LOGICAL_W, i * CELL);
    }
    ctx.stroke();

    // Eat flash
    if (eatFlash > 0) {
      ctx.fillStyle = `rgba(255, 215, 0, ${eatFlash * 0.12})`;
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    }

    // Food (red chip)
    drawChip(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.42);

    // Snake
    for (let i = snake.length - 1; i >= 0; i--) {
      const s = snake[i];
      const isHead = i === 0;
      const pad = isHead ? 1 : 2;
      ctx.fillStyle = isHead ? '#ffd700' : '#d4af37';
      roundRect(ctx, s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 4);
      ctx.fill();

      if (isHead) {
        // Eye on the leading edge of the head
        const cx = s.x * CELL + CELL / 2;
        const cy = s.y * CELL + CELL / 2;
        const ex = cx + dir.x * 4;
        const ey = cy + dir.y * 4;
        ctx.fillStyle = '#0a0e27';
        ctx.beginPath();
        ctx.arc(ex - dir.y * 3, ey + dir.x * 3, 1.6, 0, Math.PI * 2);
        ctx.arc(ex + dir.y * 3, ey - dir.x * 3, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawChip(cx, cy, r) {
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Inner ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2);
    ctx.stroke();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // ---------- Boot ----------
  resizeCanvas();
  reset();
  render();
})();
