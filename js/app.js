/**
 * PLAY ARENA — Main Application Entry Point
 * Orchestrates module initialization, routing, and session restoration
 */
import { loadSession } from './utils/storage.js';
import { showScreen } from './navigation.js';
import { openDashboard, initDashboard } from './dashboard.js';
import { initRegistration } from './registration.js';
import { initPrecisionStop } from './games/precision-stop.js';
import { initLightPong } from './games/light-pong.js';
import { initJigsawPuzzle } from './games/jigsaw-puzzle.js';
import { initFestiveAtmosphere } from './utils/dom.js';

function initApp() {
  // Initialize UI & game event listeners
  initRegistration();
  initDashboard();
  initPrecisionStop();
  initLightPong();
  initJigsawPuzzle();
  initFestiveAtmosphere();

  // Restore session or route to registration
  const hasSession = loadSession();
  if (hasSession) {
    openDashboard();
  } else {
    showScreen('register');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
