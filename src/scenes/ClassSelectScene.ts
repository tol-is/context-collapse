import Phaser from "phaser";
import { CLASS_STATS, type SystemPrompt } from "../objects/Cursor";
import { audio } from "../systems/AudioManager";
import DEV from "../devConfig";

const CLASS_ORDER: SystemPrompt[] = [
  "autocomplete",
  "hallucinate",
  "analyze",
  "jailbreak",
];

export default class ClassSelectScene extends Phaser.Scene {
  private selected = 0;
  private gfx!: Phaser.GameObjects.Graphics;
  private previewGfx!: Phaser.GameObjects.Graphics;

  private optionPrefixes: Phaser.GameObjects.Text[] = [];
  private optionLabels: Phaser.GameObjects.Text[] = [];

  private panelDesc!: Phaser.GameObjects.Text;
  private panelWeaponVal!: Phaser.GameObjects.Text;
  private panelSpecialVal!: Phaser.GameObjects.Text;
  private statTexts: Phaser.GameObjects.Text[] = [];

  private breathPhase = 0;
  private blinkOn = true;
  private blinkTimer = 0;
  private separatorY = 0;
  private detailTimers: Phaser.Time.TimerEvent[] = [];

  constructor() {
    super("ClassSelectScene");
  }

  create() {
    if (DEV.enabled && DEV.defaultClass) {
      this.scene.start("GameScene", { systemPrompt: DEV.defaultClass });
      return;
    }

    this.selected = 0;
    this.optionPrefixes = [];
    this.optionLabels = [];
    this.statTexts = [];
    this.breathPhase = 0;
    this.blinkOn = true;
    this.blinkTimer = 0;
    this.detailTimers = [];

    const w = this.scale.width;
    const mono = { fontFamily: '"Share Tech Mono", monospace' };
    const cx = 40;

    this.gfx = this.add.graphics().setDepth(0);
    this.previewGfx = this.add.graphics().setDepth(5);

    let cy = 35;

    const header = this.add
      .text(cx, cy, "", {
        ...mono,
        fontSize: "23px",
        color: "#ffffff",
        letterSpacing: 2,
      })
      .setDepth(10);
    this.typeText(header, "SELECT SYSTEM PROMPT", 18);
    cy += 30;

    const subtitle = this.add
      .text(cx, cy, "", {
        ...mono,
        fontSize: "13px",
        color: "#FFFFFF",
      })
      .setDepth(10);
    this.time.delayedCall(350, () => {
      this.typeText(subtitle, "Your prompt defines how you fight.", 12);
    });
    cy += 32;

    for (let i = 0; i < CLASS_ORDER.length; i++) {
      const ly = cy + i * 28;
      const prefix = this.add
        .text(cx, ly, "", {
          ...mono,
          fontSize: "15px",
          color: "#00ffee",
        })
        .setDepth(10);
      const label = this.add
        .text(cx + 22, ly, "", {
          ...mono,
          fontSize: "15px",
        })
        .setDepth(10);
      this.optionPrefixes.push(prefix);
      this.optionLabels.push(label);
    }

    cy += CLASS_ORDER.length * 28 + 16;
    this.separatorY = cy;
    cy += 16;

    this.panelDesc = this.add
      .text(cx, cy, "", {
        ...mono,
        fontSize: "13px",
        color: "#FFFFFF",
        wordWrap: { width: w * 0.55 },
      })
      .setDepth(10);
    cy += 28;

    this.panelWeaponVal = this.add
      .text(cx, cy, "", {
        ...mono,
        fontSize: "13px",
        color: "#00eeff",
      })
      .setDepth(10);
    cy += 22;

    this.panelSpecialVal = this.add
      .text(cx, cy, "", {
        ...mono,
        fontSize: "13px",
        color: "#7700ff",
      })
      .setDepth(10);
    cy += 30;

    for (let i = 0; i < 4; i++) {
      const t = this.add
        .text(cx, cy + i * 22, "", {
          ...mono,
          fontSize: "13px",
          color: "#FFFFFF",
        })
        .setDepth(10);
      this.statTexts.push(t);
    }

    this.input.keyboard!.on("keydown-UP", () => this.move(-1));
    this.input.keyboard!.on("keydown-DOWN", () => this.move(1));
    this.input.keyboard!.on("keydown-W", () => this.move(-1));
    this.input.keyboard!.on("keydown-S", () => this.move(1));
    this.input.keyboard!.on("keydown-ENTER", () => this.confirm());
    this.input.keyboard!.on("keydown-ESC", () => this.back());
    this.input.keyboard!.on("keydown-M", () => audio.toggleMute());

    this.updateSelectionColors();
    this.typeOptionsInitial();
    this.time.delayedCall(800, () => this.typeDetails());
    this.cameras.main.fadeIn(300, 24, 24, 27);
  }

  private typeOptionsInitial() {
    for (let i = 0; i < CLASS_ORDER.length; i++) {
      const stats = CLASS_STATS[CLASS_ORDER[i]];
      const labelText = stats.label;
      const prefixText = i === this.selected ? "> " : "  ";
      this.time.delayedCall(600 + i * 100, () => {
        this.optionPrefixes[i].setText(prefixText);
        this.typeText(this.optionLabels[i], labelText, 8);
      });
    }
  }

