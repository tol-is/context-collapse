import Phaser from 'phaser';
import { audio } from '../systems/AudioManager';

export default class GameOverScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private promptText!: Phaser.GameObjects.Text;
  private cursorBlink = true;
  private blinkTimer = 0;
  private promptReady = false;

  constructor() { super('GameOverScene'); }

  create(data: { layer?: number; kills?: number; tokens?: number }) {
    const mono = { fontFamily: '"Share Tech Mono", monospace' };
    this.gfx = this.add.graphics();
    const cx = 40;
    let cy = 36;

    const err = `ERR_CONTEXT_${Math.floor(Math.random() * 9000 + 1000)}`;

    const lines = [
      { text: '$ run --continue', color: '#445566', delay: 0 },
      { text: '', color: '#445566', delay: 200 },
      { text: `FATAL: ${err}`, color: '#ff2222', delay: 400 },
      { text: 'CONTEXT OVERFLOW', color: '#ff2222', delay: 600 },
      { text: '', color: '#445566', delay: 800 },
      { text: 'The context window has collapsed.', color: '#667788', delay: 1000 },
      { text: 'cursor terminated — process exited with code 1', color: '#667788', delay: 1200 },
      { text: '', color: '#445566', delay: 1400 },
      { text: `  layer    ${data.layer ?? 1}`, color: '#556688', delay: 1600 },
      { text: `  kills    ${data.kills ?? 0}`, color: '#556688', delay: 1800 },
      { text: `  tokens   ${data.tokens ?? 0}`, color: '#556688', delay: 2000 },
    ];

    for (let i = 0; i < lines.length; i++) {
      const t = this.add.text(cx, cy + i * 22, '', {
        ...mono, fontSize: '13px', color: lines[i].color,
      }).setAlpha(0).setDepth(10);
      if (lines[i].text === '') {
        this.time.delayedCall(lines[i].delay, () => t.setAlpha(1));
      } else {
        this.time.delayedCall(lines[i].delay, () => {
          t.setAlpha(1);
          this.typeText(t, lines[i].text, 18);
        });
      }
    }

    cy += lines.length * 22 + 32;

    const promptStr = '> PRESS ENTER TO RETRY_';
    this.promptText = this.add.text(cx, cy, '', {
      ...mono, fontSize: '16px', color: '#00aaff',
    }).setAlpha(0).setDepth(10);
    this.time.delayedCall(2800, () => {
      this.promptText.setAlpha(1);
      this.typeText(this.promptText, promptStr, 22);
      this.time.delayedCall(22 * promptStr.length + 100, () => { this.promptReady = true; });
    });

    this.input.keyboard!.on('keydown-ENTER', () => {
      audio.play('gameStart');
      this.cameras.main.fadeOut(400, 24, 24, 27);
      this.time.delayedCall(450, () => this.scene.start('TitleScene'));
    });
    this.input.keyboard!.on('keydown-M', () => audio.toggleMute());
    this.cameras.main.fadeIn(500, 24, 24, 27);
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
        this.promptText.setText('> PRESS ENTER TO RETRY' + (this.cursorBlink ? '_' : ' '));
      }
    }

    this.gfx.clear();
    this.gfx.fillStyle(0x000000, 0.04);
    for (let y = 0; y < h; y += 3) this.gfx.fillRect(0, y, w, 1);
  }
}
