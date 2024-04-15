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
  // scene: [menuScene, gameScene],
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

let player;
let lives = 3;
let enemy;
let enemy2;
let enemy3;
const enemySpeed = 100;
let ground;
let platforms;
let door;
let key;
let collectedKey = false;

function preload() {
  this.load.image('background', './img/nature_background.jpg');
  this.load.image('platform', './img/grass_platform.png');
  this.load.image('key', './img/key.png');
  this.load.image('door', './img/door.png');

  // Load player image
  this.load.image('player', './Mage/mage.png');
  //Load Enemy
  this.load.image('enemy', './Knight/knight.png');

  // Load running animation frames
  for (let i = 1; i <= 8; i++) {
    this.load.image('run' + i, './Mage/Run/run' + i + '.png');
  }
  //load enemy running frames
  for (let i = 1; i <= 8; i++) {
    this.load.image('enemyRun' + i, './Knight/Run/run' + i + '.png');
  }

  // Load jumping animation frames
  for (let i = 1; i <= 7; i++) {
    this.load.image('jump' + i, './Mage/Jump/jump' + i + '.png');
  }
  //load enemy jumping frames
  for (let i = 1; i <= 7; i++) {
    this.load.image('enemyJump' + i, './Knight/Jump/jump' + i + '.png');
  }

  //load attack animation frames
  // for (let i = 1; i <= 7; i++) {
  //   this.load.image('attack' + i, './Mage/Attack/attack' + i + '.png');
  // }
  this.load.spritesheet('attack', './Mage/new.png', {
    frameWidth: 71,
    frameHeight: 83,
  });
}

function create() {
  this.add.image(1000, 400, 'background');

  //level indicator
  levelIndicator = this.add.text(16, 16, 'Level: 1', {
    fontSize: '32px',
    fill: '#000',
  });

  //Life Indicator
  lifeIndicator = this.add.text(1700, 16, `Lives: ${lives}`, {
    fontSize: '32px',
    fill: 'red',
  });

  //add key
  key = this.physics.add.sprite(170, 265, 'key').setScale(0.2);
  key.setBounce(1.0);
  key.body.setSize(key.width * 0.7, key.height * 1);
  key.body.setOffset(key.width * 0.15, key.height * 0.2);

  //add door
  door = this.physics.add.sprite(1650, 253, 'door').setScale(0.1);
  door.body.setSize(door.width * 0.5, door.height * 0.9);

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

  for (let i = 0; i < 4; i++) {
    platforms
      .create(150 + 500 * i, 350, 'platform')
      .setScale(0.25)
      .refreshBody()
      .setSize(1000 * 0.25, 40 * 0.25);
  }

  //create player
  player = this.physics.add.sprite(150, 700, 'player').setScale(1.5);
  player.setBounce(0.1);
  player.setCollideWorldBounds(true);

  //fix player collision-box origin and size
  player.body.setSize(player.width * 0.43, player.height * 0.45);
  player.body.setOffset(player.width * 0.15, player.height * 0.43);

  //create enemy
  enemy = this.physics.add.sprite(850, 450, 'enemy').setScale(1.5);
  enemy.setCollideWorldBounds(true);
  //fix enemy collision-box origin and size
  enemy.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
  enemy.body.setOffset(enemy.width * 0.15, enemy.height * 0.43);

  //create enemy2
  enemy2 = this.physics.add.sprite(1150, 272, 'enemy').setScale(1.5);
  enemy2.setCollideWorldBounds(true);
  //fix enemy collision-box origin and size
  enemy2.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
  enemy2.body.setOffset(enemy.width * 0.15, enemy.height * 0.43);

  //create enemy3
  enemy3 = this.physics.add.sprite(150, 272, 'enemy').setScale(1.5);
  enemy3.setCollideWorldBounds(true);
  //fix enemy collision-box origin and size
  enemy3.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
  enemy3.body.setOffset(enemy.width * 0.15, enemy.height * 0.43);

  // Set up running animation frames
  let runFrames = [];
  for (let i = 1; i <= 8; i++) {
    runFrames.push({ key: 'run' + i });
  }

  //let enemy run animation frame
  let enemyRunFrames = [];
  for (let i = 1; i <= 8; i++) {
    enemyRunFrames.push({ key: 'enemyRun' + i });
  }

  //set up jumping animation frames
  let jumpFrames = [];
  for (let i = 1; i <= 7; i++) {
    jumpFrames.push({ key: 'jump' + i });
  }

  let enemyJumpFrames = [];
  for (let i = 1; i <= 7; i++) {
    enemyJumpFrames.push({ key: 'jump' + i });
  }
  //set up attack animation frames
  // let attackFrames = [];
  // for (let i = 1; i <= 7; i++) {
  //   attackFrames.push({ key: 'attack' + i });
  // }

  //base animation
  this.anims.create({
    key: 'turn',
    frames: [{ key: 'player' }],
    frameRate: 10,
  });

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
    frames: [jumpFrames[1]],
    frameRate: 4,
    repeat: -1,
  });

  //fall animation
  this.anims.create({
    key: 'fall',
    frames: [jumpFrames[5]],
    frameRate: 4,
    repeat: -1,
  });

  //attack animation
  this.anims.create({
    key: 'attack',
    frames: this.anims.generateFrameNumbers('attack', { start: 0, end: 5 }),
    frameRate: 4,
  });

  // enemy base animation
  this.anims.create({
    key: 'enemyTurn',
    frames: [{ key: 'enemy' }],
    frameRate: 10,
  });

  //create the enemy runing right animation
  this.anims.create({
    key: 'enemyRunRight',
    frames: enemyRunFrames,
    frameRate: 10,
    repeat: -1,
  });

  //create the enemy runing left animation
  this.anims.create({
    key: 'enemyRunLeft',
    frames: enemyRunFrames,
    frameRate: 10,
    repeat: -1,
    // Set flipX to true when playing the 'left' animation
    onStart: function () {
      enemy.setFlipX(true);
    },
    // Reset flipX to false when the 'left' animation ends
    onComplete: function () {
      enemy.setFlipX(false);
    },
  });

  //jump animation
  this.anims.create({
    key: 'enemyJump',
    frames: [enemyJumpFrames[1]],
    frameRate: 4,
    repeat: -1,
  });

  //fall animation
  this.anims.create({
    key: 'enemyFall',
    frames: [enemyJumpFrames[5]],
    frameRate: 4,
    repeat: -1,
  });

  console.log(enemyJumpFrames);

  //add collision between objects in the game
  this.physics.add.collider(player, platforms);
  this.physics.add.collider(enemy, platforms);
  this.physics.add.collider(enemy2, platforms);
  this.physics.add.collider(enemy3, platforms);
  this.physics.add.collider(key, platforms);
  this.physics.add.collider(key, ground);
  this.physics.add.collider(door, platforms);

  function playerDies(player, enemy) {
    player.disableBody(true, true);
    if (lives > 1) {
      lives -= 1;
      lifeIndicator.setText(`Lives: ${lives}`);
      player.enableBody(
        true,
        Math.floor(Math.random() * 1700),
        200,
        true,
        true
      );
      player.setBounce(0.1);
      player.setCollideWorldBounds(true);

      // Fix player collision-box origin and size
      player.body.setSize(player.width * 0.43, player.height * 0.45);
      player.body.setOffset(player.width * 0.15, player.height * 0.43);
    } else {
      console.log('Game Over!!');
    }
  }

  function collectKey(player, key) {
    // Remove the key sprite from the scene
    collectedKey = true;
    console.log(collectedKey);
    key.destroy();
  }

  function enterDoor(player, door) {
    if (collectedKey === true) {
      // Create a fade-out effect
      this.cameras.main.fadeOut(500);
      // Wait for the fade-out to complete before destroying the door
      this.time.delayedCall(
        1000,
        function () {
          door.destroy();
        },
        [],
        this
      );
    }
  }

  //PLayers dies and respawns
  this.physics.add.collider(player, enemy, playerDies, null, this);
  this.physics.add.collider(player, enemy2, playerDies, null, this);
  this.physics.add.collider(player, enemy3, playerDies, null, this);
  //enables player to collect the key
  this.physics.add.overlap(player, key, collectKey, null, this);
  //player enters the door with key
  this.physics.add.overlap(player, door, enterDoor, null, this);

  //key commands
  wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
  dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
}

