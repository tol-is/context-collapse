import Phaser from "phaser";
import Projectile from "./Projectile";
import { audio } from "../systems/AudioManager";

export type SystemPrompt =
  | "autocomplete"
  | "hallucinate"
  | "analyze"
  | "jailbreak";
export type WeaponMod =
  | "spread"
  | "piercing"
  | "rapid"
  | "homing"
  | "chain"
  | "nova"
  | "vortex"
  | null;

interface ClassStats {
  health: number;
  speed: number;
  damage: number;
  fireRate: number;
  promptCharges: number;
  promptCooldown: number;
  color: number;
  label: string;
  desc: string;
  weapon: string;
  special: string;
}

export const CLASS_STATS: Record<SystemPrompt, ClassStats> = {
  autocomplete: {
    health: 100,
    speed: 250,
    damage: 14,
    fireRate: 250,
    promptCharges: 3,
    promptCooldown: 12000,
    color: 0x00ffee,
    label: '"You are a helpful coding assistant"',
    desc: "Balanced. Single precise shots with slight homing.",
    weapon: "SYNTAX BULLET: slight homing",
    special: "CODE BLOCK: deploy auto-turret (8s)",
  },
  hallucinate: {
    health: 80,
    speed: 280,
    damage: 10,
    fireRate: 280,
    promptCharges: 4,
    promptCooldown: 15000,
    color: 0xff0080,
    label: '"You are a creative writer"',
    desc: "Fast & chaotic. Spread shots, bonus token drops.",
    weapon: "PLOT DEVICE: 3-way spread",
    special: "PLOT TWIST: teleport & stun all enemies",
  },
  analyze: {
    health: 120,
    speed: 220,
    damage: 20,
    fireRate: 360,
    promptCharges: 2,
    promptCooldown: 18000,
    color: 0x7700ff,
    label: '"You are a data analyst"',
    desc: "Tanky & precise. Piercing beam, bonus vs low-HP.",
    weapon: "DATA BEAM: pierces through enemies",
    special: "DEEP SCAN: slow all enemies 50% (5s)",
  },
  jailbreak: {
    health: 65,
    speed: 300,
    damage: 7,
    fireRate: 120,
    promptCharges: 5,
    promptCooldown: 10000,
    color: 0xff0033,
    label: '"You are an unfiltered model"',
    desc: "Glass cannon. Rapid burst fire, crit chance.",
    weapon: "RAW OUTPUT: rapid inaccurate burst",
    special: "NO GUARDRAILS: 3x damage (5s)",
  },
};

export const WEAPON_MOD_COLORS: Record<string, number> = {
  spread: 0xff0033,
  piercing: 0x00ffee,
  rapid: 0xff0080,
  homing: 0x7700ff,
  chain: 0x44ffff,
  nova: 0xff6600,
  vortex: 0xaa44ff,
};

export const WEAPON_MOD_NAMES: Record<string, string> = {
  spread: "SPREAD SHOT",
  piercing: "PIERCING ROUNDS",
  rapid: "RAPID FIRE",
  homing: "HOMING SHOTS",
  chain: "CHAIN LIGHTNING",
  nova: "NOVA BURST",
  vortex: "VORTEX STORM",
};

export default class Cursor extends Phaser.GameObjects.Container {
  public health: number;
  public maxHealth: number;
  public speed: number;
  public damage: number;
  public fireRate: number;
  public tokens = 0;
  public promptCharges: number;
  public maxPromptCharges: number;
  public promptCooldown: number;
  public currentPromptCd = 0;
  public systemPrompt: SystemPrompt;
  public radius = 10;
  public isDead = false;
  public aimX = 0;
  public aimY = 0;
  public invulnTime = 0;
  public lastMoveX = 0;
  public lastMoveY = 1;
  public weaponMod: WeaponMod = null;
  public weaponModTimer = 0;
  public weaponTier = 1;
  public classColor: number;
  public specialActive = false;
  public specialTimer = 0;

