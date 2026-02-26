import Phaser from "phaser";
import { audio } from "../systems/AudioManager";
import { addCreditLink } from "../ui/CreditLink";

export default class VictoryScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private promptText!: Phaser.GameObjects.Text;
  private cursorBlink = true;
  private blinkTimer = 0;
  private promptReady = false;

  constructor() {
    super("VictoryScene");
  }

  create(data: { tokens?: number; systemPrompt?: string; layers?: number }) {
    this.cursorBlink = true;
    this.blinkTimer = 0;
    this.promptReady = false;

    const mono = { fontFamily: '"Share Tech Mono", monospace' };
    this.gfx = this.add.graphics();
    const cx = 40;
    let cy = 36;

    const lines = [
      { text: "$ run --stabilize", color: "#FFFFFF", delay: 0 },
      { text: "", color: "#FFFFFF", delay: 300 },
      { text: "CONTEXT STABILIZED", color: "#00ffee", delay: 600 },
      {
        text: "The singularity has been contained.",
        color: "#FFFFFF",
        delay: 1000,
      },
      { text: "", color: "#FFFFFF", delay: 1200 },
      {
        text: `  system_prompt   "${data.systemPrompt ?? "autocomplete"}"`,
        color: "#00eeff",
        delay: 1600,
      },
      {
        text: `  layers_cleared  ${data.layers ?? 21}`,
        color: "#00eeff",
        delay: 2000,
      },
      {
        text: `  tokens          ${data.tokens ?? 0}`,
        color: "#00eeff",
        delay: 2400,
      },
      { text: "  status          OUTPUT_CLEAN", color: "#00ffee", delay: 2800 },
      { text: "", color: "#FFFFFF", delay: 3200 },
      {
        text: "> The model generates clearly now.",
        color: "#FFFFFF",
        delay: 3600,
      },
      {
        text: "> For a little while, at least.",
        color: "#FFFFFF",
        delay: 4200,
      },
    ];

    for (let i = 0; i < lines.length; i++) {
      const t = this.add
        .text(cx, cy + i * 22, "", {
          ...mono,
          fontSize: "13px",
          color: lines[i].color,
        })
        .setAlpha(0)
        .setDepth(10);
      if (lines[i].text === "") {
        this.time.delayedCall(lines[i].delay, () => t.setAlpha(1));
      } else {
        this.time.delayedCall(lines[i].delay, () => {
          t.setAlpha(1);
          this.typeText(t, lines[i].text, 22);
        });
      }
    }

    cy += lines.length * 22 + 32;

    const promptStr = "> PRESS ENTER TO REPLAY_";
    this.promptText = this.add
      .text(cx, cy, "", {
        ...mono,
        fontSize: "16px",
        color: "#00ffee",
      })
      .setAlpha(0)
      .setDepth(10);
    this.time.delayedCall(5000, () => {
      this.promptText.setAlpha(1);
      this.typeText(this.promptText, promptStr, 22);
      this.time.delayedCall(22 * promptStr.length + 100, () => {
        this.promptReady = true;
      });
    });

    this.input.keyboard!.on("keydown-ENTER", () => {
      audio.play("gameStart");
      this.cameras.main.fadeOut(400, 24, 24, 27);
      this.time.delayedCall(450, () => this.scene.start("TitleScene"));
    });
    this.input.keyboard!.on("keydown-M", () => audio.toggleMute());
    this.cameras.main.fadeIn(600, 24, 24, 27);
    addCreditLink(this);
  }

  private typeText(obj: Phaser.GameObjects.Text, text: string, speed: number) {
    let i = 0;
    this.time.addEvent({
      delay: speed,
      repeat: text.length - 1,
      callback: () => {
        i++;
        obj.setText(text.substring(0, i));
      },
    });
  }

  update(_time: number, delta: number) {
    const w = this.scale.width,
      h = this.scale.height;
    this.blinkTimer += delta;
    if (this.blinkTimer > 500) {
      this.blinkTimer = 0;
      this.cursorBlink = !this.cursorBlink;
      if (this.promptReady) {
        this.promptText.setText(
          "> PRESS ENTER TO REPLAY" + (this.cursorBlink ? "_" : " ")
        );
      }
    }

    this.gfx.clear();
    this.gfx.fillStyle(0x000000, 0.04);
    for (let y = 0; y < h; y += 3) this.gfx.fillRect(0, y, w, 1);
  }
}
