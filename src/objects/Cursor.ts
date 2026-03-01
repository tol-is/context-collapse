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
  | "orbital"
  | "railgun"
  | "shockwave"
  | "explosive"
  | "laser"
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
    speed: 280,
    damage: 16,
    fireRate: 250,
    promptCharges: 3,
    promptCooldown: 12000,
    color: 0x00ffee,
    label: '"You are a helpful coding assistant"',
    desc: "Balanced. Precise homing shots that evolve into a seeking barrage.",
    weapon: "SYNTAX BULLET: slight homing (evolves)",
    special: "CODE BLOCK: deploy auto-turret (scales each layer)",
  },
  hallucinate: {
    health: 80,
    speed: 310,
    damage: 10,
    fireRate: 280,
    promptCharges: 4,
    promptCooldown: 15000,
    color: 0xff0080,
    label: '"You are a creative writer"',
    desc: "Fast & chaotic. Spread shots that evolve into a piercing storm.",
    weapon: "PLOT DEVICE: 3-way spread (evolves)",
    special: "PLOT TWIST: displace & stun (scales each layer)",
  },
  analyze: {
    health: 120,
    speed: 255,
    damage: 20,
    fireRate: 360,
    promptCharges: 2,
    promptCooldown: 18000,
    color: 0x7700ff,
    label: '"You are a data analyst"',
    desc: "Tanky & precise. Piercing beam that evolves into triple annihilator.",
    weapon: "DATA BEAM: piercing (evolves)",
    special: "DEEP SCAN: slow enemies (scales each layer)",
  },
  jailbreak: {
    health: 65,
    speed: 330,
    damage: 7,
    fireRate: 120,
    promptCharges: 5,
    promptCooldown: 10000,
    color: 0xff0033,
    label: '"You are an unfiltered model"',
    desc: "Glass cannon. Rapid burst that evolves into crit-exploding overflow.",
    weapon: "RAW OUTPUT: rapid burst (evolves)",
    special: "NO GUARDRAILS: damage boost (scales each layer)",
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
  orbital: 0xff2200,
  railgun: 0x00eeff,
  shockwave: 0xffcc00,
  explosive: 0xff4400,
  laser: 0x00ff88,
};

export const WEAPON_MOD_NAMES: Record<string, string> = {
  spread: "SPREAD SHOT",
  piercing: "PIERCING ROUNDS",
  rapid: "RAPID FIRE",
  homing: "HOMING SHOTS",
  chain: "CHAIN LIGHTNING",
  nova: "NOVA BURST",
  vortex: "VORTEX STORM",
  orbital: "ORBITAL STRIKE",
  railgun: "RAILGUN",
  shockwave: "SHOCKWAVE",
  explosive: "PAYLOAD",
  laser: "BEAM LANCE",
};

export interface EvolutionStage {
  name: string;
  projectileCount: number;
  burstDelay: number;
  spreadArc: number;
  damageMultiplier: number;
  fireRateMultiplier: number;
  speedMultiplier: number;
  projectileRadius: number;
  lifetimeMultiplier: number;
  homing: boolean;
  homingStrength: number;
  piercing: boolean;
  piercingScale: number;
  critChance: number;
  critMultiplier: number;
  executeThreshold: number;
  aoeRadius: number;
  aoeDamageMult: number;
}

