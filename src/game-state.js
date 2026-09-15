// Shared run state across scenes (Game / GameOver / NextLevel / GameWin).
export const gameState = {
  lives: 3,
  hp: 2,
  level: 1,
  collectedKey: false,
  // Double jump is fully implemented (player-controller.js) but held back as
  // a future unlockable — flip this true (or wire it to a real unlock event
  // later) to turn it back on.
  doubleJumpUnlocked: false,
};