function update() {
  cursors = this.input.keyboard.createCursorKeys();
  //player moveset
  if (cursors.left.isDown || aKey.isDown) {
    player.setVelocityX(-160);
    player.anims.play('left', true);
    player.setFlipX(true); // Flip the player when moving left
    player.body.setSize(player.width * 0.43, player.height * 0.45);
    player.body.setOffset(player.width * 0.42, player.height * 0.43);
  } else if (cursors.right.isDown || dKey.isDown) {
    //player animation
    player.setVelocityX(160);
    player.anims.play('right', true);
    player.setFlipX(false); // Reset flip when moving right
    player.body.setSize(player.width * 0.43, player.height * 0.45);
    player.body.setOffset(player.width * 0.15, player.height * 0.43);
  } else {
    player.setVelocityX(0);
    player.anims.play('turn');
  }

  // modified jumping animation to check for rising and falling condition
  if (!player.body.touching.down && !(player.body.velocity.y > 0)) {
    player.anims.play('jump', true);
  }
  if (!player.body.touching.down && player.body.velocity.y > 0) {
    player.anims.play('fall', true);
  }

  // player jump animation
  if (
    (cursors.up.isDown && player.body.touching.down) ||
    (wKey.isDown && player.body.touching.down)
  ) {
    player.setVelocityY(-350);
    player.anims.play('jump', true);
  }

  //function for all enemies
  function enemyFollows(enemy, scene) {
    // Enemy animation for following the enemies on the y-axis
    if (player.body.y < enemy.body.y && enemy.body.touching.down) {
      scene.time.delayedCall(
        550,
        function () {
          enemy.setVelocityY(-350);
        },
        [],
        scene
      );
    }

    // Enemy animation for following the enemies on the x-axis
    if (player.body.x < enemy.body.x && player.body.x + enemy.body.x > 50) {
      enemy.setVelocityX(-enemySpeed);
      enemy.anims.play('enemyRunLeft', true);
      enemy.setFlipX(true); // Flip the enemy when moving left
      enemy.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
      enemy.body.setOffset(enemy.width * 0.42, enemy.height * 0.43);
    } else if (
      player.body.x > enemy.body.x &&
      enemy.body.x - player.body.x < -50
    ) {
      enemy.setVelocityX(enemySpeed);
      enemy.anims.play('enemyRunRight', true);
      enemy.setFlipX(false); // Flip the enemy when moving left
      enemy.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
      enemy.body.setOffset(enemy.width * 0.15, enemy.height * 0.43);
    }
  }

  // Calls the function for each enemy
  enemyFollows(enemy, this);
  enemyFollows(enemy2, this);
  enemyFollows(enemy3, this);

  if (fKey.isDown) {
    player.anims.play('attack', true);
  }
}
