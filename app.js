let player;
let lives = 3;
let deathComplete = false;
let level = 1;
let enemy;
let enemy2;
let enemy3;
const enemySpeed = 100;

let ground;
let platforms;
let door;
let key;
let collectedKey = false;

const menuScene = {
  key: 'Menu',

  preload: function () {
    const instructionPages = [
      { page: 'Page1', image: './img/instructions_page_1.png' },
      { page: 'Page2', image: './img/instructions_page_2.png' },
      { page: 'Page3', image: './img/instructions_page_3.png' },
    ];
    this.load.image('background', './img/nature_background.jpg');
    this.load.image(instructionPages[0].page, instructionPages[0].image);
    this.load.image(instructionPages[1].page, instructionPages[1].image);
    this.load.image(instructionPages[2].page, instructionPages[2].image);

    //   this.load.image('Page1', './img/instructions_page_1.png');
    //   this.load.image('Page1', './img/instructions_page_1.png');
    //   this.load.image('Page3', './img/instructions_page_3.png');
  },

  create: function () {
    this.add.image(1000, 400, 'background');

    //Add title
    this.add.text(760, 200, 'Mage Hopper', {
      fontSize: '64px',
      fontFamily: 'Augustine',
      fill: '#000',
    });

    // Add menu text/buttons
    const startGame = this.add
      .text(850, 400, 'Start Game', {
        fontSize: '32px',
        fill: '#000',
        fontFamily: 'Roboto',
      })
      .setInteractive();

    startGame.on('pointerdown', () => {
      this.scene.start('Game'); // Transition to game scene
    });

    startGame.setInteractive().on('pointerover', () => {
      startGame.setShadow(2, 2, 'rgba(42, 145, 113,0.5)', 2);
      startGame.setColor('rgba(42, 145, 145,0.9)');
    });
    startGame.setInteractive().on('pointerout', () => {
      startGame.setShadow(0, 0, 'rgba(0,0,0,0.5)', 1);
      startGame.setColor('rgb(0,0,0)');
    });

    //setup instructions button
    const instructions = this.add
      .text(850, 450, 'Instructions', {
        fontSize: '32px',
        fill: '#000',
        fontFamily: 'Roboto',
      })
      .setInteractive();

    instructions.setInteractive().on('pointerover', () => {
      instructions.setShadow(2, 2, 'rgba(42, 145, 113,0.5)', 2);
      instructions.setColor('rgba(42, 145, 145,0.9)');
    });
    instructions.setInteractive().on('pointerout', () => {
      instructions.setShadow(0, 0, 'rgba(0,0,0,0.5)', 1);
      instructions.setColor('rgb(0,0,0)');
    });

    //making instruction interactive
    instructions.on('pointerdown', () => {
      let index = 1;
      const instructionImage = this.add.image(1000, 450, 'Page' + index); // Show instructions
      const nextPage = this.add
        .text(1350, 100, 'Next Page', {
          fontSize: '32px',
          fill: 'rgba(42, 145, 145,0.9)',
          fontFamily: 'Roboto',
        })
        .setInteractive();

      //add hover effect to next page button
      nextPage.setInteractive().on('pointerover', () => {
        nextPage.setShadow(2, 2, 'rgba(0,0,0,0.5)', 2);
        nextPage.setColor('rgb(0,0,0)');
      });
      nextPage.setInteractive().on('pointerout', () => {
        nextPage.setShadow(1, 1, 'rgba(42, 145, 113,0.5)', 2);
        nextPage.setColor('rgba(42, 145, 145,0.9)');
      });

      nextPage.on('pointerdown', () => {
        if (index < 3) {
          index++;
          instructionImage.setTexture('Page' + index);
        } else {
          // add a closing function
          nextPage.destroy();
          const closeinstructions = this.add
            .text(1350, 100, 'Close', {
              fontSize: '32px',
              fill: 'rgb(145, 42, 42)',
              fontFamily: 'Roboto',
            })
            .setInteractive();

          closeinstructions.setInteractive().on('pointerover', () => {
            closeinstructions.setShadow(2, 2, 'rgba(145, 42, 42, 0.5)', 1);
            closeinstructions.setColor('rgb(145, 42, 42))');
          });
          closeinstructions.setInteractive().on('pointerout', () => {
            closeinstructions.setShadow(1, 1, 'rgba(145, 42, 42,0.5)', 2);
            closeinstructions.setColor('rgb(145, 42, 42)');
          });
          closeinstructions.on('pointerdown', () => {
            this.scene.start('Menu');
          });
        }
      });

      //add previous page function
      const prevPage = this.add
        .text(525, 100, 'Previous Page', {
          fontSize: '32px',
          fill: 'rgba(42, 145, 145,0.9)',
          fontFamily: 'Roboto',
        })
        .setInteractive();

      //add hover effect to next page button
      prevPage.setInteractive().on('pointerover', () => {
        prevPage.setShadow(2, 2, 'rgba(0,0,0,0.5)', 2);
        prevPage.setColor('rgb(0,0,0)');
      });
      prevPage.setInteractive().on('pointerout', () => {
        prevPage.setShadow(1, 1, 'rgba(42, 145, 113,0.5)', 2);
        prevPage.setColor('rgba(42, 145, 145,0.9)');
      });

      prevPage.on('pointerdown', () => {
        if (index > 1) {
          index--;
          instructionImage.setTexture('Page' + index);
        }
      });
    });
  },
};

