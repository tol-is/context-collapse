import Phaser from "phaser";
import { audio } from "../systems/AudioManager";

export type EnemyType =
  | "loremIpsum"
  | "watermark"
  | "clickbait"
  | "bias"
  | "deepfake"
  | "scraper"
  | "overfit"
  | "botnet"
  | "phishing"
  | "captcha"
  | "hallucination"
  | "malware";

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
    color: 0x5500cc,
    colorAccent: 0x7733ff,
  },
  watermark: {
    health: 22,
    speed: 75,
    damage: 6,
    chaseRange: 240,
    attackRange: 24,
    attackCooldown: 1000,
    radius: 11,
    color: 0x00ddee,
    colorAccent: 0x00ffee,
  },
  clickbait: {
    health: 16,
    speed: 100,
    damage: 24,
    chaseRange: 350,
    attackRange: 38,
    attackCooldown: 3000,
    radius: 12,
    color: 0xff0033,
    colorAccent: 0xff0080,
  },
  bias: {
    health: 48,
    speed: 42,
    damage: 18,
    chaseRange: 260,
    attackRange: 140,
    attackCooldown: 2200,
    radius: 13,
    color: 0x6600ff,
    colorAccent: 0x8833ff,
  },
  deepfake: {
    health: 30,
    speed: 55,
    damage: 12,
    chaseRange: 200,
    attackRange: 30,
    attackCooldown: 1400,
    radius: 12,
    color: 0x00eedd,
    colorAccent: 0x00ffee,
  },
  scraper: {
    health: 40,
    speed: 58,
    damage: 14,
    chaseRange: 220,
    attackRange: 35,
    attackCooldown: 1600,
    radius: 14,
    color: 0x7700ff,
    colorAccent: 0xaa00ff,
  },
  overfit: {
    health: 45,
    speed: 62,
    damage: 13,
    chaseRange: 250,
    attackRange: 32,
    attackCooldown: 1500,
    radius: 15,
    color: 0xff0066,
    colorAccent: 0xff0099,
  },
  botnet: {
    health: 35,
    speed: 50,
    damage: 10,
    chaseRange: 260,
    attackRange: 28,
    attackCooldown: 1400,
    radius: 13,
    color: 0x33cc00,
    colorAccent: 0x66ff33,
  },
  phishing: {
    health: 25,
    speed: 45,
    damage: 15,
    chaseRange: 300,
    attackRange: 200,
    attackCooldown: 2200,
    radius: 11,
    color: 0xff8800,
    colorAccent: 0xffaa33,
  },
  captcha: {
    health: 55,
    speed: 38,
    damage: 16,
    chaseRange: 240,
    attackRange: 30,
    attackCooldown: 1600,
    radius: 16,
    color: 0xcccc00,
    colorAccent: 0xffff33,
  },
  hallucination: {
    health: 20,
    speed: 70,
    damage: 10,
    chaseRange: 280,
    attackRange: 26,
    attackCooldown: 1200,
    radius: 10,
    color: 0xcc00ff,
    colorAccent: 0xee44ff,
  },
  malware: {
    health: 38,
    speed: 52,
    damage: 11,
    chaseRange: 260,
    attackRange: 30,
    attackCooldown: 1400,
    radius: 13,
    color: 0xff0000,
    colorAccent: 0xcc3333,
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
  public isMini = false;
  public isPhased = false;
  public pendingProjectiles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
  }[] = [];
  public trailZones: { x: number; y: number; age: number }[] = [];

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

  private wanderVx: number;
  private wanderVy: number;
  private wanderChangeTimer: number;

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

  private botnetPulse = 0;
  private captchaShieldAngle = 0;
  private hallucinationPhaseTimer = 2000;
  private hallucinationVisible = true;
  private malwareTrailTimer = 0;

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

    const wanderAngle = Math.random() * Math.PI * 2;
    this.wanderVx = Math.cos(wanderAngle);
    this.wanderVy = Math.sin(wanderAngle);
    this.wanderChangeTimer = 2000 + Math.random() * 3000;

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
    if (this.isPhased) return false;
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

  makeMini() {
    this.isMini = true;
    this.health = Math.round(this.maxHealth * 0.35);
    this.maxHealth = this.health;
    this.speed = Math.round(this.speed * 1.4);
    this.radius = Math.round(this.radius * 0.6);
    this.damage = Math.round(this.damage * 0.6);
    this.dropWeapon = false;
  }

  isShielded(projX: number, projY: number): boolean {
    if (this.enemyType !== "captcha" || this.isDead) return false;
    const hitAngle = Math.atan2(projY - this.y, projX - this.x);
    let diff = hitAngle - this.captchaShieldAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return Math.abs(diff) < Math.PI / 3;
  }

  update(
    delta: number,
    playerX: number,
    playerY: number,
    bounds?: { x: number; y: number; w: number; h: number }
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

    this.updateMovement(delta, playerX, playerY, bounds);
    this.updateTypeSpecific(delta, playerX, playerY, dist);
    this.setDepth(this.y);
    this.drawEnemy();
    this.drawHealthBar();

    return { attack: attacking, dead: false };
  }

  private updateMovement(
    delta: number,
    px: number,
    py: number,
    bounds?: { x: number; y: number; w: number; h: number }
  ) {
    if (this.enemyType === "bias" && this.biasLunging) return;
    const spd = this.speed * (delta / 1000);

    if (
      this.enemyType === "phishing" &&
      (this.aiState === "chase" || this.aiState === "attack")
    ) {
      const angle = Math.atan2(py - this.y, px - this.x);
      const dist = Phaser.Math.Distance.Between(this.x, this.y, px, py);
      const preferred = 180;
      if (dist < preferred - 30) {
        this.x -= Math.cos(angle) * spd;
        this.y -= Math.sin(angle) * spd;
      } else if (dist > preferred + 50) {
        this.x += Math.cos(angle) * spd * 0.7;
        this.y += Math.sin(angle) * spd * 0.7;
      } else {
        const perp = angle + Math.PI / 2;
        this.x += Math.cos(perp) * spd * 0.4;
        this.y += Math.sin(perp) * spd * 0.4;
      }
      return;
    }

    if (this.aiState === "chase" || this.aiState === "attack") {
      const angle = Math.atan2(py - this.y, px - this.x);
      this.x += Math.cos(angle) * spd;
      this.y += Math.sin(angle) * spd;
    } else {
      this.wanderChangeTimer -= delta;
      if (this.wanderChangeTimer <= 0) {
        const newAngle = Math.random() * Math.PI * 2;
        this.wanderVx = Math.cos(newAngle);
        this.wanderVy = Math.sin(newAngle);
        this.wanderChangeTimer = 1500 + Math.random() * 3000;
      }

      this.x += this.wanderVx * spd * 0.8;
      this.y += this.wanderVy * spd * 0.8;

      if (bounds) {
        const margin = 15;
        const left = bounds.x + margin;
        const right = bounds.x + bounds.w - margin;
        const top = bounds.y + margin;
        const bottom = bounds.y + bounds.h - margin;

        if (this.x <= left) {
          this.x = left;
          this.wanderVx = Math.abs(this.wanderVx) + Math.random() * 0.3;
          this.wanderVy += (Math.random() - 0.5) * 0.8;
        } else if (this.x >= right) {
          this.x = right;
          this.wanderVx = -Math.abs(this.wanderVx) - Math.random() * 0.3;
          this.wanderVy += (Math.random() - 0.5) * 0.8;
        }
        if (this.y <= top) {
          this.y = top;
          this.wanderVy = Math.abs(this.wanderVy) + Math.random() * 0.3;
          this.wanderVx += (Math.random() - 0.5) * 0.8;
        } else if (this.y >= bottom) {
          this.y = bottom;
          this.wanderVy = -Math.abs(this.wanderVy) - Math.random() * 0.3;
          this.wanderVx += (Math.random() - 0.5) * 0.8;
        }

        const len = Math.sqrt(
          this.wanderVx * this.wanderVx + this.wanderVy * this.wanderVy
        );
        if (len > 0) {
          this.wanderVx /= len;
          this.wanderVy /= len;
        }
      }
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
      case "botnet":
        this.botnetPulse += dt * 3;
        break;
      case "phishing":
        if (this.aiState === "attack") {
          const angle = Math.atan2(py - this.y, px - this.x);
          const projSpeed = 200;
          this.pendingProjectiles.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * projSpeed,
            vy: Math.sin(angle) * projSpeed,
            damage: this.damage,
          });
        }
        break;
      case "captcha": {
        const targetAngle = Math.atan2(py - this.y, px - this.x);
        const turnSpeed = 1.8 * dt;
        let angleDiff = targetAngle - this.captchaShieldAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (Math.abs(angleDiff) < turnSpeed) {
          this.captchaShieldAngle = targetAngle;
        } else {
          this.captchaShieldAngle += Math.sign(angleDiff) * turnSpeed;
        }
        break;
      }
      case "hallucination":
        this.hallucinationPhaseTimer -= delta;
        if (this.hallucinationPhaseTimer <= 0) {
          this.hallucinationVisible = !this.hallucinationVisible;
          this.isPhased = !this.hallucinationVisible;
          if (this.hallucinationVisible) {
            this.hallucinationPhaseTimer = 2000;
            const tpDist = 30 + Math.random() * 40;
            const tpAngle = Math.random() * Math.PI * 2;
            this.x += Math.cos(tpAngle) * tpDist;
            this.y += Math.sin(tpAngle) * tpDist;
          } else {
            this.hallucinationPhaseTimer = 1500;
          }
        }
        break;
      case "malware":
        this.malwareTrailTimer -= delta;
        if (this.malwareTrailTimer <= 0 && this.aiState === "chase") {
          this.malwareTrailTimer = 300;
          this.trailZones.push({ x: this.x, y: this.y, age: 0 });
        }
        for (let i = this.trailZones.length - 1; i >= 0; i--) {
          this.trailZones[i].age += delta;
          if (this.trailZones[i].age > 4000) this.trailZones.splice(i, 1);
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
      case "botnet":
        this.drawBotnet(c, a);
        break;
      case "phishing":
        this.drawPhishing(c, a);
        break;
      case "captcha":
        this.drawCaptcha(c, a);
        break;
      case "hallucination":
        this.drawHallucination(c, a);
        break;
      case "malware":
        this.drawMalware(c, a);
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
    const colors = [0xff0033, 0xff0080, 0xff0055];
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
      this.gfx.fillStyle(0x00eedd, 0.8);
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

  private drawBotnet(c: number, a: number) {
    const s = this.isMini ? 7 : 13;
    const sides = this.isMini ? 4 : 6;
    const pulse = Math.sin(this.botnetPulse) * 0.15;

    this.gfx.fillStyle(c, 0.85);
    this.gfx.beginPath();
    for (let i = 0; i < sides; i++) {
      const ang = (i / sides) * Math.PI * 2;
      const r = s * (1 + pulse);
      const px = Math.cos(ang) * r;
      const py = Math.sin(ang) * r;
      if (i === 0) this.gfx.moveTo(px, py);
      else this.gfx.lineTo(px, py);
    }
    this.gfx.closePath();
    this.gfx.fillPath();

    if (!this.isMini) {
      this.gfx.lineStyle(1, a, 0.6);
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2 + this.botnetPulse * 0.5;
        const r1 = s + 2;
        const r2 = s + 8;
        this.gfx.lineBetween(
          Math.cos(ang) * r1,
          Math.sin(ang) * r1,
          Math.cos(ang) * r2,
          Math.sin(ang) * r2
        );
        this.gfx.fillStyle(a, 0.8);
        this.gfx.fillCircle(Math.cos(ang) * r2, Math.sin(ang) * r2, 2);
      }
    }

    this.gfx.fillStyle(a, 0.9);
    this.gfx.fillCircle(0, 0, this.isMini ? 2 : 3);
  }

  private drawPhishing(c: number, a: number) {
    const bob = Math.sin(this.lifetime * 0.004) * 2;

    this.gfx.lineStyle(2.5, c, 0.9);
    this.gfx.lineBetween(0, -10 + bob, 0, 2 + bob);
    this.gfx.lineBetween(0, 2 + bob, 2, 6 + bob);
    this.gfx.lineBetween(2, 6 + bob, 6, 7 + bob);
    this.gfx.lineBetween(6, 7 + bob, 8, 5 + bob);

    this.gfx.lineStyle(1.5, a, 0.85);
    this.gfx.lineBetween(8, 5 + bob, 6, 2 + bob);

    const glow = 0.6 + Math.sin(this.lifetime * 0.006) * 0.3;
    this.gfx.fillStyle(a, glow * 0.3);
    this.gfx.fillCircle(0, -12 + bob, 7);
    this.gfx.fillStyle(a, glow);
    this.gfx.fillCircle(0, -12 + bob, 3);
  }

  private drawCaptcha(c: number, a: number) {
    const s = 14;

    this.gfx.fillStyle(c, 0.7);
    this.gfx.fillRect(-s, -s, s * 2, s * 2);

    this.gfx.lineStyle(1, a, 0.35);
    this.gfx.lineBetween(-s, 0, s, 0);
    this.gfx.lineBetween(0, -s, 0, s);

    this.gfx.lineStyle(2, a, 0.8);
    this.gfx.beginPath();
    this.gfx.moveTo(-6, -1);
    this.gfx.lineTo(-2, 5);
    this.gfx.lineTo(7, -6);
    this.gfx.strokePath();

    const shieldR = s + 6;
    const arc = Math.PI / 3;
    this.gfx.lineStyle(3, a, 0.7);
    this.gfx.beginPath();
    for (let i = -10; i <= 10; i++) {
      const t = i / 10;
      const ang = this.captchaShieldAngle + t * arc;
      const px = Math.cos(ang) * shieldR;
      const py = Math.sin(ang) * shieldR;
      if (i === -10) this.gfx.moveTo(px, py);
      else this.gfx.lineTo(px, py);
    }
    this.gfx.strokePath();
  }

  private drawHallucination(c: number, a: number) {
    const vis = this.hallucinationVisible;
    const alpha = vis ? 0.8 + Math.sin(this.lifetime * 0.01) * 0.15 : 0.12;
    const gx = vis ? 0 : (Math.random() - 0.5) * 6;
    const gy = vis ? 0 : (Math.random() - 0.5) * 6;

    this.gfx.fillStyle(c, alpha * 0.7);
    this.gfx.beginPath();
    this.gfx.moveTo(gx, -10 + gy);
    this.gfx.lineTo(8 + gx, -2 + gy);
    this.gfx.lineTo(6 + gx, 8 + gy);
    this.gfx.lineTo(2 + gx, 6 + gy);
    this.gfx.lineTo(-2 + gx, 8 + gy);
    this.gfx.lineTo(-6 + gx, 6 + gy);
    this.gfx.lineTo(-8 + gx, -2 + gy);
    this.gfx.closePath();
    this.gfx.fillPath();

    if (vis) {
      this.gfx.fillStyle(a, alpha);
      this.gfx.fillCircle(-3, -3, 2);
      this.gfx.fillCircle(3, -3, 2);
    } else {
      this.gfx.lineStyle(1, a, 0.2);
      for (let i = 0; i < 3; i++) {
        const rx = (Math.random() - 0.5) * 16;
        const ry = (Math.random() - 0.5) * 16;
        this.gfx.lineBetween(rx, ry, rx + (Math.random() - 0.5) * 8, ry);
      }
    }
  }

  private drawMalware(c: number, a: number) {
    const s = 12;
    const glitch = Math.sin(this.lifetime * 0.008);

    for (let i = 0; i < 6; i++) {
      const ox = Math.sin(i * 1.2 + this.lifetime * 0.003) * 4;
      const oy = Math.cos(i * 0.9 + this.lifetime * 0.004) * 4;
      const size = 3 + (i % 3);
      this.gfx.fillStyle(i % 2 === 0 ? c : a, 0.7 + (i % 3) * 0.1);
      this.gfx.fillRect(ox - size / 2 + glitch * 2, oy - size / 2, size, size);
    }

    this.gfx.lineStyle(1, a, 0.5);
    const noiseY = ((this.lifetime * 0.02) % (s * 2)) - s;
    this.gfx.lineBetween(-s * 0.8, noiseY, s * 0.8, noiseY);

    for (const zone of this.trailZones) {
      const fade = 1 - zone.age / 4000;
      this.gfx.fillStyle(c, 0.25 * fade);
      this.gfx.fillCircle(zone.x - this.x, zone.y - this.y, 8 * fade);
    }
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
    const col = pct > 0.5 ? 0x00ffee : pct > 0.25 ? 0xff0080 : 0xff0033;
    this.hpGfx.fillStyle(col, 0.9);
    this.hpGfx.fillRect(-w / 2, -this.radius - 9, w * pct, 2);
  }
}
