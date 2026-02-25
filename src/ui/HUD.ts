import Phaser from "phaser";
import {
  type WeaponMod,
  WEAPON_MOD_COLORS,
  WEAPON_MOD_NAMES,
} from "../objects/Cursor";

export default class HUD {
  private scene: Phaser.Scene;
  private gfx: Phaser.GameObjects.Graphics;
  private contextGfx: Phaser.GameObjects.Graphics;
  private texts: Record<string, Phaser.GameObjects.Text> = {};

  private contextLevel = 0;
  private health = 100;
  private maxHealth = 100;
  private tokens = 0;
  private promptCharges = 3;
  private maxPromptCharges = 3;
  private promptCd = 0;
  private layer = 1;
  private combo = 0;
  private collapseActive = false;
  private weaponMod: WeaponMod = null;
  private weaponTimer = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gfx = scene.add.graphics().setDepth(20000).setScrollFactor(0);
    this.contextGfx = scene.add.graphics().setDepth(20001).setScrollFactor(0);

    const font = {
      fontFamily: '"Share Tech Mono", monospace',
      fontSize: "13px",
      color: "#9999bb",
    };
    const bright = { ...font, color: "#f4f4f5" };

    this.texts.layer = scene.add
      .text(8, 4, "", { ...bright, fontSize: "13px" })
      .setDepth(20002)
      .setScrollFactor(0);
    this.texts.ctxPct = scene.add
      .text(0, 0, "", { ...font, fontSize: "10px" })
      .setDepth(20002)
      .setScrollFactor(0);
    this.texts.hp = scene.add
      .text(10, 0, "", font)
      .setDepth(20002)
      .setScrollFactor(0);
    this.texts.tokens = scene.add
      .text(10, 0, "", { ...font, color: "#ffcc00" })
      .setDepth(20002)
      .setScrollFactor(0);
    this.texts.prompt = scene.add
      .text(10, 0, "", { ...font, color: "#8855ff" })
      .setDepth(20002)
      .setScrollFactor(0);
    this.texts.combo = scene.add
      .text(0, 0, "", { ...font, fontSize: "12px" })
      .setDepth(20002)
      .setScrollFactor(0);
    this.texts.weapon = scene.add
      .text(0, 0, "", { ...font, fontSize: "11px" })
      .setDepth(20002)
      .setScrollFactor(0);
    this.texts.collapse = scene.add
      .text(0, 0, "CONTEXT OVERFLOW", {
        ...font,
        fontSize: "11px",
        color: "#ff3333",
      })
      .setDepth(20002)
      .setScrollFactor(0)
      .setAlpha(0);
    this.texts.bossName = scene.add
      .text(0, 0, "", {
        fontFamily: '"Share Tech Mono", monospace',
        fontSize: "18px",
        color: "#ff3333",
      })
      .setDepth(20002)
      .setScrollFactor(0)
      .setAlpha(0);
  }

  updateValues(
    ctx: number,
    hp: number,
    maxHp: number,
    tokens: number,
    charges: number,
    maxCharges: number,
    promptCd: number,
    _promptMaxCd: number,
    layer: number,
    combo: number,
    collapse: boolean,
    weaponMod: WeaponMod,
    weaponTimer: number
  ) {
    this.contextLevel = ctx;
    this.health = hp;
    this.maxHealth = maxHp;
    this.tokens = tokens;
    this.promptCharges = charges;
    this.maxPromptCharges = maxCharges;
    this.promptCd = promptCd;
    this.layer = layer;
    this.combo = combo;
    this.collapseActive = collapse;
    this.weaponMod = weaponMod;
    this.weaponTimer = weaponTimer;
  }

  showBossName(name: string) {
    this.texts.bossName.setText(name).setAlpha(1);
    this.scene.tweens.add({
      targets: this.texts.bossName,
      alpha: 0,
      duration: 3000,
      delay: 2000,
    });
  }

  draw() {
    const w = this.scene.scale.width,
      h = this.scene.scale.height;
    this.gfx.clear();
    this.contextGfx.clear();

    // Minimal 2px context line at very top
    const pct = Phaser.Math.Clamp(this.contextLevel / 100, 0, 1);
    const barColor =
      pct > 0.8
        ? 0xff2222
        : pct > 0.6
        ? 0xff7700
        : pct > 0.4
        ? 0xffcc00
        : 0x00ddff;
    this.contextGfx.fillStyle(0x27272a, 0.5);
    this.contextGfx.fillRect(0, 0, w, 2);
    this.contextGfx.fillStyle(barColor, 0.9);
    this.contextGfx.fillRect(0, 0, w * pct, 2);
    if (pct > 0.8) {
      this.contextGfx.fillStyle(
        0xff2222,
        0.3 + Math.sin(Date.now() * 0.008) * 0.25
      );
      this.contextGfx.fillRect(0, 0, w * pct, 2);
    }

    // Top-left: layer + context %
    this.texts.layer.setText(`L${this.layer}`).setPosition(8, 6);
    const ctxStr = Math.floor(this.contextLevel) + "%";
    this.texts.ctxPct.setText(ctxStr).setPosition(50, 8);
    this.texts.ctxPct.setColor(this.collapseActive ? "#ff3333" : "#7080aa");

    const botY = h - 24;
    this.gfx.fillStyle(0x000000, 0.35);
    this.gfx.fillRect(0, botY, w, 24);

    const hpPct = this.health / this.maxHealth;
    const hpColor =
      hpPct > 0.5 ? "#00e89a" : hpPct > 0.25 ? "#ffcc00" : "#ff3333";
    this.texts.hp
      .setText(`HP [${this.bar(hpPct, 10)}] ${Math.ceil(this.health)}`)
      .setPosition(10, botY + 5)
      .setColor(hpColor);
    this.texts.tokens.setText(`TK:${this.tokens}`).setPosition(200, botY + 5);

    const cdPct =
      this.promptCd > 0 ? ` ${Math.ceil(this.promptCd / 1000)}s` : "";
    const charges =
      "\u25C6".repeat(this.promptCharges) +
      "\u25C7".repeat(this.maxPromptCharges - this.promptCharges);
    this.texts.prompt
      .setText(`E [${charges}]${cdPct}`)
      .setPosition(270, botY + 5);

    if (this.combo >= 3) {
      const cc =
        this.combo >= 10 ? "#ffcc00" : this.combo >= 5 ? "#00ddff" : "#9999bb";
      const label =
        this.combo >= 10 ? "RAMPAGE" : this.combo >= 5 ? "STREAK" : "COMBO";
      this.texts.combo
        .setText(`${label} x${this.combo}`)
        .setColor(cc)
        .setPosition(w - 110, botY + 5)
        .setAlpha(1);
    } else {
      this.texts.combo.setAlpha(0);
    }

    if (this.weaponMod) {
      const wc =
        "#" + WEAPON_MOD_COLORS[this.weaponMod].toString(16).padStart(6, "0");
      const secs = Math.ceil(this.weaponTimer / 1000);
      this.texts.weapon
        .setText(`${WEAPON_MOD_NAMES[this.weaponMod]} ${secs}s`)
        .setColor(wc)
        .setPosition(w / 2 - 60, botY + 5)
        .setAlpha(1);
    } else {
      this.texts.weapon.setAlpha(0);
    }

    this.texts.collapse.setAlpha(
      this.collapseActive ? 0.5 + Math.sin(Date.now() * 0.008) * 0.5 : 0
    );
    this.texts.collapse.setPosition(80, 6);
    this.texts.bossName.setPosition(w / 2 - this.texts.bossName.width / 2, 20);
  }

  private bar(pct: number, len: number): string {
    const f = Math.round(pct * len);
    return "\u2588".repeat(f) + "\u2591".repeat(len - f);
  }

  destroy() {
    this.gfx.destroy();
    this.contextGfx.destroy();
    for (const t of Object.values(this.texts)) t.destroy();
  }
}
