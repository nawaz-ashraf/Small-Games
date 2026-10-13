/**
 * JIGSAW PUZZLE GAME
 * Canvas piece generation, drag-and-drop assembly module
 */
import { App } from '../state.js';
import { saveSession } from '../utils/storage.js';
import { openDashboard } from '../dashboard.js';
import { showToast } from '../utils/dom.js';
import { formatTime } from '../utils/scoring.js';
/* =============================================
   GAME 3: JIGSAW PUZZLE
   ============================================= */
export const JigsawState = {
      difficulty: 'easy',
      rows: 3, cols: 3,
      imageIndex: 0,
      pieces: [],
      placedCount: 0,
      totalPieces: 9,
      startTime: 0,
      elapsedTime: 0,
      timerInterval: null,
      hintsUsed: 0,
      maxHints: 3,
      showEdgesOnly: false,
      showPreview: false,
      sourceCanvas: null,
      boardCanvas: null,
      boardCtx: null,
      pieceSize: 0,
      draggingPiece: null,
      dragOffsetX: 0, dragOffsetY: 0,
      completed: false,
      pointerDownHandler: null,
      pointerMoveHandler: null,
      pointerUpHandler: null,
      images: []
    };

    export const JIGSAW_CONFIGS = {
      easy: { rows: 3, cols: 3 },
      medium: { rows: 4, cols: 4 },
      hard: { rows: 5, cols: 5 },
      expert: { rows: 6, cols: 6 }
    };

    // Generate puzzle images using canvas
    export function generatePuzzleImages() {
      const images = [];
      const patterns = [
        // Sunset landscape
        function (ctx, w, h) {
          const grad = ctx.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, '#FF6B35'); grad.addColorStop(0.3, '#F7C948');
          grad.addColorStop(0.5, '#FFA62F'); grad.addColorStop(0.7, '#2D6A4F');
          grad.addColorStop(1, '#1B4332');
          ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
          // Sun
          ctx.fillStyle = '#FFF3B0';
          ctx.beginPath(); ctx.arc(w * 0.5, h * 0.35, w * 0.12, 0, Math.PI * 2); ctx.fill();
          // Mountains
          ctx.fillStyle = '#2D6A4F';
          ctx.beginPath(); ctx.moveTo(0, h * 0.6); ctx.lineTo(w * 0.3, h * 0.35); ctx.lineTo(w * 0.6, h * 0.55); ctx.lineTo(w * 0.85, h * 0.38); ctx.lineTo(w, h * 0.5); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
          ctx.fillStyle = '#1B4332';
          ctx.beginPath(); ctx.moveTo(0, h * 0.7); ctx.lineTo(w * 0.2, h * 0.5); ctx.lineTo(w * 0.5, h * 0.65); ctx.lineTo(w * 0.75, h * 0.48); ctx.lineTo(w, h * 0.6); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
        },
        // Ocean waves
        function (ctx, w, h) {
          const grad = ctx.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, '#87CEEB'); grad.addColorStop(0.4, '#4682B4');
          grad.addColorStop(0.6, '#1E90FF'); grad.addColorStop(1, '#0C2D6B');
          ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
          // Waves
          for (let i = 0; i < 6; i++) {
            const y = h * (0.3 + i * 0.12);
            ctx.strokeStyle = `rgba(255,255,255,${0.15 - i * 0.02})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let x = 0; x <= w; x += 5) {
              ctx.lineTo(x, y + Math.sin(x / 30 + i * 1.5) * 12);
            }
            ctx.stroke();
          }
          // Birds
          ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
          [[w * 0.3, h * 0.15], [w * 0.5, h * 0.1], [w * 0.7, h * 0.18]].forEach(([bx, by]) => {
            ctx.beginPath(); ctx.moveTo(bx - 8, by + 4); ctx.quadraticCurveTo(bx - 2, by - 4, bx, by);
            ctx.quadraticCurveTo(bx + 2, by - 4, bx + 8, by + 4); ctx.stroke();
          });
        },
        // Geometric abstract
        function (ctx, w, h) {
          ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, w, h);
          const colors = ['#e94560', '#0f3460', '#16213e', '#533483', '#e94560', '#0f3460'];
          for (let i = 0; i < 20; i++) {
            ctx.fillStyle = colors[i % colors.length];
            ctx.globalAlpha = 0.4 + Math.random() * 0.4;
            const x = Math.random() * w;
            const y = Math.random() * h;
            const size = 20 + Math.random() * 80;
            if (i % 3 === 0) {
              ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill();
            } else if (i % 3 === 1) {
              ctx.fillRect(x, y, size, size * 0.6);
            } else {
              ctx.beginPath(); ctx.moveTo(x, y - size / 2); ctx.lineTo(x + size / 2, y + size / 2); ctx.lineTo(x - size / 2, y + size / 2); ctx.closePath(); ctx.fill();
            }
          }
          ctx.globalAlpha = 1;
        },
        // Flower garden
        function (ctx, w, h) {
          ctx.fillStyle = '#90EE90'; ctx.fillRect(0, 0, w, h);
          const grad = ctx.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, '#87CEEB'); grad.addColorStop(0.5, '#98FB98'); grad.addColorStop(1, '#228B22');
          ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
          // Flowers
          const flowerColors = ['#FF69B4', '#FF6347', '#FFD700', '#FF4500', '#DA70D6', '#FF1493'];
          for (let i = 0; i < 12; i++) {
            const fx = 30 + Math.random() * (w - 60);
            const fy = h * 0.3 + Math.random() * (h * 0.6);
            const fs = 8 + Math.random() * 14;
            // Stem
            ctx.strokeStyle = '#228B22'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy + fs * 2.5); ctx.stroke();
            // Petals
            ctx.fillStyle = flowerColors[i % flowerColors.length];
            for (let p = 0; p < 5; p++) {
              const angle = (p / 5) * Math.PI * 2;
              ctx.beginPath();
              ctx.arc(fx + Math.cos(angle) * fs * 0.5, fy + Math.sin(angle) * fs * 0.5, fs * 0.4, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = '#FFD700';
            ctx.beginPath(); ctx.arc(fx, fy, fs * 0.25, 0, Math.PI * 2); ctx.fill();
          }
        }
      ];

      patterns.forEach((drawFn, idx) => {
        const c = document.createElement('canvas');
        c.width = 400; c.height = 400;
        const ctx = c.getContext('2d');
        drawFn(ctx, 400, 400);
        images.push(c);
      });

      JigsawState.images = images;
    }

    export function jigsawInit() {
      if (JigsawState.images.length === 0) generatePuzzleImages();

      document.getElementById('jigsaw-start-view').style.display = 'flex';
      document.getElementById('jigsaw-game-view').style.display = 'none';
      document.getElementById('jigsaw-result-view').style.display = 'none';

      // Build image selector
      const selector = document.getElementById('jigsaw-image-selector');
      selector.innerHTML = '';
      JigsawState.images.forEach((img, idx) => {
        const opt = document.createElement('div');
        opt.className = 'image-option' + (idx === JigsawState.imageIndex ? ' selected' : '');
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 100; thumbCanvas.height = 100;
        const tctx = thumbCanvas.getContext('2d');
        tctx.drawImage(img, 0, 0, 100, 100);
        opt.appendChild(thumbCanvas);
        opt.addEventListener('click', () => {
          selector.querySelectorAll('.image-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          JigsawState.imageIndex = idx;
        });
        selector.appendChild(opt);
      });

      // Best time
      const bestTimes = (App.sessionScores && App.sessionScores.jigsaw && App.sessionScores.jigsaw.bestTimes) || {};
      const bestKeys = Object.keys(bestTimes);
      const startBestEl = document.getElementById('jigsaw-start-best');
      if (startBestEl) {
        startBestEl.textContent = bestKeys.length > 0 ? formatTime(Math.min(...Object.values(bestTimes))) : '—';
      }
    }

    export function jigsawCleanup() {
      if (JigsawState.timerInterval) { clearInterval(JigsawState.timerInterval); JigsawState.timerInterval = null; }
      const canvas = document.getElementById('jigsaw-canvas');
      if (canvas && JigsawState.pointerDownHandler) {
        canvas.removeEventListener('pointerdown', JigsawState.pointerDownHandler);
        canvas.removeEventListener('pointermove', JigsawState.pointerMoveHandler);
        canvas.removeEventListener('pointerup', JigsawState.pointerUpHandler);
      }
      JigsawState.completed = false;
    }

    export function jigsawStartGame() {
      jigsawCleanup();

      const cfg = JIGSAW_CONFIGS[JigsawState.difficulty];
      JigsawState.rows = cfg.rows;
      JigsawState.cols = cfg.cols;
      JigsawState.totalPieces = cfg.rows * cfg.cols;
      JigsawState.placedCount = 0;
      JigsawState.hintsUsed = 0;
      JigsawState.maxHints = 3;
      JigsawState.showEdgesOnly = false;
      JigsawState.showPreview = false;
      JigsawState.completed = false;
      JigsawState.elapsedTime = 0;
      JigsawState.draggingPiece = null;

      document.getElementById('jigsaw-start-view').style.display = 'none';
      document.getElementById('jigsaw-game-view').style.display = 'flex';
      document.getElementById('jigsaw-result-view').style.display = 'none';
      document.getElementById('jigsaw-preview-box').classList.remove('visible');

      const sourceImg = JigsawState.images[JigsawState.imageIndex];
      JigsawState.sourceCanvas = sourceImg;

      // Determine board size
      const boardArea = document.querySelector('.jigsaw-board-area');
      const maxBoardSize = Math.min(boardArea.offsetWidth - 40, 450);
      const boardSize = Math.max(240, maxBoardSize);
      JigsawState.pieceSize = Math.floor(boardSize / JigsawState.cols);
      const actualBoardW = JigsawState.pieceSize * JigsawState.cols;
      const actualBoardH = JigsawState.pieceSize * JigsawState.rows;

      const canvas = document.getElementById('jigsaw-canvas');
      canvas.width = actualBoardW;
      canvas.height = actualBoardH;
      canvas.style.width = actualBoardW + 'px';
      canvas.style.height = actualBoardH + 'px';
      JigsawState.boardCanvas = canvas;
      JigsawState.boardCtx = canvas.getContext('2d');

      // Preview
      const previewCanvas = document.getElementById('jigsaw-preview-canvas');
      previewCanvas.width = 160;
      previewCanvas.height = 160;
      previewCanvas.getContext('2d').drawImage(sourceImg, 0, 0, 160, 160);

      // Generate pieces
      JigsawState.pieces = [];
      for (let r = 0; r < JigsawState.rows; r++) {
        for (let c = 0; c < JigsawState.cols; c++) {
          JigsawState.pieces.push({
            id: r * JigsawState.cols + c,
            row: r, col: c,
            placed: false,
            isEdge: r === 0 || r === JigsawState.rows - 1 || c === 0 || c === JigsawState.cols - 1
          });
        }
      }

      // Shuffle
      for (let i = JigsawState.pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [JigsawState.pieces[i], JigsawState.pieces[j]] = [JigsawState.pieces[j], JigsawState.pieces[i]];
      }

      jigsawRenderTray();
      jigsawDrawBoard();
      jigsawUpdateStats();

      // Setup drag on canvas
      JigsawState.pointerDownHandler = jigsawPointerDown;
      JigsawState.pointerMoveHandler = jigsawPointerMove;
      JigsawState.pointerUpHandler = jigsawPointerUp;
      canvas.addEventListener('pointerdown', JigsawState.pointerDownHandler);
      canvas.addEventListener('pointermove', JigsawState.pointerMoveHandler);
      canvas.addEventListener('pointerup', JigsawState.pointerUpHandler);
      canvas.style.touchAction = 'none';

      // Start timer
      JigsawState.startTime = Date.now();
      JigsawState.timerInterval = setInterval(() => {
        if (!JigsawState.completed) {
          JigsawState.elapsedTime = (Date.now() - JigsawState.startTime) / 1000;
          document.getElementById('jigsaw-time').textContent = formatTime(JigsawState.elapsedTime);
        }
      }, 500);

      document.getElementById('jigsaw-hints-left').textContent = JigsawState.maxHints;
      document.getElementById('jigsaw-hints-used').textContent = '0';
    }

    function jigsawDrawBoard() {
      const ctx = JigsawState.boardCtx;
      const ps = JigsawState.pieceSize;
      const w = JigsawState.boardCanvas.width;
      const h = JigsawState.boardCanvas.height;

      ctx.clearRect(0, 0, w, h);

      // Draw grid background
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(0, 0, w, h);

      // Draw target slots
      for (let r = 0; r < JigsawState.rows; r++) {
        for (let c = 0; c < JigsawState.cols; c++) {
          const x = c * ps, y = r * ps;
          ctx.strokeStyle = '#CBD5E1';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, ps, ps);

          // Subtle image hint
          ctx.globalAlpha = 0.08;
          ctx.drawImage(JigsawState.sourceCanvas, c * (400 / JigsawState.cols), r * (400 / JigsawState.rows),
            400 / JigsawState.cols, 400 / JigsawState.rows, x, y, ps, ps);
          ctx.globalAlpha = 1;
        }
      }

      // Draw placed pieces
      JigsawState.pieces.filter(p => p.placed).forEach(p => {
        const x = p.col * ps, y = p.row * ps;
        ctx.drawImage(JigsawState.sourceCanvas,
          p.col * (400 / JigsawState.cols), p.row * (400 / JigsawState.rows),
          400 / JigsawState.cols, 400 / JigsawState.rows,
          x, y, ps, ps);
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, ps, ps);
      });

      // Highlight for dragging piece target
      if (JigsawState.draggingPiece) {
        const dp = JigsawState.draggingPiece;
        const tx = dp.col * ps, ty = dp.row * ps;
        ctx.strokeStyle = 'rgba(8,102,213,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(tx, ty, ps, ps);
        ctx.setLineDash([]);
      }
    }

    function jigsawRenderTray() {
      const tray = document.getElementById('jigsaw-tray-pieces');
      tray.innerHTML = '';
      const ps = JigsawState.pieceSize;
      const thumbSize = Math.max(36, Math.min(56, ps * 0.7));

      const unplaced = JigsawState.pieces.filter(p => !p.placed);
      const filtered = JigsawState.showEdgesOnly ? unplaced.filter(p => p.isEdge) : unplaced;

      filtered.forEach(p => {
        const thumb = document.createElement('canvas');
        thumb.width = thumbSize;
        thumb.height = thumbSize;
        thumb.className = 'jigsaw-piece-thumb' + (p.isEdge && JigsawState.showEdgesOnly ? ' edge-piece' : '');
        thumb.dataset.pieceId = p.id;
        thumb.style.width = thumbSize + 'px';
        thumb.style.height = thumbSize + 'px';

        const tctx = thumb.getContext('2d');
        tctx.drawImage(JigsawState.sourceCanvas,
          p.col * (400 / JigsawState.cols), p.row * (400 / JigsawState.rows),
          400 / JigsawState.cols, 400 / JigsawState.rows,
          0, 0, thumbSize, thumbSize);

        // Drag from tray
        thumb.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (p.placed || JigsawState.completed) return;
          JigsawState.draggingPiece = p;
          thumb.classList.add('dragging');
          thumb.setPointerCapture(e.pointerId);

          // We need to track so the user can drop on canvas
          const upHandler = (ue) => {
            thumb.classList.remove('dragging');
            thumb.releasePointerCapture(ue.pointerId);
            thumb.removeEventListener('pointerup', upHandler);

            // Check if dropped on canvas area
            const canvas = JigsawState.boardCanvas;
            const rect = canvas.getBoundingClientRect();
            const cx = ue.clientX, cy = ue.clientY;

            if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
              const scaleX = canvas.width / rect.width;
              const scaleY = canvas.height / rect.height;
              const boardX = (cx - rect.left) * scaleX;
              const boardY = (cy - rect.top) * scaleY;
              const dropCol = Math.floor(boardX / JigsawState.pieceSize);
              const dropRow = Math.floor(boardY / JigsawState.pieceSize);

              if (dropRow === p.row && dropCol === p.col) {
                // Correct placement!
                p.placed = true;
                JigsawState.placedCount++;
                showToast('✅ Correct placement!', 'success');
                jigsawDrawBoard();
                jigsawRenderTray();
                jigsawUpdateStats();
                jigsawCheckCompletion();
              } else {
                showToast('❌ Wrong position, try again.', 'error');
                jigsawDrawBoard();
              }
            }
            JigsawState.draggingPiece = null;
            jigsawDrawBoard();
          };
          thumb.addEventListener('pointerup', upHandler);
        });

        tray.appendChild(thumb);
      });

      document.getElementById('jigsaw-tray-count').textContent = filtered.length;
    }

    function jigsawPointerDown(e) {
      if (JigsawState.completed) return;
      // Check if clicking on a placed piece — do nothing for now
    }

    function jigsawPointerMove(e) {
      if (JigsawState.draggingPiece) {
        jigsawDrawBoard();
        // Draw ghost piece
        const canvas = JigsawState.boardCanvas;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        const ps = JigsawState.pieceSize;
        const p = JigsawState.draggingPiece;
        const ctx = JigsawState.boardCtx;

        ctx.globalAlpha = 0.6;
        ctx.drawImage(JigsawState.sourceCanvas,
          p.col * (400 / JigsawState.cols), p.row * (400 / JigsawState.rows),
          400 / JigsawState.cols, 400 / JigsawState.rows,
          mx - ps / 2, my - ps / 2, ps, ps);
        ctx.globalAlpha = 1;
      }
    }

    function jigsawPointerUp(e) {
      if (!JigsawState.draggingPiece) return;
      const canvas = JigsawState.boardCanvas;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      const ps = JigsawState.pieceSize;
      const p = JigsawState.draggingPiece;

      const dropCol = Math.floor(mx / ps);
      const dropRow = Math.floor(my / ps);

      if (dropRow === p.row && dropCol === p.col) {
        p.placed = true;
        JigsawState.placedCount++;
        showToast('✅ Correct placement!', 'success');
        jigsawUpdateStats();
        jigsawCheckCompletion();
      } else {
        showToast('❌ Wrong position, try again.', 'error');
      }

      JigsawState.draggingPiece = null;
      jigsawDrawBoard();
      jigsawRenderTray();
    }

    function jigsawUpdateStats() {
      document.getElementById('jigsaw-placed').textContent = JigsawState.placedCount;
      document.getElementById('jigsaw-total').textContent = JigsawState.totalPieces;
      document.getElementById('jigsaw-progress').textContent = Math.round((JigsawState.placedCount / JigsawState.totalPieces) * 100) + '%';
      document.getElementById('jigsaw-hints-used').textContent = JigsawState.hintsUsed;
    }

    function jigsawCheckCompletion() {
      if (JigsawState.placedCount >= JigsawState.totalPieces) {
        JigsawState.completed = true;
        if (JigsawState.timerInterval) { clearInterval(JigsawState.timerInterval); JigsawState.timerInterval = null; }
        JigsawState.elapsedTime = (Date.now() - JigsawState.startTime) / 1000;
        setTimeout(jigsawShowResults, 1000);
      }
    }

    function jigsawArrangePieces() {
      // Just re-sort unplaced pieces for display — not solving
      const unplaced = JigsawState.pieces.filter(p => !p.placed);
      unplaced.sort((a, b) => a.id - b.id);
      // Re-render tray with sorted pieces
      jigsawRenderTray();
      showToast('📐 Pieces arranged neatly.', 'info');
    }

    function jigsawToggleEdges() {
      JigsawState.showEdgesOnly = !JigsawState.showEdgesOnly;
      const btn = document.getElementById('btn-jigsaw-edges');
      btn.textContent = JigsawState.showEdgesOnly ? '🔲 All Pieces' : '🔲 Edges';
      jigsawRenderTray();
    }

    function jigsawTogglePreview() {
      JigsawState.showPreview = !JigsawState.showPreview;
      document.getElementById('jigsaw-preview-box').classList.toggle('visible', JigsawState.showPreview);
    }

    function jigsawUseHint() {
      if (JigsawState.hintsUsed >= JigsawState.maxHints) {
        showToast('No hints remaining!', 'error');
        return;
      }

      const unplaced = JigsawState.pieces.filter(p => !p.placed);
      if (unplaced.length === 0) return;

      const hintPiece = unplaced[Math.floor(Math.random() * unplaced.length)];
      JigsawState.hintsUsed++;
      document.getElementById('jigsaw-hints-left').textContent = JigsawState.maxHints - JigsawState.hintsUsed;
      jigsawUpdateStats();

      // Highlight the piece in tray
      const trayPieces = document.querySelectorAll('.jigsaw-piece-thumb');
      trayPieces.forEach(tp => {
        tp.classList.remove('highlighted');
        if (parseInt(tp.dataset.pieceId) === hintPiece.id) {
          tp.classList.add('highlighted');
        }
      });

      // Highlight target on board
      const ctx = JigsawState.boardCtx;
      const ps = JigsawState.pieceSize;
      jigsawDrawBoard();
      ctx.strokeStyle = 'rgba(245,158,11,0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(hintPiece.col * ps + 2, hintPiece.row * ps + 2, ps - 4, ps - 4);
      ctx.setLineDash([]);

      showToast(`💡 Hint: Look for the highlighted piece! (${JigsawState.maxHints - JigsawState.hintsUsed} remaining)`, 'info');
    }

    function jigsawShowResults() {
      document.getElementById('jigsaw-game-view').style.display = 'none';
      document.getElementById('jigsaw-result-view').style.display = 'flex';

      const time = JigsawState.elapsedTime;
      const diff = JigsawState.difficulty;
      const pieces = JigsawState.totalPieces;
      const hints = JigsawState.hintsUsed;

      // Score: base on time and difficulty, minus hint penalty
      const diffMultiplier = { easy: 1, medium: 1.5, hard: 2, expert: 3 }[diff];
      const timeBonus = Math.max(0, Math.round(1000 - time * 2));
      const score = Math.round((timeBonus * diffMultiplier) - (hints * 50));

      // Best time
      const key = diff;
      if (!App.sessionScores.jigsaw) App.sessionScores.jigsaw = { bestTimes: {}, games: [] };
      if (!App.sessionScores.jigsaw.bestTimes || typeof App.sessionScores.jigsaw.bestTimes !== 'object') {
        App.sessionScores.jigsaw.bestTimes = {};
      }
      if (!Array.isArray(App.sessionScores.jigsaw.games)) App.sessionScores.jigsaw.games = [];

      if (!App.sessionScores.jigsaw.bestTimes[key] || time < App.sessionScores.jigsaw.bestTimes[key]) {
        App.sessionScores.jigsaw.bestTimes[key] = Math.round(time);
        saveSession();
      }
      App.sessionScores.jigsaw.games.push({
        difficulty: diff, pieces, time: Math.round(time), hints, score,
        timestamp: new Date().toISOString()
      });

      document.getElementById('jigsaw-result-panel').innerHTML = `
    <div class="result-icon">🧩</div>
    <h2>Puzzle Completed!</h2>
    <div class="result-message">Great job assembling the ${pieces}-piece puzzle!</div>
    <div class="result-stats">
      <div class="result-stat"><div class="stat-value">${formatTime(time)}</div><div class="stat-label">Time</div></div>
      <div class="result-stat"><div class="stat-value">${Math.max(0, score)}</div><div class="stat-label">Score</div></div>
      <div class="result-stat"><div class="stat-value">${diff}</div><div class="stat-label">Difficulty</div></div>
      <div class="result-stat"><div class="stat-value">${pieces}</div><div class="stat-label">Pieces</div></div>
      <div class="result-stat"><div class="stat-value">${hints}</div><div class="stat-label">Hints Used</div></div>
    </div>
    <div style="font-size:14px;color:var(--text-secondary);margin-bottom:16px;">Best Time (${diff}): <strong>${formatTime(App.sessionScores.jigsaw.bestTimes[key])}</strong></div>
    <div class="result-actions">
      <button class="btn btn-primary btn-game" onclick="jigsawReplay()">Play Again</button>
      <button class="btn btn-secondary btn-game" onclick="jigsawChangeDifficulty()">Change Difficulty</button>
      <button class="btn btn-outline btn-game" onclick="openDashboard()">Back to Games</button>
    </div>
  `;
    }

    window.jigsawReplay = function () {
      jigsawCleanup();
      App.activeGame = 'jigsaw';
      jigsawStartGame();
    };

    window.jigsawChangeDifficulty = function () {
      jigsawCleanup();
      App.activeGame = 'jigsaw';
      jigsawInit();
    };


export function initJigsawPuzzle() {
  generatePuzzleImages();

  const diffContainer = document.getElementById('jigsaw-difficulty');
  if (diffContainer) {
    diffContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.difficulty-btn');
      if (!btn) return;
      document.querySelectorAll('#jigsaw-difficulty .difficulty-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      JigsawState.difficulty = btn.dataset.diff;
    });
  }

  const startBtn = document.getElementById('btn-jigsaw-start');
  if (startBtn) startBtn.addEventListener('click', jigsawStartGame);

  const backBtn = document.getElementById('btn-jigsaw-back');
  if (backBtn) backBtn.addEventListener('click', () => { jigsawCleanup(); openDashboard(); });

  const backBtn2 = document.getElementById('btn-jigsaw-back2');
  if (backBtn2) backBtn2.addEventListener('click', () => { jigsawCleanup(); openDashboard(); });

  const arrangeBtn = document.getElementById('btn-jigsaw-arrange');
  if (arrangeBtn) arrangeBtn.addEventListener('click', jigsawArrangePieces);

  const edgesBtn = document.getElementById('btn-jigsaw-edges');
  if (edgesBtn) edgesBtn.addEventListener('click', jigsawToggleEdges);

  const previewBtn = document.getElementById('btn-jigsaw-preview');
  if (previewBtn) previewBtn.addEventListener('click', jigsawTogglePreview);

  const hintBtn = document.getElementById('btn-jigsaw-hint');
  if (hintBtn) hintBtn.addEventListener('click', jigsawUseHint);

  const restartBtn = document.getElementById('btn-jigsaw-restart');
  if (restartBtn) restartBtn.addEventListener('click', () => { jigsawCleanup(); jigsawStartGame(); });
}