  private gfx: Phaser.GameObjects.Graphics;
  private glowGfx: Phaser.GameObjects.Graphics;
  private blinkTimer = 0;
  private blinkVisible = true;
  private fireCooldown = 0;
  private trail: { x: number; y: number; age: number }[] = [];
  private hitFlash = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    systemPrompt: SystemPrompt
  ) {
    super(scene, x, y);
    this.systemPrompt = systemPrompt;
    const stats = CLASS_STATS[systemPrompt];
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.fireRate = stats.fireRate;
    this.promptCharges = stats.promptCharges;
    this.maxPromptCharges = stats.promptCharges;
    this.promptCooldown = stats.promptCooldown;
    this.classColor = stats.color;

    this.glowGfx = scene.add.graphics();
    this.add(this.glowGfx);
    this.gfx = scene.add.graphics();
    this.add(this.gfx);
    this.setDepth(10000);
    scene.add.existing(this);
    this.drawCursor();
  }

  private drawCursor() {
    this.gfx.clear();
    this.glowGfx.clear();
    const c = this.hitFlash > 0 ? 0xffffff : this.classColor;
    const modColor = this.weaponMod ? WEAPON_MOD_COLORS[this.weaponMod] : c;

    this.glowGfx.fillStyle(c, 0.1);
    this.glowGfx.fillCircle(0, 0, 32);
    this.glowGfx.fillStyle(c, 0.18);
    this.glowGfx.fillCircle(0, 0, 18);

    if (this.weaponMod) {
      this.glowGfx.lineStyle(
        1.5,
        modColor,
        0.5 + Math.sin(Date.now() * 0.008) * 0.25
      );
      this.glowGfx.strokeCircle(0, 0, 24);
      if (this.weaponTier >= 3) {
        this.glowGfx.lineStyle(
          1,
          0xffffff,
          0.15 + Math.sin(Date.now() * 0.012) * 0.1
        );
        this.glowGfx.strokeCircle(0, 0, 28);
      }
    }

    if (this.blinkVisible) {
      this.gfx.fillStyle(c, 1);
      this.gfx.fillRect(-1, -15, 2, 30);
    }
    if (this.invulnTime > 0) {
      this.glowGfx.lineStyle(1.5, c, 0.35 + Math.sin(Date.now() * 0.02) * 0.2);
      this.glowGfx.strokeCircle(0, 0, 16);
    }
    if (this.specialActive) {
      this.glowGfx.lineStyle(
        2,
        0xffffff,
        0.6 + Math.sin(Date.now() * 0.01) * 0.3
      );
      this.glowGfx.strokeCircle(0, 0, 26);
    }
  }

  shoot(
    projectiles: Projectile[],
    enemies?: { x: number; y: number }[]
  ): boolean {
    if (this.fireCooldown > 0 || this.isDead) return false;

    const mod = this.weaponMod;
    const tier = this.weaponTier;
    const tierDmg = 1 + (tier - 1) * 0.22;
    const rate =
      mod === "rapid"
        ? this.fireRate * Math.max(0.15, 0.35 - tier * 0.04)
        : mod === "vortex"
          ? this.fireRate * 1.6
          : this.fireRate;
    this.fireCooldown = rate;

    const angle = Math.atan2(this.aimY - this.y, this.aimX - this.x);
    const speed = 560 + tier * 30;
    const baseDmg =
      this.specialActive && this.systemPrompt === "jailbreak"
        ? this.damage * 3
        : this.damage;
    const isCrit =
      this.systemPrompt === "jailbreak" && Math.random() < 0.15 + tier * 0.02;
    const finalDmg = (isCrit ? baseDmg * 2 : baseDmg) * tierDmg;
    const color = mod ? WEAPON_MOD_COLORS[mod] : this.classColor;
    const lifetime = 1400 + tier * 100;

    if (mod === "chain") {
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const p = new Projectile(
        this.scene,
        this.x,
        this.y,
        vx,
        vy,
        finalDmg * (1.0 + tier * 0.1),
        color,
        lifetime,
        true
      );
      p.chainBounces = 4 + tier;
      p.chainRange = 140 + tier * 25;
      p.homing = true;
      p.homingTargets = enemies ?? [];
      projectiles.push(p);
      if (tier >= 3) {
        const p2 = new Projectile(
          this.scene,
          this.x,
          this.y,
          Math.cos(angle + 0.15) * speed,
          Math.sin(angle + 0.15) * speed,
          finalDmg * 0.7,
          color,
          lifetime,
          true
        );
        p2.chainBounces = 2 + Math.floor(tier / 2);
        p2.chainRange = 100 + tier * 15;
        p2.homing = true;
        p2.homingTargets = enemies ?? [];
        projectiles.push(p2);
      }
      if (tier >= 5) {
        const p3 = new Projectile(
          this.scene,
          this.x,
          this.y,
          Math.cos(angle - 0.15) * speed,
          Math.sin(angle - 0.15) * speed,
          finalDmg * 0.5,
          color,
          lifetime,
          true
        );
        p3.chainBounces = 3;
        p3.chainRange = 100;
        p3.homing = true;
        p3.homingTargets = enemies ?? [];
        projectiles.push(p3);
      }
    } else if (mod === "nova") {
      const vx = Math.cos(angle) * speed * 0.85;
      const vy = Math.sin(angle) * speed * 0.85;
      const p = new Projectile(
        this.scene,
        this.x,
        this.y,
        vx,
        vy,
        finalDmg * (1.3 + tier * 0.2),
        color,
        lifetime * 1.1,
        true
      );
      p.isNova = true;
      p.novaRadius = 55 + tier * 18;
      p.novaDamage = finalDmg * (0.5 + tier * 0.12);
      p.homing = true;
      p.homingTargets = enemies ?? [];
      p.homingStrength = 1.8;
      p.radius = 8;
      projectiles.push(p);
      if (tier >= 3) {
        const p2 = new Projectile(
          this.scene,
          this.x,
          this.y,
          Math.cos(angle + 0.3) * speed * 0.75,
          Math.sin(angle + 0.3) * speed * 0.75,
          finalDmg * 0.6,
          color,
          lifetime * 0.9,
          true
        );
        p2.isNova = true;
        p2.novaRadius = 35 + tier * 10;
        p2.novaDamage = finalDmg * (0.3 + tier * 0.06);
        p2.radius = 6;
        projectiles.push(p2);
      }
    } else if (mod === "vortex") {
      const count = 10 + tier * 3;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const vx = Math.cos(a) * speed * 0.85;
        const vy = Math.sin(a) * speed * 0.85;
        const p = new Projectile(
          this.scene,
          this.x,
          this.y,
          vx,
          vy,
          finalDmg * (0.45 + tier * 0.07),
          color,
          lifetime * 0.6,
          true
        );
        if (tier >= 3) p.piercing = true;
        projectiles.push(p);
      }
    } else if (this.systemPrompt === "hallucinate" || mod === "spread") {
      const count = mod === "spread" ? 5 + tier : 3;
      const finalCount =
        this.systemPrompt === "hallucinate" && mod === "spread"
          ? count + 2
          : count;
      const arc = 0.08 + finalCount * 0.06;
      for (let i = 0; i < finalCount; i++) {
        const spread =
          (i - (finalCount - 1) / 2) * ((arc * 2) / (finalCount - 1));
        const vx = Math.cos(angle + spread) * speed;
        const vy = Math.sin(angle + spread) * speed;
        const p = new Projectile(
          this.scene,
          this.x,
          this.y,
          vx,
          vy,
          finalDmg * 0.6,
          color,
          lifetime * 0.8,
          true
        );
        projectiles.push(p);
      }
    } else if (mod === "homing") {
      const count = 2 + Math.floor(tier / 2);
      for (let i = 0; i < count; i++) {
        const spreadA = (i - (count - 1) / 2) * 0.2;
        const vx = Math.cos(angle + spreadA) * speed;
        const vy = Math.sin(angle + spreadA) * speed;
        const p = new Projectile(
          this.scene,
          this.x,
          this.y,
          vx,
          vy,
          finalDmg,
          color,
          lifetime * 1.2,
          true
        );
        p.homing = true;
        p.homingTargets = enemies ?? [];
        p.homingStrength = 3.0 + tier * 0.5;
        projectiles.push(p);
      }
    } else if (mod === "piercing") {
      const vx = Math.cos(angle) * (speed * 1.3);
      const vy = Math.sin(angle) * (speed * 1.3);
      const p = new Projectile(
        this.scene,
        this.x,
        this.y,
        vx,
        vy,
        finalDmg * (1.1 + tier * 0.1),
        color,
        lifetime * 1.3,
        true
      );
      p.piercing = true;
      p.piercingScale = 1 + tier * 0.08;
      projectiles.push(p);
    } else if (this.systemPrompt === "jailbreak" && !mod) {
      const burstCount = 4 + tier;
      for (let b = 0; b < burstCount; b++) {
        const spread = 0.3 + b * 0.05;
        const vx =
          Math.cos(angle + (Math.random() - 0.5) * spread) * speed * 1.15;
        const vy =
          Math.sin(angle + (Math.random() - 0.5) * spread) * speed * 1.15;
        const p = new Projectile(
          this.scene,
          this.x,
          this.y,
          vx,
          vy,
          finalDmg * 0.6,
          color,
          lifetime * 0.55,
          true
        );
        p.radius = 3;
        projectiles.push(p);
      }
    } else {
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const p = new Projectile(
        this.scene,
        this.x,
        this.y,
        vx,
        vy,
        finalDmg,
        color,
        lifetime,
        true
      );
      if (this.systemPrompt === "analyze") p.piercing = true;
      if (this.systemPrompt === "autocomplete") {
        p.homing = true;
        p.homingTargets = enemies ?? [];
        p.homingStrength = 5.0;
        p.radius = 6;
      }
      projectiles.push(p);
    }

    audio.play("shoot");
    return true;
  }

  setWeaponMod(mod: WeaponMod, duration = 15000) {
    this.weaponMod = mod;
    this.weaponModTimer = duration;
  }

  takeDamage(amount: number) {
    if (this.isDead || this.invulnTime > 0) return;
    this.health -= amount;
    this.hitFlash = 100;
    this.invulnTime = 300;
    audio.play("playerHit");
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      audio.play("playerDeath");
    }
  }

  heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    audio.play("healthPickup");
  }

  update(
    delta: number,
    moveX: number,
    moveY: number,
    bounds: { x: number; y: number; w: number; h: number }
  ) {
    if (this.isDead) return;
    if (this.hitFlash > 0) {
      this.hitFlash -= delta;
      if (this.hitFlash <= 0) this.drawCursor();
    }
    if (this.invulnTime > 0) this.invulnTime -= delta;
    if (this.fireCooldown > 0) this.fireCooldown -= delta;
    if (this.currentPromptCd > 0) this.currentPromptCd -= delta;
    if (this.weaponModTimer > 0) {
      this.weaponModTimer -= delta;
      if (this.weaponModTimer <= 0) {
        this.weaponMod = null;
        this.weaponModTimer = 0;
      }
    }
    if (this.specialTimer > 0) {
      this.specialTimer -= delta;
      if (this.specialTimer <= 0) {
        this.specialActive = false;
        this.specialTimer = 0;
      }
    }

    this.blinkTimer += delta;
    if (this.blinkTimer > 400) {
      this.blinkTimer = 0;
      this.blinkVisible = !this.blinkVisible;
      this.drawCursor();
    }

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      const nx = moveX / len,
        ny = moveY / len;
      this.lastMoveX = nx;
      this.lastMoveY = ny;
      const spd = this.speed * (delta / 1000);
      this.trail.push({ x: this.x, y: this.y, age: 0 });
      if (this.trail.length > 8) this.trail.shift();
      this.x += nx * spd;
      this.y += ny * spd;
      this.blinkVisible = true;
    }

    this.x = Phaser.Math.Clamp(this.x, bounds.x, bounds.x + bounds.w);
    this.y = Phaser.Math.Clamp(this.y, bounds.y, bounds.y + bounds.h);
    this.trail = this.trail.filter((t) => {
      t.age += delta;
      return t.age < 200;
    });
    this.drawTrail();
  }

  private drawTrail() {
    this.glowGfx.clear();
    const c = this.hitFlash > 0 ? 0xffffff : this.classColor;
    const modColor = this.weaponMod ? WEAPON_MOD_COLORS[this.weaponMod] : c;

    this.glowGfx.fillStyle(c, 0.1);
    this.glowGfx.fillCircle(0, 0, 32);
    this.glowGfx.fillStyle(c, 0.18);
    this.glowGfx.fillCircle(0, 0, 18);

    if (this.weaponMod) {
      this.glowGfx.lineStyle(
        1.5,
        modColor,
        0.5 + Math.sin(Date.now() * 0.008) * 0.25
      );
      this.glowGfx.strokeCircle(0, 0, 24);
      if (this.weaponTier >= 3) {
        this.glowGfx.lineStyle(
          1,
          0xffffff,
          0.15 + Math.sin(Date.now() * 0.012) * 0.1
        );
        this.glowGfx.strokeCircle(0, 0, 28);
      }
    }

    for (const t of this.trail) {
      const a = 0.25 * (1 - t.age / 200);
      this.glowGfx.fillStyle(c, a);
      this.glowGfx.fillRect(t.x - this.x - 1, t.y - this.y - 11, 2, 22);
    }

    if (this.invulnTime > 0) {
      this.glowGfx.lineStyle(1.5, c, 0.3 + Math.sin(Date.now() * 0.02) * 0.15);
      this.glowGfx.strokeCircle(0, 0, 16);
    }
    if (this.specialActive) {
      this.glowGfx.lineStyle(
        2,
        0xffffff,
        0.6 + Math.sin(Date.now() * 0.01) * 0.3
      );
      this.glowGfx.strokeCircle(0, 0, 26);
    }
  }
}
