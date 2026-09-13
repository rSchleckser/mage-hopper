export class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'fire1');
  }

  // The flame's opaque pixels cover roughly the middle third of the 32x32
  // source canvas (fire1..9.png) horizontally, so the default full-frame
  // body is much wider than the visible flame — biased toward the leading
  // edge (direction of travel), matching how SlamWave sizes its own hitbox.
  // Vertically, several frames' flame content reaches all the way to the
  // canvas bottom (y=32) as it flickers, and — since the bolt's flight
  // height is spawned a bit above the player's own center — a tight
  // vertical box left too little overlap with a same-height enemy's hurtbox
  // for reliable hits, so the box extends down to the canvas edge.
  refreshHitbox() {
    if (!this.body) return;
    const w = 16;
    const h = 21;
    this.body.setSize(w, h);
    if (this.flipX) {
      this.body.setOffset(2, 11);
    } else {
      this.body.setOffset(32 - w - 2, 11);
    }
  }

  fire(x, y, dir = 1) {
    this.setActive(true);
    this.setVisible(true);
    if (this.body) {
      this.body.enable = true;
      this.body.reset(x, y);
      this.body.allowGravity = false;
      if (this.body.setAllowGravity) this.body.setAllowGravity(false);
    }
    // Bigger bolt so it reads next to the scaled mage/knights
    this.setScale(2.4);
    this.setVelocityY(0);
    this.setAcceleration(0, 0);
    // Straight horizontal flight across the level
    const speed = 420;
    this.setVelocityX(dir * speed);
    this.setFlipX(dir < 0);
    this.refreshHitbox();
    if (this.anims) {
      this.anims.play('fire', true);
    }
  }
}

export class ProjectileGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene) {
    super(scene.physics.world, scene);

    this.createMultiple({
      classType: Projectile,
      frameQuantity: 30,
      active: false,
      visible: false,
      key: 'fire1',
    });
  }

  fireProjectile(x, y) {
    const projectile = this.getFirstDead(false);
    if (projectile) {
      projectile.fire(x, y);
    }
  }
}