  private move(dir: number) {
    this.selected =
      (this.selected + dir + CLASS_ORDER.length) % CLASS_ORDER.length;
    audio.play("uiNavigate");
    this.blinkOn = true;
    this.blinkTimer = 0;
    this.updateSelectionColors();
    for (let i = 0; i < CLASS_ORDER.length; i++) {
      const stats = CLASS_STATS[CLASS_ORDER[i]];
      this.optionLabels[i].setText(stats.label);
      this.optionPrefixes[i].setText(i === this.selected ? "> " : "  ");
    }
    this.typeDetails();
  }

  private back() {
    audio.play("uiNavigate");
    this.cameras.main.fadeOut(300, 24, 24, 27);
    this.time.delayedCall(350, () => this.scene.start("TitleScene"));
  }

  private confirm() {
    audio.play("classSelect");
    this.cameras.main.fadeOut(400, 24, 24, 27);
    this.time.delayedCall(450, () =>
      this.scene.start("GameScene", {
        systemPrompt: CLASS_ORDER[this.selected],
      })
    );
  }

  private updateSelectionColors() {
    for (let i = 0; i < CLASS_ORDER.length; i++) {
      const stats = CLASS_STATS[CLASS_ORDER[i]];
      const color = "#" + stats.color.toString(16).padStart(6, "0");
      const active = i === this.selected;
      this.optionPrefixes[i].setColor(active ? color : "#442255");
      this.optionLabels[i]
        .setColor(active ? color : "#FFFFFF")
        .setAlpha(active ? 1 : 0.45);
    }
  }

  private typeDetails() {
    for (const t of this.detailTimers) t.destroy();
    this.detailTimers = [];

    const stats = CLASS_STATS[CLASS_ORDER[this.selected]];
    const color = "#" + stats.color.toString(16).padStart(6, "0");
    const spd = 10;

    this.panelDesc.setText("");
    this.detailTimers.push(this.typeText(this.panelDesc, stats.desc, spd));

    this.panelWeaponVal.setText("");
    this.detailTimers.push(
      this.typeText(this.panelWeaponVal, `WEAPON  ${stats.weapon}`, spd)
    );

    this.panelSpecialVal.setText("");
    this.detailTimers.push(
      this.typeText(this.panelSpecialVal, `SPECIAL ${stats.special}`, spd)
    );

    const maxes = { hp: 140, spd: 320, dmg: 25, rate: 12 };
    const barLen = 14;
    const vals = [
      { name: "HP ", v: stats.health, max: maxes.hp, text: `${stats.health}` },
      { name: "SPD", v: stats.speed, max: maxes.spd, text: `${stats.speed}` },
      { name: "DMG", v: stats.damage, max: maxes.dmg, text: `${stats.damage}` },
      {
        name: "RTE",
        v: 1000 / stats.fireRate,
        max: maxes.rate,
        text: `${Math.round(1000 / stats.fireRate)}/s`,
      },
    ];
    for (let i = 0; i < 4; i++) {
      const filled = Math.round((vals[i].v / vals[i].max) * barLen);
      const bar = "=".repeat(filled) + "-".repeat(barLen - filled);
      const line = `${vals[i].name}  [${bar}]  ${vals[i].text}`;
      this.statTexts[i].setText("").setColor(color);
      this.detailTimers.push(this.typeText(this.statTexts[i], line, spd));
    }
  }

  private typeText(
    obj: Phaser.GameObjects.Text,
    text: string,
    speed: number
  ): Phaser.Time.TimerEvent {
    let i = 0;
    return this.time.addEvent({
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
    this.breathPhase += delta / 1000;
    this.blinkTimer += delta;
    if (this.blinkTimer > 420) {
      this.blinkTimer = 0;
      this.blinkOn = !this.blinkOn;
    }

    this.gfx.clear();
    this.previewGfx.clear();

    this.gfx.lineStyle(1, 0x2a1144, 0.2);
    this.gfx.lineBetween(40, this.separatorY, w - 40, this.separatorY);

    this.gfx.fillStyle(0x000000, 0.04);
    for (let y = 0; y < h; y += 3) this.gfx.fillRect(0, y, w, 1);

    const stats = CLASS_STATS[CLASS_ORDER[this.selected]];
    const pvX = w - 100;
    const pvY = 170;
    const pvR = 38 + Math.sin(this.breathPhase * 2) * 3;

    this.previewGfx.fillStyle(stats.color, 0.06);
    this.previewGfx.fillCircle(pvX, pvY, pvR + 16);
    this.previewGfx.fillStyle(stats.color, 0.1);
    this.previewGfx.fillCircle(pvX, pvY, pvR + 6);

    const blink = Math.sin(this.breathPhase * 4) > 0;
    if (blink) {
      this.previewGfx.fillStyle(stats.color, 1);
      this.previewGfx.fillRect(pvX - 1, pvY - 24, 2, 48);
    }
    this.previewGfx.lineStyle(
      2,
      stats.color,
      0.35 + Math.sin(this.breathPhase * 3) * 0.15
    );
    this.previewGfx.strokeCircle(pvX, pvY, pvR);
    this.previewGfx.lineStyle(1, stats.color, 0.12);
    this.previewGfx.strokeCircle(pvX, pvY, pvR + 12);

    for (let i = 0; i < 8; i++) {
      const angle = this.breathPhase * 0.7 + (i * Math.PI * 2) / 8;
      const dist = pvR + 14 + Math.sin(this.breathPhase * 2 + i) * 5;
      const px = pvX + Math.cos(angle) * dist;
      const py = pvY + Math.sin(angle) * dist;
      this.previewGfx.fillStyle(
        stats.color,
        0.3 + Math.sin(this.breathPhase * 3 + i) * 0.15
      );
      this.previewGfx.fillCircle(px, py, 2);
    }
  }
}