const gameOverScene = {
  key: 'GameOver',
  preload: function () {},
  create: function () {
    this.add.text(750, 300, 'Game Over!!', { fontSize: '72px', fill: '#fff' });

    const playAgain = this.add
      .text(780, 450, 'Play Again?', {
        fontSize: '48px',
        fill: '#fff',
        fontFamily: 'Roboto',
      })
      .setInteractive();

    playAgain.on('pointerdown', () => {
      this.scene.start('Game'); // Transition to game scene
      lives = 3;
      level = 1;
    });

    playAgain.setInteractive().on('pointerover', () => {
      playAgain.setShadow(2, 2, 'rgba(42, 145, 113,0.5)', 2);
      playAgain.setColor('rgba(42, 145, 145,0.9)');
    });
    playAgain.setInteractive().on('pointerout', () => {
      playAgain.setShadow(0, 0, 'rgba(0,0,0,0.5)', 1);
      playAgain.setColor('rgb(255,255,255)');
    });

    const quit = this.add
      .text(1050, 450, 'Quit', {
        fontSize: '48px',
        fill: '#fff',
        fontFamily: 'Roboto',
      })
      .setInteractive();

    quit.on('pointerdown', () => {
      this.scene.start('Menu'); // Transition to game scene
    });
    quit.setInteractive().on('pointerover', () => {
      quit.setShadow(2, 2, 'rgba(42, 145, 113,0.5)', 2);
      quit.setColor('rgba(42, 145, 145,0.9)');
    });
    quit.setInteractive().on('pointerout', () => {
      quit.setShadow(0, 0, 'rgba(0,0,0,0.5)', 1);
      quit.setColor('rgb(255,255,255)');
    });
  },
};

const levelWinScene = {
  key: 'NextLevel',
  preload: function () {
    this.load.image('Background', './img/nature_background.jpg');
  },
  create: function () {
    this.add.image(1000, 400, 'Background');
    this.add.text(730, 250, `Congratulations!!`, {
      fontFamily: 'Augustine',
      fontSize: '64px',
      fill: '#000',
    });

    this.add
      .text(750, 380, `Ready to move on to`, {
        fontFamily: 'Roboto',
        fontSize: '48px',
        fill: '#000',
      })
      .setInteractive();

    const nextLevel = this.add
      .text(870, 500, `Level: ${level}`, {
        fontFamily: 'Roboto',
        fontSize: '48px',
        fill: '#000',
      })
      .setInteractive();

    nextLevel.on('pointerdown', () => {
      this.scene.start('Game'); // Transition to game scene
      lives = 3;
    });

    nextLevel.setInteractive().on('pointerover', () => {
      nextLevel.setShadow(2, 2, 'rgba(42, 145, 113,0.5)', 2);
      nextLevel.setColor('rgba(42, 145, 145,0.9)');
    });
    nextLevel.setInteractive().on('pointerout', () => {
      nextLevel.setShadow(0, 0, 'rgba(0,0,0,0.5)', 1);
      nextLevel.setColor('rgb(0,0,0)');
    });
  },
};

