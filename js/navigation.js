/**
 * Screen Navigation & View Transitions
 */
import { App } from './state.js';
import { precisionInit, precisionCleanup } from './games/precision-stop.js';
import { pongInit, pongCleanup } from './games/light-pong.js';
import { jigsawInit, jigsawCleanup } from './games/jigsaw-puzzle.js';

export function showScreen(screenId) {
  // Clean up active game if leaving a game
  if (App.activeGame) {
    cleanupGame(App.activeGame);
    App.activeGame = null;
  }

  // Deactivate all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  // Activate target screen
  const screen = document.getElementById('screen-' + screenId);
  if (screen) {
    screen.classList.add('active');
    App.currentScreen = screenId;
    window.scrollTo(0, 0);
  }

  // Body classes for game atmosphere & header styling
  if (screenId === 'precision-stop' || screenId === 'light-pong' || screenId === 'jigsaw') {
    document.body.classList.add('game-active');
    App.activeGame = screenId;
  } else {
    document.body.classList.remove('game-active');
  }

  document.body.classList.toggle('in-dashboard', screenId === 'dashboard');

  // Initialize entered game
  if (screenId === 'precision-stop') {
    precisionInit();
  } else if (screenId === 'light-pong') {
    pongInit();
  } else if (screenId === 'jigsaw') {
    jigsawInit();
  }
}

export function cleanupGame(game) {
  if (game === 'precision-stop' || game === 'precision') {
    precisionCleanup();
  } else if (game === 'light-pong' || game === 'pong') {
    pongCleanup();
  } else if (game === 'jigsaw') {
    jigsawCleanup();
  }
}
