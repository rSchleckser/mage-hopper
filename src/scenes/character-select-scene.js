import { setMobileControlsVisible } from '../input.js';
import { dismissRotateHint } from '../rotate-hint.js';
import { makePillButton } from '../ui/menu-widgets.js';
import { MENU_COLORS } from '../ui/theme.js';
import { shouldUseDomOverlay, hideMenuDomUi } from '../ui/dom-overlays.js';
import { openCharacterSelectDomOverlay, hideCharacterSelectDomUi } from '../ui/character-select-overlay.js';
import { getAllCharacters, frameFileIndices, frameCount } from '../characters.js';
import { getSelectedCharacterId, setSelectedCharacterId } from '../character-select.js';
import { playUiClick } from '../audio.js';

const CARD_W = 420;
const CARD_H = 520;
const CARD_GAP = 56;
const CX = 1000;
const CARD_Y = 470;

function idleTextureKey(characterId, frameNum) {
  return `cs_${characterId}_idle${frameNum}`;
}

function idleAnimKey(characterId) {
  return `cs_${characterId}_idle`;
}

function attackExtraTextureKey(characterId, frameNum) {
  return `cs_${characterId}_ax${frameNum}`;
}

function attackExtraAnimKey(characterId) {
  return `cs_${characterId}_attack_extra`;
}

