/**
 * DIYA STOP CHALLENGE (TARGET MATCH ARCADE)
 * Precision target alignment gameplay module
 */
import { App } from '../state.js';
import { saveSession } from '../utils/storage.js';
import { openDashboard } from '../dashboard.js';
/* =============================================
   CONFIG & DIFFICULTY
   ============================================= */
export const TOTAL_ROUNDS = 3;

export const DIYA_MATCH_CONFIG = {
      easy: {
        name: 'Easy',
        baseSpeed: 2.2,
        speedInc: 0.35,
        zoneWidth: 80,
        perfectPct: 3.5,   // within 3.5% of track width
        excellentPct: 7.5, // within 7.5%
        goodPct: 13.0,     // within 13.0%
        nearMissPct: 22.0  // within 22.0%
      },
      medium: {
        name: 'Medium',
        baseSpeed: 3.6,
        speedInc: 0.45,
        zoneWidth: 60,
        perfectPct: 3.0,   // within 3.0% of track width
        excellentPct: 7.0, // within 7.0%
        goodPct: 12.0,     // within 12.0%
        nearMissPct: 20.0  // within 20.0%
      },
      hard: {
        name: 'Hard',
        baseSpeed: 5.2,
        speedInc: 0.65,
        zoneWidth: 45,
        perfectPct: 2.2,   // within 2.2% of track width
        excellentPct: 5.5, // within 5.5%
        goodPct: 10.0,     // within 10.0%
        nearMissPct: 16.0  // within 16.0%
      }
    };

    export const PrecisionState = {
      state: 'ready', // 'ready', 'countdown', 'playing', 'round-result', 'completed'
      difficulty: 'medium',
      totalRounds: TOTAL_ROUNDS,
      currentRound: 0,
      totalScore: 0,
      roundScores: [],
      roundAccuracies: [],
      roundDistances: [],
      roundTiers: [],
      perfectCount: 0,
      excellentCount: 0,
      animFrame: null,
      countdownTimer: null,
      keyHandler: null,
      movingDiyaX: 0,
      movingDiyaDirection: 1,
      currentSpeed: 3.6,
      diyaWidth: 88,
      isStopLocked: false
    };

    export function precisionInit() {
      precisionCleanup();
      PrecisionState.state = 'ready';
      document.getElementById('precision-start-view').style.display = 'flex';
      document.getElementById('precision-game-view').style.display = 'none';
      document.getElementById('precision-result-view').style.display = 'none';
      const best = App.sessionScores.precision.best;
      document.getElementById('precision-start-best').textContent = best > 0 ? best + ' pts' : '—';
    }

    export function precisionCleanup() {
      PrecisionState.state = 'ready';
      PrecisionState.isStopLocked = false;
      if (PrecisionState.animFrame) {
        cancelAnimationFrame(PrecisionState.animFrame);
        PrecisionState.animFrame = null;
      }
      if (PrecisionState.countdownTimer) {
        clearInterval(PrecisionState.countdownTimer);
        PrecisionState.countdownTimer = null;
      }
      if (PrecisionState.keyHandler) {
        document.removeEventListener('keydown', PrecisionState.keyHandler);
        PrecisionState.keyHandler = null;
      }
      const overlay = document.getElementById('prec-countdown-overlay');
      if (overlay) overlay.style.display = 'none';
    }



    export function precisionStartGame() {
      precisionCleanup();
      PrecisionState.totalRounds = TOTAL_ROUNDS;
      PrecisionState.currentRound = 0;
      PrecisionState.totalScore = 0;
      PrecisionState.roundScores = [];
      PrecisionState.roundAccuracies = [];
      PrecisionState.roundDistances = [];
      PrecisionState.roundTiers = [];
      PrecisionState.perfectCount = 0;
      PrecisionState.excellentCount = 0;
      PrecisionState.isStopLocked = false;

      document.getElementById('precision-start-view').style.display = 'none';
      document.getElementById('precision-game-view').style.display = 'flex';
      document.getElementById('precision-result-view').style.display = 'none';

      // Build 5-round progress pills
      const pillsContainer = document.getElementById('prec-round-pills');
      pillsContainer.innerHTML = '';
      for (let i = 0; i < PrecisionState.totalRounds; i++) {
        const pill = document.createElement('div');
        pill.className = 'round-pill';
        pill.id = `round-pill-${i}`;
        pill.textContent = `Round ${i + 1}`;
        pillsContainer.appendChild(pill);
      }

      precisionStartRound();
    }

    function precisionStartRound() {
      PrecisionState.state = 'countdown';
      PrecisionState.isStopLocked = false;
      const cfg = DIYA_MATCH_CONFIG[PrecisionState.difficulty];
      PrecisionState.currentSpeed = cfg.baseSpeed + (PrecisionState.currentRound * cfg.speedInc);

      // Update HUD values
      document.getElementById('prec-round').textContent = `${PrecisionState.currentRound + 1}/${PrecisionState.totalRounds}`;
      document.getElementById('prec-score').textContent = `${PrecisionState.totalScore} pts`;
      const lastAcc = PrecisionState.roundAccuracies.length > 0 
        ? PrecisionState.roundAccuracies[PrecisionState.roundAccuracies.length - 1] + '%' 
        : '—';
      document.getElementById('prec-accuracy').textContent = lastAcc;

      // Update round pills
      for (let i = 0; i < PrecisionState.totalRounds; i++) {
        const pill = document.getElementById(`round-pill-${i}`);
        if (!pill) continue;
        if (i === PrecisionState.currentRound) {
          pill.className = 'round-pill active';
          pill.textContent = `Round ${i + 1} ⏱`;
        } else if (i < PrecisionState.currentRound) {
          const tier = PrecisionState.roundTiers[i] || 'good';
          const score = PrecisionState.roundScores[i] || 0;
          pill.className = `round-pill done-${tier}`;
          pill.textContent = `R${i + 1}: +${score}`;
        } else {
          pill.className = 'round-pill';
          pill.textContent = `Round ${i + 1}`;
        }
      }

      // Reset Diya position to starting edge
      const track = document.getElementById('prec-track');
      const trackWidth = track.clientWidth || 500;
      const diyaEl = document.getElementById('prec-moving-diya');
      diyaEl.className = 'precision-moving-diya';
      PrecisionState.diyaWidth = (diyaEl && diyaEl.offsetWidth) ? diyaEl.offsetWidth : 88;
      
      const startFromLeft = (PrecisionState.currentRound % 2 === 0);
      PrecisionState.movingDiyaDirection = startFromLeft ? 1 : -1;
      PrecisionState.movingDiyaX = startFromLeft ? 6 : Math.max(0, trackWidth - PrecisionState.diyaWidth - 6);
      diyaEl.style.left = PrecisionState.movingDiyaX + 'px';

      // Reset feedback
      const badge = document.getElementById('prec-feedback-badge');
      badge.style.color = 'var(--text-secondary)';
      badge.textContent = 'Get ready to match the target silhouette!';
      document.getElementById('prec-feedback-details').textContent = '';

      // Reset stop button to ready state
      const stopBtn = document.getElementById('btn-precision-stop');
      stopBtn.className = 'precision-stop-btn';
      stopBtn.disabled = true;
      stopBtn.textContent = 'READY';

      // Run 3-2-1-MATCH Countdown
      const overlay = document.getElementById('prec-countdown-overlay');
      const countNum = document.getElementById('prec-countdown-num');
      overlay.style.display = 'flex';
      let count = 3;
      countNum.textContent = count;

      if (PrecisionState.countdownTimer) clearInterval(PrecisionState.countdownTimer);
      PrecisionState.countdownTimer = setInterval(() => {
        count--;
        if (count > 0) {
          countNum.textContent = count;
        } else if (count === 0) {
          countNum.textContent = 'MATCH!';
        } else {
          clearInterval(PrecisionState.countdownTimer);
          PrecisionState.countdownTimer = null;
          overlay.style.display = 'none';

          // Activate Gameplay
          PrecisionState.state = 'playing';
          stopBtn.disabled = false;
          stopBtn.textContent = 'STOP';

          // Key listeners
          if (PrecisionState.keyHandler) document.removeEventListener('keydown', PrecisionState.keyHandler);
          PrecisionState.keyHandler = function (e) {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              if (e.repeat) return;
              if (PrecisionState.state === 'playing') {
                precisionTriggerStop();
              } else if (PrecisionState.state === 'round-result') {
                precisionContinueNext();
              }
            }
          };
          document.addEventListener('keydown', PrecisionState.keyHandler);

          // Launch animation loop
          precisionLoop();
        }
      }, 700);
    }

    function precisionLoop() {
      if (PrecisionState.state !== 'playing') return;

      const track = document.getElementById('prec-track');
      if (!track) return;
      const trackWidth = track.clientWidth;
      const diyaEl = document.getElementById('prec-moving-diya');
      if (diyaEl && diyaEl.offsetWidth) PrecisionState.diyaWidth = diyaEl.offsetWidth;
      const maxPos = Math.max(0, trackWidth - PrecisionState.diyaWidth);

      PrecisionState.movingDiyaX += PrecisionState.currentSpeed * PrecisionState.movingDiyaDirection;

      if (PrecisionState.movingDiyaX >= maxPos) {
        PrecisionState.movingDiyaX = maxPos;
        PrecisionState.movingDiyaDirection = -1;
      } else if (PrecisionState.movingDiyaX <= 0) {
        PrecisionState.movingDiyaX = 0;
        PrecisionState.movingDiyaDirection = 1;
      }

      if (diyaEl) {
        diyaEl.style.left = PrecisionState.movingDiyaX + 'px';
      }

      PrecisionState.animFrame = requestAnimationFrame(precisionLoop);
    }



    function precisionTriggerStop() {
      if (PrecisionState.state !== 'playing' || PrecisionState.isStopLocked) return;
      PrecisionState.isStopLocked = true;
      PrecisionState.state = 'round-result';

      if (PrecisionState.animFrame) {
        cancelAnimationFrame(PrecisionState.animFrame);
        PrecisionState.animFrame = null;
      }

      const track = document.getElementById('prec-track');
      const trackWidth = track.clientWidth || 500;
      const diyaEl = document.getElementById('prec-moving-diya');
      if (diyaEl && diyaEl.offsetWidth) PrecisionState.diyaWidth = diyaEl.offsetWidth;
      const targetCenterX = trackWidth / 2;
      const movingDiyaCenterX = PrecisionState.movingDiyaX + (PrecisionState.diyaWidth / 2);
      const distance = Math.abs(movingDiyaCenterX - targetCenterX);
      const distancePercent = (distance / trackWidth) * 100;

      const cfg = DIYA_MATCH_CONFIG[PrecisionState.difficulty];
      let tier = 'miss';
      let points = 0;
      let label = '';
      let color = '';

      if (distancePercent <= cfg.perfectPct) {
        tier = 'perfect';
        points = 1000;
        label = '🎯 PERFECT MATCH!';
        color = '#D97706';
        PrecisionState.perfectCount++;
      } else if (distancePercent <= cfg.excellentPct) {
        tier = 'excellent';
        points = 750;
        label = '🌟 EXCELLENT MATCH!';
        color = '#16A34A';
        PrecisionState.excellentCount++;
      } else if (distancePercent <= cfg.goodPct) {
        tier = 'good';
        points = 500;
        label = '👍 GOOD MATCH!';
        color = '#0284C7';
      } else if (distancePercent <= cfg.nearMissPct) {
        tier = 'near';
        points = 250;
        label = '🔵 NEAR MISS!';
        color = '#F59E0B';
      } else {
        tier = 'miss';
        points = 0;
        label = '❌ MISSED TARGET';
        color = '#DC2626';
      }

      // Calculate transparent normalized accuracy percentage
      const maxScoringPercent = cfg.nearMissPct * 1.25;
      const accuracyPct = Math.max(0, Math.min(100, Math.round((1 - (distancePercent / maxScoringPercent)) * 100)));

      PrecisionState.totalScore += points;
      PrecisionState.roundScores.push(points);
      PrecisionState.roundAccuracies.push(accuracyPct);
      PrecisionState.roundDistances.push(Math.round(distance));
      PrecisionState.roundTiers.push(tier);

      // Apply outcome visual state to moving Diya
      if (diyaEl) {
        diyaEl.className = `precision-moving-diya matched-${tier}`;
      }

      // Trigger sparkle burst if Perfect
      if (tier === 'perfect') {
        const sparkle = document.getElementById('prec-sparkle-box');
        if (sparkle) {
          sparkle.style.animation = 'none';
          void sparkle.offsetWidth; // retrigger
          sparkle.style.animation = 'sparkleBurst 1.2s forwards ease-out';
        }
      }

      // Update Feedback Panel
      const feedbackBadge = document.getElementById('prec-feedback-badge');
      feedbackBadge.style.color = color;
      feedbackBadge.innerHTML = `${label} <span style="font-size:17px;font-weight:800;">(+${points} pts)</span>`;

      const feedbackDetails = document.getElementById('prec-feedback-details');
      feedbackDetails.innerHTML = `Alignment Accuracy: <strong>${accuracyPct}%</strong> &bull; Distance from center: <strong>${Math.round(distance)}px</strong> (${distancePercent.toFixed(1)}%)`;

      // Update HUD
      document.getElementById('prec-score').textContent = `${PrecisionState.totalScore} pts`;
      document.getElementById('prec-accuracy').textContent = `${accuracyPct}%`;

      // Update current round pill
      const pill = document.getElementById(`round-pill-${PrecisionState.currentRound}`);
      if (pill) {
        pill.className = `round-pill done-${tier}`;
        pill.textContent = `R${PrecisionState.currentRound + 1}: +${points}`;
      }

      // Transform STOP button into CONTINUE button
      const stopBtn = document.getElementById('btn-precision-stop');
      stopBtn.className = 'precision-stop-btn btn-continue';
      stopBtn.disabled = false;
      if (PrecisionState.currentRound < PrecisionState.totalRounds - 1) {
        stopBtn.textContent = `CONTINUE TO ROUND ${PrecisionState.currentRound + 2} ▶`;
      } else {
        stopBtn.textContent = `VIEW FINAL RESULTS 🏆`;
      }
    }

    function precisionContinueNext() {
      if (PrecisionState.state !== 'round-result') return;
      PrecisionState.currentRound++;

      if (PrecisionState.currentRound < PrecisionState.totalRounds) {
        precisionStartRound();
      } else {
        PrecisionState.state = 'completed';
        precisionShowResults();
      }
    }

    function precisionShowResults() {
      precisionCleanup();
      PrecisionState.state = 'completed';
      document.getElementById('precision-game-view').style.display = 'none';
      document.getElementById('precision-result-view').style.display = 'flex';

      const total = PrecisionState.totalScore;
      const maxPossible = PrecisionState.totalRounds * 1000;
      const avgAccuracy = PrecisionState.roundAccuracies.length > 0
        ? Math.round(PrecisionState.roundAccuracies.reduce((a, b) => a + b, 0) / PrecisionState.totalRounds)
        : 0;
      const bestRoundScore = PrecisionState.roundScores.length > 0
        ? Math.max(...PrecisionState.roundScores)
        : 0;

      let icon = '🏆';
      let praise = 'Diya Master! Flawless Timing!';
      if (total >= maxPossible * 0.9) {
        icon = '🏆';
        praise = 'Diya Master! Flawless Reflexes & Pinpoint Timing!';
      } else if (total >= maxPossible * 0.75) {
        icon = '🌟';
        praise = 'Outstanding Precision! Superb Reflexes!';
      } else if (total >= maxPossible * 0.55) {
        icon = '👍';
        praise = 'Great Match Timing! Impressive Focus!';
      } else {
        icon = '⚡';
        praise = 'Good Effort! Keep practicing to master the target!';
      }

      // Update session best score
      if (!App.sessionScores.precision) App.sessionScores.precision = { best: 0, last: 0, games: [] };
      if (!Array.isArray(App.sessionScores.precision.games)) App.sessionScores.precision.games = [];

      if (total > (App.sessionScores.precision.best || 0)) {
        App.sessionScores.precision.best = total;
        saveSession();
      }
      App.sessionScores.precision.games.push({
        score: total,
        difficulty: PrecisionState.difficulty,
        rounds: PrecisionState.totalRounds,
        accuracy: avgAccuracy,
        timestamp: new Date().toISOString()
      });

      // Update Dashboard badge
      const dashBest = document.getElementById('dash-best-precision');
      if (dashBest) dashBest.textContent = App.sessionScores.precision.best + ' pts';

      // Render Final Results Panel
      document.getElementById('precision-result-panel').innerHTML = `
        <div class="result-icon">${icon}</div>
        <h2>Challenge Complete!</h2>
        <div class="result-message" style="color:#D97706;font-size:16px;font-weight:700;">${praise}</div>
        
        <div style="margin: 16px 0 20px; font-size:32px; font-weight:900; color:var(--navy);">
          ${total} <span style="font-size:16px; font-weight:600; color:var(--text-secondary);">/ ${maxPossible} pts</span>
        </div>

        <div class="result-stats">
          <div class="result-stat">
            <div class="stat-value">${avgAccuracy}%</div>
            <div class="stat-label">Avg Accuracy</div>
          </div>
          <div class="result-stat">
            <div class="stat-value">${PrecisionState.perfectCount}</div>
            <div class="stat-label">Perfect Stops</div>
          </div>
          <div class="result-stat">
            <div class="stat-value">${PrecisionState.excellentCount}</div>
            <div class="stat-label">Excellent Stops</div>
          </div>
          <div class="result-stat">
            <div class="stat-value">${bestRoundScore}</div>
            <div class="stat-label">Best Round</div>
          </div>
          <div class="result-stat">
            <div class="stat-value" style="text-transform:capitalize;">${PrecisionState.difficulty}</div>
            <div class="stat-label">Difficulty</div>
          </div>
          <div class="result-stat">
            <div class="stat-value">${PrecisionState.totalRounds}/${PrecisionState.totalRounds}</div>
            <div class="stat-label">Rounds Done</div>
          </div>
        </div>

        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:20px;">
          Session Best: <strong style="color:#D97706;">${App.sessionScores.precision.best} pts</strong>
        </div>

        <div class="result-actions">
          <button class="btn btn-primary btn-game" onclick="precisionReplay()">Play Again</button>
          <button class="btn btn-secondary btn-game" onclick="precisionChangeDifficulty()">Change Difficulty</button>
          <button class="btn btn-outline btn-game" onclick="openDashboard()">Back to Games</button>
        </div>
      `;
    }

    window.precisionReplay = function () {
      precisionCleanup();
      App.activeGame = 'precision';
      precisionStartGame();
    };

    window.precisionChangeDifficulty = function () {
      precisionCleanup();
      App.activeGame = 'precision';
      precisionInit();
    };

export function initPrecisionStop() {
  const diffContainer = document.getElementById('precision-difficulty');
  if (diffContainer) {
    diffContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.difficulty-btn');
      if (!btn) return;
      document.querySelectorAll('#precision-difficulty .difficulty-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      PrecisionState.difficulty = btn.dataset.diff;
    });
  }

  const startBtn = document.getElementById('btn-precision-start');
  if (startBtn) startBtn.addEventListener('click', precisionStartGame);

  const backBtn = document.getElementById('btn-precision-back');
  if (backBtn) backBtn.addEventListener('click', () => { precisionCleanup(); openDashboard(); });

  const backBtn2 = document.getElementById('btn-precision-back2');
  if (backBtn2) backBtn2.addEventListener('click', () => { precisionCleanup(); openDashboard(); });

  const stopBtn = document.getElementById('btn-precision-stop');
  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      if (PrecisionState.state === 'playing') {
        precisionTriggerStop();
      } else if (PrecisionState.state === 'round-result') {
        precisionContinueNext();
      }
    });
  }
}
