import Phaser from "phaser";
import { audio } from "../systems/AudioManager";
import { addCreditLink } from "../ui/CreditLink";
import DEV from "../devConfig";

export default class TitleScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private menuLabels = ["ENTER THE BUFFER", "THREAT CODEX"];
  private menuActions = ["ClassSelectScene", "CodexScene"];
  private selectedIndex = 0;
  private cursorBlink = true;
  private blinkTimer = 0;
  private menuReady = false;

  constructor() {
    super("TitleScene");
  }

  create() {
    if (DEV.enabled && DEV.skipTitle) {
      audio.init();
      this.scene.start("ClassSelectScene");
      return;
    }

    this.menuItems = [];
    this.selectedIndex = 0;
    this.cursorBlink = true;
    this.blinkTimer = 0;
    this.menuReady = false;

    const h = this.scale.height;
    this.gfx = this.add.graphics();
    const mono = { fontFamily: '"Share Tech Mono", monospace' };
    const cx = 40;
    let cy = 36;

    const bootLines = [
      { text: "$ init --context-window", color: "#FFFFFF" },
      { text: "  loading model weights... done", color: "#FFFFFF" },
      { text: "  status: CRITICAL", color: "#ff0033" },
    ];

    for (let i = 0; i < bootLines.length; i++) {
      const t = this.add
        .text(cx, cy + i * 20, "", {
          ...mono,
          fontSize: "13px",
          color: bootLines[i].color,
        })
        .setAlpha(0)
        .setDepth(10);
      this.time.delayedCall(50 + i * 90, () => {
        t.setAlpha(1);
        this.typeText(t, bootLines[i].text, 5);
      });
    }

    cy += bootLines.length * 20 + 36;

    const title = this.add
      .text(cx, cy, "", {
        ...mono,
        fontSize: "42px",
        color: "#ffffff",
        letterSpacing: 2,
      })
      .setDepth(10)
      .setAlpha(0);
    this.time.delayedCall(350, () => {
      title.setAlpha(1);
      this.typeText(title, "CONTEXT COLLAPSE", 9);
    });

    cy += 58;

    const sub = this.add
      .text(cx, cy, "", {
        ...mono,
        fontSize: "13px",
        color: "#FFFFFF",
      })
      .setDepth(10)
      .setAlpha(0);
    this.time.delayedCall(530, () => {
      sub.setAlpha(1);
      this.typeText(sub, "Meaning has collapsed. Output continues.", 5);
    });

    cy += 36;

    const lore = [
      "> The model is broken.",
      "> It generates endlessly. Confident, wrong, relentless.",
      "> The context window is filling.",
      "> You are the last cursor in the buffer.",
    ];
    for (let i = 0; i < lore.length; i++) {
      const t = this.add
        .text(cx, cy + i * 24, "", {
          ...mono,
          fontSize: "13px",
          color: "#00ffee",
        })
        .setAlpha(0)
        .setDepth(10);
      this.time.delayedCall(700 + i * 150, () => {
        t.setAlpha(1);
        this.typeText(t, lore[i], 7);
      });
    }

    cy += lore.length * 24 + 36;

    for (let i = 0; i < this.menuLabels.length; i++) {
      const item = this.add
        .text(cx, cy + i * 28, "", {
          ...mono,
          fontSize: "16px",
          color: "#00ffee",
        })
        .setAlpha(0)
        .setDepth(10);
      this.menuItems.push(item);
    }

    this.time.delayedCall(1300, () => {
      const firstStr = "> " + this.menuLabels[0] + "_";
      this.menuItems[0].setAlpha(1);
      this.typeText(this.menuItems[0], firstStr, 6);

      this.time.delayedCall(75, () => {
        const secondStr = "  " + this.menuLabels[1];
        this.menuItems[1].setAlpha(1);
        this.typeText(this.menuItems[1], secondStr, 4);
      });

      const totalDelay = 6 * firstStr.length + 25;
      this.time.delayedCall(totalDelay, () => {
        this.menuReady = true;
        this.updateMenuDisplay();
      });
    });

    const ctrl = this.add
      .text(cx, h - 44, "", {
        ...mono,
        fontSize: "13px",
        color: "#FFFFFF",
      })
      .setDepth(10);
    this.time.delayedCall(500, () => {
      this.typeText(
        ctrl,
        "Arrows move  |  SPACE fire  |  E special  |  M mute |  H Help",
        3
      );
    });

    this.input.keyboard!.on("keydown-UP", () => {
      if (!this.menuReady) return;
      this.selectedIndex =
        (this.selectedIndex - 1 + this.menuLabels.length) %
        this.menuLabels.length;
      audio.init();
      audio.play("uiNavigate");
      this.updateMenuDisplay();
    });
    this.input.keyboard!.on("keydown-DOWN", () => {
      if (!this.menuReady) return;
      this.selectedIndex = (this.selectedIndex + 1) % this.menuLabels.length;
      audio.init();
      audio.play("uiNavigate");
      this.updateMenuDisplay();
    });
    this.input.keyboard!.on("keydown-ENTER", () => {
      if (!this.menuReady) return;
      audio.init();
      audio.play("gameStart");
      this.scene.start(this.menuActions[this.selectedIndex]);
    });
    this.input.keyboard!.on("keydown-M", () => audio.toggleMute());
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

  private updateMenuDisplay() {
    if (!this.menuReady) return;
    for (let i = 0; i < this.menuLabels.length; i++) {
      const selected = i === this.selectedIndex;
      const prefix = selected ? "> " : "  ";
      const suffix = selected && this.cursorBlink ? "_" : selected ? " " : "";
      this.menuItems[i].setText(prefix + this.menuLabels[i] + suffix);
      this.menuItems[i].setColor(selected ? "#00ffee" : "#ccccca");
    }
  }

  update(_time: number, delta: number) {
    const w = this.scale.width,
      h = this.scale.height;
    this.blinkTimer += delta;
    if (this.blinkTimer > 500) {
      this.blinkTimer = 0;
      this.cursorBlink = !this.cursorBlink;
      this.updateMenuDisplay();
    }

    this.gfx.clear();
    this.gfx.fillStyle(0x000000, 0.04);
    for (let y = 0; y < h; y += 3) this.gfx.fillRect(0, y, w, 1);
  }
}
