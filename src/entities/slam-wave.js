// Extra Attack fire wave — separate VFX that travels out from the staff
export class SlamWave extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'fireExtra1');
  }

  refreshHitbox() {
    if (!this.body) return;
    // Sized to the wave's actual opaque content while traveling
    // (fire_extra1..3.png: bbox ~44,54 to 69,93 on the 128 source), not
    // pushed out toward the canvas edge — that previously put the hitbox
    // well ahead of the visible wave. Scale applies on top.
    const w = 30;
    const h = 45;
    this.body.setSize(w, h);
    const contentX = 41;
    if (this.flipX) {
      this.body.setOffset(128 - contentX - w, 51);
    } else {
      this.body.setOffset(contentX, 51);
    }
  }

  despawn() {
    this.off('animationcomplete-fireExtraTravel');
    this.off('animationcomplete-fireExtraImpact');
    if (this.anims) this.anims.stop();
    this.setActive(false);
    this.setVisible(false);
    this.setData('impacting', false);
    this.setVelocity(0, 0);
    if (this.body) {
      this.body.stop();
      this.body.enable = false;
    }
  }

  launch(x, y, dir = 1, power = 1) {
    this.power = power;
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setDepth(50);
    this.setData('impacting', false);
    this.setTexture('fireExtra1');
    this.setScale(2.6);
    this.setFlipX(dir < 0);

    if (this.body) {
      this.body.enable = true;
      this.body.allowGravity = false;
      if (this.body.setAllowGravity) this.body.setAllowGravity(false);
      this.body.reset(x, y);
    }
    this.refreshHitbox();
    this.setAcceleration(0, 0);
    this.setVelocityY(0);
    this.setVelocityX(dir * 360);

    // Play fire_extra1..3, then hold on fire_extra3 while traveling
    this.off('animationcomplete-fireExtraTravel');
    this.off('animationcomplete-fireExtraImpact');
    this.once('animationcomplete-fireExtraTravel', () => {
      if (!this.active || this.getData('impacting')) return;
      if (this.anims) this.anims.stop();
      this.setTexture('fireExtra3');
      this.setScale(2.6);
      this.setVisible(true);
      this.setAlpha(1);
      if (this.body && !this.getData('impacting')) {
        this.body.enable = true;
        this.refreshHitbox();
        const speed = 360;
        this.setVelocityX(this.flipX ? -speed : speed);
        this.setVelocityY(0);
      }
    });
    if (this.anims) {
      this.anims.play('fireExtraTravel', true);
    } else {
      this.setTexture('fireExtra3');
      this.refreshHitbox();
    }
  }

  // Enemy hitbox entered: stop and play fire_extra4..9
  beginImpact() {
    if (this.getData('impacting')) return;
    this.setData('impacting', true);
    this.setVelocity(0, 0);
    this.setAcceleration(0, 0);
    if (this.body) {
      this.body.stop();
      this.body.enable = false;
    }
    this.off('animationcomplete-fireExtraTravel');
    this.off('animationcomplete-fireExtraImpact');
    this.setVisible(true);
    this.setAlpha(1);
    this.setDepth(50);
    this.setScale(2.6);

    this.once('animationcomplete-fireExtraImpact', () => {
      this.despawn();
    });
    if (this.anims) {
      this.anims.stop();
      this.anims.play('fireExtraImpact', true);
    } else {
      this.despawn();
    }
  }
}

export class SlamWaveGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene) {
    super(scene.physics.world, scene);
    this.createMultiple({
      classType: SlamWave,
      frameQuantity: 8,
      active: false,
      visible: false,
      key: 'fireExtra1',
    });
    this.children.each((wave) => {
      if (wave.body) wave.body.enable = false;
      wave.setActive(false);
      wave.setVisible(false);
    });
  }
}
