// Gameplay tuning
export const ENEMY_BASE_SPEED = 100;
export const PLAYER_MOVE_SPEED = 160;
export const PLAYER_JUMP_VELOCITY = -350;
export const ENEMY_JUMP_VELOCITY = -350;
export const ENEMY_JUMP_DELAY_MS = 650;
export const INVULNERABILITY_MS = 1800;

// Extra downward gravity applied only while a body is actually falling
// (velocity.y > 0), on top of the world gravity set in main.js — makes
// landings snappier without touching jump height/reach (rise is untouched).
export const FALL_GRAVITY_BOOST = 200;

// Combat stats: hit points and per-hit power, replacing the old
// touch-equals-instant-kill model on both sides.
export const ENEMY_HP = 2;
export const ENEMY_CONTACT_DAMAGE = 1;

// Enemy attack: how close an enemy needs to be to swing (vertical check
// reuses MELEE_HEIGHT_TOLERANCE below) and the cooldown between swings.
export const ENEMY_ATTACK_RANGE = 70;
export const ENEMY_ATTACK_COOLDOWN_MS = 1200;

// Melee reach (Rogue): a rectangle extending in front of the player, swept
// against enemies on attack release.
export const MELEE_REACH = 90;
export const MELEE_EXTRA_REACH = 150;
export const MELEE_HEIGHT_TOLERANCE = 90;

// Collision-box ratios shared by the mage and the knights (same sprite proportions).
// The x-offset differs by facing direction because the sprite art isn't symmetric.
export const BODY_WIDTH_RATIO = 0.43;
export const BODY_HEIGHT_RATIO = 0.45;
export const BODY_OFFSET_X_RIGHT_RATIO = 0.15;
export const BODY_OFFSET_X_LEFT_RATIO = 0.42;
export const BODY_OFFSET_Y_RATIO = 0.43;
