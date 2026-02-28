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
  | "malware"
  | "ransomware"
  | "ddos"
  | "trojan"
  | "zeroDay";

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

type EnemyTier = 1 | 2 | 3 | 4;

const ENEMY_TIER: Record<EnemyType, EnemyTier> = {
  loremIpsum: 1, watermark: 1, clickbait: 1,
  botnet: 2, deepfake: 2, scraper: 2, overfit: 2,
  malware: 3, phishing: 3, hallucination: 3, ddos: 3,
  bias: 4, captcha: 4, ransomware: 4, trojan: 4, zeroDay: 4,
};

const CONFIGS: Record<EnemyType, EnemyConfig> = {
  // --- Tier 1: Noise ---
  loremIpsum: {
    health: 30,
    speed: 90,
    damage: 8,
    chaseRange: 550,
    attackRange: 28,
    attackCooldown: 1200,
    radius: 12,
    color: 0x5500cc,
    colorAccent: 0x7733ff,
  },
  watermark: {
    health: 25,
    speed: 110,
    damage: 6,
    chaseRange: 500,
    attackRange: 24,
    attackCooldown: 1000,
    radius: 10,
    color: 0x00ddee,
    colorAccent: 0x00ffee,
  },
  clickbait: {
    health: 25,
    speed: 140,
    damage: 18,
    chaseRange: 700,
    attackRange: 38,
    attackCooldown: 3000,
    radius: 13,
    color: 0xff0033,
    colorAccent: 0xff0080,
  },
  // --- Tier 2: Glitches ---
  botnet: {
    health: 45,
    speed: 85,
    damage: 12,
    chaseRange: 550,
    attackRange: 28,
    attackCooldown: 1400,
    radius: 14,
    color: 0x33cc00,
    colorAccent: 0x66ff33,
  },
  deepfake: {
    health: 50,
    speed: 95,
    damage: 14,
    chaseRange: 500,
    attackRange: 30,
    attackCooldown: 1400,
    radius: 14,
    color: 0x00eedd,
    colorAccent: 0x00ffee,
  },
  scraper: {
    health: 55,
    speed: 90,
    damage: 14,
    chaseRange: 550,
    attackRange: 35,
    attackCooldown: 1600,
    radius: 15,
    color: 0x7700ff,
    colorAccent: 0xaa00ff,
  },
  overfit: {
    health: 60,
    speed: 100,
    damage: 15,
    chaseRange: 600,
    attackRange: 32,
    attackCooldown: 1500,
    radius: 16,
    color: 0xff0066,
    colorAccent: 0xff0099,
  },
  // --- Tier 3: Threats ---
  malware: {
    health: 75,
    speed: 100,
    damage: 16,
    chaseRange: 550,
    attackRange: 30,
    attackCooldown: 1400,
    radius: 15,
    color: 0xff0000,
    colorAccent: 0xcc3333,
  },
  phishing: {
    health: 55,
    speed: 80,
    damage: 20,
    chaseRange: 600,
    attackRange: 200,
    attackCooldown: 2000,
    radius: 14,
    color: 0xff8800,
    colorAccent: 0xffaa33,
  },
  hallucination: {
    health: 50,
    speed: 130,
    damage: 15,
    chaseRange: 600,
    attackRange: 26,
    attackCooldown: 1200,
    radius: 13,
    color: 0xcc00ff,
    colorAccent: 0xee44ff,
  },
  ddos: {
    health: 35,
    speed: 170,
    damage: 10,
    chaseRange: 800,
    attackRange: 22,
    attackCooldown: 800,
    radius: 14,
    color: 0x00cc44,
    colorAccent: 0x44ff88,
  },
  // --- Tier 4: Dangers ---
  bias: {
    health: 90,
    speed: 85,
    damage: 24,
    chaseRange: 600,
    attackRange: 160,
    attackCooldown: 2000,
    radius: 16,
    color: 0x6600ff,
    colorAccent: 0x8833ff,
  },
  captcha: {
    health: 100,
    speed: 70,
    damage: 18,
    chaseRange: 550,
    attackRange: 30,
    attackCooldown: 1600,
    radius: 18,
    color: 0xcccc00,
    colorAccent: 0xffff33,
  },
  ransomware: {
    health: 160,
    speed: 65,
    damage: 32,
    chaseRange: 500,
    attackRange: 34,
    attackCooldown: 2400,
    radius: 20,
    color: 0xee3300,
    colorAccent: 0xff6633,
  },
  trojan: {
    health: 110,
    speed: 120,
    damage: 28,
    chaseRange: 550,
    attackRange: 28,
    attackCooldown: 1600,
    radius: 16,
    color: 0xcc8800,
    colorAccent: 0xffaa00,
  },
  zeroDay: {
    health: 70,
    speed: 190,
    damage: 42,
    chaseRange: 900,
    attackRange: 26,
    attackCooldown: 2800,
    radius: 12,
    color: 0xff0044,
    colorAccent: 0xff4477,
  },
};

