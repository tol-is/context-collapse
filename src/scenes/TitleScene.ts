import Phaser from 'phaser';
import { audio } from '../systems/AudioManager';
import { addCreditLink } from '../ui/CreditLink';

export default class TitleScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private promptText!: Phaser.GameObjects.Text;
  private cursorBlink = true;
  private blinkTimer = 0;
  private promptReady = false;

  constructor() { super('TitleScene'); }

  create() {
    const h = this.scale.height;
    this.gfx = this.add.graphics();
    const mono = { fontFamily: '"Share Tech Mono", monospace' };
    const cx = 40;
    let cy = 36;

    const bootLines = [
      { text: '$ init --context-window', color: '#445566' },
      { text: '  loading model weights... done', color: '#445566' },
      { text: '  status: CRITICAL', color: '#ff3333' },
    ];

    for (let i = 0; i < bootLines.length; i++) {
      const t = this.add.text(cx, cy + i * 20, '', {
        ...mono, fontSize: '13px', color: bootLines[i].color,
      }).setAlpha(0).setDepth(10);
      this.time.delayedCall(200 + i * 350, () => {
        t.setAlpha(1);
        this.typeText(t, bootLines[i].text, 20);
      });
    }

    cy += bootLines.length * 20 + 36;

    const title = this.add.text(cx, cy, '', {
      ...mono, fontSize: '42px', color: '#ffffff', letterSpacing: 2,
    }).setDepth(10).setAlpha(0);
    this.time.delayedCall(1400, () => {
      title.setAlpha(1);
      this.typeText(title, 'CONTEXT COLLAPSE', 35);
    });

    cy += 58;

    const sub = this.add.text(cx, cy, '', {
      ...mono, fontSize: '13px', color: '#556688',
    }).setDepth(10).setAlpha(0);
    this.time.delayedCall(2100, () => {
      sub.setAlpha(1);
      this.typeText(sub, 'Nothing is real. Survive anyway.', 18);
    });

    cy += 36;

    const lore = [
      '> The model is broken.',
      '> It generates endlessly. Confident, wrong, relentless.',
      '> The context window is filling.',
      '> You are the last cursor in the buffer.',
    ];
    for (let i = 0; i < lore.length; i++) {
      const t = this.add.text(cx, cy + i * 24, '', {
        ...mono, fontSize: '13px', color: '#00cc66',
      }).setAlpha(0).setDepth(10);
      this.time.delayedCall(2800 + i * 600, () => {
        t.setAlpha(1);
        this.typeText(t, lore[i], 28);
      });
    }

    cy += lore.length * 24 + 36;

    this.promptText = this.add.text(cx, cy, '', {
      ...mono, fontSize: '16px', color: '#00aaff',
    }).setAlpha(0).setDepth(10);
    const promptStr = '> PRESS ENTER TO BEGIN_';
    this.time.delayedCall(5200, () => {
      this.promptText.setAlpha(1);
      this.typeText(this.promptText, promptStr, 22);
      this.time.delayedCall(22 * promptStr.length + 100, () => { this.promptReady = true; });
    });

    const ctrl = this.add.text(cx, h - 44, '', {
      ...mono, fontSize: '13px', color: '#d8d8d0',
    }).setDepth(10);
    this.time.delayedCall(2000, () => {
      this.typeText(ctrl, 'WASD move  |  SPACE fire  |  E special  |  M mute', 10);
    });

    this.input.keyboard!.on('keydown-ENTER', () => {
      audio.init(); audio.play('gameStart');
      this.cameras.main.fadeOut(400, 24, 24, 27);
      this.time.delayedCall(450, () => this.scene.start('ClassSelectScene'));
    });
    this.input.keyboard!.on('keydown-M', () => audio.toggleMute());
    this.cameras.main.fadeIn(500, 24, 24, 27);
    addCreditLink(this);
  }

  private typeText(obj: Phaser.GameObjects.Text, text: string, speed: number) {
    let i = 0;
    this.time.addEvent({
      delay: speed, repeat: text.length - 1,
      callback: () => { i++; obj.setText(text.substring(0, i)); },
    });
  }

  update(_time: number, delta: number) {
    const w = this.scale.width, h = this.scale.height;
    this.blinkTimer += delta;
    if (this.blinkTimer > 500) {
      this.blinkTimer = 0;
      this.cursorBlink = !this.cursorBlink;
      if (this.promptReady) {
        this.promptText.setText('> PRESS ENTER TO BEGIN' + (this.cursorBlink ? '_' : ' '));
      }
    }

    this.gfx.clear();
    this.gfx.fillStyle(0x000000, 0.04);
    for (let y = 0; y < h; y += 3) this.gfx.fillRect(0, y, w, 1);
  }
}
