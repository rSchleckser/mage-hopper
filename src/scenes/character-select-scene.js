import { setMobileControlsVisible } from '../input.js';
import { dismissRotateHint } from '../rotate-hint.js';
import { makePillButton } from '../ui/menu-widgets.js';
import { MENU_COLORS } from '../ui/theme.js';
import { shouldUseDomOverlay, hideMenuDomUi } from '../ui/dom-overlays.js';
import { openCharacterSelectDomOverlay, hideCharacterSelectDomUi } from '../ui/character-select-overlay.js';
import { getAllCharacters, frameFileIndices, frameCount } from '../characters.js';
import { getSelectedCharacterId, setSelectedCharacterId } from '../character-select.js';
import { playUiClick } from '../audio.js';

const CARD_W = 380;
const CARD_H = 480;
const CARD_GAP = 70;
const CX = 1000;
const CARD_Y = 490;

function idleTextureKey(characterId, frameNum) {
  return `cs_${characterId}_idle${frameNum}`;
}

function idleAnimKey(characterId) {
  return `cs_${characterId}_idle`;
}

export const characterSelectScene = {
  key: 'CharacterSelect',

  preload: function () {
    this.load.image('background', './img/nature_background.jpg');
    getAllCharacters().forEach((character) => {
      frameFileIndices(character.anims.idle).forEach((fileIndex, i) => {
        this.load.image(
          idleTextureKey(character.id, i + 1),
          `./${character.folder}/${character.anims.idle.dir}/${character.anims.idle.prefix}${fileIndex}.png`
        );
      });
    });
  },

  create: function () {
    setMobileControlsVisible(false);
    dismissRotateHint();
    hideMenuDomUi();

    const characters = getAllCharacters();

    characters.forEach((character) => {
      const key = idleAnimKey(character.id);
      if (!this.anims.exists(key)) {
        const frames = [];
        for (let i = 1; i <= frameCount(character.anims.idle); i++) {
          frames.push({ key: idleTextureKey(character.id, i) });
        }
        this.anims.create({ key, frames, frameRate: 10, repeat: -1 });
      }
    });

    let selectedId = getSelectedCharacterId();
    const cardNodes = [];

    const confirmSelection = () => {
      setSelectedCharacterId(selectedId);
      hideCharacterSelectDomUi();
      this.scene.start('Game');
    };
    const goBack = () => {
      hideCharacterSelectDomUi();
      this.scene.start('Menu');
    };

    this.events.once('shutdown', () => hideCharacterSelectDomUi());

    // Portrait / touch: the letterboxed canvas is tiny here, use a full-viewport card instead.
    if (shouldUseDomOverlay()) {
      openCharacterSelectDomOverlay(this, {
        characters,
        selectedId,
        onSelect: (id) => {
          selectedId = id;
        },
        onConfirm: confirmSelection,
        onBack: goBack,
      });
      return;
    }

    this.add.image(CX, 400, 'background');
    this.add.rectangle(CX, 400, 1890, 890, 0x0a1010, 0.35);

    this.add
      .text(CX, 80, 'CHOOSE YOUR HERO', {
        fontFamily: 'Cinzel, serif',
        fontSize: '58px',
        fontStyle: '900',
        color: '#fff8e7',
        stroke: '#1a2424',
        strokeThickness: 6,
        shadow: { offsetX: 0, offsetY: 4, color: '#1f6e6e', blur: 0, fill: true, stroke: true },
      })
      .setOrigin(0.5);

    this.add
      .text(CX, 140, 'Pick a fighter, then confirm', {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: '700',
        color: 'rgba(255,248,231,0.8)',
      })
      .setOrigin(0.5);

    const totalW = characters.length * CARD_W + (characters.length - 1) * CARD_GAP;
    const startX = CX - totalW / 2 + CARD_W / 2;

    const drawCard = (character, index) => {
      const cardX = startX + index * (CARD_W + CARD_GAP);
      const isSelected = character.id === selectedId;

      const panel = this.add.graphics();
      const sprite = this.add
        .sprite(cardX, CARD_Y - 70, idleTextureKey(character.id, 1))
        .setScale(2.2)
        .play(idleAnimKey(character.id));

      const nameText = this.add
        .text(cardX, CARD_Y + 150, character.name, {
          fontFamily: 'Cinzel, serif',
          fontSize: '30px',
          fontStyle: '900',
          color: '#fff8e7',
        })
        .setOrigin(0.5);

      const taglineText = this.add
        .text(cardX, CARD_Y + 188, character.tagline, {
          fontFamily: 'Nunito, system-ui, sans-serif',
          fontSize: '15px',
          fontStyle: '700',
          color: 'rgba(255,248,231,0.75)',
        })
        .setOrigin(0.5);

      const redraw = (selected) => {
        panel.clear();
        panel.fillStyle(MENU_COLORS.ink, selected ? 0.55 : 0.35);
        panel.fillRoundedRect(cardX - CARD_W / 2, CARD_Y - CARD_H / 2, CARD_W, CARD_H, 20);
        panel.lineStyle(selected ? 5 : 2, selected ? MENU_COLORS.tealLite : 0xffffff, selected ? 0.95 : 0.3);
        panel.strokeRoundedRect(cardX - CARD_W / 2, CARD_Y - CARD_H / 2, CARD_W, CARD_H, 20);
        sprite.setScale(selected ? 2.35 : 2.2);
      };
      redraw(isSelected);

      // World-space zone (not nested in a scaled container) so the hit area
      // stays aligned with the visuals at any FIT letterbox scale.
      const zone = this.add
        .zone(cardX, CARD_Y, CARD_W, CARD_H)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        playUiClick();
        selectedId = character.id;
        cardNodes.forEach((c) => c.redraw(c.character.id === selectedId));
      });

      cardNodes.push({ character, redraw });
      return [panel, sprite, nameText, taglineText, zone];
    };

    characters.forEach((character, index) => drawCard(character, index));

    const backBtn = makePillButton(this, 130, 40, 'Back', {
      width: 120,
      height: 40,
      variant: 'secondary',
      fontSize: 15,
      depth: 20,
    });
    backBtn.setOnActivate(goBack);

    const confirmBtn = makePillButton(this, CX, CARD_Y + CARD_H / 2 + 70, 'Start Adventure', {
      width: 300,
      height: 58,
      variant: 'primary',
      fontSize: 24,
      depth: 20,
    });
    confirmBtn.setOnActivate(confirmSelection);

    // Keyboard: arrows move the highlight, Enter/Space confirms.
    const moveSelection = (dir) => {
      const idx = characters.findIndex((c) => c.id === selectedId);
      const nextIdx = (idx + dir + characters.length) % characters.length;
      selectedId = characters[nextIdx].id;
      cardNodes.forEach((c) => c.redraw(c.character.id === selectedId));
      playUiClick();
    };
    const onLeft = () => moveSelection(-1);
    const onRight = () => moveSelection(1);
    const onConfirmKey = () => confirmSelection();
    this.input.keyboard.on('keydown-LEFT', onLeft);
    this.input.keyboard.on('keydown-RIGHT', onRight);
    this.input.keyboard.on('keydown-ENTER', onConfirmKey);
    this.input.keyboard.on('keydown-SPACE', onConfirmKey);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-LEFT', onLeft);
      this.input.keyboard.off('keydown-RIGHT', onRight);
      this.input.keyboard.off('keydown-ENTER', onConfirmKey);
      this.input.keyboard.off('keydown-SPACE', onConfirmKey);
    });
  },
};
