import Phaser from "phaser";
import Projectile from "./Projectile";
import { audio } from "../systems/AudioManager";

export type BossType =
  | "contentFarm"
  | "blackBox"
  | "hallucinator"
  | "alignmentProblem"
  | "overfitEngine"
  | "promptInjector"
  | "singularity";

export const BOSS_NAMES: Record<BossType, string> = {
  contentFarm: "THE CONTENT FARM",
  blackBox: "THE BLACK BOX",
  hallucinator: "THE HALLUCINATOR",
  alignmentProblem: "THE ALIGNMENT PROBLEM",
  overfitEngine: "THE OVERFIT ENGINE",
  promptInjector: "THE PROMPT INJECTOR",
  singularity: "THE SINGULARITY",
};

export const BOSS_COLORS: Record<BossType, number> = {
  contentFarm: 0xff0033,
  blackBox: 0x5500cc,
  hallucinator: 0x7700ff,
  alignmentProblem: 0x00ffee,
  overfitEngine: 0xff0080,
  promptInjector: 0xff0066,
  singularity: 0xffffff,
};

const BOSS_INDEX: Record<BossType, number> = {
  contentFarm: 0,
  blackBox: 1,
  hallucinator: 2,
  alignmentProblem: 3,
  overfitEngine: 4,
  promptInjector: 5,
  singularity: 6,
};

const BASE_HP = [1000, 3600, 4800, 6000, 7500, 9000, 14000];
const SPEED_MULT = [1.1, 1.3, 1.5, 1.65, 1.8, 1.95, 2.2];

interface HexCell {
  localX: number;
  localY: number;
  alive: boolean;
  hp: number;
  spawnCd: number;
  pulse: number;
  regenTimer: number;
}

export default class Boss extends Phaser.GameObjects.Container {
  public bossType: BossType;
  public health: number;
  public maxHealth: number;
  public radius = 60;
  public isDead = false;
  public phase = 1;
  public wantsSpawn = false;
  public spawnX = 0;
  public spawnY = 0;
  public deathCinematic = false;
  public deathProgress = 0;

  private gfx: Phaser.GameObjects.Graphics;
  private hpGfx: Phaser.GameObjects.Graphics;
  private lifetime = 0;
  private hitFlash = 0;
  private breathPhase = 0;
  private bossColor: number;
  private bossIdx: number;
  private spdMult: number;

  private cells: HexCell[] = [];
  private cellSize = 18;
  private breathWave = 0;
  private phaseTransition = 0;

  private tendrils: {
    angle: number;
    length: number;
    age: number;
    maxAge: number;
  }[] = [];
  private tendrilTimer = 0;
  private distortRadius = 0;
  private shootTimer = 2000;
  private playerX = 0;
  private playerY = 0;

  private clones: { x: number; y: number; real: boolean; alpha: number }[] = [];
  private cloneTimer = 0;

  private apFriendly = true;
  private apTransitionTimer = 0;
  private apSpikes: number[] = [];

  private oePatternPhase = 0;
  private oeShieldAngle = 0;

  private piGlitchTimer = 0;
  public piGlitchActive = false;

  private singSize = 2;
  private singRings: {
    radius: number;
    speed: number;
    gapAngle: number;
    gapSize: number;
  }[] = [];
  private singAbsorbed = 0;