const gameScene = {
  key: 'Game',

  preload: function () {
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

    //Load Death animation frames
    this.load.spritesheet('death', './Mage/newDeath.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  },

  create: function () {
    this.add.image(1000, 400, 'background');

    //level indicator
    levelIndicator = this.add.text(16, 16, `Level: ${level}`, {
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
    enemy3 = this.physics.add.sprite(1650, 272, 'enemy').setScale(1.5);
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
      enemyJumpFrames.push({ key: 'enemyJump' + i });
    }

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

    //death animation
    this.anims.create({
      key: 'death',
      frames: this.anims.generateFrameNumbers('death', { start: 0, end: 59 }),
      frameRate: 10,
      repeat: 0,
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
      frameRate: 10,
      repeat: -1,
    });

    //fall animation
    this.anims.create({
      key: 'enemyFall',
      frames: [enemyJumpFrames[5]],
      frameRate: 4,
      repeat: -1,
    });

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
          Math.floor(Math.random() * 700),
          true,
          true
        );
        player.setBounce(0.1);
        player.setCollideWorldBounds(true);

        // Fix player collision-box origin and size
        player.body.setSize(player.width * 0.43, player.height * 0.45);
        player.body.setOffset(player.width * 0.15, player.height * 0.43);
      } else {
        lives -= 1;
        lifeIndicator.setText(`Lives: ${lives}`);
        this.scene.start('GameOver');
      }
    }

    function collectKey(player, key) {
      // Remove the key sprite from the scene
      collectedKey = true;
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
            collectedKey = false;
            level += 1;
            this.scene.start('NextLevel');
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
  },

  update: function () {
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

    //player death
    // if (lives === 0) {
    //   player.anims.play('death', true);
    //   // console.log(this.textures.get('death').frames); // Log spritesheet frames data

    //   deathComplete = true;
    // }

    //function for all enemies
    function enemyFollows(enemy, scene) {
      // Enemy animation for following the enemies on the y-axis
      //Enemy has a  delay jumping after player jumps
      if (player.body.y < enemy.body.y && enemy.body.touching.down) {
        scene.time.delayedCall(
          650,
          function () {
            enemy.setVelocityY(-350);
          },
          [],
          scene
        );
      }

      //Knights jumping animation changes at level 3, to disguise itself.
      if (level < 3) {
        if (!enemy.body.touching.down && !(enemy.body.velocity.y > 0)) {
          enemy.anims.play('enemyJump', true);
        }
        if (!enemy.body.touching.down && enemy.body.velocity.y > 0) {
          enemy.anims.play('enemyFall', true);
        }
      } else {
        if (!enemy.body.touching.down && !(enemy.body.velocity.y > 0)) {
          enemy.anims.play('jump', true);
        }
        if (!enemy.body.touching.down && enemy.body.velocity.y > 0) {
          enemy.anims.play('fall', true);
        }
      }

      // Enemy animation for following the enemies on the x-axis

      if (
        player.body.x < enemy.body.x &&
        player.body.x + enemy.body.x > 50 &&
        enemy.body.touching.down
      ) {
        enemy.setVelocityX(-enemySpeed * (1 + (level - 1) / 10));
        enemy.anims.play('enemyRunLeft', true);
        enemy.setFlipX(true); // Flip the enemy when moving left
        enemy.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
        enemy.body.setOffset(enemy.width * 0.42, enemy.height * 0.43);
      } else if (
        player.body.x > enemy.body.x &&
        enemy.body.x - player.body.x < -50 &&
        enemy.body.touching.down
      ) {
        enemy.setVelocityX(enemySpeed * (1 + (level - 1) / 10));
        enemy.anims.play('enemyRunRight', true);
        enemy.setFlipX(false); // Flip the enemy when moving right
        enemy.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
        enemy.body.setOffset(enemy.width * 0.15, enemy.height * 0.43);
      }
    }

    // Calls the function for each enemy
    enemyFollows(enemy, this);
    enemyFollows(enemy2, this);
    enemyFollows(enemy3, this);
  },
};

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1890,
    height: 890,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 }, // Set gravity
      debug: false, // Set to true to see physics bodies
    },
  },
  scene: [menuScene, gameScene, gameOverScene, levelWinScene],
  // scene: {
  //   preload: preload,
  //   create: create,
  //   update: update,
  // },
};

const game = new Phaser.Game(config);
