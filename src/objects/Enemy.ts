import Phaser from "phaser";
import { audio } from "../systems/AudioManager";

export type EnemyType =
  | "loremIpsum"
  | "watermark"
  | "clickbait"
  | "bias"
  | "deepfake"
  | "scraper"
  | "overfit";

interface EnemyConfig {
  health: number;
  speed: number;
  damage: number;
  chaseRange: number;
  attackRange: number;
  attackCooldown: number;
  radius: number;
  color: number;
  colorAccent: number;
}

const CONFIGS: Record<EnemyType, EnemyConfig> = {
  loremIpsum: {
    health: 30,
    speed: 60,
    damage: 8,
    chaseRange: 280,
    attackRange: 28,
    attackCooldown: 1200,
    radius: 14,
    color: 0x4477aa,
    colorAccent: 0x5599cc,
  },
  watermark: {
    health: 22,
    speed: 75,
    damage: 6,
    chaseRange: 240,
    attackRange: 24,
    attackCooldown: 1000,
    radius: 11,
    color: 0x0099cc,
    colorAccent: 0x00bbdd,
  },
  clickbait: {
    health: 16,
    speed: 100,
    damage: 24,
    chaseRange: 350,
    attackRange: 38,
    attackCooldown: 3000,
    radius: 12,
    color: 0xff5500,
    colorAccent: 0xff1177,
  },
  bias: {
    health: 48,
    speed: 42,
    damage: 18,
    chaseRange: 260,
    attackRange: 140,
    attackCooldown: 2200,
    radius: 13,
    color: 0x5566cc,
    colorAccent: 0x7799dd,
  },
  deepfake: {
    health: 30,
    speed: 55,
    damage: 12,
    chaseRange: 200,
    attackRange: 30,
    attackCooldown: 1400,
    radius: 12,
    color: 0x00cc66,
    colorAccent: 0x00ee88,
  },
  scraper: {
    health: 40,
    speed: 58,
    damage: 14,
    chaseRange: 220,
    attackRange: 35,
    attackCooldown: 1600,
    radius: 14,
    color: 0x7722ff,
    colorAccent: 0x9944ff,
  },
  overfit: {
    health: 45,
    speed: 62,
    damage: 13,
    chaseRange: 250,
    attackRange: 32,
    attackCooldown: 1500,
    radius: 15,
    color: 0xff8800,
    colorAccent: 0xffaa00,
  },
};

let nextId = 1;

export function scaleEnemy(zone: number): (cfg: EnemyConfig) => EnemyConfig {
  return (cfg) => ({
    ...cfg,
    health: Math.round(cfg.health * (1 + (zone - 1) * 0.25)),
    speed: Math.round(cfg.speed * (1 + (zone - 1) * 0.08)),
    damage: Math.round(cfg.damage * (1 + (zone - 1) * 0.15)),
  });
}

export default class Enemy extends Phaser.GameObjects.Container {
  public readonly eid: number;
  public health: number;
  public maxHealth: number;
  public speed: number;
  public damage: number;
  public chaseRange: number;
  public attackRange: number;
  public enemyType: EnemyType;
  public radius: number;
  public isDead = false;
  public dropWeapon = false;

  public cfg: EnemyConfig;
  private attackCd = 0;
  private gfx: Phaser.GameObjects.Graphics;
  private hpGfx: Phaser.GameObjects.Graphics;
  private aiState: "idle" | "alert" | "chase" | "attack" | "dead" = "idle";
  private hitFlash = 0;
  private lifetime = 0;
  private patrolAngle: number;
  private patrolOriginX: number;
  private patrolOriginY: number;
  private alertTimer = 0;

  private breathPhase: number;
  private breathRate: number;
  private idlePhase: number;
  private flinchAmount = 0;
  private deathProgress = 0;

