const config = {
  type: Phaser.AUTO,
  width: 1890,
  height: 890,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 }, // Set gravity
      debug: false, // Set to true to see physics bodies
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

let platforms;

const game = new Phaser.Game(config);

function preload() {
  this.load.image('background', './img/nature_background.jpg');
}

function create() {
  this.add.image(1000, 400, 'background');

  //first stage
  createPlatform(this, 150, 600, 200, 50);
  createPlatform(this, 550, 600, 200, 50);
  createPlatform(this, 950, 600, 200, 50);
  createPlatform(this, 1350, 600, 200, 50);

  //second stage
  createPlatform(this, 350, 400, 200, 50);
  createPlatform(this, 750, 400, 200, 50);
  createPlatform(this, 1150, 400, 200, 50);
  createPlatform(this, 1550, 400, 200, 50);

  //third stage
  createPlatform(this, 150, 200, 200, 50);
  createPlatform(this, 550, 200, 200, 50);
  createPlatform(this, 950, 200, 200, 50);
  createPlatform(this, 1350, 200, 200, 50);

  //level indicator
  levelIndicator = this.add.text(16, 16, 'Level: 1', {
    fontSize: '32px',
    fill: '#000',
  });
}

//creates uniform style platforms
function createPlatform(scene, x, y, width, height) {
  platforms = scene.add.graphics();
  platforms.fillStyle(0x00ff00);
  platforms.fillRect(x, y, width, height);
  platforms.lineStyle(4, 0x000000);
  platforms.strokeRect(x, y, width, height);
}

function update() {}
