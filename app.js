const config = {
  type: Phaser.AUTO,
  width: 1890,
  height: 890,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 }, // Set gravity
      debug: true, // Set to true to see physics bodies
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

let player;
let ground;
let platforms;
let key;
let collectedKey = false;

const game = new Phaser.Game(config);

function preload() {
  this.load.image('background', './img/nature_background.jpg');
  this.load.image('platform', './img/grass_platform.png');
  this.load.image('key', './img/key.png');

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

  //add key
  key = this.physics.add.sprite(170, 275, 'key').setScale(0.2);
  key.body.setSize(key.width * 0.7, key.height * 1);
  key.body.setOffset(key.width * 0.15, key.height * 0.2);

  platforms = this.physics.add.staticGroup();

  //ground level
  ground = platforms.create(950, 990).refreshBody();
  ground.body.setSize(1900, 240);

  // first stage
  for (let i = 1; i < 3; i++) {
    platforms
      .create(150 + 500 * i, 720, 'platform')
      .setScale(0.25)
      .refreshBody()
      .setSize(1000 * 0.25, 40 * 0.25);
  }

  // second stage
  for (let i = 0; i < 3; i++) {
    platforms
      .create(350 + 500 * i, 550, 'platform')
      .setScale(0.25)
      .refreshBody()
      .setSize(1000 * 0.25, 40 * 0.25);
  }

  //third stage
  // second stage
  for (let i = 0; i < 4; i++) {
    platforms
      .create(150 + 500 * i, 350, 'platform')
      .setScale(0.25)
      .refreshBody()
      .setSize(1000 * 0.25, 40 * 0.25);
  }

  //level indicator
  levelIndicator = this.add.text(16, 16, 'Level: 1', {
    fontSize: '32px',
    fill: '#000',
  });

  //create player
  player = this.physics.add.sprite(150, 700, 'player').setScale(1.5);
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  //fix player collision-box origin and size

  player.body.setSize(player.width * 0.43, player.height * 0.45);
  player.body.setOffset(player.width * 0.15, player.height * 0.43);

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

  //add collision between objects in the game
  this.physics.add.collider(player, platforms);
  this.physics.add.collider(key, platforms);
  this.physics.add.collider(key, ground);

  //collect the key and player overlap
  this.physics.add.overlap(player, key, collectKey, null, this);

  function collectKey(player, key) {
    // Remove the key sprite from the scene
    collectedKey = true;
    console.log(collectKey);
    key.destroy();
  }
}

function update() {
  cursors = this.input.keyboard.createCursorKeys();

  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    player.anims.play('left', true);
    player.setFlipX(true); // Flip the player when moving left
    player.body.setSize(player.width * 0.43, player.height * 0.45);
    player.body.setOffset(player.width * 0.42, player.height * 0.43);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
    player.anims.play('right', true);
    player.setFlipX(false); // Reset flip when moving right
    player.body.setSize(player.width * 0.43, player.height * 0.45);
    player.body.setOffset(player.width * 0.15, player.height * 0.43);
  } else {
    player.setVelocityX(0);
    player.anims.play('turn');
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-350);
  }

  if (!player.body.touching.down) {
    player.anims.play('jump');
  }
}