let nextId = 1;

export function scaleEnemy(zone: number): (cfg: EnemyConfig) => EnemyConfig {
  return (cfg) => ({
    ...cfg,
    health: Math.round(cfg.health * Math.pow(1.3, zone - 1)),
    speed: Math.round(cfg.speed * (1 + (zone - 1) * 0.14)),
    damage: Math.round(cfg.damage * Math.pow(1.18, zone - 1)),
  });
}

export default class Enemy extends Phaser.GameObjects.Container {
  public readonly eid: number;
  public readonly tier: EnemyTier;
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

  private botnetPulse = 0;
  private captchaShieldAngle = 0;
  private hallucinationPhaseTimer = 2000;
  private hallucinationVisible = true;
  private malwareTrailTimer = 0;

  private ransomwareLockPulse = 0;
  public ransomwareStunOnHit = false;
  private ddosPulse = 0;
  private trojanRevealed = false;
  private trojanRevealTimer = 0;
  private zdVisible = false;
  private zdPhaseTimer = 0;
  private zdStrikeTimer = 0;

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
    this.tier = ENEMY_TIER[type];
    const scale = scaleEnemy(zone);
    this.cfg = scale(CONFIGS[type]);
    this.health = this.cfg.health;
    this.maxHealth = this.cfg.health;
    this.speed = this.cfg.speed;
    this.damage = this.cfg.damage;
    this.chaseRange = this.cfg.chaseRange;
    this.attackRange = this.cfg.attackRange;
    this.radius = this.cfg.radius;

    this.dropWeapon = Math.random() < 0.22;

    this.breathPhase = Math.random() * Math.PI * 2;
    this.breathRate = 1.5 + Math.random();
    this.idlePhase = Math.random() * Math.PI * 2;