  private rectOffsets: { x: number; y: number; w: number; h: number }[] = [];
  private wmBreathScale = 1;
  private cbBounce = 0;
  private cbSwell = 0;
  private biasCoil = 0;
  private biasLunging = false;
  private biasLungeTimer = 0;
  private scraperAnts = 0;
  private overfitTilt = 0;
  private prevPlayerPositions: { x: number; y: number }[] = [];
  private dfMorphPhase = 0;
  private dfRevealed = false;
  private dfRevealTimer = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: EnemyType,
    zone = 1
  ) {
    super(scene, x, y);
    this.eid = nextId++;
    this.enemyType = type;
    const scale = scaleEnemy(zone);
    this.cfg = scale(CONFIGS[type]);
    this.health = this.cfg.health;
    this.maxHealth = this.cfg.health;
    this.speed = this.cfg.speed;
    this.damage = this.cfg.damage;
    this.chaseRange = this.cfg.chaseRange;
    this.attackRange = this.cfg.attackRange;
    this.radius = this.cfg.radius;

    this.dropWeapon = Math.random() < 0.18;

    this.patrolAngle = Math.random() * Math.PI * 2;
    this.patrolOriginX = x;
    this.patrolOriginY = y;
    this.breathPhase = Math.random() * Math.PI * 2;
    this.breathRate = 1.5 + Math.random();
    this.idlePhase = Math.random() * Math.PI * 2;

    if (type === "loremIpsum") {
      for (let i = 0; i < 4 + Math.floor(Math.random() * 2); i++) {
        this.rectOffsets.push({
          x: (Math.random() - 0.5) * 6,
          y: -6 + i * 5 + (Math.random() - 0.5) * 2,
          w: 12 + Math.random() * 10,
          h: 3 + Math.random() * 2,
        });
      }
    }

    this.gfx = scene.add.graphics();
    this.add(this.gfx);
    this.hpGfx = scene.add.graphics();
    this.add(this.hpGfx);

    this.setDepth(y);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  takeDamage(amount: number): boolean {
    if (this.isDead) return false;
    this.health -= amount;
    this.hitFlash = 120;
    this.flinchAmount = 1;
    audio.play("enemyHit");
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.aiState = "dead";
      this.deathProgress = 0;
      audio.play("enemyDeath");
      return true;
    }
    return false;
  }

  update(
    delta: number,
    playerX: number,
    playerY: number
  ): { attack: boolean; dead: boolean } {
    if (this.isDead) {
      this.deathProgress += delta / 450;
      if (this.deathProgress >= 1) {
        this.destroy();
        return { attack: false, dead: true };
      }
      this.drawDeath();
      return { attack: false, dead: false };
    }

    this.lifetime += delta;
    if (this.hitFlash > 0) this.hitFlash -= delta;
    if (this.flinchAmount > 0)
      this.flinchAmount = Math.max(0, this.flinchAmount - delta / 150);
    if (this.attackCd > 0) this.attackCd -= delta;
    this.breathPhase += (delta / 1000) * this.breathRate;
    this.idlePhase += (delta / 1000) * 0.8;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    let attacking = false;
    const prevState = this.aiState;

    if (dist < this.attackRange && this.attackCd <= 0) {
      this.aiState = "attack";
      this.attackCd = this.cfg.attackCooldown;
      attacking = true;
    } else if (dist < this.chaseRange) {
      this.aiState = "chase";
    } else {
      this.aiState = "idle";
    }

    if (prevState === "idle" && this.aiState === "chase") this.alertTimer = 200;
    if (this.alertTimer > 0) this.alertTimer -= delta;

    this.updateMovement(delta, playerX, playerY);
    this.updateTypeSpecific(delta, playerX, playerY, dist);
    this.setDepth(this.y);
    this.drawEnemy();
    this.drawHealthBar();

    return { attack: attacking, dead: false };
  }

  private updateMovement(delta: number, px: number, py: number) {
    if (this.enemyType === "bias" && this.biasLunging) return;
    const spd = this.speed * (delta / 1000);

    if (this.aiState === "chase" || this.aiState === "attack") {
      const angle = Math.atan2(py - this.y, px - this.x);
      this.x += Math.cos(angle) * spd;
      this.y += Math.sin(angle) * spd;
    } else {
      this.patrolAngle += (delta / 1000) * 0.5;
      const tx = this.patrolOriginX + Math.cos(this.patrolAngle) * 50;
      const ty = this.patrolOriginY + Math.sin(this.patrolAngle) * 50;
      const angle = Math.atan2(ty - this.y, tx - this.x);
      this.x += Math.cos(angle) * spd * 0.4;
      this.y += Math.sin(angle) * spd * 0.4;
    }
  }

  private updateTypeSpecific(
    delta: number,
    px: number,
    py: number,
    dist: number
  ) {
    const dt = delta / 1000;
    switch (this.enemyType) {
      case "loremIpsum":
        for (const r of this.rectOffsets) {
          r.x += (Math.random() - 0.5) * dt * 8;
          r.x = Phaser.Math.Clamp(r.x, -8, 8);
        }
        break;
      case "watermark":
        this.wmBreathScale = 1 + Math.sin(this.breathPhase) * 0.15;
        break;
      case "clickbait":
        this.cbBounce = Math.abs(Math.sin(this.lifetime * 0.008)) * 6;
        this.cbSwell =
          dist < this.attackRange * 1.5
            ? Math.min(1, this.cbSwell + dt * 2)
            : Math.max(0, this.cbSwell - dt);
        break;
      case "bias":
        if (!this.biasLunging)
          this.biasCoil = Math.sin(this.idlePhase * 2) * 0.3;
        if (this.biasLunging) {
          this.biasLungeTimer -= delta;
          if (this.biasLungeTimer <= 0) this.biasLunging = false;
        }
        if (this.aiState === "attack" && !this.biasLunging) {
          this.biasLunging = true;
          this.biasLungeTimer = 300;
          const angle = Math.atan2(py - this.y, px - this.x);
          this.scene.tweens.add({
            targets: this,
            x: this.x + Math.cos(angle) * 120,
            y: this.y + Math.sin(angle) * 120,
            duration: 200,
            ease: "Back.easeOut",
          });
        }
        break;
      case "deepfake":
        this.dfMorphPhase += dt;
        if (dist < this.attackRange * 2 && !this.dfRevealed) {
          this.dfRevealed = true;
          this.dfRevealTimer = 400;
        }
        if (this.dfRevealTimer > 0) this.dfRevealTimer -= delta;
        break;
      case "scraper":
        this.scraperAnts += dt * (this.aiState === "chase" ? 4 : 1.5);
        break;
      case "overfit":
        this.overfitTilt = Math.sin(this.lifetime * 0.003) * 0.2;
        if (this.lifetime % 500 < delta) {
          this.prevPlayerPositions.push({ x: px, y: py });
          if (this.prevPlayerPositions.length > 5)
            this.prevPlayerPositions.shift();
        }
        break;
    }
  }

  private drawEnemy() {
    this.gfx.clear();
    const flash = this.hitFlash > 0;
    const c = flash ? 0xffffff : this.cfg.color;
    const a = flash ? 0xffffff : this.cfg.colorAccent;
    const breath = Math.sin(this.breathPhase);
    const scale = 1 + breath * 0.04 - this.flinchAmount * 0.15;
    const bob = Math.sin(this.idlePhase) * 3;
    const lean = this.aiState === "chase" ? 2 : 0;
    this.gfx.setScale(scale);

    switch (this.enemyType) {
      case "loremIpsum":
        this.drawLoremIpsum(c, a, bob, lean);
        break;
      case "watermark":
        this.drawWatermark(c, a);
        break;
      case "clickbait":
        this.drawClickbait();
        break;
      case "bias":
        this.drawBias(c, a);
        break;
      case "deepfake":
        this.drawDeepfake(c, a);
        break;
      case "scraper":
        this.drawScraper(c, a);
        break;
      case "overfit":
        this.drawOverfit(c, a);
        break;
    }
  }

  private drawLoremIpsum(c: number, a: number, bob: number, lean: number) {
    for (let i = 0; i < this.rectOffsets.length; i++) {
      const r = this.rectOffsets[i];
      this.gfx.fillStyle(
        i % 2 === 0 ? c : a,
        0.8 + (i / this.rectOffsets.length) * 0.15
      );
      this.gfx.fillRect(
        r.x + lean - r.w / 2,
        r.y + bob - 10 - r.h / 2,
        r.w,
        r.h
      );
    }
    if (this.flinchAmount > 0.5)
      for (const r of this.rectOffsets)
        r.x += (Math.random() - 0.5) * this.flinchAmount * 8;
  }

  private drawWatermark(c: number, a: number) {
    const s = 12 * this.wmBreathScale;
    const alpha = 0.65 + Math.sin(this.breathPhase) * 0.1;
    const wx = Math.sin(this.idlePhase * 1.3) * 2;
    const wy = Math.cos(this.idlePhase * 0.9) * 2;
    this.gfx.fillStyle(c, alpha * 0.6);
    this.gfx.beginPath();
    this.gfx.moveTo(wx, -s - 4 + wy);
    this.gfx.lineTo(s + 4 + wx, wy);
    this.gfx.lineTo(wx, s + 4 + wy);
    this.gfx.lineTo(-s - 4 + wx, wy);
    this.gfx.closePath();
    this.gfx.fillPath();
    this.gfx.fillStyle(a, alpha);
    this.gfx.beginPath();
    this.gfx.moveTo(wx, -s + wy);
    this.gfx.lineTo(s + wx, wy);
    this.gfx.lineTo(wx, s + wy);
    this.gfx.lineTo(-s + wx, wy);
    this.gfx.closePath();
    this.gfx.fillPath();
    this.gfx.lineStyle(1, a, alpha * 0.7);
    this.gfx.lineBetween(
      -s * 0.7 + wx,
      -s * 0.3 + wy,
      s * 0.7 + wx,
      s * 0.3 + wy
    );
  }

  private drawClickbait() {
    const bounce = this.cbBounce;
    const swell = 1 + this.cbSwell * 0.5;
    const s = 13 * swell;
    const colors = [0xff5500, 0xff1177, 0xff2222];
    const mainColor =
      this.hitFlash > 0
        ? 0xffffff
        : colors[Math.floor(this.lifetime / 120) % 3];
    this.gfx.fillStyle(mainColor, 0.9);
    this.gfx.beginPath();
    this.gfx.moveTo(0, -s - bounce);
    this.gfx.lineTo(s * 0.9, s * 0.6 - bounce);
    this.gfx.lineTo(-s * 0.9, s * 0.6 - bounce);
    this.gfx.closePath();
    this.gfx.fillPath();
    this.gfx.fillStyle(0xffffff, 0.95);
    this.gfx.fillRect(-1.5, -s * 0.4 - bounce, 3, s * 0.4);
    this.gfx.fillCircle(0, s * 0.2 - bounce, 2);
    if (this.cbSwell > 0.3) {
      this.gfx.lineStyle(1.5, mainColor, this.cbSwell * 0.5);
      this.gfx.strokeCircle(0, -bounce, s * 1.3);
    }
  }

  private drawBias(c: number, a: number) {
    const stretch = this.biasLunging ? 2.5 : 1;
    const coil = this.biasCoil;
    const w = 28 * stretch;
    this.gfx.fillStyle(c, 0.9);
    this.gfx.beginPath();
    this.gfx.moveTo(-w + coil * 8, -6);
    this.gfx.lineTo(w + coil * 4, -5);
    this.gfx.lineTo(w - coil * 4, 5);
    this.gfx.lineTo(-w - coil * 8, 6);
    this.gfx.closePath();
    this.gfx.fillPath();
    this.gfx.fillStyle(a, 0.8);
    this.gfx.fillCircle(w * 0.8, 0, 3);
    this.gfx.fillCircle(-w * 0.8, 0, 2);
    if (this.biasLunging) {
      this.gfx.lineStyle(2, a, 0.75);
      this.gfx.beginPath();
      this.gfx.moveTo(w, 0);
      this.gfx.lineTo(w + 10, 0);
      this.gfx.strokePath();
    }
  }

  private drawDeepfake(c: number, a: number) {
    if (!this.dfRevealed) {
      this.gfx.fillStyle(0x00cc66, 0.8);
      this.gfx.fillCircle(0, 0, 8);
      this.gfx.fillStyle(0xffffff, 0.9);
      this.gfx.fillRect(-1, -4, 2, 5);
      this.gfx.fillRect(-2, -1, 5, 2);
      return;
    }
    const morph = this.dfMorphPhase;
    const verts = 5 + Math.floor(Math.sin(morph * 2) * 2);
    const jagged = this.dfRevealTimer > 0 ? 1.5 : 0.8;
    this.gfx.fillStyle(c, 0.92);
    this.gfx.beginPath();
    for (let i = 0; i <= verts; i++) {
      const angle = (i / verts) * Math.PI * 2;
      const r = 11 + Math.sin(morph * 3 + i * 1.5) * 4 * jagged;
      if (i === 0) this.gfx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else this.gfx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    this.gfx.closePath();
    this.gfx.fillPath();
    this.gfx.fillStyle(a, 0.85);
    this.gfx.fillCircle(
      Math.sin(morph) * 2,
      Math.cos(morph * 1.3) * 2,
      4 + Math.sin(morph * 5) * 2
    );
  }

  private drawScraper(c: number, a: number) {
    const s = 13;
    this.gfx.lineStyle(2.5, a, 0.9);
    const dashOffset = Math.floor(this.scraperAnts * 8) % 8;
    this.gfx.beginPath();
    for (let side = 0; side < 4; side++) {
      const corners = [
        [-s, -s],
        [s, -s],
        [s, s],
        [-s, s],
      ];
      const [x0, y0] = corners[side];
      const [x1, y1] = corners[(side + 1) % 4];
      for (let d = 0; d < s * 2; d += 8) {
        const t0 = (d + dashOffset) / (s * 2);
        const t1 = Math.min(1, (d + 4 + dashOffset) / (s * 2));
        if (t0 >= 1) continue;
        this.gfx.moveTo(x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0);
        this.gfx.lineTo(x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1);
      }
    }
    this.gfx.strokePath();
    this.gfx.fillStyle(c, 0.3);
    this.gfx.fillRect(-s, -s, s * 2, s * 2);
    if (this.aiState === "chase") {
      this.gfx.lineStyle(1, a, 0.55);
      const scanY = -s + ((this.scraperAnts * 30) % (s * 2));
      this.gfx.lineBetween(-s, scanY, s, scanY);
    }
  }

  private drawOverfit(c: number, a: number) {
    this.drawSierpinski(0, -4, 22, 0, c, a, this.overfitTilt);
    if (this.prevPlayerPositions.length >= 2 && this.aiState === "chase") {
      const last =
        this.prevPlayerPositions[this.prevPlayerPositions.length - 1];
      const prev =
        this.prevPlayerPositions[this.prevPlayerPositions.length - 2];
      const dx = last.x - prev.x,
        dy = last.y - prev.y;
      this.gfx.lineStyle(1, a, 0.45);
      for (let i = 1; i <= 3; i++)
        this.gfx.strokeCircle(
          last.x + dx * i * 0.5 - this.x,
          last.y + dy * i * 0.5 - this.y,
          4
        );
    }
  }

  private drawSierpinski(
    cx: number,
    cy: number,
    size: number,
    depth: number,
    c: number,
    a: number,
    tilt: number
  ) {
    if (depth > 2 || size < 4) {
      this.gfx.fillStyle(depth === 0 ? c : a, 0.8 + depth * 0.08);
      const h = size * 0.866;
      this.gfx.beginPath();
      this.gfx.moveTo(cx + Math.sin(tilt) * 3, cy - h * 0.67);
      this.gfx.lineTo(cx + size / 2, cy + h * 0.33);
      this.gfx.lineTo(cx - size / 2, cy + h * 0.33);
      this.gfx.closePath();
      this.gfx.fillPath();
      return;
    }
    const h = size * 0.866,
      half = size / 2;
    this.drawSierpinski(cx, cy - h * 0.33, half, depth + 1, c, a, tilt);
    this.drawSierpinski(cx - half / 2, cy + h * 0.17, half, depth + 1, c, a, 0);
    this.drawSierpinski(cx + half / 2, cy + h * 0.17, half, depth + 1, c, a, 0);
  }

  private drawDeath() {
    this.gfx.clear();
    const p = this.deathProgress;
    const c = this.cfg.color;
    this.setAlpha(1 - p);
    this.setScale(1 - p * 0.3);
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + p * 2;
      const dist = p * 35;
      const size = 3 * (1 - p);
      this.gfx.fillStyle(c, 0.85 * (1 - p));
      if (i % 3 === 0)
        this.gfx.fillTriangle(
          Math.cos(angle) * dist,
          Math.sin(angle) * dist - size,
          Math.cos(angle) * dist + size,
          Math.sin(angle) * dist + size,
          Math.cos(angle) * dist - size,
          Math.sin(angle) * dist + size
        );
      else if (i % 3 === 1)
        this.gfx.fillRect(
          Math.cos(angle) * dist - size / 2,
          Math.sin(angle) * dist - size / 2,
          size,
          size
        );
      else
        this.gfx.fillCircle(
          Math.cos(angle) * dist,
          Math.sin(angle) * dist,
          size * 0.7
        );
    }
  }

  private drawHealthBar() {
    this.hpGfx.clear();
    if (this.health >= this.maxHealth || this.isDead) return;
    const w = 22,
      pct = this.health / this.maxHealth;
    this.hpGfx.fillStyle(0x080809, 0.7);
    this.hpGfx.fillRect(-w / 2 - 1, -this.radius - 10, w + 2, 4);
    const col = pct > 0.5 ? 0x00cc66 : pct > 0.25 ? 0xff8800 : 0xff2222;
    this.hpGfx.fillStyle(col, 0.9);
    this.hpGfx.fillRect(-w / 2, -this.radius - 9, w * pct, 2);
  }
}
