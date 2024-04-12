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

  // Load player image
  this.load.image('player', './Mage/mage.png');

  // Load running animation frames
  for (let i = 1; i <= 8; i++) {
    this.load.image('run' + i, './Mage/Run/run' + i + '.png');
  }

  // Load jumping animation frames
  for (let i = 1; i <= 7; i++) {
    this.load.image('jump' + i, './Mage/Jump/jump' + i + '.png');
  }
}

function create() {
  this.add.image(1000, 400, 'background');

  // platforms = this.physics.add.staticGroup();
  // let platform = platforms.create(150, 625, 'platform');
  // platform.setDisplaySize(200, 50);

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

  //create player
  player = this.physics.add.sprite(150, 700, 'player').setScale(1.5);

  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  // Set up running animation frames
  let runFrames = [];
  for (let i = 1; i <= 8; i++) {
    runFrames.push({ key: 'run' + i });
  }
  //set up jumping animation frames
  let jumpFrames = [];
  for (let i = 1; i <= 7; i++) {
    jumpFrames.push({ key: 'jump' + i });
  }

  // Create the 'left' animation
  this.anims.create({
    key: 'left',
    frames: runFrames,
    frameRate: 10,
    repeat: -1,
    // Set flipX to true when playing the 'left' animation
    onStart: function () {
      player.setFlipX(true);
    },
    // Reset flipX to false when the 'left' animation ends
    onComplete: function () {
      player.setFlipX(false);
    },
  });

  //base animation
  this.anims.create({
    key: 'turn',
    frames: [{ key: 'player', frame: 0 }],
    frameRate: 10,
  });

  //right animation
  this.anims.create({
    key: 'right',
    frames: runFrames,
    frameRate: 10,
    repeat: -1,
  });

  //jump animation
  this.anims.create({
    key: 'jump',
    frames: jumpFrames,
    frameRate: 10,
    repeat: -1,
  });

  console.log(jumpFrames);
}

//creates uniform style platforms
// function createPlatform(scene, x, y, width, height) {
//   platforms = scene.add.graphics();
//   platforms.fillStyle(0x00ff00);
//   platforms.fillRect(x, y, width, height);
//   platforms.lineStyle(4, 0x000000);
//   platforms.strokeRect(x, y, width, height);
// }

function createPlatform(scene, x, y, width, height) {
  let platform = scene.physics.add.staticSprite(x, y, null, width, height);
  platform.setOrigin(0); // Set origin to top-left corner
  platform.setDisplaySize(width, height);
  platform.setTint(0x00ff00);
  platform.body.setSize(width, height);
  platform.body.setOffset(0, 0);
  return platform;
}

function update() {
  cursors = this.input.keyboard.createCursorKeys();

  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    player.anims.play('left', true);
    player.setFlipX(true); // Flip the player when moving left
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
    player.anims.play('right', true);
    player.setFlipX(false); // Reset flip when moving right
  } else {
    player.setVelocityX(0);
    player.anims.play('turn');
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330);
    player.anims.play('jump');
  }
}
