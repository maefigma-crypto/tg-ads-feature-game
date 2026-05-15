// Dino Runner — OCS8 Arcade
// Canvas-rendered endless runner. Logical coords: 800x300.

(function () {
  'use strict';

  const HS_KEY = 'megagamee_dino_high_score';
  const LOGICAL_W = 800;
  const LOGICAL_H = 600;
  const GROUND_Y = 500;

  // Tuning
  const GRAVITY = 2200;          // px/s^2
  const JUMP_VY = -780;          // px/s impulse
  const START_SPEED = 320;       // px/s scroll speed
  const SPEED_STEP = 22;         // +px/s every 500 points
  const SCORE_PER_SEC = 60;      // matches "+1 per frame at 60fps"

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMsg = document.getElementById('overlay-msg');
  const playBtn = document.getElementById('play-btn');
  const scoreEl = document.getElementById('score');
  const hsEl = document.getElementById('hs');

  // Handle high-DPI displays without losing logical coord system.
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    // Scale so 1 unit == LOGICAL_W across the visible canvas.
    const scaleX = canvas.width / LOGICAL_W;
    const scaleY = canvas.height / LOGICAL_H;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  }

  let state = 'ready';        // 'ready' | 'playing' | 'gameover'
  let lastT = 0;
  let speed = START_SPEED;
  let score = 0;
  let highScore = Math.floor(Number(localStorage.getItem(HS_KEY) || 0));
  let paused = false;

  // Player
  const player = {
    x: 64,
    y: GROUND_Y - 44,
    w: 36,
    h: 44,
    vy: 0,
    ducking: false,
    onGround: true,
    runFrame: 0,
  };

  // Obstacles: array of {type:'ground'|'flying', x, y, w, h}
  let obstacles = [];
  let spawnTimer = 0;
  let nextSpawnIn = 1.2;

  // Parallax layers
  let stars = [];
  let skyline = [];
  function seedBackground() {
    stars = [];
    for (let i = 0; i < 55; i++) {
      stars.push({ x: Math.random() * LOGICAL_W, y: Math.random() * (GROUND_Y - 30), r: Math.random() * 1.4 + 0.4 });
    }
    skyline = [];
    let x = 0;
    while (x < LOGICAL_W + 200) {
      const w = 40 + Math.random() * 80;
      const h = 30 + Math.random() * 50;
      skyline.push({ x, w, h });
      x += w + 8;
    }
  }
  seedBackground();

  hsEl.textContent = `HS ${highScore}`;

  // ---------- Input ----------
  function jump() {
    if (state !== 'playing') return;
    if (player.onGround) {
      player.vy = JUMP_VY;
      player.onGround = false;
    }
  }
  function startDuck() {
    if (state !== 'playing') return;
    player.ducking = true;
  }
  function endDuck() {
    player.ducking = false;
  }

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (state === 'ready') startGame();
      else if (state === 'gameover') startGame();
      else jump();
    } else if (e.code === 'ArrowDown') {
      e.preventDefault();
      startDuck();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown') endDuck();
  });

  // Touch: tap to jump, swipe down to duck
  let touchStartY = null;
  let touchStartT = 0;
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartY = e.touches[0].clientY;
    touchStartT = performance.now();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    if (touchStartY == null) return;
    const dy = e.touches[0].clientY - touchStartY;
    if (dy > 30) startDuck();
  }, { passive: false });
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const dt = performance.now() - touchStartT;
    const dy = touchStartY != null && e.changedTouches[0]
      ? e.changedTouches[0].clientY - touchStartY
      : 0;
    if (state === 'ready' || state === 'gameover') {
      startGame();
    } else if (dy < 20 && dt < 250) {
      // Treat as a tap → jump.
      jump();
    }
    endDuck();
    touchStartY = null;
  }, { passive: false });

  // Mouse fallback (for desktop testing without keyboard)
  canvas.addEventListener('mousedown', () => {
    if (state === 'ready' || state === 'gameover') startGame();
    else jump();
  });

  playBtn.addEventListener('click', startGame);

  // Pause on tab hide
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused) {
      lastT = performance.now();
      requestAnimationFrame(loop);
    }
  });

  window.addEventListener('resize', resizeCanvas);

  // ---------- Game flow ----------
  function startGame() {
    state = 'playing';
    speed = START_SPEED;
    score = 0;
    obstacles = [];
    spawnTimer = 0;
    nextSpawnIn = 1.0;
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.ducking = false;
    player.onGround = true;
    seedBackground();
    overlay.classList.add('hidden');
    lastT = performance.now();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    state = 'gameover';
    const finalScore = Math.floor(score);
    if (finalScore > highScore) {
      highScore = finalScore;
      localStorage.setItem(HS_KEY, String(highScore));
      hsEl.textContent = `HS ${highScore}`;
    }
    overlayTitle.textContent = 'GAME OVER';
    overlayMsg.innerHTML = `Score: <b>${finalScore}</b> &middot; High: <b>${highScore}</b>`;
    playBtn.textContent = 'PLAY AGAIN';
    overlay.classList.remove('hidden');
  }

  // ---------- Loop ----------
  function loop(now) {
    if (paused || state !== 'playing') return;
    const dt = Math.min((now - lastT) / 1000, 0.05); // cap dt to avoid huge jumps
    lastT = now;

    update(dt);
    render();

    requestAnimationFrame(loop);
  }

  function update(dt) {
    // Score & speed ramp
    score += dt * SCORE_PER_SEC;
    const displayScore = Math.floor(score);
    scoreEl.textContent = displayScore;
    speed = START_SPEED + Math.floor(displayScore / 500) * SPEED_STEP;

    // Player physics
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;

    // Crouch shrinks height while keeping feet on ground.
    const targetH = player.ducking && player.onGround ? 26 : 44;
    const targetW = player.ducking && player.onGround ? 54 : 36;
    player.h = targetH;
    player.w = targetW;

    if (player.y + player.h >= GROUND_Y) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    player.runFrame += dt * 10;

    // Spawn obstacles
    spawnTimer += dt;
    if (spawnTimer >= nextSpawnIn) {
      spawnTimer = 0;
      const minGap = Math.max(0.55, 1.0 - (speed - START_SPEED) / 800);
      const maxGap = Math.max(0.9, 1.6 - (speed - START_SPEED) / 600);
      nextSpawnIn = minGap + Math.random() * (maxGap - minGap);
      spawnObstacle();
    }

    // Move obstacles, cull off-screen
    for (const o of obstacles) o.x -= speed * dt;
    obstacles = obstacles.filter((o) => o.x + o.w > -20);

    // Background scroll
    for (const s of stars) {
      s.x -= speed * 0.08 * dt;
      if (s.x < -2) { s.x = LOGICAL_W + 2; s.y = Math.random() * (GROUND_Y - 30); }
    }
    for (const b of skyline) {
      b.x -= speed * 0.35 * dt;
    }
    // Wrap skyline
    const last = skyline[skyline.length - 1];
    while (skyline[0] && skyline[0].x + skyline[0].w < 0) {
      const removed = skyline.shift();
      removed.x = last.x + last.w + 8;
      removed.w = 40 + Math.random() * 80;
      removed.h = 30 + Math.random() * 50;
      skyline.push(removed);
    }

    // Collision
    for (const o of obstacles) {
      if (aabbHit(player, o)) {
        gameOver();
        return;
      }
    }
  }

  function spawnObstacle() {
    // Once speed gets going, occasionally spawn flying obstacles.
    const canFly = speed > START_SPEED + 30;
    const isFlying = canFly && Math.random() < 0.32;
    if (isFlying) {
      // Flying card — must duck under
      const h = 22;
      const w = 38;
      // Two height bands: low (near duck height) and high (jump-clearable)
      const lowY = GROUND_Y - 44; // around upper torso of standing player
      obstacles.push({ type: 'flying', x: LOGICAL_W + 30, y: lowY, w, h });
    } else {
      // Ground chip stack — must jump over
      const stackCount = 1 + Math.floor(Math.random() * 3); // 1..3 chips
      const w = 22;
      const h = stackCount * 10 + 6; // 16..36
      obstacles.push({ type: 'ground', x: LOGICAL_W + 30, y: GROUND_Y - h, w, h, stackCount });
    }
  }

  function aabbHit(a, b) {
    // Inset hitboxes slightly so collisions feel fair.
    const ix = 4, iy = 4;
    return (
      a.x + ix < b.x + b.w - 2 &&
      a.x + a.w - ix > b.x + 2 &&
      a.y + iy < b.y + b.h - 2 &&
      a.y + a.h - iy > b.y + 2
    );
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

    // Skyline
    ctx.fillStyle = 'rgba(212, 175, 55, 0.18)';
    for (const b of skyline) {
      ctx.fillRect(b.x, GROUND_Y - b.h, b.w, b.h);
    }

    // Ground line
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 1);
    ctx.lineTo(LOGICAL_W, GROUND_Y + 1);
    ctx.stroke();

    // Dashed motion ticks on the ground
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 14]);
    ctx.lineDashOffset = -((performance.now() / 1000) * speed) % 22;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 6);
    ctx.lineTo(LOGICAL_W, GROUND_Y + 6);
    ctx.stroke();
    ctx.setLineDash([]);

    // Obstacles
    for (const o of obstacles) {
      if (o.type === 'ground') {
        // Chip stack: stacked ovals
        ctx.fillStyle = '#c0392b';
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        const chips = o.stackCount;
        for (let i = 0; i < chips; i++) {
          const cy = GROUND_Y - 5 - i * 10;
          ctx.beginPath();
          ctx.ellipse(o.x + o.w / 2, cy, o.w / 2, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else {
        // Flying card: white rounded rect with red pip
        ctx.fillStyle = '#ecf0f1';
        roundRect(ctx, o.x, o.y, o.w, o.h, 3);
        ctx.fill();
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player
    drawPlayer();
  }

  function drawPlayer() {
    ctx.fillStyle = '#d4af37';
    // Body
    roundRect(ctx, player.x, player.y, player.w, player.h, 4);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#0a0e27';
    const eyeX = player.x + player.w - 8;
    const eyeY = player.y + (player.ducking ? 8 : 10);
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();
    // Legs animate while on ground
    if (player.onGround && !player.ducking) {
      ctx.fillStyle = '#d4af37';
      const swing = Math.sin(player.runFrame * 2) * 4;
      ctx.fillRect(player.x + 6, GROUND_Y - 6 + swing * 0.3, 6, 6 - Math.max(0, swing));
      ctx.fillRect(player.x + player.w - 12, GROUND_Y - 6 - swing * 0.3, 6, 6 + Math.max(0, swing));
    }
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
  // Render the initial frame so the player + ground show under the overlay.
  render();
})();
