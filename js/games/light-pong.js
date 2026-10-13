/**
 * LIGHT PONG GAME
 * Single-player paddle reflex game module
 */
import { App } from '../state.js';
import { saveSession } from '../utils/storage.js';
import { openDashboard } from '../dashboard.js';
import { formatTime } from '../utils/scoring.js';
/* =============================================
   GAME 2: LIGHT PONG
   ============================================= */
export const PongState = {
      canvas: null, ctx: null,
      animFrame: null,
      state: 'ready', // ready, playing, paused, gameover, completed
      targetReturns: 15,
      ball: { x: 0, y: 0, vx: 0, vy: 0, radius: 8, speed: 4 },
      playerPaddle: { x: 0, y: 0, width: 12, height: 70, speed: 6 },
      cpuPaddle: { x: 0, y: 0, width: 12, height: 70, speed: 3.5, targetY: 0 },
      score: 0,
      returns: 0,
      level: 1,
      startTime: 0,
      playTime: 0,
      keys: {},
      lastTime: 0,
      keyHandler: null,
      keyUpHandler: null,
      mouseHandler: null,
      touchHandler: null,
      visibilityHandler: null,
      mobileUpInterval: null,
      mobileDownInterval: null,
      canvasWidth: 700,
      canvasHeight: 420
    };

    export function pongInit() {
      document.getElementById('pong-start-view').style.display = 'flex';
      document.getElementById('pong-game-view').style.display = 'none';
      document.getElementById('pong-result-view').style.display = 'none';
      const best = App.sessionScores.pong.best;
      document.getElementById('pong-start-best').textContent = best > 0 ? best + ' pts' : '—';
    }

    export function pongCleanup() {
      PongState.state = 'ready';
      if (PongState.animFrame) { cancelAnimationFrame(PongState.animFrame); PongState.animFrame = null; }
      if (PongState.keyHandler) document.removeEventListener('keydown', PongState.keyHandler);
      if (PongState.keyUpHandler) document.removeEventListener('keyup', PongState.keyUpHandler);
      if (PongState.mouseHandler && PongState.canvas) PongState.canvas.removeEventListener('mousemove', PongState.mouseHandler);
      if (PongState.touchHandler && PongState.canvas) PongState.canvas.removeEventListener('touchmove', PongState.touchHandler);
      if (PongState.visibilityHandler) document.removeEventListener('visibilitychange', PongState.visibilityHandler);
      clearInterval(PongState.mobileUpInterval);
      clearInterval(PongState.mobileDownInterval);
      PongState.keyHandler = null;
      PongState.keyUpHandler = null;
      PongState.mouseHandler = null;
      PongState.touchHandler = null;
      PongState.visibilityHandler = null;
      PongState.keys = {};
    }

    export function pongStartGame() {
      document.getElementById('pong-start-view').style.display = 'none';
      document.getElementById('pong-game-view').style.display = 'flex';
      document.getElementById('pong-result-view').style.display = 'none';

      const canvas = document.getElementById('pong-canvas');
      const wrapper = document.getElementById('pong-canvas-wrapper');

      // Responsive canvas
      const maxW = Math.min(700, window.innerWidth - 40);
      const maxH = Math.min(420, window.innerHeight - 220);
      const aspect = 700 / 420;
      let w = maxW, h = maxW / aspect;
      if (h > maxH) { h = maxH; w = maxH * aspect; }
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
      PongState.canvasWidth = canvas.width;
      PongState.canvasHeight = canvas.height;

      PongState.canvas = canvas;
      PongState.ctx = canvas.getContext('2d');

      const cw = canvas.width, ch = canvas.height;
      const paddleH = Math.round(ch * 0.167);

      PongState.ball = { x: cw / 2, y: ch / 2, vx: 4 * (cw / 700), vy: 3 * (ch / 420), radius: Math.round(8 * (cw / 700)), speed: 4 * (cw / 700) };
      PongState.playerPaddle = { x: 15, y: ch / 2 - paddleH / 2, width: Math.round(12 * (cw / 700)), height: paddleH, speed: 6 * (ch / 420) };
      PongState.cpuPaddle = { x: cw - 15 - Math.round(12 * (cw / 700)), y: ch / 2 - paddleH / 2, width: Math.round(12 * (cw / 700)), height: paddleH, speed: 3.5 * (ch / 420), targetY: ch / 2 };
      PongState.score = 0;
      PongState.returns = 0;
      PongState.level = 1;
      PongState.startTime = Date.now();
      PongState.playTime = 0;
      PongState.keys = {};
      PongState.state = 'playing';
      PongState.lastTime = performance.now();

      document.getElementById('pong-status-overlay').classList.add('hidden');
      pongUpdateHUD();

      // Random starting direction
      const angle = (Math.random() * 0.8 - 0.4);
      PongState.ball.vx = PongState.ball.speed * Math.cos(angle);
      PongState.ball.vy = PongState.ball.speed * Math.sin(angle);

      // Input handlers
      PongState.keyHandler = function (e) {
        if (['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S', ' '].includes(e.key)) {
          e.preventDefault();
          PongState.keys[e.key] = true;
        }
        if (e.key === ' ' && PongState.state === 'paused') pongTogglePause();
      };
      PongState.keyUpHandler = function (e) { PongState.keys[e.key] = false; };
      document.addEventListener('keydown', PongState.keyHandler);
      document.addEventListener('keyup', PongState.keyUpHandler);

      PongState.mouseHandler = function (e) {
        if (PongState.state !== 'playing') return;
        const rect = canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const scaleY = canvas.height / rect.height;
        PongState.playerPaddle.y = Math.max(0, Math.min(canvas.height - PongState.playerPaddle.height, y * scaleY - PongState.playerPaddle.height / 2));
      };
      canvas.addEventListener('mousemove', PongState.mouseHandler);

      PongState.touchHandler = function (e) {
        e.preventDefault();
        if (PongState.state !== 'playing') return;
        const rect = canvas.getBoundingClientRect();
        const y = e.touches[0].clientY - rect.top;
        const scaleY = canvas.height / rect.height;
        PongState.playerPaddle.y = Math.max(0, Math.min(canvas.height - PongState.playerPaddle.height, y * scaleY - PongState.playerPaddle.height / 2));
      };
      canvas.addEventListener('touchmove', PongState.touchHandler, { passive: false });

      // Visibility handler
      PongState.visibilityHandler = function () {
        if (document.hidden && PongState.state === 'playing') { pongTogglePause(); }
      };
      document.addEventListener('visibilitychange', PongState.visibilityHandler);

      // Mobile buttons
      const upBtn = document.getElementById('btn-pong-up');
      const downBtn = document.getElementById('btn-pong-down');
      upBtn.onpointerdown = () => { PongState.keys['ArrowUp'] = true; };
      upBtn.onpointerup = () => { PongState.keys['ArrowUp'] = false; };
      upBtn.onpointerleave = () => { PongState.keys['ArrowUp'] = false; };
      downBtn.onpointerdown = () => { PongState.keys['ArrowDown'] = true; };
      downBtn.onpointerup = () => { PongState.keys['ArrowDown'] = false; };
      downBtn.onpointerleave = () => { PongState.keys['ArrowDown'] = false; };

      pongLoop(performance.now());
    }

    function pongTogglePause() {
      if (PongState.state === 'playing') {
        PongState.state = 'paused';
        document.getElementById('pong-status-overlay').classList.remove('hidden');
        document.getElementById('pong-status-title').textContent = 'PAUSED';
        document.getElementById('pong-status-msg').textContent = 'Press Space or click Resume to continue';
        document.getElementById('btn-pong-resume').style.display = '';
        document.getElementById('btn-pong-pause').textContent = '▶ Resume';
      } else if (PongState.state === 'paused') {
        PongState.state = 'playing';
        PongState.lastTime = performance.now();
        document.getElementById('pong-status-overlay').classList.add('hidden');
        document.getElementById('btn-pong-pause').textContent = '⏸ Pause';
        pongLoop(performance.now());
      }
    }

    function pongLoop(now) {
      if (PongState.state !== 'playing') return;

      const dt = Math.min((now - PongState.lastTime) / 16.667, 3); // Normalized to ~60fps
      PongState.lastTime = now;

      const { ball, playerPaddle, cpuPaddle, keys } = PongState;
      const cw = PongState.canvasWidth, ch = PongState.canvasHeight;

      // Player input
      const pSpeed = playerPaddle.speed * dt;
      if (keys['ArrowUp'] || keys['w'] || keys['W']) playerPaddle.y -= pSpeed;
      if (keys['ArrowDown'] || keys['s'] || keys['S']) playerPaddle.y += pSpeed;
      playerPaddle.y = Math.max(0, Math.min(ch - playerPaddle.height, playerPaddle.y));

      // CPU AI
      const cpuCenter = cpuPaddle.y + cpuPaddle.height / 2;
      const delay = 0.06 + Math.random() * 0.02;
      cpuPaddle.targetY += (ball.y - cpuPaddle.targetY) * delay;
      if (cpuCenter < cpuPaddle.targetY - 5) cpuPaddle.y += cpuPaddle.speed * dt;
      else if (cpuCenter > cpuPaddle.targetY + 5) cpuPaddle.y -= cpuPaddle.speed * dt;
      cpuPaddle.y = Math.max(0, Math.min(ch - cpuPaddle.height, cpuPaddle.y));

      // Ball movement
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      // Top/bottom bounce
      if (ball.y - ball.radius <= 0) { ball.y = ball.radius; ball.vy = Math.abs(ball.vy); }
      if (ball.y + ball.radius >= ch) { ball.y = ch - ball.radius; ball.vy = -Math.abs(ball.vy); }

      // Player paddle collision
      if (ball.vx < 0 && ball.x - ball.radius <= playerPaddle.x + playerPaddle.width &&
        ball.x - ball.radius >= playerPaddle.x &&
        ball.y >= playerPaddle.y && ball.y <= playerPaddle.y + playerPaddle.height) {
        ball.x = playerPaddle.x + playerPaddle.width + ball.radius;
        const hitPos = (ball.y - playerPaddle.y) / playerPaddle.height - 0.5;
        const angle = hitPos * Math.PI / 3;
        const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        ball.vx = currentSpeed * Math.cos(angle);
        ball.vy = currentSpeed * Math.sin(angle);
        if (ball.vx < 0) ball.vx = -ball.vx;

        PongState.returns++;
        PongState.score += 10 * PongState.level;

        // Level up every 5 returns
        if (PongState.returns % 5 === 0) {
          PongState.level++;
          const speedMult = 1 + PongState.level * 0.08;
          const baseSpeed = 4 * (cw / 700);
          ball.speed = baseSpeed * speedMult;
          const curSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          const ratio = ball.speed / curSpeed;
          ball.vx *= ratio;
          ball.vy *= ratio;
          cpuPaddle.speed = (3.5 + PongState.level * 0.3) * (ch / 420);
        }

        pongUpdateHUD();
      }

      // CPU paddle collision
      if (ball.vx > 0 && ball.x + ball.radius >= cpuPaddle.x &&
        ball.x + ball.radius <= cpuPaddle.x + cpuPaddle.width &&
        ball.y >= cpuPaddle.y && ball.y <= cpuPaddle.y + cpuPaddle.height) {
        ball.x = cpuPaddle.x - ball.radius;
        const hitPos = (ball.y - cpuPaddle.y) / cpuPaddle.height - 0.5;
        const angle = Math.PI - hitPos * Math.PI / 3;
        const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        ball.vx = -currentSpeed * Math.abs(Math.cos(angle));
        ball.vy = currentSpeed * Math.sin(angle);
      }

      // Ball passed CPU (score point)
      if (ball.x + ball.radius > cw) {
        PongState.score += 25;
        PongState.returns++;
        pongResetBall(1);
        pongUpdateHUD();
      }

      // Ball passed player (game over)
      if (ball.x - ball.radius < 0) {
        PongState.state = 'gameover';
        PongState.playTime = (Date.now() - PongState.startTime) / 1000;
        pongDraw();
        setTimeout(pongShowResults, 800);
        return;
      }

      // Check win
      if (PongState.returns >= PongState.targetReturns) {
        PongState.state = 'completed';
        PongState.playTime = (Date.now() - PongState.startTime) / 1000;
        PongState.score += 100; // completion bonus
        pongDraw();
        setTimeout(pongShowResults, 800);
        return;
      }

      // Update timer
      PongState.playTime = (Date.now() - PongState.startTime) / 1000;
      document.getElementById('pong-timer').textContent = formatTime(PongState.playTime);

      pongDraw();
      PongState.animFrame = requestAnimationFrame(pongLoop);
    }

    function pongResetBall(dir) {
      const cw = PongState.canvasWidth, ch = PongState.canvasHeight;
      PongState.ball.x = cw / 2;
      PongState.ball.y = ch / 2;
      const angle = (Math.random() * 0.6 - 0.3);
      const speed = PongState.ball.speed;
      PongState.ball.vx = speed * Math.cos(angle) * dir;
      PongState.ball.vy = speed * Math.sin(angle);
    }

    function pongUpdateHUD() {
      document.getElementById('pong-returns').textContent = PongState.returns;
      document.getElementById('pong-score').textContent = PongState.score;
      document.getElementById('pong-level').textContent = PongState.level;
    }

    function pongDraw() {
      const ctx = PongState.ctx;
      const cw = PongState.canvasWidth, ch = PongState.canvasHeight;
      const { ball, playerPaddle, cpuPaddle } = PongState;

      // Background
      ctx.fillStyle = PongState.state === 'gameover' ? '#0A0F18' : '#07111F';
      ctx.fillRect(0, 0, cw, ch);

      // Center line
      ctx.setLineDash([6, 8]);
      ctx.strokeStyle = 'rgba(56,189,248,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cw / 2, 0);
      ctx.lineTo(cw / 2, ch);
      ctx.stroke();
      ctx.setLineDash([]);

      // Paddles
      ctx.shadowColor = 'rgba(56,189,248,0.5)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.roundRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height, 4);
      ctx.fill();

      ctx.fillStyle = '#F87171';
      ctx.shadowColor = 'rgba(248,113,113,0.5)';
      ctx.beginPath();
      ctx.roundRect(cpuPaddle.x, cpuPaddle.y, cpuPaddle.width, cpuPaddle.height, 4);
      ctx.fill();

      // Ball
      ctx.shadowColor = 'rgba(255,255,255,0.8)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      // Ball trail
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(ball.x - ball.vx * 0.5, ball.y - ball.vy * 0.5, ball.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    }

    function pongShowResults() {
      if (PongState.animFrame) { cancelAnimationFrame(PongState.animFrame); PongState.animFrame = null; }

      document.getElementById('pong-game-view').style.display = 'none';
      document.getElementById('pong-result-view').style.display = 'flex';

      const completed = PongState.state === 'completed';
      const icon = completed ? '🏆' : '🏓';
      const msg = completed ? 'Challenge completed! Amazing reflexes!' : `You reached ${PongState.returns} returns before missing.`;

      if (!App.sessionScores.pong) App.sessionScores.pong = { best: 0, last: 0, games: [] };
      if (!Array.isArray(App.sessionScores.pong.games)) App.sessionScores.pong.games = [];

      if (PongState.score > (App.sessionScores.pong.best || 0)) {
        App.sessionScores.pong.best = PongState.score;
        saveSession();
      }
      App.sessionScores.pong.games.push({
        score: PongState.score, returns: PongState.returns, level: PongState.level,
        completed, duration: Math.round(PongState.playTime), timestamp: new Date().toISOString()
      });

      document.getElementById('pong-result-panel').innerHTML = `
    <div class="result-icon">${icon}</div>
    <h2>${completed ? 'Challenge Complete!' : 'Game Over'}</h2>
    <div class="result-message">${msg}</div>
    <div class="result-stats">
      <div class="result-stat"><div class="stat-value">${PongState.score}</div><div class="stat-label">Score</div></div>
      <div class="result-stat"><div class="stat-value">${PongState.returns}</div><div class="stat-label">Returns</div></div>
      <div class="result-stat"><div class="stat-value">${PongState.level}</div><div class="stat-label">Level</div></div>
      <div class="result-stat"><div class="stat-value">${formatTime(PongState.playTime)}</div><div class="stat-label">Duration</div></div>
    </div>
    <div style="font-size:14px;color:var(--text-secondary);margin-bottom:16px;">Session Best: <strong>${App.sessionScores.pong.best} pts</strong></div>
    <div class="result-actions">
      <button class="btn btn-primary btn-game" onclick="pongReplay()">Play Again</button>
      <button class="btn btn-outline btn-game" onclick="openDashboard()">Back to Games</button>
    </div>
  `;
    }

    window.pongReplay = function () {
      pongCleanup();
      App.activeGame = 'pong';
      pongStartGame();
    };


export function initLightPong() {
  const targetSelector = document.getElementById('pong-target-selector');
  if (targetSelector) {
    targetSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('.difficulty-btn');
      if (!btn) return;
      document.querySelectorAll('#pong-target-selector .difficulty-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      PongState.targetReturns = parseInt(btn.dataset.returns, 10);
    });
  }

  const startBtn = document.getElementById('btn-pong-start');
  if (startBtn) startBtn.addEventListener('click', pongStartGame);

  const backBtn = document.getElementById('btn-pong-back');
  if (backBtn) backBtn.addEventListener('click', () => { pongCleanup(); openDashboard(); });

  const backBtn2 = document.getElementById('btn-pong-back2');
  if (backBtn2) backBtn2.addEventListener('click', () => { pongCleanup(); openDashboard(); });

  const pauseBtn = document.getElementById('btn-pong-pause');
  if (pauseBtn) pauseBtn.addEventListener('click', pongTogglePause);

  const resumeBtn = document.getElementById('btn-pong-resume');
  if (resumeBtn) resumeBtn.addEventListener('click', pongTogglePause);
}
