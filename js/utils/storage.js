/**
 * Session Storage Management
 */
import { App } from '../state.js';

export function getDefaultSessionScores() {
  return {
    precision: { best: 0, last: 0, games: [] },
    pong: { best: 0, last: 0, games: [] },
    jigsaw: { bestTime: 0, lastTime: 0, bestTimes: {}, games: [] }
  };
}

export function saveSession() {
  try {
    sessionStorage.setItem('playArenaSession', JSON.stringify({
      participant: App.participant,
      sessionScores: App.sessionScores
    }));
  } catch (e) {
    /* sessionStorage may not be available */
  }
}

export function loadSession() {
  try {
    const data = sessionStorage.getItem('playArenaSession');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.participant) {
        App.participant = parsed.participant;
        const defaults = getDefaultSessionScores();
        App.sessionScores = {
          precision: { ...defaults.precision, ...(parsed.sessionScores?.precision || {}) },
          pong: { ...defaults.pong, ...(parsed.sessionScores?.pong || {}) },
          jigsaw: { ...defaults.jigsaw, ...(parsed.sessionScores?.jigsaw || {}) }
        };
        if (!Array.isArray(App.sessionScores.precision.games)) App.sessionScores.precision.games = [];
        if (!Array.isArray(App.sessionScores.pong.games)) App.sessionScores.pong.games = [];
        if (!Array.isArray(App.sessionScores.jigsaw.games)) App.sessionScores.jigsaw.games = [];
        if (!App.sessionScores.jigsaw.bestTimes || typeof App.sessionScores.jigsaw.bestTimes !== 'object') {
          App.sessionScores.jigsaw.bestTimes = {};
        }
        return true;
      }
    }
  } catch (e) {
    /* session load error */
  }
  return false;
}

export function clearSession() {
  try {
    sessionStorage.removeItem('playArenaSession');
  } catch (e) {
    /* ignore */
  }
  App.participant = null;
  App.sessionScores = getDefaultSessionScores();
}
