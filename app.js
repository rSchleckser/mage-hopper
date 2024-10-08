let player;
let fireProjectile;
let lives = 3;
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

class Projectile extends Phaser.Physics.Arcade.Sprite{
  constructor(scene, x, y){
    super(scene, x, y, 'fire');
  }

  fire(x,y){
    this.body.reset(x, y);

    this.setActive(true);
    this.setVisible(true);
    this.setVelocityX(200);
  }
}

class ProjectileGroup extends Phaser.Physics.Arcade.Group{
  constructor(scene){
    super(scene.physics.world, scene);

    this.createMultiple({
      classType: Fire,
      frameQuantity: 30, 
      active: false,
      visible: false,
      key: 'fire',
    })
  }

  fireProjectile(x,y){
    const projectile = this.getFirstDead(false)
    if(projectile){
      projectile.fire(x,y)
    }
  }

}

const menuScene = {
  key: 'Menu',

  preload: function () {
    this.load.image('background', './img/nature_background.jpg');
    this.load.image('Page1', './img/instructions_page_1.png');
    this.load.image('Page2', './img/instructions_page_2.png');
    this.load.image('Page3', './img/instructions_page_3.png');
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
const gameWinScene = {
  key: 'GameWin',
  preload: function () {
    this.load.image('background', './img/nature_background.jpg');
  },
  create: function () {
    this.add.image(1000, 400, 'background');
    this.add.text(700, 200, 'Congratulations!!', {
      fontSize: '72px',
      fontFamily: 'Augustine',
      fill: 'rgba(90, 145, 145)',
    });
    this.add.text(675, 300, 'You Won the Game!', {
      fontSize: '72px',
      fontFamily: 'Augustine',
      fill: 'rgb(90, 145, 145)',
    });

    const playAgain = this.add
      .text(700, 450, 'Play Again?', {
        fontSize: '48px',
        fill: '#000',
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
      playAgain.setColor('rgb(0,0,0)');
    });

    const quit = this.add
      .text(1000, 450, 'Main Menu', {
        fontSize: '48px',
        fill: '#000',
        fontFamily: 'Roboto',
      })
      .setInteractive();

    quit.on('pointerdown', () => {
      this.scene.start('Menu'); // Transition to game scene
    });
    console.log('Initial size:', quit.displayWidth, quit.displayHeight);
    console.log('Initial offset:', quit.x, quit.y);

    quit.setInteractive().on('pointerover', () => {
      quit.setShadow(2, 2, 'rgba(42, 145, 113,0.5)', 2);
      quit.setColor('rgba(42, 145, 145,0.9)');
    });
    quit.setInteractive().on('pointerout', () => {
      quit.setShadow(0, 0, 'rgba(0,0,0,0.5)', 1);
      quit.setColor('rgb(0,0,0)');
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

    //Load attack animation
    for (let i = 1; i <= 7; i++) {
      this.load.image('attack' + i, './Mage/Attack/attack' + i + '.png');
    }
    // Load Fire animation
    for (let i = 1; i <= 9; i++) {
      this.load.image('fire' + i, './Mage/Fire/fire' + i + '.png');
    }
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
      fill: 'blue',
    });

    //Player Speed Indicator
    playerSpeedIndicator = this.add.text(500, 16, `Player Speed: 160`, {
      fontSize: '32px',
      fill: 'green',
    });

    //Enemy Speed Indicator
    enemySpeedIndicator = this.add.text(
      900,
      16,
      `Enemy Speed: ${parseInt(enemySpeed * (1 + level / 8.3))}`,
      {
        fontSize: '32px',
        fill: 'red',
      }
    );

    //key spawn points for each level
    this.keyArray = [
      { x: 170, y: 265 },
      { x: 1370, y: 465 },
      { x: 1670, y: 750 },
      { x: 170, y: 265 },
      { x: 1020, y: 65 },
    ];

    //add key
    key = this.physics.add
      .sprite(this.keyArray[level - 1].x, this.keyArray[level - 1].y, 'key')
      .setScale(0.2);
    key.setBounce(1.0);
    key.body.setSize(key.width * 0.7, key.height * 1);
    key.body.setOffset(key.width * 0.15, key.height * 0.2);

    //door spawn points for each level
    this.doorArray = [
      { x: 1650, y: 253 },
      { x: 150, y: 253 },
      { x: 850, y: 453 },
      { x: 1650, y: 778 },
      { x: 150, y: 778 },
    ];

    //add door
    door = this.physics.add
      .sprite(this.doorArray[level - 1].x, this.doorArray[level - 1].y, 'door')
      .setScale(0.1);
    door.body.setSize(door.width * 0.5, door.height * 0.9);

    platforms = this.physics.add.staticGroup();

    //ground level
    ground = platforms.create(950, 990).refreshBody();
    ground.body.setSize(1900, 240);

    // first stage
    for (let i = 1; i < 3; i++) {
      platforms
        .create(100 + 500 * i, 720, 'platform')
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

    //fourth stage spawns at level 5
    if (level === 5) {
      for (let i = 1; i < 3; i++) {
        platforms
          .create(500 * i, 150, 'platform')
          .setScale(0.25)
          .refreshBody()
          .setSize(1000 * 0.25, 40 * 0.25);
      }
    }

    //create player
    player = this.physics.add.sprite(150, 800, 'player').setScale(1.5);
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
    for (let i = 1; i <= 3; i++) {
      jumpFrames.push({ key: 'jump' + i });
    }

    //peak frame for jumping animation
    let peakFrame = [{ key: 'jump4' }];

    // player fall animation
    let fallFrames = [];
    for (let i = 5; i <= 7; i++) {
      fallFrames.push({ key: 'jump' + i });
    }

    let lastFallFrame = [{ key: 'jump6' }];
    let landing = [{ key: 'jump7' }];

    let attackFrames = [];
    for (let i = 1; i <= 7; i++) {
      attackFrames.push({ key: 'attack' + i });
    }

    let fireFrames = [];
    for (let i = 1; i <= 9; i++) {
      fireFrames.push({ key: 'fire' + i });
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
      frames: jumpFrames,
      frameRate: 10,
      repeat: 0,
    });

    // peak animation
    this.anims.create({
      key: 'peak',
      frames: peakFrame,
      frameRate: 1,
      repeat: 0,
    });

    //fall animation
    this.anims.create({
      key: 'fall',
      frames: fallFrames,
      frameRate: 10,
      repeat: 0,
    });

    // last fall frame
    this.anims.create({
      key: 'lastFallFrame',
      frames: lastFallFrame,
      frameRate: 1,
      repeat: 0,
    });

    // Landing
    this.anims.create({
      key: 'landing',
      frames: landing,
      frameRate: 1,
      repeat: 0,
    });

    // attack animation
    this.anims.create({
      key: 'attack',
      frames: attackFrames,
      frameRate: 10,
      repeat: 0,
    });

    // fire animation
    this.anims.create({
      key: 'fire',
      frames: [fireFrames[1]],
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
    this.physics.add.collider(door, ground);

    function playerDies(player, enemy) {
      player.disableBody(true, true);
      if (lives > 1) {
        lives -= 1;
        lifeIndicator.setText(`Lives: ${lives}`);
        player.enableBody(
          true,
          Math.floor(Math.random() * 1700),
          800,
          // Math.floor(Math.random() * 700),
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
            if (level <= 5) {
              this.scene.start('NextLevel');
            } else {
              this.scene.start('GameWin');
            }
          },
          [],
          this
        );
      }
    }

        //key commands
    wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    //PLayers dies and respawns
    this.physics.add.collider(player, enemy, playerDies, null, this);
    this.physics.add.collider(player, enemy2, playerDies, null, this);
    this.physics.add.collider(player, enemy3, playerDies, null, this);
    //enables player to collect the key
    this.physics.add.overlap(player, key, collectKey, null, this);
    //player enters the door with key
    this.physics.add.overlap(player, door, enterDoor, null, this);



    playerState = 'idle'; // Initial player state
  },

  update: function () {
    cursors = this.input.keyboard.createCursorKeys();

    switch (playerState) {
      case 'idle':
        handleIdleState();
        break;
      case 'running':
        handleRunningState();
        break;
      case 'jumping':
        handleJumpingState();
        break;
      case 'falling':
        handleFallingState();
        break;
      case 'attacking':
        handleAttackingState();
        break;
    }

    handleStateTransitions();

    function moveLeft() {
      player.setVelocityX(-160);
      player.setFlipX(true); // Flip the player when moving left
      player.body.setSize(player.width * 0.43, player.height * 0.45);
      player.body.setOffset(player.width * 0.42, player.height * 0.43);
    }

    function moveRight() {
      player.setVelocityX(160);
      player.setFlipX(false); // Reset flip when moving right
      player.body.setSize(player.width * 0.43, player.height * 0.45);
      player.body.setOffset(player.width * 0.15, player.height * 0.43);
    }

    // Handle Idle State
    function handleIdleState() {
      player.setVelocityX(0);
      player.anims.play('turn', true);

      // Transitions to running
      if (cursors.left.isDown || aKey.isDown) {
        playerState = 'running';
      } else if (cursors.right.isDown || dKey.isDown) {
        playerState = 'running';
      }
      // Transition to jumping
      if ((cursors.up.isDown || wKey.isDown) && player.body.touching.down) {
        playerState = 'jumping';
      }
      // Transition to attacking
      if (fKey.isDown) {
        playerState = 'attacking';
      }
    }

    //Handle Running State
    function handleRunningState() {
      if (cursors.left.isDown || aKey.isDown) {
        player.setVelocityX(-160);
        // Play running left animation only if the player is on the ground
        if (player.body.touching.down) {
          player.anims.play('left', true);
        }
        player.setFlipX(true); // Flip the player when moving left
        player.body.setSize(player.width * 0.43, player.height * 0.45);
        player.body.setOffset(player.width * 0.42, player.height * 0.43);
      } else if (cursors.right.isDown || dKey.isDown) {
        player.setVelocityX(160);
        // Play running right animation only if the player is on the ground
        if (player.body.touching.down) {
          player.anims.play('right', true);
        }
        player.setFlipX(false); // Reset flip when moving right
        player.body.setSize(player.width * 0.43, player.height * 0.45);
        player.body.setOffset(player.width * 0.15, player.height * 0.43);
      }

      // Transition to idle
      if (!aKey.isDown && !dKey.isDown) {
        playerState = 'idle';
      }
      // Transition to jumping
      if ((cursors.up.isDown || wKey.isDown) && player.body.touching.down) {
        playerState = 'jumping';
      }
      // Transition to attacking
      if (fKey.isDown) {
        playerState = 'attacking';
      }
    }

    function handleJumpingState() {
      if (
        (cursors.up.isDown && player.body.touching.down) ||
        (wKey.isDown && player.body.touching.down)
      ) {
        player.setVelocityY(-350);
        player.anims.play('jump', true);
      }

      if (cursors.left.isDown || aKey.isDown) {
        moveLeft();
      } else if (cursors.right.isDown || dKey.isDown) {
        moveRight();
      }

      // modified jumping animation to check for rising and falling condition
      if (!player.body.touching.down && player.body.velocity.y === 0) {
        player.anims.play('peak', true);
      }
    }

    function handleFallingState() {
      if (!player.body.touching.down && player.body.velocity.y > 0) {
        player.anims.play('fall', true);
        if (!player.body.touching.down) {
          player.anims.play('lastFallFrame', true);
        }
      }

      if (player.body.touching.down && (aKey.isDown || dKey.isDown)) {
        playerState = 'running';
      } else if (player.body.touching.down) {
        playerState = 'idle';
      }
    }

    function handleAttackingState() {
      // Play the attack animation
      player.anims.play('attack', true);
      player.setVelocityX(0); 
    
      // Listen for animation completion
      player.once('animationcomplete-attack', () => {
        playerState = 'idle'; 
      });
    }
    

    // Handle State Transitions
    function handleStateTransitions() {
      // Transition from jumping to falling
      if (playerState === 'jumping' && player.body.velocity.y > 0) {
        playerState = 'falling';
      }

      // Transition from falling to idle (when landing)
      if (playerState === 'falling' && player.body.touching.down) {
        playerState = 'idle';
      }
    }


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

      // enemy jumping animation
      if (!enemy.body.touching.down && !(enemy.body.velocity.y > 0)) {
        enemy.anims.play('enemyJump', true);
      }
      if (!enemy.body.touching.down && enemy.body.velocity.y > 0) {
        enemy.anims.play('enemyFall', true);
      }

      // Enemy animation for following the enemies on the x-axis
      if (level < 3) {
        if (
          player.body.x < enemy.body.x &&
          player.body.x + enemy.body.x > 50 &&
          enemy.body.touching.down
        ) {
          enemy.setVelocityX(-enemySpeed * (1 + level / 8.3));
          enemy.anims.play('enemyRunLeft', true);
          enemy.setFlipX(true); // Flip the enemy when moving left
          enemy.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
          enemy.body.setOffset(enemy.width * 0.42, enemy.height * 0.43);
        } else if (
          player.body.x > enemy.body.x &&
          enemy.body.x - player.body.x < -50 &&
          enemy.body.touching.down
        ) {
          enemy.setVelocityX(enemySpeed * (1 + level / 8.3));
          enemy.anims.play('enemyRunRight', true);
          enemy.setFlipX(false); // Flip the enemy when moving right
          enemy.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
          enemy.body.setOffset(enemy.width * 0.15, enemy.height * 0.43);
        }
      } else {
        //Knights jumping animation changes at level 3, to disguise itself.
        if (
          player.body.x < enemy.body.x &&
          player.body.x + enemy.body.x > 50 &&
          enemy.body.touching.down
        ) {
          enemy.setVelocityX(-enemySpeed * (1 + level / 8.3));
          enemy.anims.play('left', true);
          enemy.setFlipX(true); // Flip the enemy when moving left
          enemy.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
          enemy.body.setOffset(enemy.width * 0.42, enemy.height * 0.43);
        } else if (
          player.body.x > enemy.body.x &&
          enemy.body.x - player.body.x < -50 &&
          enemy.body.touching.down
        ) {
          enemy.setVelocityX(enemySpeed * (1 + level / 8.3));
          enemy.anims.play('right', true);
          enemy.setFlipX(false); // Flip the enemy when moving right
          enemy.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
          enemy.body.setOffset(enemy.width * 0.15, enemy.height * 0.43);
        }
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
  scene: [menuScene, gameScene, gameOverScene, levelWinScene, gameWinScene],
  // scene: {
  //   preload: preload,
  //   create: create,
  //   update: update,
  // },
};

const game = new Phaser.Game(config);
