import {
  BODY_WIDTH_RATIO,
  BODY_HEIGHT_RATIO,
  BODY_OFFSET_X_RIGHT_RATIO,
  BODY_OFFSET_X_LEFT_RATIO,
  BODY_OFFSET_Y_RATIO,
} from '../constants.js';

// The mage/knight collision box needs a different x-offset depending on facing
// direction, so this must be re-applied any time a sprite flips.
export function applyFacingHitbox(sprite, facingLeft) {
  sprite.body.setSize(sprite.width * BODY_WIDTH_RATIO, sprite.height * BODY_HEIGHT_RATIO);
  sprite.body.setOffset(
    sprite.width * (facingLeft ? BODY_OFFSET_X_LEFT_RATIO : BODY_OFFSET_X_RIGHT_RATIO),
    sprite.height * BODY_OFFSET_Y_RATIO
  );
}