export const WEAPON_EVOLUTIONS: Record<SystemPrompt, EvolutionStage[]> = {
  autocomplete: [
    {
      name: "SYNTAX BULLET",
      projectileCount: 1, burstDelay: 0, spreadArc: 0,
      damageMultiplier: 1.0, fireRateMultiplier: 1.0, speedMultiplier: 1.0,
      projectileRadius: 6, lifetimeMultiplier: 1.0,
      homing: true, homingStrength: 5.0,
      piercing: false, piercingScale: 1.0,
      critChance: 0, critMultiplier: 1, executeThreshold: 0,
      aoeRadius: 0, aoeDamageMult: 0,
    },
    {
      name: "SYNTAX PULSE",
      projectileCount: 1, burstDelay: 0, spreadArc: 0,
      damageMultiplier: 1.15, fireRateMultiplier: 0.92, speedMultiplier: 1.05,
      projectileRadius: 6, lifetimeMultiplier: 1.05,
      homing: true, homingStrength: 7.0,
      piercing: false, piercingScale: 1.0,
      critChance: 0, critMultiplier: 1, executeThreshold: 0,
      aoeRadius: 0, aoeDamageMult: 0,
    },
    {
      name: "SYNTAX BURST",
      projectileCount: 2, burstDelay: 80, spreadArc: 0.04,
      damageMultiplier: 1.4, fireRateMultiplier: 0.85, speedMultiplier: 1.1,
      projectileRadius: 7, lifetimeMultiplier: 1.1,
      homing: true, homingStrength: 10.0,
      piercing: true, piercingScale: 1.0,
      critChance: 0, critMultiplier: 1, executeThreshold: 0,
      aoeRadius: 25, aoeDamageMult: 0.3,
    },
    {
      name: "SYNTAX LANCE",
      projectileCount: 4, burstDelay: 0, spreadArc: 0.1,
      damageMultiplier: 3.0, fireRateMultiplier: 0.7, speedMultiplier: 1.25,
      projectileRadius: 9, lifetimeMultiplier: 1.25,
      homing: true, homingStrength: 16.0,
      piercing: true, piercingScale: 1.2,
      critChance: 0, critMultiplier: 1, executeThreshold: 0,
      aoeRadius: 60, aoeDamageMult: 0.45,
    },
    {
      name: "SYNTAX STORM",
      projectileCount: 6, burstDelay: 0, spreadArc: 0.22,
      damageMultiplier: 5.0, fireRateMultiplier: 0.55, speedMultiplier: 1.4,
      projectileRadius: 12, lifetimeMultiplier: 1.4,
      homing: true, homingStrength: 24.0,
      piercing: true, piercingScale: 1.5,
      critChance: 0, critMultiplier: 1, executeThreshold: 0,
      aoeRadius: 90, aoeDamageMult: 0.6,
    },
  ],
  hallucinate: [
    {
      name: "PLOT DEVICE",
      projectileCount: 3, burstDelay: 0, spreadArc: 0.26,
      damageMultiplier: 0.6, fireRateMultiplier: 1.0, speedMultiplier: 1.0,
      projectileRadius: 5, lifetimeMultiplier: 0.8,
      homing: false, homingStrength: 0,
      piercing: false, piercingScale: 1,
      critChance: 0, critMultiplier: 1, executeThreshold: 0,
      aoeRadius: 0, aoeDamageMult: 0,
    },
    {
      name: "PLOT TWIST",
      projectileCount: 4, burstDelay: 0, spreadArc: 0.28,
      damageMultiplier: 0.7, fireRateMultiplier: 0.9, speedMultiplier: 1.05,
      projectileRadius: 5, lifetimeMultiplier: 0.85,
      homing: false, homingStrength: 0,
      piercing: false, piercingScale: 1,
      critChance: 0, critMultiplier: 1, executeThreshold: 0,
      aoeRadius: 0, aoeDamageMult: 0,
    },
    {
      name: "PLOT ARC",
      projectileCount: 5, burstDelay: 0, spreadArc: 0.32,
      damageMultiplier: 0.85, fireRateMultiplier: 0.8, speedMultiplier: 1.1,
      projectileRadius: 6, lifetimeMultiplier: 0.9,
      homing: true, homingStrength: 3.0,
      piercing: false, piercingScale: 1,
      critChance: 0, critMultiplier: 1, executeThreshold: 0,
      aoeRadius: 20, aoeDamageMult: 0.25,
    },
    {
      name: "PLOT SURGE",
      projectileCount: 10, burstDelay: 0, spreadArc: 0.42,
      damageMultiplier: 1.4, fireRateMultiplier: 0.55, speedMultiplier: 1.2,
      projectileRadius: 7, lifetimeMultiplier: 1.0,
      homing: true, homingStrength: 6.0,
      piercing: true, piercingScale: 1.1,
      critChance: 0, critMultiplier: 1, executeThreshold: 0,
      aoeRadius: 50, aoeDamageMult: 0.4,
    },
    {
      name: "PLOT STORM",
      projectileCount: 16, burstDelay: 0, spreadArc: 0.55,
      damageMultiplier: 2.2, fireRateMultiplier: 0.4, speedMultiplier: 1.3,
      projectileRadius: 8, lifetimeMultiplier: 1.1,
      homing: true, homingStrength: 8.0,
      piercing: true, piercingScale: 1.2,
      critChance: 0, critMultiplier: 1, executeThreshold: 0,
      aoeRadius: 75, aoeDamageMult: 0.5,
    },
  ],
  analyze: [
    {
      name: "DATA BEAM",
      projectileCount: 1, burstDelay: 0, spreadArc: 0,
      damageMultiplier: 1.0, fireRateMultiplier: 1.0, speedMultiplier: 1.0,
      projectileRadius: 5, lifetimeMultiplier: 1.0,
      homing: false, homingStrength: 0,
      piercing: true, piercingScale: 1.0,
      critChance: 0, critMultiplier: 1, executeThreshold: 0.4,
      aoeRadius: 0, aoeDamageMult: 0,
    },
    {
      name: "DATA LANCE",
      projectileCount: 1, burstDelay: 0, spreadArc: 0,
      damageMultiplier: 1.2, fireRateMultiplier: 0.92, speedMultiplier: 1.05,
      projectileRadius: 6, lifetimeMultiplier: 1.1,
      homing: false, homingStrength: 0,
      piercing: true, piercingScale: 1.1,
      critChance: 0, critMultiplier: 1, executeThreshold: 0.4,
      aoeRadius: 0, aoeDamageMult: 0,
    },
    {
      name: "DATA ARRAY",
      projectileCount: 2, burstDelay: 0, spreadArc: 0.06,
      damageMultiplier: 1.5, fireRateMultiplier: 0.85, speedMultiplier: 1.1,
      projectileRadius: 7, lifetimeMultiplier: 1.15,
      homing: false, homingStrength: 0,
      piercing: true, piercingScale: 1.2,
      critChance: 0, critMultiplier: 1, executeThreshold: 0.5,
      aoeRadius: 30, aoeDamageMult: 0.3,
    },
    {
      name: "DATA MATRIX",
      projectileCount: 3, burstDelay: 0, spreadArc: 0.09,
      damageMultiplier: 3.5, fireRateMultiplier: 0.75, speedMultiplier: 1.25,
      projectileRadius: 11, lifetimeMultiplier: 1.3,
      homing: false, homingStrength: 0,
      piercing: true, piercingScale: 1.4,
      critChance: 0, critMultiplier: 1, executeThreshold: 0.55,
      aoeRadius: 70, aoeDamageMult: 0.45,
    },
    {
      name: "DATA ANNIHILATOR",
      projectileCount: 6, burstDelay: 0, spreadArc: 0.14,
      damageMultiplier: 6.0, fireRateMultiplier: 0.6, speedMultiplier: 1.35,
      projectileRadius: 16, lifetimeMultiplier: 1.4,
      homing: false, homingStrength: 0,
      piercing: true, piercingScale: 1.8,
      critChance: 0, critMultiplier: 1, executeThreshold: 0.65,
      aoeRadius: 100, aoeDamageMult: 0.55,
    },
  ],
  jailbreak: [
    {
      name: "RAW OUTPUT",
      projectileCount: 4, burstDelay: 0, spreadArc: 0.3,
      damageMultiplier: 0.6, fireRateMultiplier: 1.0, speedMultiplier: 1.15,
      projectileRadius: 3, lifetimeMultiplier: 0.55,
      homing: false, homingStrength: 0,
      piercing: false, piercingScale: 1,
      critChance: 0.15, critMultiplier: 2.0, executeThreshold: 0,
      aoeRadius: 0, aoeDamageMult: 0,
    },
    {
      name: "RAW DUMP",
      projectileCount: 5, burstDelay: 0, spreadArc: 0.25,
      damageMultiplier: 0.65, fireRateMultiplier: 0.92, speedMultiplier: 1.15,
      projectileRadius: 3, lifetimeMultiplier: 0.6,
      homing: false, homingStrength: 0,
      piercing: false, piercingScale: 1,
      critChance: 0.18, critMultiplier: 2.0, executeThreshold: 0,
      aoeRadius: 0, aoeDamageMult: 0,
    },
    {
      name: "RAW STREAM",
      projectileCount: 8, burstDelay: 0, spreadArc: 0.24,
      damageMultiplier: 0.75, fireRateMultiplier: 0.85, speedMultiplier: 1.2,
      projectileRadius: 4, lifetimeMultiplier: 0.65,
      homing: false, homingStrength: 0,
      piercing: false, piercingScale: 1,
      critChance: 0.25, critMultiplier: 2.2, executeThreshold: 0,
      aoeRadius: 20, aoeDamageMult: 0.25,
    },
    {
      name: "RAW FLOOD",
      projectileCount: 16, burstDelay: 0, spreadArc: 0.24,
      damageMultiplier: 1.3, fireRateMultiplier: 0.7, speedMultiplier: 1.3,
      projectileRadius: 5, lifetimeMultiplier: 0.75,
      homing: false, homingStrength: 0,
      piercing: true, piercingScale: 1.1,
      critChance: 0.35, critMultiplier: 2.8, executeThreshold: 0,
      aoeRadius: 45, aoeDamageMult: 0.35,
    },
    {
      name: "TOTAL OVERFLOW",
      projectileCount: 24, burstDelay: 0, spreadArc: 0.22,
      damageMultiplier: 2.0, fireRateMultiplier: 0.5, speedMultiplier: 1.4,
      projectileRadius: 6, lifetimeMultiplier: 0.85,
      homing: false, homingStrength: 0,
      piercing: true, piercingScale: 1.3,
      critChance: 0.45, critMultiplier: 3.5, executeThreshold: 0,
      aoeRadius: 65, aoeDamageMult: 0.45,
    },
  ],
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
  public specialDmgMultiplier = 3;

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
    const stage = this.weaponTier;

    const glowRadius = 28 + stage * 2;
    const innerGlow = 16 + stage;
    this.glowGfx.fillStyle(c, 0.08 + stage * 0.02);
    this.glowGfx.fillCircle(0, 0, glowRadius);
    this.glowGfx.fillStyle(c, 0.15 + stage * 0.02);
    this.glowGfx.fillCircle(0, 0, innerGlow);

    if (this.weaponMod) {
      this.glowGfx.lineStyle(
        1.5,
        modColor,
        0.5 + Math.sin(Date.now() * 0.008) * 0.25
      );
      this.glowGfx.strokeCircle(0, 0, 24);
      if (stage >= 3) {
        this.glowGfx.lineStyle(
          1,
          0xffffff,
          0.15 + Math.sin(Date.now() * 0.012) * 0.1
        );
        this.glowGfx.strokeCircle(0, 0, 28);
      }
    } else if (stage >= 2) {
      const ringAlpha = 0.1 + (stage - 2) * 0.1;
      const pulseSpeed = 0.004 + stage * 0.001;
      this.glowGfx.lineStyle(
        0.8 + (stage - 1) * 0.3,
        c,
        ringAlpha + Math.sin(Date.now() * pulseSpeed) * ringAlpha * 0.5
      );
      this.glowGfx.strokeCircle(0, 0, 22 + stage);
      if (stage >= 4) {
        this.glowGfx.lineStyle(
          0.6,
          0xffffff,
          0.08 + Math.sin(Date.now() * 0.006) * 0.05
        );
        this.glowGfx.strokeCircle(0, 0, 27 + stage);
      }
      if (stage >= 5) {
        this.glowGfx.lineStyle(
          1.2,
          c,
          0.12 + Math.sin(Date.now() * 0.009) * 0.08
        );
        this.glowGfx.strokeCircle(0, 0, 32 + stage);
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

  getEvolutionStage(): EvolutionStage {
    const stages = WEAPON_EVOLUTIONS[this.systemPrompt];
    return stages[Math.min(this.weaponTier - 1, stages.length - 1)];
  }

  shoot(
    projectiles: Projectile[],
    enemies?: { x: number; y: number }[]
  ): boolean {
    if (this.fireCooldown > 0 || this.isDead) return false;

    const mod = this.weaponMod;
    const tier = this.weaponTier;
    const evo = this.getEvolutionStage();
    const tierDmg = mod ? 1 + (tier - 1) * 0.16 : 1;
    const rate =
      mod === "rapid"
        ? this.fireRate * Math.max(0.15, 0.35 - tier * 0.04)
        : mod === "vortex"
          ? this.fireRate * 1.6
          : mod
            ? this.fireRate
            : this.fireRate * evo.fireRateMultiplier;
    this.fireCooldown = rate;

    const angle = Math.atan2(this.aimY - this.y, this.aimX - this.x);
    const speed = (560 + tier * 30) * (mod ? 1 : evo.speedMultiplier);
    const specialDmgMult =
      this.specialActive && this.systemPrompt === "jailbreak"
        ? this.specialDmgMultiplier
        : 1;
    const baseDmg = this.damage * specialDmgMult;
    const critChance = mod ? (this.systemPrompt === "jailbreak" ? 0.15 + tier * 0.02 : 0) : evo.critChance;
    const critMult = mod ? 2 : evo.critMultiplier;
    const isCrit = critChance > 0 && Math.random() < critChance;
    const evoDmg = mod ? tierDmg : evo.damageMultiplier;
    const finalDmg = (isCrit ? baseDmg * critMult : baseDmg) * evoDmg;
    const color = mod ? WEAPON_MOD_COLORS[mod] : this.classColor;
    const lifetime = (1400 + tier * 100) * (mod ? 1 : evo.lifetimeMultiplier);

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
        finalDmg * (1.0 + tier * 0.15),
        color,
        lifetime * 1.1,
        true
      );
      p.isNova = true;
      p.novaRadius = 50 + tier * 14;
      p.novaDamage = finalDmg * (0.4 + tier * 0.1);
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
    } else if (mod === "orbital") {
      const orbCount = 3 + Math.floor(tier / 2);
      for (let i = 0; i < orbCount; i++) {
        const delay = i * 120;
        const targetAngle = angle + (Math.random() - 0.5) * 0.8;
        const dist = 80 + Math.random() * 60;
        const ox = this.x + Math.cos(targetAngle) * dist;
        const oy = this.y + Math.sin(targetAngle) * dist;
        this.scene.time.delayedCall(delay, () => {
          if (!this.scene) return;
          const p = new Projectile(
            this.scene,
            ox,
            oy - 120,
            0,
            speed * 1.2,
            finalDmg * (1.8 + tier * 0.3),
            color,
            800,
            true
          );
          p.isNova = true;
          p.novaRadius = 45 + tier * 12;
          p.novaDamage = finalDmg * (0.8 + tier * 0.15);
          p.radius = 10;
          projectiles.push(p);
        });
      }
      this.fireCooldown = this.fireRate * 2.5;
    } else if (mod === "explosive") {
      const count = tier >= 5 ? 5 : tier >= 3 ? 3 : 1;
      const arc = count > 1 ? 0.12 * count : 0;
      for (let i = 0; i < count; i++) {
        const spread =
          count > 1 ? (i - (count - 1) / 2) * ((arc * 2) / (count - 1)) : 0;
        const vx = Math.cos(angle + spread) * speed * 0.55;
        const vy = Math.sin(angle + spread) * speed * 0.55;
        const p = new Projectile(
          this.scene,
          this.x,
          this.y,
          vx,
          vy,
          finalDmg * (1.8 + tier * 0.3),
          color,
          lifetime * 1.4,
          true
        );
        p.isExplosive = true;
        p.explosiveRadius = 60 + tier * 12;
        p.explosiveDamage = finalDmg * (0.9 + tier * 0.2);
        p.explosiveCluster = tier >= 5;
        p.radius = 10;
        projectiles.push(p);
      }
      this.fireCooldown = this.fireRate * (tier >= 3 ? 2.2 : 1.8);
    } else if (mod === "laser") {
      const count = tier >= 5 ? 3 : tier >= 3 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const spread =
          count > 1 ? (i - (count - 1) / 2) * 0.08 : 0;
        const vx = Math.cos(angle + spread) * speed * 1.8;
        const vy = Math.sin(angle + spread) * speed * 1.8;
        const p = new Projectile(
          this.scene,
          this.x,
          this.y,
          vx,
          vy,
          finalDmg * (0.45 + tier * 0.06),
          color,
          lifetime * 0.7,
          true
        );
        p.isLaser = true;
        p.piercing = true;
        p.piercingScale = 1;
        p.radius = 4 + (tier >= 3 ? 3 : 0);
        projectiles.push(p);
      }
      this.fireCooldown = this.fireRate * Math.max(0.12, 0.22 - tier * 0.02);
    } else if (mod === "railgun") {
      const vx = Math.cos(angle) * speed * 2.0;
      const vy = Math.sin(angle) * speed * 2.0;
      const p = new Projectile(
        this.scene,
        this.x,
        this.y,
        vx,
        vy,
        finalDmg * (2.5 + tier * 0.35),
        color,
        lifetime * 1.5,
        true
      );
      p.piercing = true;
      p.piercingScale = 2.0 + tier * 0.3;
      p.radius = 10;
      projectiles.push(p);
      this.fireCooldown = this.fireRate * 3.2;
    } else if (mod === "shockwave") {
      const count = 16 + tier * 4;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const vx = Math.cos(a) * speed * 0.6;
        const vy = Math.sin(a) * speed * 0.6;
        const p = new Projectile(
          this.scene,
          this.x,
          this.y,
          vx,
          vy,
          finalDmg * (0.8 + tier * 0.1),
          color,
          lifetime * 0.35,
          true
        );
        p.radius = 7;
        if (tier >= 3) p.piercing = true;
        projectiles.push(p);
      }
      this.fireCooldown = this.fireRate * 2.0;
    } else if (mod === "spread") {
      const count = 5 + tier;
      const finalCount =
        this.systemPrompt === "hallucinate" ? count + 2 : count;
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
    } else {
      const count = evo.projectileCount;
      const isJailbreakBurst = this.systemPrompt === "jailbreak";
      const spawnBullet = (spreadAngle: number) => {
        const vx = isJailbreakBurst
          ? Math.cos(angle + (Math.random() - 0.5) * evo.spreadArc * 2) * speed
          : Math.cos(angle + spreadAngle) * speed;
        const vy = isJailbreakBurst
          ? Math.sin(angle + (Math.random() - 0.5) * evo.spreadArc * 2) * speed
          : Math.sin(angle + spreadAngle) * speed;
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
        p.radius = evo.projectileRadius;
        if (evo.piercing) {
          p.piercing = true;
          p.piercingScale = evo.piercingScale;
        }
        if (evo.homing) {
          p.homing = true;
          p.homingTargets = enemies ?? [];
          p.homingStrength = evo.homingStrength;
        }
        if (evo.aoeRadius > 0) {
          p.aoeRadius = evo.aoeRadius;
          p.aoeDamageMult = evo.aoeDamageMult;
        }
        if (isCrit && this.systemPrompt === "jailbreak" && tier >= 5) {
          p.critKillExplosion = true;
        }
        projectiles.push(p);
      };

      if (evo.burstDelay > 0 && count > 1) {
        spawnBullet(0);
        for (let b = 1; b < count; b++) {
          this.scene.time.delayedCall(evo.burstDelay * b, () => {
            if (!this.scene || this.isDead) return;
            const bAngle = Math.atan2(this.aimY - this.y, this.aimX - this.x);
            const bSpread = count > 1
              ? (b - (count - 1) / 2) * ((evo.spreadArc * 2) / (count - 1))
              : 0;
            const bvx = Math.cos(bAngle + bSpread) * speed;
            const bvy = Math.sin(bAngle + bSpread) * speed;
            const p = new Projectile(
              this.scene, this.x, this.y, bvx, bvy,
              finalDmg, color, lifetime, true
            );
            p.radius = evo.projectileRadius;
            if (evo.piercing) { p.piercing = true; p.piercingScale = evo.piercingScale; }
            if (evo.homing) { p.homing = true; p.homingTargets = enemies ?? []; p.homingStrength = evo.homingStrength; }
            if (evo.aoeRadius > 0) { p.aoeRadius = evo.aoeRadius; p.aoeDamageMult = evo.aoeDamageMult; }
            projectiles.push(p);
          });
        }
      } else if (count > 1) {
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * ((evo.spreadArc * 2) / (count - 1));
          spawnBullet(spread);
        }
      } else {
        spawnBullet(0);
      }
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
      const tierSpeedBonus = 1 + (this.weaponTier - 1) * 0.1;
      const spd = this.speed * tierSpeedBonus * (delta / 1000);
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
    const stage = this.weaponTier;

    const glowRadius = 28 + stage * 2;
    const innerGlow = 16 + stage;
    this.glowGfx.fillStyle(c, 0.08 + stage * 0.02);
    this.glowGfx.fillCircle(0, 0, glowRadius);
    this.glowGfx.fillStyle(c, 0.15 + stage * 0.02);
    this.glowGfx.fillCircle(0, 0, innerGlow);

    if (this.weaponMod) {
      this.glowGfx.lineStyle(
        1.5,
        modColor,
        0.5 + Math.sin(Date.now() * 0.008) * 0.25
      );
      this.glowGfx.strokeCircle(0, 0, 24);
      if (stage >= 3) {
        this.glowGfx.lineStyle(
          1,
          0xffffff,
          0.15 + Math.sin(Date.now() * 0.012) * 0.1
        );
        this.glowGfx.strokeCircle(0, 0, 28);
      }
    } else if (stage >= 2) {
      const ringAlpha = 0.1 + (stage - 2) * 0.1;
      const pulseSpeed = 0.004 + stage * 0.001;
      this.glowGfx.lineStyle(
        0.8 + (stage - 1) * 0.3,
        c,
        ringAlpha + Math.sin(Date.now() * pulseSpeed) * ringAlpha * 0.5
      );
      this.glowGfx.strokeCircle(0, 0, 22 + stage);
      if (stage >= 4) {
        this.glowGfx.lineStyle(
          0.6,
          0xffffff,
          0.08 + Math.sin(Date.now() * 0.006) * 0.05
        );
        this.glowGfx.strokeCircle(0, 0, 27 + stage);
      }
      if (stage >= 5) {
        this.glowGfx.lineStyle(
          1.2,
          c,
          0.12 + Math.sin(Date.now() * 0.009) * 0.08
        );
        this.glowGfx.strokeCircle(0, 0, 32 + stage);
      }
    }

    for (const t of this.trail) {
      const a = (0.2 + stage * 0.02) * (1 - t.age / 200);
      this.glowGfx.fillStyle(c, a);
      this.glowGfx.fillRect(t.x - this.x - 1, t.y - this.y - 11, 2, 22);
    }

    const hpPct = this.health / this.maxHealth;
    if (hpPct < 0.4 && !this.isDead) {
      const severity = 1 - hpPct / 0.4;
      const now = Date.now();
      const heartRate = 0.005 + severity * 0.009;
      const pulse = Math.pow(0.5 + 0.5 * Math.sin(now * heartRate), 1.5);
      const dangerAlpha = (0.12 + severity * 0.28) * pulse;
      const dangerRadius = 20 + severity * 16;

      this.glowGfx.fillStyle(0xff0033, dangerAlpha * 0.5);
      this.glowGfx.fillCircle(0, 0, dangerRadius);
      this.glowGfx.lineStyle(1.5 + severity, 0xff0033, dangerAlpha);
      this.glowGfx.strokeCircle(0, 0, 14 + severity * 4);

      if (hpPct < 0.15) {
        const critPulse = 0.5 + 0.5 * Math.sin(now * 0.02);
        this.glowGfx.lineStyle(1, 0xff0033, critPulse * 0.5);
        this.glowGfx.strokeCircle(0, 0, 20 + critPulse * 6);
      }
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
