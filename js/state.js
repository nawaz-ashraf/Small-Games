/**
 * PLAY ARENA — Shared Application State
 */
export const App = {
  participant: null,
  currentScreen: 'register',
  activeGame: null,
  sessionScores: {
    precision: { best: 0, last: 0, games: [] },
    pong: { best: 0, last: 0, games: [] },
    jigsaw: { bestTime: 0, lastTime: 0, bestTimes: {}, games: [] }
  }
};