function shouldForceDomCharacterSelect() {
  // Never leave phones on tiny letterboxed Phaser cards.
  return (
    shouldUseDomOverlay() ||
    window.matchMedia('(max-width: 900px)').matches ||
    window.matchMedia('(orientation: portrait)').matches
  );
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
      const ax = character.anims.attackExtra;
      if (ax) {
        frameFileIndices(ax).forEach((fileIndex, i) => {
          this.load.image(
            attackExtraTextureKey(character.id, i + 1),
            `./${character.folder}/${ax.dir}/${ax.prefix}${fileIndex}.png`
          );
        });
      }
    });
  },

  create: function () {
    setMobileControlsVisible(false);
    dismissRotateHint();
    hideMenuDomUi();

    const characters = getAllCharacters();

    characters.forEach((character) => {
      const idleKey = idleAnimKey(character.id);
      if (!this.anims.exists(idleKey)) {
        const frames = [];
        for (let i = 1; i <= frameCount(character.anims.idle); i++) {
          frames.push({ key: idleTextureKey(character.id, i) });
        }
        this.anims.create({ key: idleKey, frames, frameRate: 10, repeat: -1 });
      }
      const ax = character.anims.attackExtra;
      if (ax) {
        const axKey = attackExtraAnimKey(character.id);
        if (!this.anims.exists(axKey)) {
          const frames = [];
          for (let i = 1; i <= frameCount(ax); i++) {
            frames.push({ key: attackExtraTextureKey(character.id, i) });
          }
          this.anims.create({ key: axKey, frames, frameRate: 12, repeat: 0 });
        }
      }
    });

    let selectedId = getSelectedCharacterId();
    const cardNodes = [];
    let confirming = false;

    const goBack = () => {
      if (confirming) return;
      hideCharacterSelectDomUi();
      this.scene.start('Menu');
    };

    this.events.once('shutdown', () => hideCharacterSelectDomUi());

    // Mobile / narrow: cream full-viewport DOM overlay (not letterboxed Phaser cards).
    if (shouldForceDomCharacterSelect()) {
      openCharacterSelectDomOverlay(this, {
        characters,
        selectedId,
        onSelect: (id) => {
          selectedId = id;
        },
        onConfirm: () => {
          setSelectedCharacterId(selectedId);
          hideCharacterSelectDomUi();
          this.scene.start('Game');
        },
        onBack: goBack,
      });
      return;
    }

    this.add.image(CX, 400, 'background');
    // Soft dim so cream cards pop (keep nature visible).
    this.add.rectangle(CX, 400, 1890, 890, 0x0a1010, 0.28);

    this.add
      .text(CX, 72, 'CHOOSE YOUR HERO', {
        fontFamily: 'Cinzel, serif',
        fontSize: '58px',
        fontStyle: '900',
        color: '#fff8e7',
        stroke: '#1a2424',
        strokeThickness: 6,
        shadow: { offsetX: 0, offsetY: 4, color: '#1f6e6e', blur: 0, fill: true, stroke: true },
      })
      .setOrigin(0.5);

    // Soft cream ribbon for subtitle (menu language, readable over sun).
    const sub = this.add
      .text(0, 0, 'Pick a fighter, then confirm', {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: '800',
        color: 'rgba(26,36,36,0.72)',
      })
      .setOrigin(0.5);
    const rw = sub.width + 36;
    const rh = sub.height + 12;
    const ribbonG = this.add.graphics();
    ribbonG.fillStyle(MENU_COLORS.cream, 0.75);
    ribbonG.fillRoundedRect(CX - rw / 2, 128 - rh / 2, rw, rh, 4);
    sub.setPosition(CX, 128);

    const totalW = characters.length * CARD_W + (characters.length - 1) * CARD_GAP;
    const startX = CX - totalW / 2 + CARD_W / 2;

    const drawCard = (character, index) => {
      const cardX = startX + index * (CARD_W + CARD_GAP);
      const isSelected = character.id === selectedId;

      const panel = this.add.graphics();
      const sprite = this.add
        .sprite(cardX, CARD_Y - 50, idleTextureKey(character.id, 1))
        .setScale(2.85)
        .play(idleAnimKey(character.id));

      const nameText = this.add
        .text(cardX, CARD_Y + 168, character.name, {
          fontFamily: 'Cinzel, serif',
          fontSize: '32px',
          fontStyle: '900',
          color: '#1a2424',
        })
        .setOrigin(0.5);

      const taglineText = this.add
        .text(cardX, CARD_Y + 208, character.tagline, {
          fontFamily: 'Nunito, system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: '700',
          color: 'rgba(26,36,36,0.68)',
        })
        .setOrigin(0.5);

      const redraw = (selected) => {
        panel.clear();
        // Cream cards — match Instructions / Level Complete language (no dark ink slabs).
        panel.fillStyle(MENU_COLORS.cream, selected ? 0.98 : 0.9);
        panel.fillRoundedRect(cardX - CARD_W / 2, CARD_Y - CARD_H / 2, CARD_W, CARD_H, 22);
        panel.lineStyle(
          selected ? 5 : 2,
          selected ? MENU_COLORS.tealLite : MENU_COLORS.ink,
          selected ? 1 : 0.32
        );
        panel.strokeRoundedRect(cardX - CARD_W / 2, CARD_Y - CARD_H / 2, CARD_W, CARD_H, 22);
        if (selected) {
          panel.lineStyle(3, MENU_COLORS.teal, 0.28);
          panel.strokeRoundedRect(cardX - CARD_W / 2 - 4, CARD_Y - CARD_H / 2 - 4, CARD_W + 8, CARD_H + 8, 24);
        }
        if (!confirming) {
          sprite.setScale(selected ? 3.15 : 2.85);
        }
      };
      redraw(isSelected);

      const zone = this.add
        .zone(cardX, CARD_Y, CARD_W, CARD_H)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        if (confirming) return;
        playUiClick();
        selectedId = character.id;
        cardNodes.forEach((c) => c.redraw(c.character.id === selectedId));
      });

      cardNodes.push({ character, redraw, sprite, zone });
      return [panel, sprite, nameText, taglineText, zone];
    };

    characters.forEach((character, index) => drawCard(character, index));

    const backBtn = makePillButton(this, 130, 40, 'Back', {
      width: 120,
      height: 44,
      variant: 'secondary',
      fontSize: 15,
      depth: 20,
    });
    backBtn.setOnActivate(goBack);

    const confirmBtn = makePillButton(this, CX, CARD_Y + CARD_H / 2 + 72, 'Start Adventure', {
      width: 320,
      height: 60,
      variant: 'primary',
      fontSize: 24,
      depth: 20,
    });

    const confirmSelection = () => {
      if (confirming) return;
      confirming = true;
      playUiClick();
      setSelectedCharacterId(selectedId);

      const node = cardNodes.find((c) => c.character.id === selectedId);
      const axKey = attackExtraAnimKey(selectedId);
      let finished = false;
      const finish = () => {
        if (finished || !this.sys.settings.active) return;
        finished = true;
        hideCharacterSelectDomUi();
        this.scene.start('Game');
      };

      // Disable further card picks while the flourish plays.
      cardNodes.forEach((c) => {
        if (c.zone && c.zone.disableInteractive) c.zone.disableInteractive();
      });

      if (node && node.sprite && this.anims.exists(axKey)) {
        node.sprite.setScale(3.25);
        node.sprite.once('animationcomplete', finish);
        node.sprite.play(axKey);
        // Safety timeout if animationcomplete is missed.
        this.time.delayedCall(1600, () => finish());
      } else {
        finish();
      }
    };
    confirmBtn.setOnActivate(confirmSelection);

    const moveSelection = (dir) => {
      if (confirming) return;
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
