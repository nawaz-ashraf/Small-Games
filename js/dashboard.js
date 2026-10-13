/**
 * DASHBOARD MODULE
 * Handles game selection dashboard, participant info, avatar rendering,
 * profile modal, best-score displays, and session lifecycle management
 */
import { App } from './state.js';
import { showScreen, cleanupGame } from './navigation.js';
import { clearSession } from './utils/storage.js';
import { showToast, showModal } from './utils/dom.js';
import { formatTime, formatDuration } from './utils/scoring.js';

/**
 * Extract clean initials from participant name
 * e.g., "Rahul Sharma" -> "RS", "Rohan" -> "R", "" -> "PA"
 */
export function getParticipantInitials(name) {
  if (!name || typeof name !== 'string') return 'PA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PA';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

/**
 * Escape HTML to prevent unsafe injection in modals
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render participant avatar into container element
 * Supports image photo or generates festive gradient initials
 */
export function renderAvatar(el, p, size = 42) {
  if (!el) return;
  el.innerHTML = '';
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  el.style.minWidth = size + 'px';
  el.style.minHeight = size + 'px';
  el.style.borderRadius = '50%';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.overflow = 'hidden';
  el.style.userSelect = 'none';

  if (p && p.photo) {
    const img = document.createElement('img');
    img.src = p.photo;
    img.alt = p.name || 'Participant';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.onerror = () => {
      renderInitials(el, p, size);
    };
    el.appendChild(img);
  } else {
    renderInitials(el, p, size);
  }
}

function renderInitials(el, p, size) {
  el.innerHTML = '';
  const initials = getParticipantInitials(p ? p.name : '');
  el.textContent = initials;
  el.style.background = 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)';
  el.style.color = '#FFFFFF';
  el.style.fontWeight = '800';
  el.style.fontSize = Math.round(size * 0.4) + 'px';
  el.style.letterSpacing = '1px';
  el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25), 0 0 10px rgba(245, 158, 11, 0.35)';
  el.style.border = '2px solid rgba(255, 255, 255, 0.4)';
}

export function openDashboard() {
  if (!App.participant) {
    showScreen('register');
    return;
  }
  updateDashboardUI();
  showScreen('dashboard');
}
window.openDashboard = openDashboard;

/**
 * Open Participant Profile Modal
 */
export function showProfileModal() {
  const p = App.participant;
  if (!p) {
    showToast('No active participant session found.', 'warning');
    showScreen('register');
    return;
  }

  const initials = getParticipantInitials(p.name);
  const regDate = p.registeredAt ? new Date(p.registeredAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }) : 'Active Session';

  const precBest = App.sessionScores?.precision?.best || 0;
  const pongBest = App.sessionScores?.pong?.best || 0;
  const jigsawTimes = Object.values(App.sessionScores?.jigsaw?.bestTimes || {});
  const jigsawBest = jigsawTimes.length > 0 ? Math.min(...jigsawTimes) : (App.sessionScores?.jigsaw?.bestTime || 0);

  const modalHtml = `
    <div class="profile-modal-view">
      <div class="profile-modal-avatar-wrap">
        <div class="profile-modal-avatar">${initials}</div>
        <div class="profile-modal-name">${escapeHtml(p.name)}</div>
        <div class="profile-modal-badge">Visitor #${p.id ? p.id.substring(p.id.length - 4).toUpperCase() : 'ARENA'}</div>
      </div>
      <div class="profile-details-grid">
        <div class="profile-detail-item">
          <span class="detail-label">📱 Mobile Number</span>
          <span class="detail-value">${escapeHtml(p.phone || 'N/A')}</span>
        </div>
        <div class="profile-detail-item">
          <span class="detail-label">✉️ Email Address</span>
          <span class="detail-value">${escapeHtml(p.email || 'N/A')}</span>
        </div>
        <div class="profile-detail-item">
          <span class="detail-label">📅 Registered</span>
          <span class="detail-value">${escapeHtml(regDate)}</span>
        </div>
        <div class="profile-detail-item">
          <span class="detail-label">🔑 Session ID</span>
          <span class="detail-value" style="font-family:monospace; font-size:12px;">${escapeHtml(p.id || 'N/A')}</span>
        </div>
      </div>
      <div class="profile-scores-summary">
        <h4>Session Best Scores</h4>
        <div class="profile-scores-row">
          <div class="score-pill">
            <span class="game-tag">🪔 Diya Stop</span>
            <strong>${precBest > 0 ? precBest + ' pts' : '—'}</strong>
          </div>
          <div class="score-pill">
            <span class="game-tag">🏓 Light Pong</span>
            <strong>${pongBest > 0 ? pongBest + ' pts' : '—'}</strong>
          </div>
          <div class="score-pill">
            <span class="game-tag">🧩 Jigsaw</span>
            <strong>${jigsawBest > 0 ? formatDuration(jigsawBest) : '—'}</strong>
          </div>
        </div>
      </div>
    </div>
  `;

  showModal('Participant Profile', modalHtml, [
    { text: 'Close', style: 'primary' }
  ]);
}
window.showProfileModal = showProfileModal;