  private spawnTimer = 0;
  private readonly spawnDuration = 800;
  public get isSpawning() {
    return this.spawnTimer < this.spawnDuration;
  }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: BossType,
    zone: number
  ) {
    super(scene, x, y);
    this.bossType = type;
    this.bossColor = BOSS_COLORS[type];
    this.bossIdx = BOSS_INDEX[type];
    this.spdMult = SPEED_MULT[this.bossIdx];
    const zoneScale = 1 + (zone - 1) * 0.15;

    this.health = Math.round(BASE_HP[this.bossIdx] * zoneScale);
    this.maxHealth = this.health;

    switch (type) {
      case "contentFarm":
        this.radius = 70;
        this.initContentFarm();
        break;
      case "blackBox":
        this.radius = 50;
        break;
      case "hallucinator":
        this.radius = 35;
        this.initClones(x, y);
        break;
      case "alignmentProblem":
        this.radius = 45;
        for (let i = 0; i < 14; i++) this.apSpikes.push(0);
        break;
      case "overfitEngine":
        this.radius = 48;
        break;
      case "promptInjector":
        this.radius = 42;
        break;
      case "singularity":
        this.radius = 10;
        for (let i = 0; i < 5; i++)
          this.singRings.push({
            radius: 30 + i * 20,
            speed: (i % 2 === 0 ? 1 : -1) * (0.8 + i * 0.3),
            gapAngle: Math.random() * Math.PI * 2,
            gapSize: 0.6 - i * 0.06,
          });
        break;
    }

    this.gfx = scene.add.graphics();
    this.add(this.gfx);
    this.hpGfx = scene.add.graphics();
    this.add(this.hpGfx);
    this.setDepth(5000);
    this.setAlpha(0);
    this.shootTimer = this.spawnDuration + 800;
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    audio.play("bossIntro");
  }

  private initContentFarm() {
    this.cells = [];
    const rings = Math.max(1, 2 - this.phase + 1);
    for (let ring = 0; ring <= rings; ring++) {
      if (ring === 0) {
        this.cells.push({
          localX: 0,
          localY: 0,
          alive: true,
          hp: 3,
          spawnCd: 2000,
          pulse: 0,
          regenTimer: 0,
        });
        continue;
      }
      for (let i = 0; i < 6 * ring; i++) {
        const angle = (i / (6 * ring)) * Math.PI * 2;
        this.cells.push({
          localX: Math.cos(angle) * ring * this.cellSize * 1.8,
          localY: Math.sin(angle) * ring * this.cellSize * 1.8,
          alive: true,
          hp: 2,
          spawnCd: 3500 - this.phase * 300,
          pulse: Math.random() * Math.PI * 2,
          regenTimer: 0,
        });
      }
    }
  }

  private initClones(cx: number, cy: number) {
    this.clones = [];
    const count = 3 + this.phase * 3;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 80 + Math.random() * 50;
      this.clones.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        real: i === 0,
        alpha: 0.8,
      });
    }
    for (let i = this.clones.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.clones[i], this.clones[j]] = [this.clones[j], this.clones[i]];
    }
  }

  takeDamage(amount: number) {
    if (
      this.isDead ||
      this.deathCinematic ||
      this.spawnTimer < this.spawnDuration
    )
      return;
    this.health -= amount;
    this.hitFlash = 80;
    audio.play("bossHit");

    const pct = this.health / this.maxHealth;
    if (this.bossType === "contentFarm") {
      if (this.phase === 1 && pct < 0.66) this.advancePhase();
      else if (this.phase === 2 && pct < 0.33) this.advancePhase();
    }
    if (this.bossType === "alignmentProblem" && this.apFriendly && pct < 0.85) {
      this.apFriendly = false;
      this.apTransitionTimer = 1000;
      audio.play("bossPhase");
    }
    if (this.bossType === "hallucinator" && this.phase < 3) {
      if (
        (this.phase === 1 && pct < 0.66) ||
        (this.phase === 2 && pct < 0.33)
      ) {
        this.phase++;
        this.initClones(this.x, this.y);
        audio.play("bossPhase");
      }
    }
    if (this.bossType === "overfitEngine") {
      if (this.phase === 1 && pct < 0.5) {
        this.phase = 2;
        audio.play("bossPhase");
      }
    }
    if (this.bossType === "promptInjector") {
      if (this.phase === 1 && pct < 0.6) {
        this.phase = 2;
        audio.play("bossPhase");
      } else if (this.phase === 2 && pct < 0.3) {
        this.phase = 3;
        audio.play("bossPhase");
      }
    }
    if (this.bossType === "singularity") {
      if (this.phase === 1 && pct < 0.7) {
        this.phase = 2;
        audio.play("bossPhase");
      } else if (this.phase === 2 && pct < 0.4) {
        this.phase = 3;
        audio.play("bossPhase");
      } else if (this.phase === 3 && pct < 0.15) {
        this.phase = 4;
        audio.play("bossPhase");
      }
    }

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.deathCinematic = true;
      this.deathProgress = 0;
      audio.play("bossDeath");
    }
  }

  private advancePhase() {
    this.phase++;
    this.phaseTransition = 500;
    audio.play("bossPhase");
    if (this.bossType === "contentFarm") this.initContentFarm();
  }

  update(
    delta: number,
    playerX: number,
    playerY: number,
    projectiles: Projectile[]
  ) {
    if (this.deathCinematic) {
      this.deathProgress += delta / 2200;
      this.drawBossDeath();
      if (this.deathProgress >= 1) this.destroy();
      return;
    }
    if (this.isDead) return;

    if (this.spawnTimer < this.spawnDuration) {
      this.spawnTimer += delta;
      const t = Math.min(1, this.spawnTimer / this.spawnDuration);
      const ease = 1 - Math.pow(1 - t, 3);
      this.setAlpha(ease);
      this.setScale(0.6 + 0.4 * ease);
      this.breathPhase += delta / 1000;
      this.drawBoss();
      this.drawBossHealth();
      return;
    }

    this.lifetime += delta;
    this.breathPhase += delta / 1000;
    if (this.hitFlash > 0) this.hitFlash -= delta;
    if (this.phaseTransition > 0) this.phaseTransition -= delta;
    this.wantsSpawn = false;
    this.playerX = playerX;
    this.playerY = playerY;

    switch (this.bossType) {
      case "contentFarm":
        this.updateContentFarm(delta, projectiles);
        break;
      case "blackBox":
        this.updateBlackBox(delta, playerX, playerY, projectiles);
        break;
      case "hallucinator":
        this.updateHallucinator(delta, playerX, playerY, projectiles);
        break;
      case "alignmentProblem":
        this.updateAlignment(delta, playerX, playerY, projectiles);
        break;
      case "overfitEngine":
        this.updateOverfit(delta, playerX, playerY, projectiles);
        break;
      case "promptInjector":
        this.updatePromptInjector(delta, playerX, playerY, projectiles);
        break;
      case "singularity":
        this.updateSingularity(delta, playerX, playerY, projectiles);
        break;
    }
    this.drawBoss();
    this.drawBossHealth();
  }

  // ========== BOSS UPDATES ==========

  private updateContentFarm(delta: number, projectiles: Projectile[]) {
    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
      this.shootTimer = Math.max(600, 2000 - this.phase * 500);
      const aliveCells = this.cells.filter((c) => c.alive);
      if (aliveCells.length > 0) {
        const cell = aliveCells[Math.floor(Math.random() * aliveCells.length)];
        const cx = this.x + cell.localX,
          cy = this.y + cell.localY;
        const a = Math.atan2(this.playerY - cy, this.playerX - cx);
        projectiles.push(
          new Projectile(
            this.scene,
            cx,
            cy,
            Math.cos(a) * 120,
            Math.sin(a) * 120,
            6,
            0xff0033,
            2500,
            false
          )
        );
      }
    }
    let alive = 0;
    for (const cell of this.cells) {
      if (!cell.alive) {
        cell.regenTimer += delta;
        if (cell.regenTimer > 6000 - this.phase * 600) {
          cell.alive = true;
          cell.hp = 2;
          cell.regenTimer = 0;
        }
        continue;
      }
      alive++;
      cell.pulse += delta / 1000;
      const wx = this.x + cell.localX,
        wy = this.y + cell.localY;
      for (const p of projectiles) {
        if (!p.fromPlayer || p.hitIds.has(-cell.localX * 1000 - cell.localY))
          continue;
        if (Phaser.Math.Distance.Between(p.x, p.y, wx, wy) < this.cellSize) {
          cell.hp--;
          p.hitIds.add(-cell.localX * 1000 - cell.localY);
          if (!p.piercing) p.destroy();
          if (cell.hp <= 0) {
            cell.alive = false;
            cell.regenTimer = 0;
            this.takeDamage(25);
          }
          break;
        }
      }
    }
    if (alive === 0 && this.phase < 3) this.advancePhase();
    this.breathWave += delta / 800;
  }

  private updateBlackBox(
    delta: number,
    px: number,
    py: number,
    projectiles: Projectile[]
  ) {
    const hpPct = this.health / this.maxHealth;
    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
      this.shootTimer = Math.max(280, 880 - (1 - hpPct) * 560);
      const a = Math.atan2(py - this.y, px - this.x);
      projectiles.push(
        new Projectile(
          this.scene,
          this.x,
          this.y,
          Math.cos(a) * 220,
          Math.sin(a) * 220,
          12,
          0x8844ff,
          2200,
          false
        )
      );
      if (hpPct < 0.75) {
        const spread = 0.22;
        projectiles.push(
          new Projectile(
            this.scene,
            this.x,
            this.y,
            Math.cos(a + spread) * 200,
            Math.sin(a + spread) * 200,
            10,
            0x5500cc,
            2000,
            false
          )
        );
        projectiles.push(
          new Projectile(
            this.scene,
            this.x,
            this.y,
            Math.cos(a - spread) * 200,
            Math.sin(a - spread) * 200,
            10,
            0x5500cc,
            2000,
            false
          )
        );
      }
      if (hpPct < 0.45) {
        const wide = 0.45;
        projectiles.push(
          new Projectile(
            this.scene,
            this.x,
            this.y,
            Math.cos(a + wide) * 180,
            Math.sin(a + wide) * 180,
            9,
            0x4400aa,
            1800,
            false
          )
        );
        projectiles.push(
          new Projectile(
            this.scene,
            this.x,
            this.y,
            Math.cos(a - wide) * 180,
            Math.sin(a - wide) * 180,
            9,
            0x4400aa,
            1800,
            false
          )
        );
      }
      if (hpPct < 0.2) {
        for (let i = 0; i < 8; i++) {
          const sa = (i / 8) * Math.PI * 2;
          projectiles.push(
            new Projectile(
              this.scene,
              this.x,
              this.y,
              Math.cos(sa) * 140,
              Math.sin(sa) * 140,
              7,
              0x3300aa,
              1600,
              false
            )
          );
        }
      }
    }
    this.tendrilTimer -= delta;
    this.distortRadius = 70 + Math.sin(this.breathPhase * 0.8) * 10;
    const tendrilRate = Math.max(200, 450 - (1 - hpPct) * 300);
    if (this.tendrilTimer <= 0) {
      this.tendrilTimer = tendrilRate;
      const count = hpPct < 0.4 ? 4 : 2;
      for (let c = 0; c < count; c++) {
        this.tendrils.push({
          angle:
            Math.atan2(py - this.y, px - this.x) +
            (Math.random() - 0.5) * (0.6 + c * 0.4),
          length: 0,
          age: 0,
          maxAge: 900 + this.bossIdx * 50,
        });
      }
    }
    for (let i = this.tendrils.length - 1; i >= 0; i--) {
      const t = this.tendrils[i];
      t.age += delta;
      t.length = Math.min(180, t.age * 0.45);
      if (t.age > t.maxAge) this.tendrils.splice(i, 1);
    }
    const moveSpd = 85 * this.spdMult * (delta / 1000);
    const angle = Math.atan2(py - this.y, px - this.x);
    this.x += Math.cos(angle) * moveSpd;
    this.y += Math.sin(angle) * moveSpd;
    this.checkProjectileHits(projectiles);
  }

  private updateHallucinator(
    delta: number,
    px: number,
    py: number,
    projectiles: Projectile[]
  ) {
    this.cloneTimer += delta;
    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
      this.shootTimer = Math.max(400, 1100 - this.phase * 240);
      const volleyCount = Math.min(this.clones.length, 1 + this.phase);
      const indices = [...Array(this.clones.length).keys()];
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      for (let v = 0; v < volleyCount; v++) {
        const shooter = this.clones[indices[v]];
        if (!shooter) continue;
        const a = Math.atan2(py - shooter.y, px - shooter.x);
        projectiles.push(
          new Projectile(
            this.scene,
            shooter.x,
            shooter.y,
            Math.cos(a) * 185,
            Math.sin(a) * 185,
            8,
            0x7700ff,
            2200,
            false
          )
        );
        if (this.phase >= 3) {
          projectiles.push(
            new Projectile(
              this.scene,
              shooter.x,
              shooter.y,
              Math.cos(a + 0.2) * 170,
              Math.sin(a + 0.2) * 170,
              6,
              0x5500cc,
              2000,
              false
            )
          );
        }
      }
    }
    const moveSpd = (90 + this.phase * 20) * this.spdMult;
    for (const clone of this.clones) {
      const angle = Math.atan2(py - clone.y, px - clone.x);
      const spd = (clone.real ? moveSpd : moveSpd * 0.9) * (delta / 1000);
      clone.x += Math.cos(angle) * spd;
      clone.y += Math.sin(angle) * spd;
      clone.alpha =
        0.5 + Math.sin(this.lifetime * 0.003 + (clone.real ? 0 : 2)) * 0.3;
    }
    const real = this.clones.find((c) => c.real);
    if (real) {
      this.x = real.x;
      this.y = real.y;
    }
    this.checkProjectileHits(projectiles);
  }

  private updateAlignment(
    delta: number,
    px: number,
    py: number,
    projectiles: Projectile[]
  ) {
    if (this.apTransitionTimer > 0) {
      this.apTransitionTimer -= delta;
      for (let i = 0; i < this.apSpikes.length; i++)
        this.apSpikes[i] = Math.min(1, this.apSpikes[i] + delta / 600);
    }
    if (!this.apFriendly) {
      for (let i = 0; i < this.apSpikes.length; i++)
        this.apSpikes[i] = 0.6 + Math.sin(this.breathPhase * 3.5 + i) * 0.4;
      this.shootTimer -= delta;
      if (this.shootTimer <= 0) {
        this.shootTimer = 680;
        const count = 14 + Math.floor((1 - this.health / this.maxHealth) * 14);
        for (let i = 0; i < count; i++) {
          const sa = (i / count) * Math.PI * 2 + this.breathPhase;
          const spd = 180 + (1 - this.health / this.maxHealth) * 40;
          projectiles.push(
            new Projectile(
              this.scene,
              this.x,
              this.y,
              Math.cos(sa) * spd,
              Math.sin(sa) * spd,
              14,
              0xff0033,
              2200,
              false
            )
          );
        }
      }
    }
    const angle = Math.atan2(py - this.y, px - this.x);
    const spd = (this.apFriendly ? 25 : 150 * this.spdMult) * (delta / 1000);
    this.x += Math.cos(angle) * spd;
    this.y += Math.sin(angle) * spd;
    this.checkProjectileHits(projectiles);
  }

  private updateOverfit(
    delta: number,
    px: number,
    py: number,
    projectiles: Projectile[]
  ) {
    this.oePatternPhase += delta / 1000;
    const shieldSpeed = (1.8 + (this.phase === 2 ? 1.2 : 0)) * this.spdMult;
    this.oeShieldAngle += (delta / 1000) * shieldSpeed;
    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
      this.shootTimer = this.phase === 2 ? 960 : 1440;
      const count = 3 + (this.phase === 2 ? 2 : 0);
      for (let i = 0; i < count; i++) {
        const sa = this.oePatternPhase + (i / count) * Math.PI * 2;
        projectiles.push(
          new Projectile(
            this.scene,
            this.x,
            this.y,
            Math.cos(sa) * 155,
            Math.sin(sa) * 155,
            7,
            0xff0080,
            2200,
            false
          )
        );
      }
    }
    const angle = Math.atan2(py - this.y, px - this.x);
    const moveSpd = (70 + (this.phase === 2 ? 30 : 0)) * this.spdMult;
    this.x += Math.cos(angle) * moveSpd * (delta / 1000);
    this.y += Math.sin(angle) * moveSpd * (delta / 1000);

    const shieldArc = this.phase === 2 ? 1.3 : 1.0;
    for (const p of projectiles) {
      if (!p.fromPlayer) continue;
      const d = Phaser.Math.Distance.Between(p.x, p.y, this.x, this.y);
      const pAngle = Math.atan2(p.y - this.y, p.x - this.x);
      let diff = pAngle - this.oeShieldAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (d < this.radius + 15) {
        if (Math.abs(diff) < shieldArc) {
          if (!p.piercing) p.destroy();
        } else {
          this.takeDamage(p.damage);
          if (!p.piercing) p.destroy();
        }
      }
    }
  }

  private updatePromptInjector(
    delta: number,
    px: number,
    py: number,
    projectiles: Projectile[]
  ) {
    this.piGlitchTimer -= delta;
    const glitchInterval = Math.max(
      1500,
      3500 - this.phase * 800 - (1 - this.health / this.maxHealth) * 1200
    );
    const glitchDuration = 1800 + this.phase * 600;
    if (this.piGlitchTimer <= 0) {
      this.piGlitchTimer = glitchInterval;
      this.piGlitchActive = true;
      this.scene.time.delayedCall(glitchDuration, () => {
        this.piGlitchActive = false;
      });
    }
    if (this.piGlitchActive) {
      this.shootTimer -= delta;
      if (this.shootTimer <= 0) {
        this.shootTimer = Math.max(120, 200 - this.phase * 24);
        const a =
          Math.atan2(py - this.y, px - this.x) + (Math.random() - 0.5) * 0.8;
        projectiles.push(
          new Projectile(
            this.scene,
            this.x,
            this.y,
            Math.cos(a) * 230,
            Math.sin(a) * 230,
            8,
            0xff0066,
            2000,
            false
          )
        );
        if (this.phase >= 3) {
          projectiles.push(
            new Projectile(
              this.scene,
              this.x,
              this.y,
              Math.cos(a + 0.4) * 200,
              Math.sin(a + 0.4) * 200,
              6,
              0xff0066,
              1800,
              false
            )
          );
        }
      }
    }
    const moveSpd = (80 + this.phase * 18) * this.spdMult;
    const angle = Math.atan2(py - this.y, px - this.x);
    this.x += Math.cos(angle) * moveSpd * (delta / 1000);
    this.y += Math.sin(angle) * moveSpd * (delta / 1000);
    this.checkProjectileHits(projectiles);
  }

  private updateSingularity(
    delta: number,
    px: number,
    py: number,
    projectiles: Projectile[]
  ) {
    const phaseMult = 1 + (this.phase - 1) * 0.35;
    this.singSize = 2 + (1 - this.health / this.maxHealth) * 100;
    this.radius = this.singSize + 12;
    for (let i = 0; i < this.singRings.length; i++) {
      const ring = this.singRings[i];
      ring.gapAngle += ring.speed * phaseMult * (delta / 1000);
      ring.radius = this.singSize + 20 + i * 18;
      ring.gapSize = Math.max(0.15, 0.5 - this.phase * 0.1 - i * 0.05);
    }
    if (this.phase >= 2) {
      const angle = Math.atan2(py - this.y, px - this.x);
      const spd = (20 + this.phase * 20) * this.spdMult * (delta / 1000);
      this.x += Math.cos(angle) * spd;
      this.y += Math.sin(angle) * spd;
    }
    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
      this.shootTimer = Math.max(560, 1440 - this.phase * 280);
      const count = 8 + this.phase * 4;
      for (let i = 0; i < count; i++) {
        const sa = (i / count) * Math.PI * 2 + this.breathPhase;
        const spd = 140 + this.phase * 30;
        projectiles.push(
          new Projectile(
            this.scene,
            this.x,
            this.y,
            Math.cos(sa) * spd,
            Math.sin(sa) * spd,
            10,
            0xcc77ff,
            2800,
            false
          )
        );
      }
      if (this.phase >= 3) {
        const aimed = Math.atan2(py - this.y, px - this.x);
        for (let i = 0; i < 3; i++) {
          const spread = (i - 1) * 0.15;
          projectiles.push(
            new Projectile(
              this.scene,
              this.x,
              this.y,
              Math.cos(aimed + spread) * 220,
              Math.sin(aimed + spread) * 220,
              12,
              0xff44ff,
              2200,
              false
            )
          );
        }
      }
    }
    for (const p of projectiles) {
      if (!p.fromPlayer) continue;
      if (
        Phaser.Math.Distance.Between(p.x, p.y, this.x, this.y) <
        this.singSize + 15
      ) {
        this.takeDamage(p.damage);
        this.singAbsorbed++;
        if (!p.piercing) p.destroy();
      }
    }
  }

  private checkProjectileHits(projectiles: Projectile[]) {
    for (const p of projectiles) {
      if (!p.fromPlayer) continue;
      if (
        Phaser.Math.Distance.Between(p.x, p.y, this.x, this.y) <
        this.radius + 10
      ) {
        this.takeDamage(p.damage);
        if (!p.piercing) p.destroy();
      }
    }
  }

  // ========== DRAWING ==========

  private drawBoss() {
    this.gfx.clear();
    const f = this.hitFlash > 0;
    switch (this.bossType) {
      case "contentFarm":
        this.drawContentFarm(f);
        break;
      case "blackBox":
        this.drawBlackBox(f);
        break;
      case "hallucinator":
        this.drawHallucinator(f);
        break;
      case "alignmentProblem":
        this.drawAlignment(f);
        break;
      case "overfitEngine":
        this.drawOverfitEngine(f);
        break;
      case "promptInjector":
        this.drawPromptInjector(f);
        break;
      case "singularity":
        this.drawSingularity(f);
        break;
    }
  }

  private drawContentFarm(flash: boolean) {
    const bw = Math.sin(this.breathWave);
    for (const cell of this.cells) {
      if (!cell.alive) {
        this.gfx.fillStyle(0x18181b, 0.3);
        this.drawHex(cell.localX, cell.localY, this.cellSize * 0.8);
        continue;
      }
      const cb = Math.sin(cell.pulse + bw) * 0.08;
      const s = this.cellSize * (1 + cb);
      const spawning = cell.spawnCd < 800;
      this.gfx.fillStyle(
        flash ? 0xffffff : spawning ? 0xff0066 : 0xff0033,
        0.5 + (spawning ? Math.sin(cell.pulse * 8) * 0.3 : 0.2)
      );
      this.drawHex(cell.localX, cell.localY, s);
      this.gfx.lineStyle(1, flash ? 0xffffff : 0xff0033, 0.5);
      this.strokeHex(cell.localX, cell.localY, s);
    }
  }

  private drawBlackBox(flash: boolean) {
    const s = 45;
    this.gfx.fillStyle(flash ? 0x220044 : 0x020204, 1);
    this.gfx.fillRect(-s, -s, s * 2, s * 2);
    this.gfx.lineStyle(1, 0x5500cc, 0.4);
    this.gfx.strokeRect(-s, -s, s * 2, s * 2);
    for (const t of this.tendrils) {
      const p = t.age / t.maxAge;
      this.gfx.lineStyle(2.5, 0xaa77ff, 0.7 * (1 - p));
      this.gfx.beginPath();
      this.gfx.moveTo(Math.cos(t.angle) * s, Math.sin(t.angle) * s);
      this.gfx.lineTo(
        Math.cos(t.angle + 0.15) * (s + t.length * 0.5),
        Math.sin(t.angle + 0.15) * (s + t.length * 0.5)
      );
      this.gfx.lineTo(
        Math.cos(t.angle) * (s + t.length),
        Math.sin(t.angle) * (s + t.length)
      );
      this.gfx.strokePath();
    }
    this.gfx.lineStyle(1, 0x5500cc, 0.15);
    for (let i = 0; i < 6; i++)
      this.gfx.strokeCircle(0, 0, this.distortRadius + i * 3);
  }

  private drawHallucinator(flash: boolean) {
    for (const clone of this.clones) {
      const rx = clone.x - this.x,
        ry = clone.y - this.y;
      const c = flash && clone.real ? 0xffffff : 0x7700ff;
      this.gfx.fillStyle(c, clone.alpha * 0.25);
      this.gfx.fillCircle(rx, ry, 32);
      this.gfx.fillStyle(c, clone.alpha * 0.75);
      const verts =
        6 +
        Math.floor(Math.sin(this.lifetime * 0.002 + (clone.real ? 0 : 3)) * 2);
      this.gfx.beginPath();
      for (let i = 0; i < verts; i++) {
        const a = (i / verts) * Math.PI * 2 + this.breathPhase;
        const r = 22 + Math.sin(this.breathPhase * 2 + i) * 5;
        if (i === 0)
          this.gfx.moveTo(rx + Math.cos(a) * r, ry + Math.sin(a) * r);
        else this.gfx.lineTo(rx + Math.cos(a) * r, ry + Math.sin(a) * r);
      }
      this.gfx.closePath();
      this.gfx.fillPath();
      this.gfx.fillStyle(0xffffff, clone.alpha * 0.5);
      this.gfx.fillCircle(rx, ry, 6);
    }
  }

  private drawAlignment(flash: boolean) {
    const r = 38;
    const bp = this.breathPhase;

    if (this.apFriendly) {
      this.gfx.fillStyle(flash ? 0xffffff : 0x080e1a, 0.92);
      this.gfx.fillCircle(0, 0, r);

      // inner lattice — rotating hexagram lines connecting opposite vertices
      this.gfx.lineStyle(1, 0x00ffee, 0.12 + Math.sin(bp) * 0.04);
      for (let i = 0; i < 6; i++) {
        const a1 = (i / 6) * Math.PI * 2 + bp * 0.25;
        const a2 = ((i + 2) / 6) * Math.PI * 2 + bp * 0.25;
        this.gfx.beginPath();
        this.gfx.moveTo(Math.cos(a1) * r * 0.78, Math.sin(a1) * r * 0.78);
        this.gfx.lineTo(Math.cos(a2) * r * 0.78, Math.sin(a2) * r * 0.78);
        this.gfx.strokePath();
      }

      // three concentric orbital rings with nodes
      for (let ring = 0; ring < 3; ring++) {
        const ringR = r * 0.35 + ring * r * 0.25;
        this.gfx.lineStyle(
          1,
          0x00ffee,
          0.14 + Math.sin(bp + ring * 1.2) * 0.06
        );
        this.gfx.strokeCircle(0, 0, ringR);

        const count = 3 + ring;
        const dir = ring % 2 === 0 ? 1 : -1;
        const speed = dir * (0.7 - ring * 0.12);
        for (let n = 0; n < count; n++) {
          const na = (n / count) * Math.PI * 2 + bp * speed;
          const nx = Math.cos(na) * ringR;
          const ny = Math.sin(na) * ringR;
          this.gfx.fillStyle(
            0x00ffee,
            0.55 + Math.sin(bp * 2 + n + ring) * 0.25
          );
          this.gfx.fillCircle(nx, ny, 2.5 - ring * 0.3);
        }
      }

      // faint radial spokes connecting core to boundary
      this.gfx.lineStyle(1, 0x00ffee, 0.06);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + bp * 0.15;
        this.gfx.beginPath();
        this.gfx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
        this.gfx.lineTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92);
        this.gfx.strokePath();
      }

      // outer boundary
      this.gfx.lineStyle(1.5, 0x00ffee, 0.45 + Math.sin(bp) * 0.15);
      this.gfx.strokeCircle(0, 0, r + 3);

      // central core
      this.gfx.fillStyle(0x00ffee, 0.35 + Math.sin(bp * 1.5) * 0.15);
      this.gfx.fillCircle(0, 0, 5);
    } else {
      const jit =
        this.apTransitionTimer > 0 ? (this.apTransitionTimer / 1000) * 5 : 0;
      this.gfx.fillStyle(flash ? 0xffffff : 0x0f0f10, 0.9);
      this.gfx.beginPath();
      for (let i = 0; i < this.apSpikes.length; i++) {
        const a = (i / this.apSpikes.length) * Math.PI * 2;
        const sr = r + this.apSpikes[i] * 32;
        const px = Math.cos(a) * sr + (Math.random() - 0.5) * jit;
        const py = Math.sin(a) * sr + (Math.random() - 0.5) * jit;
        if (i === 0) this.gfx.moveTo(px, py);
        else this.gfx.lineTo(px, py);
      }
      this.gfx.closePath();
      this.gfx.fillPath();
      this.gfx.lineStyle(2, 0xff0033, 0.8);
      this.gfx.strokePath();
      this.gfx.fillStyle(0xff0033, Math.sin(bp * 4) * 0.3 + 0.5);
      this.gfx.fillCircle(0, 0, r * 0.4);
    }
  }

  private drawOverfitEngine(flash: boolean) {
    const c = flash ? 0xffffff : 0xff0080;
    this.gfx.lineStyle(2, c, 0.8);
    const ringCount = this.phase === 2 ? 4 : 3;
    for (let i = 0; i < ringCount; i++) {
      const r = 18 + i * 11;
      const startAngle =
        this.oePatternPhase * (i % 2 === 0 ? 1 : -1) * (1 + i * 0.3);
      this.gfx.beginPath();
      for (let j = 0; j < 60; j++) {
        const a = startAngle + (j / 60) * Math.PI * 2;
        const rr = r + Math.sin(a * (4 + i) + this.oePatternPhase * 3) * 5;
        if (j === 0) this.gfx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else this.gfx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      this.gfx.closePath();
      this.gfx.strokePath();
    }
    this.gfx.lineStyle(5, 0xff3399, 0.6);
    this.gfx.beginPath();
    for (let j = 0; j < 20; j++) {
      const a = this.oeShieldAngle - 1.0 + (j / 19) * 2.0;
      const rr = this.radius + 6;
      if (j === 0) this.gfx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else this.gfx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    this.gfx.strokePath();
    this.gfx.fillStyle(c, 0.5);
    this.gfx.fillCircle(0, 0, 14);
  }

  private drawPromptInjector(flash: boolean) {
    const c = flash ? 0xffffff : 0xff0066;
    const glitch = this.piGlitchActive;
    const jx = glitch ? (Math.random() - 0.5) * 10 : 0;
    const jy = glitch ? (Math.random() - 0.5) * 10 : 0;
    this.gfx.fillStyle(c, 0.12);
    this.gfx.fillCircle(jx, jy, 42);
    this.gfx.lineStyle(2.5, c, 0.85);
    this.gfx.strokeCircle(jx, jy, 32);
    if (this.phase >= 2) {
      this.gfx.lineStyle(1, c, 0.4);
      this.gfx.strokeCircle(jx, jy, 42);
    }
    if (this.phase >= 3) {
      this.gfx.lineStyle(1, 0xffffff, 0.25);
      this.gfx.strokeCircle(jx, jy, 50);
    }
    this.gfx.fillStyle(0xffffff, 0.95);
    this.gfx.beginPath();
    this.gfx.moveTo(-9 + jx, -11 + jy);
    this.gfx.lineTo(9 + jx, jy);
    this.gfx.lineTo(-9 + jx, 11 + jy);
    this.gfx.closePath();
    this.gfx.fillPath();
    if (glitch) {
      for (let i = 0; i < 3; i++) {
        this.gfx.fillStyle(0xff0066, 0.25);
        this.gfx.fillRect(
          -55 + (Math.random() - 0.5) * 110,
          -3 + (Math.random() - 0.5) * 70,
          110,
          3
        );
      }
    }
  }

  private drawSingularity(flash: boolean) {
    const t = this.breathPhase;
    const coreR = this.singSize;
    const absorbed = Math.min(1, this.singAbsorbed * 0.003);

    for (let i = 5; i >= 0; i--) {
      const r = coreR + 20 + i * 10 + Math.sin(t * 0.5 + i * 0.4) * 3;
      const a = 0.06 - i * 0.008 + absorbed * 0.025;
      if (a > 0) {
        this.gfx.fillStyle(0x7733aa, a);
        this.gfx.fillCircle(0, 0, r);
      }
    }

    const rimPulse = 0.3 + Math.sin(t * 1.8) * 0.1;
    this.gfx.lineStyle(2.5, 0xbb66ee, rimPulse);
    this.gfx.strokeCircle(0, 0, coreR + 1.5);
    this.gfx.lineStyle(1, 0xddaaff, rimPulse * 0.4);
    this.gfx.strokeCircle(0, 0, coreR + 5);

    this.gfx.fillStyle(flash ? 0x1a0033 : 0x030010, 1);
    this.gfx.fillCircle(0, 0, coreR);

    const hx = Math.sin(t * 2) * coreR * 0.25;
    const hy = Math.cos(t * 2.7) * coreR * 0.25;
    this.gfx.fillStyle(0xaa66dd, 0.18 + absorbed * 0.08);
    this.gfx.fillCircle(hx, hy, coreR * 0.35);
    this.gfx.fillStyle(0xddaaff, 0.08);
    this.gfx.fillCircle(hx * 0.4, hy * 0.4, coreR * 0.15);

    for (let ri = 0; ri < this.singRings.length; ri++) {
      const ring = this.singRings[ri];
      const alpha = 0.5 - ri * 0.05 + Math.sin(t * 1.5 + ri * 1.2) * 0.08;
      const weight = 2.5 - ri * 0.15;

      this.gfx.lineStyle(
        Math.max(1, weight),
        flash ? 0xffffff : 0xcc77ff,
        Math.max(0.12, alpha)
      );

      const arcLen = Math.PI * 2 - ring.gapSize;
      const arcStart = ring.gapAngle + ring.gapSize;

      this.gfx.beginPath();
      this.gfx.arc(0, 0, ring.radius, arcStart, arcStart + arcLen, false, 0);
      this.gfx.strokePath();
    }

    if (this.phase >= 3) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 1.5;
        const inner = coreR + 3;
        const outer = coreR + 13 + Math.sin(t * 3 + i * 0.8) * 5;
        this.gfx.lineStyle(1, 0xddaaff, 0.15 + Math.sin(t * 3 + i) * 0.08);
        this.gfx.beginPath();
        this.gfx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        this.gfx.lineTo(
          Math.cos(a + 0.12) * outer,
          Math.sin(a + 0.12) * outer
        );
        this.gfx.strokePath();
      }
    }
  }

  // ========== CINEMATIC DEATH ==========

  private drawBossDeath() {
    this.gfx.clear();
    this.hpGfx.clear();
    const p = this.deathProgress;
    const c = this.bossColor;

    for (let i = 0; i < 4; i++) {
      const ringP = Math.max(0, p - i * 0.12);
      if (ringP <= 0) continue;
      const ringR = ringP * 250;
      const ringA = 0.7 * (1 - ringP);
      this.gfx.lineStyle(3.5 - i * 0.7, c, ringA);
      this.gfx.strokeCircle(0, 0, ringR);
    }

    const frags = 28;
    for (let i = 0; i < frags; i++) {
      const angle = (i / frags) * Math.PI * 2 + p * 2;
      const dist = p * 180 * (0.5 + (i % 3) * 0.25);
      const size = (5 - (i % 3)) * (1 - p);
      const fragA = 0.85 * (1 - p);
      this.gfx.fillStyle(
        i % 3 === 0 ? c : i % 3 === 1 ? 0xffffff : 0xff0080,
        fragA
      );
      const fx = Math.cos(angle) * dist,
        fy = Math.sin(angle) * dist;
      if (i % 3 === 0)
        this.gfx.fillTriangle(
          fx,
          fy - size,
          fx + size,
          fy + size,
          fx - size,
          fy + size
        );
      else if (i % 3 === 1)
        this.gfx.fillRect(fx - size / 2, fy - size / 2, size, size);
      else this.gfx.fillCircle(fx, fy, size * 0.7);
    }

    if (p < 0.35) {
      const flashA = (1 - p / 0.35) * 0.85;
      this.gfx.fillStyle(0xffffff, flashA);
      this.gfx.fillCircle(0, 0, 70 * (1 - p));
    }
    this.setAlpha(1 - p * 0.5);
  }

  // ========== HELPERS ==========

  private drawHex(cx: number, cy: number, size: number) {
    this.gfx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      if (i === 0)
        this.gfx.moveTo(cx + size * Math.cos(a), cy + size * Math.sin(a));
      else this.gfx.lineTo(cx + size * Math.cos(a), cy + size * Math.sin(a));
    }
    this.gfx.closePath();
    this.gfx.fillPath();
  }

  private strokeHex(cx: number, cy: number, size: number) {
    this.gfx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      if (i === 0)
        this.gfx.moveTo(cx + size * Math.cos(a), cy + size * Math.sin(a));
      else this.gfx.lineTo(cx + size * Math.cos(a), cy + size * Math.sin(a));
    }
    this.gfx.closePath();
    this.gfx.strokePath();
  }

  private drawBossHealth() {
    this.hpGfx.clear();
    if (this.isDead) return;
    const w = 120,
      pct = this.health / this.maxHealth;
    const yOff = -this.radius - 24;
    this.hpGfx.fillStyle(0x18181b, 0.85);
    this.hpGfx.fillRect(-w / 2 - 1, yOff - 1, w + 2, 7);
    this.hpGfx.fillStyle(this.bossColor, 0.9);
    this.hpGfx.fillRect(-w / 2, yOff, w * pct, 5);
    this.hpGfx.lineStyle(1, this.bossColor, 0.5);
    this.hpGfx.strokeRect(-w / 2 - 1, yOff - 1, w + 2, 7);
  }
}
