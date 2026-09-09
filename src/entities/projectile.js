export class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'fire1');
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