    if (type === "zeroDay") {
      this.zdVisible = false;
      this.isPhased = true;
      this.zdPhaseTimer = 2500 + Math.random() * 1500;
    }

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
    _bounds?: { x: number; y: number; w: number; h: number }
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
      const dist = Phaser.Math.Distance.Between(this.x, this.y, px, py);
      const baseAngle = Math.atan2(py - this.y, px - this.x);
      const flankOffset = ((this.eid % 7) - 3) * 0.12;
      const flankFade = Math.min(1, Math.max(0, (dist - 80) / 120));
      const angle = baseAngle + flankOffset * flankFade;
      this.x += Math.cos(angle) * spd;
      this.y += Math.sin(angle) * spd;
    } else {
      const angle = Math.atan2(py - this.y, px - this.x);
      const drift = spd * 0.35;
      this.x += Math.cos(angle) * drift;
      this.y += Math.sin(angle) * drift;
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
        const turnSpeed = 1.3 * dt;
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
      case "ransomware":
        this.ransomwareLockPulse += dt * 2;
        this.ransomwareStunOnHit = this.aiState === "attack";
        break;
      case "ddos":
        this.ddosPulse += dt * 5;
        break;
      case "trojan":
        if (!this.trojanRevealed && dist < this.chaseRange * 0.7) {
          this.trojanRevealed = true;
          this.trojanRevealTimer = 400;
          this.speed = Math.round(this.speed * 1.6);
        }
        if (this.trojanRevealTimer > 0) this.trojanRevealTimer -= delta;
        break;
      case "zeroDay":
        if (!this.zdVisible) {
          this.zdPhaseTimer -= delta;
          if (this.zdPhaseTimer <= 0) {
            this.zdVisible = true;
            this.isPhased = false;
            this.zdStrikeTimer = 1200;
            const tpAngle = Math.atan2(py - this.y, px - this.x);
            const tpDist = 40 + Math.random() * 30;
            this.x = px - Math.cos(tpAngle) * tpDist;
            this.y = py - Math.sin(tpAngle) * tpDist;
          }
        } else {
          this.zdStrikeTimer -= delta;
          if (this.zdStrikeTimer <= 0) {
            this.zdVisible = false;
            this.isPhased = true;
            this.zdPhaseTimer = 2000 + Math.random() * 1500;
            const escAngle = Math.random() * Math.PI * 2;
            this.x += Math.cos(escAngle) * 60;
            this.y += Math.sin(escAngle) * 60;
          }
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

    if (!flash) this.drawTierEffectsPre();

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
      case "ransomware":
        this.drawRansomware(c, a);
        break;
      case "ddos":
        this.drawDdos(c, a);
        break;
      case "trojan":
        this.drawTrojan(c, a);
        break;
      case "zeroDay":
        this.drawZeroDay(c, a);
        break;
    }

    if (!flash) this.drawTierEffectsPost();
  }

  private drawTierEffectsPre() {
    const t = this.tier;
    const r = this.radius;
    const col = this.cfg.color;
    const acc = this.cfg.colorAccent;
    const pulse = Math.sin(this.breathPhase * 2);

    if (t >= 3) {
      const auraR = r + 8 + pulse * 3;
      const auraAlpha = t >= 4 ? 0.12 + pulse * 0.04 : 0.07 + pulse * 0.02;
      this.gfx.fillStyle(col, auraAlpha);
      this.gfx.fillCircle(0, 0, auraR);
      if (t >= 4) {
        this.gfx.fillStyle(acc, auraAlpha * 0.5);
        this.gfx.fillCircle(0, 0, auraR + 6);
      }
    }
  }

  private drawTierEffectsPost() {
    const t = this.tier;
    const r = this.radius;
    const acc = this.cfg.colorAccent;
    const pulse = Math.sin(this.breathPhase * 2);
    const chasing = this.aiState === "chase" || this.aiState === "attack";

    if (t >= 2 && chasing) {
      const intensity = t >= 4 ? 0.4 : t >= 3 ? 0.25 : 0.15;
      const ringR = r + 4 + pulse * 2;
      this.gfx.lineStyle(t >= 4 ? 1.5 : 1, acc, intensity + pulse * 0.08);
      this.gfx.strokeCircle(0, 0, ringR);
    }

    if (t >= 4) {
      const orbCount = 3;
      const orbR = r + 10 + pulse * 2;
      for (let i = 0; i < orbCount; i++) {
        const angle = (i / orbCount) * Math.PI * 2 + this.breathPhase * 1.5;
        const ox = Math.cos(angle) * orbR;
        const oy = Math.sin(angle) * orbR;
        this.gfx.fillStyle(acc, 0.5 + pulse * 0.15);
        this.gfx.fillCircle(ox, oy, 1.5);
      }

      if (this.aiState === "attack" || this.alertTimer > 0) {
        const threatPulse = Math.sin(this.lifetime * 0.012) * 0.3 + 0.3;
        this.gfx.lineStyle(1.5, 0xff0033, threatPulse);
        this.gfx.strokeCircle(0, 0, r + 14 + Math.sin(this.lifetime * 0.008) * 4);
      }
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
    const s = 10 * this.wmBreathScale;
    const alpha = 0.45 + Math.sin(this.breathPhase) * 0.08;
    const wx = Math.sin(this.idlePhase * 1.3) * 1.5;
    const wy = Math.cos(this.idlePhase * 0.9) * 1.5;
    this.gfx.fillStyle(c, alpha * 0.4);
    this.gfx.beginPath();
    this.gfx.moveTo(wx, -s + wy);
    this.gfx.lineTo(s + wx, wy);
    this.gfx.lineTo(wx, s + wy);
    this.gfx.lineTo(-s + wx, wy);
    this.gfx.closePath();
    this.gfx.fillPath();
    this.gfx.lineStyle(0.5, a, alpha * 0.5);
    this.gfx.lineBetween(
      -s * 0.5 + wx,
      -s * 0.2 + wy,
      s * 0.5 + wx,
      s * 0.2 + wy
    );
  }

  private drawClickbait() {
    const bounce = this.cbBounce * 0.6;
    const swell = 1 + this.cbSwell * 0.25;
    const s = 11 * swell;
    const mainColor =
      this.hitFlash > 0
        ? 0xffffff
        : 0xff0033;
    this.gfx.fillStyle(mainColor, 0.6);
    this.gfx.beginPath();
    this.gfx.moveTo(0, -s - bounce);
    this.gfx.lineTo(s * 0.85, s * 0.55 - bounce);
    this.gfx.lineTo(-s * 0.85, s * 0.55 - bounce);
    this.gfx.closePath();
    this.gfx.fillPath();
    this.gfx.fillStyle(0xffffff, 0.7);
    this.gfx.fillRect(-1, -s * 0.35 - bounce, 2, s * 0.35);
    this.gfx.fillCircle(0, s * 0.15 - bounce, 1.5);
  }

  private drawBias(c: number, a: number) {
    const stretch = this.biasLunging ? 2.8 : 1;
    const coil = this.biasCoil;
    const w = 34 * stretch;
    const h = 8;

    this.gfx.fillStyle(c, 0.15);
    this.gfx.fillCircle(0, 0, w * 0.6);

    this.gfx.fillStyle(c, 0.92);
    this.gfx.beginPath();
    this.gfx.moveTo(-w + coil * 10, -h);
    this.gfx.lineTo(w + coil * 5, -h + 1);
    this.gfx.lineTo(w - coil * 5, h - 1);
    this.gfx.lineTo(-w - coil * 10, h);
    this.gfx.closePath();
    this.gfx.fillPath();

    this.gfx.lineStyle(1, a, 0.5);
    this.gfx.strokePath();

    this.gfx.fillStyle(a, 0.9);
    this.gfx.fillCircle(w * 0.75, 0, 4);
    this.gfx.fillCircle(-w * 0.75, 0, 3);
    this.gfx.fillStyle(0xffffff, 0.6);
    this.gfx.fillCircle(w * 0.75, -1, 1.5);

    if (this.biasLunging) {
      this.gfx.lineStyle(2.5, a, 0.85);
      this.gfx.beginPath();
      this.gfx.moveTo(w, 0);
      this.gfx.lineTo(w + 16, 0);
      this.gfx.strokePath();
      this.gfx.lineStyle(1, a, 0.4);
      this.gfx.lineBetween(w + 8, -5, w + 16, 0);
      this.gfx.lineBetween(w + 8, 5, w + 16, 0);
    }

    for (let i = 0; i < 4; i++) {
      const sa = (i / 4) * Math.PI * 2 + this.breathPhase * 0.8;
      const sr = w * 0.4;
      this.gfx.lineStyle(0.8, a, 0.25);
      this.gfx.lineBetween(
        Math.cos(sa) * sr, Math.sin(sa) * sr * 0.5,
        Math.cos(sa) * (sr + 6), Math.sin(sa) * (sr + 6) * 0.5
      );
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
    const verts = 6 + Math.floor(Math.sin(morph * 2) * 2);
    const jagged = this.dfRevealTimer > 0 ? 1.8 : 0.9;
    this.gfx.fillStyle(c, 0.85);
    this.gfx.beginPath();
    for (let i = 0; i <= verts; i++) {
      const angle = (i / verts) * Math.PI * 2;
      const r = 13 + Math.sin(morph * 3 + i * 1.5) * 5 * jagged;
      if (i === 0) this.gfx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else this.gfx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    this.gfx.closePath();
    this.gfx.fillPath();
    this.gfx.fillStyle(a, 0.8);
    this.gfx.fillCircle(
      Math.sin(morph) * 3,
      Math.cos(morph * 1.3) * 3,
      5 + Math.sin(morph * 5) * 2
    );
    this.gfx.lineStyle(0.8, a, 0.3);
    this.gfx.strokeCircle(0, 0, 14 + Math.sin(morph * 1.5) * 2);
  }

  private drawScraper(c: number, a: number) {
    const s = 12;
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
    const echoes = 4;
    for (let e = echoes; e >= 0; e--) {
      const delay = e * 0.35;
      const phase = this.overfitTilt - delay;
      const drift = e * 1.5 * (1 + Math.sin(this.lifetime * 0.002 + e) * 0.3);
      const ox = Math.sin(phase * 2 + e * 0.8) * drift;
      const oy = Math.cos(phase * 1.6 + e * 1.1) * drift;
      const fade = 1 - e * 0.2;
      const r = 9 - e * 0.5;

      this.gfx.lineStyle(1.5, e === 0 ? c : a, fade * (e === 0 ? 0.85 : 0.35));
      this.gfx.beginPath();
      const verts = 5;
      for (let i = 0; i <= verts; i++) {
        const va = (i / verts) * Math.PI * 2 + phase;
        const vr = r + Math.sin(va * 2 + this.lifetime * 0.003) * 2;
        if (i === 0)
          this.gfx.moveTo(ox + Math.cos(va) * vr, oy + Math.sin(va) * vr);
        else this.gfx.lineTo(ox + Math.cos(va) * vr, oy + Math.sin(va) * vr);
      }
      this.gfx.closePath();
      this.gfx.strokePath();
    }

    this.gfx.fillStyle(c, 0.8);
    this.gfx.fillCircle(0, 0, 4);
    this.gfx.fillStyle(a, 0.6);
    this.gfx.fillCircle(0, 0, 2);

    if (this.prevPlayerPositions.length >= 2 && this.aiState === "chase") {
      const last =
        this.prevPlayerPositions[this.prevPlayerPositions.length - 1];
      const prev =
        this.prevPlayerPositions[this.prevPlayerPositions.length - 2];
      const dx = last.x - prev.x,
        dy = last.y - prev.y;
      for (let i = 1; i <= 3; i++) {
        const fade = 0.4 - i * 0.1;
        this.gfx.lineStyle(1, a, fade);
        const px = last.x + dx * i * 0.5 - this.x;
        const py = last.y + dy * i * 0.5 - this.y;
        this.gfx.strokeCircle(px, py, 3);
        this.gfx.fillStyle(a, fade * 0.5);
        this.gfx.fillCircle(px, py, 1.5);
      }
    }
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
    const pulse = 0.75 + Math.sin(this.lifetime * 0.005) * 0.2;
    const reach = this.aiState === "chase" || this.aiState === "attack";

    this.gfx.fillStyle(a, pulse * 0.15);
    this.gfx.fillCircle(0, 0, 18);
    this.gfx.fillStyle(c, pulse * 0.35);
    this.gfx.fillCircle(0, 0, 10);
    this.gfx.fillStyle(a, pulse * 0.9);
    this.gfx.fillCircle(0, 0, 5);
    this.gfx.fillStyle(0xffffff, pulse * 0.55);
    this.gfx.fillCircle(-1, -1.5, 2);

    const filaments = 7;
    for (let i = 0; i < filaments; i++) {
      const base = (i / filaments) * Math.PI * 2 + this.lifetime * 0.0015;
      const len = reach
        ? 16 + Math.sin(this.lifetime * 0.004 + i * 1.3) * 6
        : 8;
      const sway = Math.sin(this.lifetime * 0.003 + i * 2.1) * 0.35;
      const fade = reach ? 0.55 : 0.25;
      this.gfx.lineStyle(1.2, a, fade);
      this.gfx.beginPath();
      this.gfx.moveTo(Math.cos(base) * 6, Math.sin(base) * 6);
      const midLen = len * 0.6;
      this.gfx.lineTo(
        Math.cos(base + sway * 0.5) * (6 + midLen),
        Math.sin(base + sway * 0.5) * (6 + midLen)
      );
      this.gfx.lineTo(
        Math.cos(base + sway) * (6 + len),
        Math.sin(base + sway) * (6 + len)
      );
      this.gfx.strokePath();
      if (reach) {
        this.gfx.fillStyle(a, fade * 0.6);
        this.gfx.fillCircle(
          Math.cos(base + sway) * (6 + len),
          Math.sin(base + sway) * (6 + len),
          1.2
        );
      }
    }
  }

  private drawCaptcha(c: number, a: number) {
    const spin = this.lifetime * 0.001;

    this.gfx.lineStyle(1, c, 0.15);
    this.gfx.strokeCircle(0, 0, 16);
    this.gfx.lineStyle(1, c, 0.1);
    this.gfx.strokeCircle(0, 0, 10);

    const segments = 10;
    for (let i = 0; i < segments; i++) {
      const sa = (i / segments) * Math.PI * 2 + spin * 0.5;
      const gap = 0.12;
      const inner = 7,
        outer = 16;
      this.gfx.fillStyle(c, 0.35 + (i % 2) * 0.15);
      this.gfx.beginPath();
      this.gfx.moveTo(Math.cos(sa + gap) * inner, Math.sin(sa + gap) * inner);
      this.gfx.lineTo(Math.cos(sa + gap) * outer, Math.sin(sa + gap) * outer);
      this.gfx.lineTo(
        Math.cos(sa + (Math.PI * 2) / segments - gap) * outer,
        Math.sin(sa + (Math.PI * 2) / segments - gap) * outer
      );
      this.gfx.lineTo(
        Math.cos(sa + (Math.PI * 2) / segments - gap) * inner,
        Math.sin(sa + (Math.PI * 2) / segments - gap) * inner
      );
      this.gfx.closePath();
      this.gfx.fillPath();
    }

    this.gfx.fillStyle(a, 0.75);
    this.gfx.fillCircle(0, 0, 5);
    this.gfx.fillStyle(c, 0.5);
    this.gfx.fillCircle(0, 0, 2.5);
    this.gfx.fillStyle(0xffffff, 0.4);
    this.gfx.fillCircle(-1, -1, 1.5);

    const shieldR = 22;
    const arc = Math.PI / 3;
    this.gfx.lineStyle(4.5, a, 0.8);
    this.gfx.beginPath();
    for (let i = -14; i <= 14; i++) {
      const t = i / 14;
      const ang = this.captchaShieldAngle + t * arc;
      const px = Math.cos(ang) * shieldR;
      const py = Math.sin(ang) * shieldR;
      if (i === -14) this.gfx.moveTo(px, py);
      else this.gfx.lineTo(px, py);
    }
    this.gfx.strokePath();
    this.gfx.lineStyle(2, a, 0.3);
    this.gfx.beginPath();
    for (let i = -14; i <= 14; i++) {
      const t = i / 14;
      const ang = this.captchaShieldAngle + t * arc;
      const px = Math.cos(ang) * (shieldR + 4);
      const py = Math.sin(ang) * (shieldR + 4);
      if (i === -14) this.gfx.moveTo(px, py);
      else this.gfx.lineTo(px, py);
    }
    this.gfx.strokePath();
    this.gfx.lineStyle(1, a, 0.15);
    this.gfx.beginPath();
    for (let i = -14; i <= 14; i++) {
      const t = i / 14;
      const ang = this.captchaShieldAngle + t * arc;
      const px = Math.cos(ang) * (shieldR + 7);
      const py = Math.sin(ang) * (shieldR + 7);
      if (i === -14) this.gfx.moveTo(px, py);
      else this.gfx.lineTo(px, py);
    }
    this.gfx.strokePath();
  }

  private drawHallucination(c: number, a: number) {
    const vis = this.hallucinationVisible;
    const alpha = vis ? 0.85 + Math.sin(this.lifetime * 0.01) * 0.12 : 0.1;
    const gx = vis ? 0 : (Math.random() - 0.5) * 8;
    const gy = vis ? 0 : (Math.random() - 0.5) * 8;
    const s = 1.3;

    if (vis) {
      this.gfx.fillStyle(c, 0.08);
      this.gfx.fillCircle(0, 0, 16);
    }

    this.gfx.fillStyle(c, alpha * 0.75);
    this.gfx.beginPath();
    this.gfx.moveTo(gx, (-12 + gy) * s);
    this.gfx.lineTo((10 + gx) * s, (-3 + gy) * s);
    this.gfx.lineTo((8 + gx) * s, (10 + gy) * s);
    this.gfx.lineTo((3 + gx) * s, (8 + gy) * s);
    this.gfx.lineTo((-3 + gx) * s, (10 + gy) * s);
    this.gfx.lineTo((-8 + gx) * s, (8 + gy) * s);
    this.gfx.lineTo((-10 + gx) * s, (-3 + gy) * s);
    this.gfx.closePath();
    this.gfx.fillPath();

    if (vis) {
      this.gfx.fillStyle(a, alpha);
      this.gfx.fillCircle(-4, -4, 2.5);
      this.gfx.fillCircle(4, -4, 2.5);
      this.gfx.fillStyle(0xffffff, 0.35);
      this.gfx.fillCircle(-4, -4.5, 1);
      this.gfx.fillCircle(4, -4.5, 1);

      this.gfx.lineStyle(0.8, a, 0.2 + Math.sin(this.lifetime * 0.008) * 0.1);
      this.gfx.strokeCircle(0, 0, 14 + Math.sin(this.breathPhase) * 2);
    } else {
      this.gfx.lineStyle(1, a, 0.15);
      for (let i = 0; i < 5; i++) {
        const rx = (Math.random() - 0.5) * 22;
        const ry = (Math.random() - 0.5) * 22;
        this.gfx.lineBetween(rx, ry, rx + (Math.random() - 0.5) * 10, ry);
      }
    }
  }

  private drawMalware(c: number, a: number) {
    const s = 14;
    const glitch = Math.sin(this.lifetime * 0.008);

    for (let i = 0; i < 8; i++) {
      const ox = Math.sin(i * 1.2 + this.lifetime * 0.003) * 5;
      const oy = Math.cos(i * 0.9 + this.lifetime * 0.004) * 5;
      const size = 3.5 + (i % 3) * 1.2;
      this.gfx.fillStyle(i % 2 === 0 ? c : a, 0.75 + (i % 3) * 0.08);
      this.gfx.fillRect(ox - size / 2 + glitch * 2.5, oy - size / 2, size, size);
    }

    this.gfx.lineStyle(1, a, 0.5);
    const noiseY = ((this.lifetime * 0.02) % (s * 2)) - s;
    this.gfx.lineBetween(-s * 0.8, noiseY, s * 0.8, noiseY);
    this.gfx.lineStyle(0.5, a, 0.25);
    const noiseY2 = ((this.lifetime * 0.015 + s) % (s * 2)) - s;
    this.gfx.lineBetween(-s * 0.6, noiseY2, s * 0.6, noiseY2);

    for (const zone of this.trailZones) {
      const fade = 1 - zone.age / 4000;
      this.gfx.fillStyle(c, 0.3 * fade);
      this.gfx.fillCircle(zone.x - this.x, zone.y - this.y, 10 * fade);
    }
  }

  private drawRansomware(c: number, a: number) {
    const lock = this.aiState === "attack" ? 0.9 : 0;
    const drift = 1 - lock;
    const shards = 9;

    this.gfx.fillStyle(c, 0.1);
    this.gfx.fillCircle(0, 0, 22);

    for (let i = 0; i < shards; i++) {
      const base = (i / shards) * Math.PI * 2;
      const orbit = base + this.ransomwareLockPulse * 0.4 * drift;
      const dist = 8 + Math.sin(this.ransomwareLockPulse + i * 1.7) * 4 * drift;
      const ox = Math.cos(orbit) * dist;
      const oy = Math.sin(orbit) * dist;
      const rot = orbit + this.ransomwareLockPulse * 0.6 * drift;
      const sz = 6 + (i % 3) * 1.5;

      this.gfx.fillStyle(i % 2 === 0 ? c : a, 0.85);
      this.gfx.beginPath();
      this.gfx.moveTo(ox + Math.cos(rot) * sz, oy + Math.sin(rot) * sz);
      this.gfx.lineTo(
        ox + Math.cos(rot + 2.1) * sz * 0.7,
        oy + Math.sin(rot + 2.1) * sz * 0.7
      );
      this.gfx.lineTo(
        ox + Math.cos(rot + 4.2) * sz * 0.9,
        oy + Math.sin(rot + 4.2) * sz * 0.9
      );
      this.gfx.closePath();
      this.gfx.fillPath();
    }

    this.gfx.fillStyle(0x110000, 0.95);
    this.gfx.fillCircle(0, 0, 6);
    this.gfx.fillStyle(a, 0.7 + Math.sin(this.ransomwareLockPulse * 2) * 0.2);
    this.gfx.fillCircle(0, 0, 3);
    this.gfx.fillStyle(0xffffff, 0.3);
    this.gfx.fillCircle(-1, -1, 1.5);

    this.gfx.lineStyle(0.8, a, 0.2);
    this.gfx.strokeCircle(0, 0, 10);

    if (lock > 0.5) {
      this.gfx.lineStyle(2, a, 0.7);
      this.gfx.strokeCircle(0, 0, 18);
      this.gfx.lineStyle(
        1.5,
        0xff0000,
        0.4 + Math.sin(this.lifetime * 0.02) * 0.25
      );
      this.gfx.strokeCircle(0, 0, 23);
      this.gfx.lineStyle(1, 0xff0000, 0.15);
      this.gfx.strokeCircle(0, 0, 27);
    }
  }

  private drawDdos(c: number, a: number) {
    const s = this.isMini ? 5 : 10;
    const pulse = Math.sin(this.ddosPulse) * 0.2;

    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + this.ddosPulse * 0.3;
      const dist = 5 + pulse * 6;
      const ox = Math.cos(ang) * dist;
      const oy = Math.sin(ang) * dist;
      this.gfx.fillStyle(i % 2 === 0 ? c : a, 0.8);
      this.gfx.fillCircle(ox, oy, s * 0.5);
    }

    this.gfx.fillStyle(c, 0.9);
    this.gfx.fillCircle(0, 0, s);
    this.gfx.fillStyle(a, 0.85);
    this.gfx.fillCircle(0, 0, s * 0.4);

    if (this.aiState === "chase") {
      this.gfx.lineStyle(1.5, a, 0.5);
      for (let i = 0; i < 5; i++) {
        const la = this.ddosPulse + (i / 5) * Math.PI * 2;
        this.gfx.lineBetween(
          Math.cos(la) * s,
          Math.sin(la) * s,
          Math.cos(la) * (s + 8),
          Math.sin(la) * (s + 8)
        );
      }
    }
  }

  private drawTrojan(c: number, a: number) {
    if (!this.trojanRevealed) {
      this.gfx.fillStyle(0x00ffee, 0.7);
      this.gfx.fillRect(-2, -7, 4, 14);
      this.gfx.fillRect(-7, -2, 14, 4);
      this.gfx.fillStyle(0x00ffee, 0.12);
      this.gfx.fillCircle(0, 0, 12);
      return;
    }

    const jit =
      this.trojanRevealTimer > 0 ? (this.trojanRevealTimer / 400) * 6 : 0;
    const legs = 8;

    this.gfx.fillStyle(c, 0.1);
    this.gfx.fillCircle(0, 0, 18);

    this.gfx.fillStyle(c, 0.92);
    this.gfx.beginPath();
    for (let i = 0; i < legs; i++) {
      const ang = (i / legs) * Math.PI * 2 + this.lifetime * 0.003;
      const r = 14 + Math.sin(ang * 3 + this.lifetime * 0.005) * 5;
      const px = Math.cos(ang) * r + (Math.random() - 0.5) * jit;
      const py = Math.sin(ang) * r + (Math.random() - 0.5) * jit;
      if (i === 0) this.gfx.moveTo(px, py);
      else this.gfx.lineTo(px, py);
    }
    this.gfx.closePath();
    this.gfx.fillPath();

    this.gfx.fillStyle(a, 0.9);
    this.gfx.fillCircle(-4, -3, 3);
    this.gfx.fillCircle(4, -3, 3);
    this.gfx.fillStyle(0xffffff, 0.5);
    this.gfx.fillCircle(-4, -3.5, 1.2);
    this.gfx.fillCircle(4, -3.5, 1.2);

    this.gfx.lineStyle(2, a, 0.7);
    for (let i = 0; i < 6; i++) {
      const la = (i / 6) * Math.PI * 2 + this.lifetime * 0.004;
      const innerR = 14;
      const outerR = 22 + Math.sin(this.lifetime * 0.006 + i) * 3;
      this.gfx.lineBetween(
        Math.cos(la) * innerR,
        Math.sin(la) * innerR,
        Math.cos(la + 0.2) * outerR,
        Math.sin(la + 0.2) * outerR
      );
    }
  }

  private drawZeroDay(c: number, a: number) {
    const vis = this.zdVisible;
    const alpha = vis ? 0.92 : 0.06;
    const gx = vis ? 0 : (Math.random() - 0.5) * 14;
    const gy = vis ? 0 : (Math.random() - 0.5) * 14;
    const s = 1.4;

    if (vis && this.zdStrikeTimer < 500) {
      const urgency = 1 - this.zdStrikeTimer / 500;
      this.gfx.lineStyle(1.5, a, urgency * 0.7);
      this.gfx.strokeCircle(gx, gy, 16 + urgency * 10);
      this.gfx.lineStyle(1, 0xff0033, urgency * 0.4);
      this.gfx.strokeCircle(gx, gy, 20 + urgency * 14);
    }

    this.gfx.fillStyle(c, alpha);
    this.gfx.beginPath();
    this.gfx.moveTo((-10 + gx) * s, (-8 + gy) * s);
    this.gfx.lineTo((3 + gx) * s, (-12 + gy) * s);
    this.gfx.lineTo((11 + gx) * s, (-3 + gy) * s);
    this.gfx.lineTo((7 + gx) * s, (10 + gy) * s);
    this.gfx.lineTo((-5 + gx) * s, (11 + gy) * s);
    this.gfx.lineTo((-12 + gx) * s, (3 + gy) * s);
    this.gfx.closePath();
    this.gfx.fillPath();

    if (vis) {
      this.gfx.fillStyle(c, 0.15);
      this.gfx.fillCircle(0, 0, 16);

      this.gfx.fillStyle(a, 0.95);
      this.gfx.fillCircle(0, 0, 4);
      this.gfx.lineStyle(2, 0xffffff, 0.8);
      this.gfx.lineBetween(-4, -4, 4, 4);
      this.gfx.lineBetween(4, -4, -4, 4);
      this.gfx.fillStyle(0xffffff, 0.5);
      this.gfx.fillCircle(0, 0, 1.5);

      for (let i = 0; i < 4; i++) {
        const sa = (i / 4) * Math.PI * 2 + this.lifetime * 0.006;
        this.gfx.lineStyle(1, a, 0.3);
        this.gfx.lineBetween(
          Math.cos(sa) * 8, Math.sin(sa) * 8,
          Math.cos(sa) * 14, Math.sin(sa) * 14
        );
      }
    } else {
      this.gfx.lineStyle(1, a, 0.08);
      for (let i = 0; i < 4; i++) {
        const rx = (Math.random() - 0.5) * 28;
        const ry = (Math.random() - 0.5) * 28;
        this.gfx.lineBetween(rx, ry, rx + (Math.random() - 0.5) * 14, ry);
      }
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
