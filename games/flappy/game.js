// Flappy — OCS8 Arcade
// Canvas-rendered tap-to-flap. Logical coords: 400x600.

(function () {
  'use strict';

  const HS_KEY = 'megagamee_flappy_high_score';
  const LOGICAL_W = 400;
  const LOGICAL_H = 600;
  const GROUND_Y = 560;
  const CEILING_Y = 0;

  // Tuning
  const GRAVITY = 1400;          // px/s^2
  const FLAP_VY = -380;          // px/s impulse
  const MAX_FALL_VY = 520;
  const PIPE_W = 62;
  const BASE_GAP = 158;          // gap height between top/bottom pipe
  const MIN_GAP = 122;
  const BASE_SPEED = 150;        // px/s scroll speed
  const SPEED_STEP = 8;          // +px/s per score
  const SPAWN_EVERY = 1.55;      // seconds between pipe pairs at base speed

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
  let score = 0;
  let highScore = Math.floor(Number(localStorage.getItem(HS_KEY) || 0));
  let paused = false;

  // Bird
  const bird = {
    x: 110,
    y: LOGICAL_H * 0.45,
    r: 14,
    vy: 0,
    flapPhase: 0,
  };

  // Pipes: {x, gapY, gap, passed}
  let pipes = [];
  let spawnTimer = 0;

  // Background
  let stars = [];
  function seedStars() {
    stars = [];
    for (let i = 0; i < 36; i++) {
      stars.push({
        x: Math.random() * LOGICAL_W,
        y: Math.random() * (GROUND_Y - 20),
        r: Math.random() * 1.4 + 0.4,
        s: 6 + Math.random() * 14, // parallax speed
      });
    }
  }
  seedStars();

  hsEl.textContent = `HS ${highScore}`;
  scoreEl.textContent = '0';

  // ---------- Input ----------
  function flap() {
    if (state !== 'playing') return;
    bird.vy = FLAP_VY;
    bird.flapPhase = 1; // visual cue
  }

  function handleAction() {
    if (state === 'ready' || state === 'gameover') {
      startGame();
    } else {
      flap();
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
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
    score = 0;
    scoreEl.textContent = '0';
    bird.x = 110;
    bird.y = LOGICAL_H * 0.45;
    bird.vy = 0;
    bird.flapPhase = 0;
    pipes = [];
    spawnTimer = 0;
    seedStars();
    overlay.classList.add('hidden');
    lastT = performance.now();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    state = 'gameover';
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(HS_KEY, String(highScore));
      hsEl.textContent = `HS ${highScore}`;
    }
    overlayTitle.textContent = 'GAME OVER';
    overlayMsg.innerHTML = `Score: <b>${score}</b> &middot; High: <b>${highScore}</b>`;
    playBtn.textContent = 'PLAY AGAIN';
    overlay.classList.remove('hidden');
  }

  // ---------- Loop ----------
  function loop(now) {
    if (paused || state !== 'playing') return;
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function currentSpeed() {
    return BASE_SPEED + score * SPEED_STEP;
  }
  function currentGap() {
    return Math.max(MIN_GAP, BASE_GAP - score * 1.5);
  }

  function update(dt) {
    // Bird physics
    bird.vy = Math.min(bird.vy + GRAVITY * dt, MAX_FALL_VY);
    bird.y += bird.vy * dt;
    bird.flapPhase = Math.max(0, bird.flapPhase - dt * 4);

    if (bird.y - bird.r < CEILING_Y) {
      bird.y = CEILING_Y + bird.r;
      bird.vy = 0;
    }
    if (bird.y + bird.r >= GROUND_Y) {
      bird.y = GROUND_Y - bird.r;
      gameOver();
      return;
    }

    const speed = currentSpeed();

    // Pipes
    spawnTimer += dt;
    const spawnInterval = SPAWN_EVERY * (BASE_SPEED / speed);
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      spawnPipe();
    }
    for (const p of pipes) {
      p.x -= speed * dt;
      // Score when bird passes pipe center
      if (!p.passed && p.x + PIPE_W < bird.x - bird.r) {
        p.passed = true;
        score += 1;
        scoreEl.textContent = String(score);
      }
    }
    pipes = pipes.filter((p) => p.x + PIPE_W > -20);

    // Stars parallax
    for (const s of stars) {
      s.x -= s.s * (speed / BASE_SPEED) * dt;
      if (s.x < -2) {
        s.x = LOGICAL_W + 2;
        s.y = Math.random() * (GROUND_Y - 20);
      }
    }

    // Pipe collision
    for (const p of pipes) {
      if (hitsPipe(bird, p)) { gameOver(); return; }
    }
  }

  function spawnPipe() {
    const gap = currentGap();
    const margin = 50;
    const gapY = margin + Math.random() * (GROUND_Y - margin * 2 - gap);
    pipes.push({ x: LOGICAL_W + 10, gapY, gap, passed: false });
  }

  function hitsPipe(b, p) {
    // Tighter circle-vs-rect: shrink the bird hitbox by 2 for fairness.
    const r = b.r - 2;
    if (b.x + r < p.x || b.x - r > p.x + PIPE_W) return false;
    // Top pipe: 0..gapY ; Bottom pipe: gapY+gap..GROUND_Y
    if (b.y - r < p.gapY) return true;
    if (b.y + r > p.gapY + p.gap) return true;
    return false;
  }

  // ---------- Render ----------
  function render() {
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Background
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Stars
    ctx.fillStyle = 'rgba(236, 240, 241, 0.7)';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pipes (red chip-stack themed)
    for (const p of pipes) drawPipe(p);

    // Ground
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 1);
    ctx.lineTo(LOGICAL_W, GROUND_Y + 1);
    ctx.stroke();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.08)';
    ctx.fillRect(0, GROUND_Y + 2, LOGICAL_W, LOGICAL_H - GROUND_Y);

    // Bird
    drawBird();
  }

  function drawPipe(p) {
    const capH = 14;
    // Top pipe
    drawPipeColumn(p.x, 0, PIPE_W, p.gapY - capH);
    drawPipeCap(p.x - 4, p.gapY - capH, PIPE_W + 8, capH);
    // Bottom pipe
    drawPipeCap(p.x - 4, p.gapY + p.gap, PIPE_W + 8, capH);
    drawPipeColumn(p.x, p.gapY + p.gap + capH, PIPE_W, GROUND_Y - (p.gapY + p.gap + capH));
  }
  function drawPipeColumn(x, y, w, h) {
    if (h <= 0) return;
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x, y, w, h);
    // Highlight strip
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(x + 4, y, 6, h);
    // Shadow strip
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(x + w - 10, y, 6, h);
  }
  function drawPipeCap(x, y, w, h) {
    ctx.fillStyle = '#a8321f';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(x + 4, y + 2, w - 8, 3);
  }

  function drawBird() {
    const tilt = Math.max(-0.5, Math.min(1.2, bird.vy / 500));
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(tilt);

    // Body
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
    ctx.fill();

    // Wing (animates when recently flapped)
    const wingY = -2 + bird.flapPhase * -4;
    ctx.fillStyle = '#a88a26';
    ctx.beginPath();
    ctx.ellipse(-2, wingY, 8, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#0a0e27';
    ctx.beginPath();
    ctx.arc(6, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.arc(6.6, -4.6, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(bird.r - 2, -1);
    ctx.lineTo(bird.r + 6, 1);
    ctx.lineTo(bird.r - 2, 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ---------- Boot ----------
  resizeCanvas();
  render();
})();