/**
 * Confirm and execute End Session
 */
export function confirmEndSession() {
  showModal(
    'End Game Session?',
    '<p style="color:var(--text-secondary);line-height:1.6;font-size:14px;">Are you sure you want to end your current session? All participant scores, progress, and active game timers will be cleared. You will return to the registration screen.</p>',
    [
      { text: 'Cancel', style: 'secondary' },
      {
        text: 'End Session',
        style: 'danger',
        handler: () => {
          // Stop any active game animations/loops
          if (App.activeGame) {
            cleanupGame(App.activeGame);
            App.activeGame = null;
          }
          // Clear session data from storage & state
          clearSession();

          // Reset registration form fields so a new participant starts fresh
          const form = document.getElementById('registration-form');
          if (form) {
            form.reset();
            form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
            form.querySelectorAll('.visible').forEach(el => el.classList.remove('visible'));
          }

          // Return to registration screen
          showScreen('register');
          showToast('Session ended. Ready for next participant.', 'info');
        }
      }
    ]
  );
}
window.confirmEndSession = confirmEndSession;

export function updateDashboardUI() {
  const p = App.participant;
  if (!p) return;

  const userNameEl = document.getElementById('dash-username') || document.getElementById('dash-user-name');
  if (userNameEl) userNameEl.textContent = p.name;

  const avatarEl = document.getElementById('dash-avatar') || document.getElementById('dash-user-avatar');
  if (avatarEl) {
    renderAvatar(avatarEl, p, 44);
    avatarEl.setAttribute('role', 'button');
    avatarEl.setAttribute('tabindex', '0');
    avatarEl.setAttribute('title', 'Click to view profile details');
    avatarEl.style.cursor = 'pointer';
  }

  const badgeEl = document.getElementById('dash-user-badge');
  if (badgeEl) {
    badgeEl.textContent = 'Visitor #' + p.id.substring(p.id.length - 4).toUpperCase();
  }

  // Update best scores
  const precBestEl = document.getElementById('dash-best-precision');
  if (precBestEl) {
    const best = App.sessionScores?.precision?.best || 0;
    precBestEl.textContent = best > 0 ? best + ' pts' : '—';
  }

  const pongBestEl = document.getElementById('dash-best-pong');
  if (pongBestEl) {
    const best = App.sessionScores?.pong?.best || 0;
    pongBestEl.textContent = best > 0 ? best + ' pts' : '—';
  }

  const jigsawBestEl = document.getElementById('dash-best-jigsaw');
  if (jigsawBestEl) {
    const bestTimes = App.sessionScores?.jigsaw?.bestTimes || {};
    const times = Object.values(bestTimes);
    const bestJigsaw = times.length > 0 ? Math.min(...times) : (App.sessionScores?.jigsaw?.bestTime || 0);
    jigsawBestEl.textContent = bestJigsaw > 0 ? formatDuration(bestJigsaw) : '—';
  }
}

function openGame(gameScreenId) {
  if (!App.participant) {
    showToast('Please register before playing games.', 'warning');
    showScreen('register');
    return;
  }
  showScreen(gameScreenId);
}

export function initDashboard() {
  // Profile button and avatar click handlers
  const profileBtn = document.getElementById('btn-view-profile');
  if (profileBtn) {
    profileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showProfileModal();
    });
    profileBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showProfileModal();
      }
    });
  }

  const avatarEl = document.getElementById('dash-avatar') || document.getElementById('dash-user-avatar');
  if (avatarEl) {
    avatarEl.addEventListener('click', (e) => {
      e.preventDefault();
      showProfileModal();
    });
    avatarEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showProfileModal();
      }
    });
  }

  // End Session button handlers
  const endSessionBtn = document.getElementById('btn-end-session') || document.getElementById('btn-reset-session');
  if (endSessionBtn) {
    endSessionBtn.addEventListener('click', (e) => {
      e.preventDefault();
      confirmEndSession();
    });
    endSessionBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        confirmEndSession();
      }
    });
  }

  // Game Cards
  const cardPrecision = document.getElementById('card-precision');
  if (cardPrecision) {
    cardPrecision.addEventListener('click', () => openGame('precision-stop'));
    cardPrecision.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openGame('precision-stop');
      }
    });
  }

  const cardPong = document.getElementById('card-pong');
  if (cardPong) {
    cardPong.addEventListener('click', () => openGame('light-pong'));
    cardPong.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openGame('light-pong');
      }
    });
  }

  const cardJigsaw = document.getElementById('card-jigsaw');
  if (cardJigsaw) {
    cardJigsaw.addEventListener('click', () => openGame('jigsaw'));
    cardJigsaw.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openGame('jigsaw');
      }
    });
  }
}
