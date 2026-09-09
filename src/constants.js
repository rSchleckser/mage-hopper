// Gameplay tuning
export const ENEMY_BASE_SPEED = 100;
export const PLAYER_MOVE_SPEED = 160;
export const PLAYER_JUMP_VELOCITY = -350;
export const ENEMY_JUMP_VELOCITY = -350;
export const ENEMY_JUMP_DELAY_MS = 650;
export const INVULNERABILITY_MS = 1800;

// Collision-box ratios shared by the mage and the knights (same sprite proportions).
// The x-offset differs by facing direction because the sprite art isn't symmetric.
export const BODY_WIDTH_RATIO = 0.43;
export const BODY_HEIGHT_RATIO = 0.45;
export const BODY_OFFSET_X_RIGHT_RATIO = 0.15;
export const BODY_OFFSET_X_LEFT_RATIO = 0.42;
export const BODY_OFFSET_Y_RATIO = 0.43;
