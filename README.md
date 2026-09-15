# Mage Hopper

Mage Hopper is a platformer where you pick a hero, hop across floating platforms, take down knights, and race to the key and door on each stage before you run out of lives. Clear all 5 levels to win. Playable on desktop and mobile.

**Play the game [here](https://rschleckser.github.io/mage-hopper/)**

![Gameplay Screenshot](./img/GamePlay.png)

## Features

- **3 playable heroes**, each with a different feel:
  - **Mage** — Ranged fire magic. Fragile, but hits from anywhere on screen.
  - **Rogue** — Close-quarters blades. Faster than the others, has to close the distance.
  - **Knight** — Slow, tough, hits hard. Starts with more lives and HP than the others.
- **5 hand-built levels**, growing more demanding as you go — the later stages add moving platforms (oscillating and conveyor-style) on top of the standard jump-and-climb layouts.
- **HP + lives combat** on both sides: enemies take multiple hits to go down, and you only lose a life once your HP for that life runs out — contact alone doesn't hurt you, only a landed enemy swing does, followed by a brief invulnerability window.
- **Mobile-first UI**: the main menu, character select, pause menu, and end screens all switch to full-viewport layouts on phones instead of shrinking the desktop layout down.

## How to Play

1. **Choose your hero** on the Character Select screen, then **Start Adventure**.
2. **Controls**:

   | Action | Keyboard | Touch |
   | --- | --- | --- |
   | Move | `←`/`→` or `A`/`D` | On-screen D-pad |
   | Jump | `↑` or `W` | JUMP button |
   | Attack | `F` | FIRE button |
   | Extra Attack | `E` | SLAM button |
   | Pause | `P` or `Esc` | Pause button |

   Touch controls appear automatically on phones and tablets.
3. **Fight knights**: they patrol the platforms and chase you down — attacks (not just bumping into them) are what cost you HP, and they take a few hits to defeat.
4. **Collect the key**, then reach the door to clear the stage and move to the next level.
5. **Watch your HP and lives**: each hero has their own starting HP and life count (the Knight is the tankiest). Run out of lives and it's game over — play again or return to the menu.
6. **Clear all 5 levels** to win the game.

## Screenshots

### Main Menu

![Main Menu Screenshot](./img/Main_Menu.png)

### Character Select

![Character Select Screenshot](./img/CharacterSelect.png)

### In-Game Instructions

![Game Instructions - Controls](./img/instructions_page_1.png)
![Game Instructions - Quest](./img/instructions_page_2.png)
![Game Instructions - Tips](./img/instructions_page_3.png)

## Technologies Used

- HTML5 / CSS3
- JavaScript (ES Modules — no build step, bundler, or `npm install` required)
- [Phaser 3](https://phaser.io/) game framework (pinned to 3.80.0 via CDN in `index.html`)

## Project Structure

The game logic lives under `src/`, organized by responsibility:

```
src/
  main.js                 Phaser config and game bootstrap
  characters.js           Per-character stats, animations, and asset config
  character-select.js     Selected-character state (persists across scenes)
  game-state.js           Shared run state (lives, HP, level, key collected)
  constants.js            Gameplay tuning values (speeds, hitboxes, timers)
  levels.js               Per-level platforms, moving platforms, key/door spawns
  input.js                Touch/mobile control handling
  audio.js                Sound effects + mute state
  rotate-hint.js          Landscape-orientation nudge + canvas scale handling
  entities/               Projectile and slam-wave sprite classes + pools
  utils/hitbox.js         Shared facing-direction hitbox helper
  ui/                     Pill-button UI kit, theme colors, and per-screen DOM
                          overlays (menu, character select, pause, game over,
                          level/game win, instructions) used on mobile
  scenes/
    menu-scene.js             Main menu
    character-select-scene.js Hero picker
    pause-scene.js            Pause menu
    game-over-scene.js        Game over screen
    level-win-scene.js        Between-level screen
    game-win-scene.js         Victory screen
    game-scene/                The level itself:
      index.js                   Scene setup, world/collider wiring
      player-controller.js       Player input + state machine
      enemy-ai.js                Enemy chase/attack behavior
      combat.js                  Damage, key/door, death handling
      animations.js              Animation definitions per character
      hud.js                     Level/lives badges + HP bar
```

`index.html` loads `src/main.js` directly as an ES module — see **Development** below for how to run it locally.

## Development

No `npm install` or build step — this is plain HTML/CSS/JS. To run it locally, serve the folder with any static file server (opening `index.html` directly via `file://` won't work, since ES modules require a real HTTP origin):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

While playing, press the backtick key (`` ` ``) to toggle a debug overlay showing player/enemy speed and Arcade Physics collision boxes — useful when tuning movement or level layouts.

## Credits

- **Code**: Richard Schleckser
- **Character sprites** (Mage, Rogue, Knight): [Assassin, Mage, Viking - Free Pixel Art Game Heroes](https://craftpix.net/freebies/assassin-mage-viking-free-pixel-art-game-heroes/) by CraftPix
- **Background artwork**: [Freepik](https://www.freepik.com/) (Freepik Company S.L.)
- **Sound effects**: rendered with [sfxr.me](https://sfxr.me/) (public domain / Unlicense)

## License

The game's original code (this repo's HTML, CSS, and JavaScript) is licensed under the [MIT License](./LICENSE). Third-party art and audio keep their own sources/licenses as listed under Credits above.
