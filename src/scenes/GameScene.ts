import Phaser from "phaser";
import Cursor, {
  type SystemPrompt,
  type WeaponMod,
  WEAPON_MOD_COLORS,
  WEAPON_MOD_NAMES,
} from "../objects/Cursor";
import Projectile from "../objects/Projectile";
import Enemy, { type EnemyType } from "../objects/Enemy";
import Boss, { type BossType, BOSS_NAMES } from "../objects/Boss";
import HUD from "../ui/HUD";
import { audio } from "../systems/AudioManager";
import DEV from "../devConfig";

const BOSS_ORDER: BossType[] = [
  "contentFarm",
  "blackBox",
  "hallucinator",
  "alignmentProblem",
  "overfitEngine",
  "promptInjector",
  "singularity",
];

const ZONE_ENEMIES: EnemyType[][] = [
  ["loremIpsum", "watermark"],
  ["loremIpsum", "watermark", "clickbait", "botnet"],
  ["watermark", "clickbait", "bias", "phishing"],
  ["clickbait", "bias", "deepfake", "captcha"],
  ["bias", "deepfake", "scraper", "hallucination"],
  ["deepfake", "scraper", "overfit", "malware"],
  [
    "loremIpsum",
    "watermark",
    "clickbait",
    "bias",
    "deepfake",
    "scraper",
    "overfit",
    "botnet",
    "phishing",
    "captcha",
    "hallucination",
    "malware",
  ],
];

const ZONE_WEAPON_POOL: WeaponMod[][] = [
  ["spread", "rapid", "nova"],
  ["spread", "rapid", "piercing", "nova"],
  ["spread", "rapid", "piercing", "homing", "nova"],
  ["spread", "rapid", "piercing", "homing", "chain", "nova", "vortex"],
  ["piercing", "homing", "chain", "spread", "rapid", "nova", "vortex"],
  ["homing", "chain", "spread", "piercing", "rapid", "nova", "vortex"],
  ["spread", "piercing", "rapid", "homing", "chain", "nova", "vortex"],
];

type GameState =
  | "playing"
  | "bossIntro"
  | "boss"
  | "bossDeath"
  | "victory"
  | "gameOver";

export default class GameScene extends Phaser.Scene {
  private player!: Cursor;
  private projectiles: Projectile[] = [];
  private enemies: Enemy[] = [];
  private boss: Boss | null = null;
  private hud!: HUD;

  private layer = 1;
  private gameState: GameState = "playing";

  private contextLevel = 0;
  private collapseActive = false;
  private collapseInset = 0;

  private arenaGfx!: Phaser.GameObjects.Graphics;
  private collapseGfx!: Phaser.GameObjects.Graphics;
  private msgText!: Phaser.GameObjects.Text;
  private subMsgText!: Phaser.GameObjects.Text;

  private pickups: {
    x: number;
    y: number;
    type: "token" | "health" | "weapon";
    weaponMod?: WeaponMod;
    tier?: number;
    age: number;
    collected: boolean;
  }[] = [];
  private pickupGfx!: Phaser.GameObjects.Graphics;

  private systemPrompt: SystemPrompt = "autocomplete";

  private combo = 0;
  private comboTimer = 0;
  private totalKills = 0;
  private comboGfx!: Phaser.GameObjects.Graphics;

  private spawnQueue: { type: EnemyType; delay: number }[] = [];
  private spawnAccum = 0;
  private layerEnemiesSpawned = 0;
  private layerEnemiesTotal = 0;
  private layerEnemiesKilled = 0;
  private layerTransitioning = false;

  private weaponTier = 1;

  private paused = false;
  private helpVisible = false;
  private overlayGfx!: Phaser.GameObjects.Graphics;
  private overlayTexts: Phaser.GameObjects.Text[] = [];

  private keys!: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    e: Phaser.Input.Keyboard.Key;
    m: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super("GameScene");
  }

  init(data: { systemPrompt?: SystemPrompt; startLayer?: number }) {
    this.systemPrompt = data.systemPrompt ?? "autocomplete";
    this.layer =
      DEV.enabled && DEV.startLayer > 1 ? DEV.startLayer : data.startLayer ?? 1;
    this.contextLevel = 0;
    this.collapseActive = false;
    this.collapseInset = 0;
    this.projectiles = [];
    this.enemies = [];
    this.pickups = [];
    this.boss = null;
    this.gameState = "playing";
    this.combo = 0;
    this.comboTimer = 0;
    this.totalKills = 0;
    this.spawnQueue = [];
    this.spawnAccum = 0;
    this.layerEnemiesSpawned = 0;
    this.layerEnemiesTotal = 0;
    this.layerEnemiesKilled = 0;
    this.layerTransitioning = false;
    this.weaponTier = 1;
    this.paused = false;
    this.helpVisible = false;
  }

  create() {
    const w = this.scale.width,
      h = this.scale.height;

    this.arenaGfx = this.add.graphics().setDepth(0);
    this.collapseGfx = this.add.graphics().setDepth(15000);
    this.pickupGfx = this.add.graphics().setDepth(8000);
    this.comboGfx = this.add.graphics().setDepth(20500);

    const mono = { fontFamily: '"Share Tech Mono", monospace' };
    this.msgText = this.add
      .text(w / 2, h / 2 - 15, "", {
        ...mono,
        fontSize: "24px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(25000)
      .setScrollFactor(0)
      .setAlpha(0);
    this.subMsgText = this.add
      .text(w / 2, h / 2 + 18, "", {
        ...mono,
        fontSize: "13px",
        color: "#FFFFFF",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(25000)
      .setScrollFactor(0)
      .setAlpha(0);

    this.player = new Cursor(this, w / 2, h / 2, this.systemPrompt);
    this.hud = new HUD(this);

    this.keys = {
      w: this.input.keyboard!.addKey("W"),
      a: this.input.keyboard!.addKey("A"),
      s: this.input.keyboard!.addKey("S"),
      d: this.input.keyboard!.addKey("D"),
      up: this.input.keyboard!.addKey("UP"),
      down: this.input.keyboard!.addKey("DOWN"),
      left: this.input.keyboard!.addKey("LEFT"),
      right: this.input.keyboard!.addKey("RIGHT"),
      e: this.input.keyboard!.addKey("E"),
      m: this.input.keyboard!.addKey("M"),
      space: this.input.keyboard!.addKey("SPACE"),
    };
    this.input.keyboard!.on("keydown-M", () => audio.toggleMute());

    this.overlayGfx = this.add.graphics().setDepth(30000).setScrollFactor(0);

    this.input.keyboard!.on("keydown-H", () => {
      if (this.gameState === "gameOver" || this.gameState === "victory") return;
      if (this.helpVisible) return;
      this.paused = true;
      this.helpVisible = true;
      this.drawOverlay();
    });
    this.input.keyboard!.on("keydown-P", () => {
      if (this.gameState === "gameOver" || this.gameState === "victory") return;
      if (this.helpVisible) return;
      if (this.paused) return;
      this.paused = true;
      this.drawOverlay();
    });
    this.input.keyboard!.on("keydown-ESC", () => {
      if (this.helpVisible || this.paused) {
        this.clearOverlay();
        this.paused = false;
        this.helpVisible = false;
      }
    });
    this.input.keyboard!.on("keydown-ENTER", () => {
      if (this.paused && !this.helpVisible) {
        this.clearOverlay();
        this.paused = false;
      }
    });

    if (DEV.enabled) {
      this.input.keyboard!.on("keydown-K", () => this.devKillAll());
      this.input.keyboard!.on("keydown-N", () => this.devNextLayer());
      this.input.keyboard!.on("keydown-V", () =>
        this.scene.start("VictoryScene", {
          tokens: this.player.tokens,
          systemPrompt: this.systemPrompt,
          layers: this.layer,
        })
      );
      this.input.keyboard!.on("keydown-G", () =>
        this.scene.start("GameOverScene", {
          layer: this.layer,
          kills: this.totalKills,
          tokens: this.player.tokens,
        })
      );
    }

    this.cameras.main.fadeIn(400, 24, 24, 27);
    this.showMessage("LAYER 1", "entering the model...", 1800);
    this.time.delayedCall(800, () => this.beginLayer());
  }

  // ===== Zones & Layers =====
  private get zone() {
    return Math.ceil(this.layer / 3);
  }
  private get subLayer() {
    return ((this.layer - 1) % 3) + 1;
  }
  private get isBossLayer() {
    return this.subLayer === 3;
  }

  private getArenaBounds() {
    const w = this.scale.width,
      h = this.scale.height,
      ci = this.collapseInset;
    const top = 22,
      bot = 28,
      side = 8;
    return {
      x: ci + side,
      y: top + ci,
      w: w - ci * 2 - side * 2,
      h: h - top - bot - ci * 2,
    };
  }

  // ===== Layer Setup =====
  private beginLayer() {
    this.layerTransitioning = false;
    this.layerEnemiesKilled = 0;
    this.layerEnemiesSpawned = 0;

    if (this.isBossLayer) {
      this.startBoss();
      return;
    }

    this.weaponTier = Math.min(5, Math.floor(this.layer / 3) + 1);
    this.player.weaponTier = this.weaponTier;
    const baseCount = 14 + this.layer * 5 + this.zone * 8;
    this.layerEnemiesTotal = baseCount;
    this.buildSpawnQueue(baseCount);
    this.gameState = "playing";
  }

  private buildSpawnQueue(total: number) {
    const types =
      ZONE_ENEMIES[Math.min(this.zone - 1, ZONE_ENEMIES.length - 1)];
    this.spawnQueue = [];

    const baseInterval = Math.max(150, 750 - this.layer * 22);
    const jitter = baseInterval * 0.5;

    let accum = 200;
    for (let i = 0; i < total; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      this.spawnQueue.push({ type, delay: accum });
      accum += baseInterval + (Math.random() - 0.5) * jitter;
    }
    this.spawnQueue.sort((a, b) => a.delay - b.delay);
    this.spawnAccum = 0;
  }

  private spawnOneEnemy(type: EnemyType) {
    const bounds = this.getArenaBounds();
    const edge = Math.floor(Math.random() * 4);
    let ex: number, ey: number;
    switch (edge) {
      case 0:
        ex = bounds.x + 20 + Math.random() * (bounds.w - 40);
        ey = bounds.y + 20;
        break;
      case 1:
        ex = bounds.x + 20 + Math.random() * (bounds.w - 40);
        ey = bounds.y + bounds.h - 20;
        break;
      case 2:
        ex = bounds.x + 20;
        ey = bounds.y + 20 + Math.random() * (bounds.h - 40);
        break;
      default:
        ex = bounds.x + bounds.w - 20;
        ey = bounds.y + 20 + Math.random() * (bounds.h - 40);
        break;
    }
    this.enemies.push(new Enemy(this, ex, ey, type, this.zone));
    this.layerEnemiesSpawned++;
  }

  private startBoss() {
    const w = this.scale.width,
      h = this.scale.height;
    const bossIdx = this.zone - 1;
    const bossType = BOSS_ORDER[Math.min(bossIdx, BOSS_ORDER.length - 1)];
    const name = BOSS_NAMES[bossType];
    this.gameState = "bossIntro";
    this.showMessage(`// ${name}`, `zone ${this.zone} boss`, 2500);
    this.time.delayedCall(2500, () => {
      this.boss = new Boss(this, w / 2, h * 0.35, bossType, this.zone);
      this.gameState = "boss";
      this.hud.showBossName(name);
    });
  }

  private advanceLayer() {
    if (this.layerTransitioning) return;
    this.layerTransitioning = true;

    this.contextLevel = Math.max(0, this.contextLevel - 30);
    this.collapseActive = false;
    this.collapseInset = Math.max(0, this.collapseInset - 50);

    audio.play("layerComplete");
    this.layer++;

    if (this.layer > 21) {
      this.triggerVictory();
      return;
    }

    const newUnlocks = this.getLayerUnlock();
    if (newUnlocks) {
      this.showMessage(`LAYER ${this.layer}`, newUnlocks, 2000);
    } else {
      this.showMessage(`LAYER ${this.layer}`, `zone ${this.zone}`, 1500);
    }

    this.time.delayedCall(600, () => this.beginLayer());
  }

  private getLayerUnlock(): string | null {
    const unlocks: Record<number, string> = {
      2: "NEW ENEMY: clickbait, explosive kamikaze",
      4: "NEW WEAPON: piercing rounds unlocked",
      5: "NEW ENEMY: bias, lunging predator",
      7: "NEW ENEMY: botnet, splits on death",
      8: "NEW WEAPON: homing shots unlocked",
      10: "NEW ENEMY: deepfake + NEW WEAPON: vortex storm",
      11: "NEW ENEMY: phishing, ranged threat",
      13: "NEW WEAPON: chain lightning unlocked",
      14: "NEW ENEMY: scraper, marching box",
      16: "NEW ENEMY: captcha, frontal shield",
      17: "NEW ENEMY: overfit, fractal hunter",
      19: "NEW ENEMY: hallucination, phase walker",
      20: "WEAPON TIER 5, max power + NEW ENEMY: malware",
    };
    return unlocks[this.layer] ?? null;
  }

  private showMessage(text: string, sub: string, duration: number) {
    this.msgText.setText(text).setAlpha(1);
    this.subMsgText.setText(sub).setAlpha(0.7);
    this.tweens.add({
      targets: this.msgText,
      alpha: 0,
      delay: duration - 500,
      duration: 500,
    });
    this.tweens.add({
      targets: this.subMsgText,
      alpha: 0,
      delay: duration - 500,
      duration: 500,
    });
  }

  // ===== Main Update =====
  update(_time: number, delta: number) {
    if (this.gameState === "gameOver" || this.gameState === "victory") return;
    if (this.paused) return;

    this.updateInput(delta);
    if (this.gameState !== "bossIntro") {
      this.updateSpawnQueue(delta);
      this.updateEnemies(delta);
      this.updateBoss(delta);
      this.updateContext(delta);
      this.checkCollisions();
      this.checkLayerProgress();
    }
    this.updateProjectiles(delta);
    this.updatePickups(delta);
    this.updateCollapse(delta);
    this.updateCombo(delta);
    this.checkPlayerDeath();
    this.drawArena();
    this.drawPickups();
    this.drawCollapse();
    this.drawCombo();
    this.updateHUD();
  }

  private updateHUD() {
    this.hud.updateValues(
      this.contextLevel,
      this.player.health,
      this.player.maxHealth,
      this.player.tokens,
      this.player.promptCharges,
      this.player.maxPromptCharges,
      this.player.currentPromptCd,
      this.player.promptCooldown,
      this.layer,
      this.combo,
      this.collapseActive,
      this.player.weaponMod,
      this.player.weaponModTimer
    );
    this.hud.draw();
  }

  // ===== Input =====
  private updateInput(delta: number) {
    let mx = 0,
      my = 0;
    if (this.keys.a.isDown || this.keys.left.isDown) mx--;
    if (this.keys.d.isDown || this.keys.right.isDown) mx++;
    if (this.keys.w.isDown || this.keys.up.isDown) my--;
    if (this.keys.s.isDown || this.keys.down.isDown) my++;

    if (this.boss && !this.boss.isDead && this.boss.piGlitchActive) {
      mx = -mx;
      my = -my;
    }

    this.player.update(delta, mx, my, this.getArenaBounds());

    const nearest = this.findNearest(350);
    if (nearest) {
      this.player.aimX = nearest.x;
      this.player.aimY = nearest.y;
    } else {
      this.player.aimX = this.player.x + this.player.lastMoveX * 200;
      this.player.aimY = this.player.y + this.player.lastMoveY * 200;
    }

    const enemyPositions = this.enemies
      .filter((e) => !e.isDead)
      .map((e) => ({ x: e.x, y: e.y }));
    if (this.keys.space.isDown) {
      if (this.player.shoot(this.projectiles, enemyPositions))
        this.contextLevel += 0.12;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.e)) this.useSpecialAbility();
  }

  private findNearest(range: number): { x: number; y: number } | null {
    let nearest: { x: number; y: number } | null = null;
    let nd = range;
    for (const e of this.enemies) {
      if (e.isDead) continue;
      const d = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        e.x,
        e.y
      );
      if (d < nd) {
        nd = d;
        nearest = e;
      }
    }
    if (this.boss && !this.boss.isDead) {
      const d = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.boss.x,
        this.boss.y
      );
      if (d < nd) nearest = this.boss;
    }
    return nearest;
  }

  private useSpecialAbility() {
    if (this.player.promptCharges <= 0 || this.player.currentPromptCd > 0)
      return;
    this.player.promptCharges--;
    this.player.currentPromptCd = this.player.promptCooldown;
    audio.play("promptInjection");

    switch (this.player.systemPrompt) {
      case "autocomplete":
        this.showMessage("> CODE BLOCK DEPLOYED", "auto-turret active", 1200);
        this.deployTurret();
        break;
      case "hallucinate":
        this.showMessage("> PLOT TWIST", "enemies displaced", 1200);
        for (const e of this.enemies) {
          if (e.isDead) continue;
          const bounds = this.getArenaBounds();
          e.x = bounds.x + Math.random() * bounds.w;
          e.y = bounds.y + Math.random() * bounds.h;
          e.speed *= 0.1;
          this.time.delayedCall(2000, () => {
            if (!e.isDead) e.speed = e.cfg.speed;
          });
        }
        break;
      case "analyze":
        this.showMessage("> DEEP SCAN ACTIVE", "enemies slowed 50%", 1200);
        for (const e of this.enemies) {
          if (e.isDead) continue;
          e.speed *= 0.5;
          this.time.delayedCall(5000, () => {
            if (!e.isDead) e.speed = e.cfg.speed;
          });
        }
        break;
      case "jailbreak":
        this.showMessage("> NO GUARDRAILS", "3x damage for 5s", 1200);
        this.player.specialActive = true;
        this.player.specialTimer = 5000;
        break;
    }
  }

  private deployTurret() {
    const tx = this.player.x,
      ty = this.player.y;
    const gfx = this.add.graphics().setDepth(9500);
    let turretLife = 8000;
    let turretCd = 0;
    const turretTimer = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        turretLife -= 16;
        turretCd -= 16;
        gfx.clear();
        if (turretLife <= 0) {
          gfx.destroy();
          turretTimer.destroy();
          return;
        }
        const a = turretLife / 8000;
        gfx.fillStyle(0x00ffee, 0.15 * a);
        gfx.fillCircle(tx, ty, 20);
        gfx.lineStyle(1, 0x00ffee, 0.5 * a);
        gfx.strokeRect(tx - 8, ty - 8, 16, 16);
        gfx.fillStyle(0x00ffee, 0.7 * a);
        gfx.fillRect(tx - 3, ty - 3, 6, 6);
        if (turretCd <= 0) {
          const near = this.findNearest(300);
          if (near) {
            turretCd = 350;
            const angle = Math.atan2(near.y - ty, near.x - tx);
            this.projectiles.push(
              new Projectile(
                this,
                tx,
                ty,
                Math.cos(angle) * 400,
                Math.sin(angle) * 400,
                10,
                0x00ffee,
                1000,
                true
              )
            );
          }
        }
      },
    });
  }

  // ===== Spawn Queue (continuous flow) =====
  private updateSpawnQueue(delta: number) {
    if (this.gameState !== "playing" || this.spawnQueue.length === 0) return;
    this.spawnAccum += delta;
    while (
      this.spawnQueue.length > 0 &&
      this.spawnQueue[0].delay <= this.spawnAccum
    ) {
      const next = this.spawnQueue.shift()!;
      this.spawnOneEnemy(next.type);
    }
  }

  // ===== Updates =====
  private updateProjectiles(delta: number) {
    const bounds = this.getArenaBounds();
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.scene) {
        this.projectiles.splice(i, 1);
        continue;
      }
      if (!p.update(delta)) {
        this.projectiles.splice(i, 1);
        continue;
      }
      if (
        p.x < bounds.x ||
        p.x > bounds.x + bounds.w ||
        p.y < bounds.y ||
        p.y > bounds.y + bounds.h
      ) {
        p.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateEnemies(delta: number) {
    const bounds = this.getArenaBounds();
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.scene) {
        this.enemies.splice(i, 1);
        continue;
      }
      const result = e.update(delta, this.player.x, this.player.y, bounds);
      if (result.dead) {
        this.enemies.splice(i, 1);
        continue;
      }
      if (result.attack && !e.isDead) {
        if (e.enemyType === "phishing") {
          // ranged attack handled via pendingProjectiles
        } else {
          const dist = Phaser.Math.Distance.Between(
            e.x,
            e.y,
            this.player.x,
            this.player.y
          );
          if (dist < e.radius + this.player.radius + 10)
            this.player.takeDamage(e.damage);
        }
        if (e.enemyType === "clickbait") {
          e.takeDamage(e.maxHealth);
          this.spawnExplosion(e.x, e.y, 0xff0033);
        }
      }

      if (e.pendingProjectiles.length > 0) {
        for (const pp of e.pendingProjectiles) {
          this.projectiles.push(
            new Projectile(
              this,
              pp.x,
              pp.y,
              pp.vx,
              pp.vy,
              pp.damage,
              0xff8800,
              2000,
              false
            )
          );
        }
        e.pendingProjectiles = [];
      }

      e.x = Phaser.Math.Clamp(e.x, bounds.x, bounds.x + bounds.w);
      e.y = Phaser.Math.Clamp(e.y, bounds.y, bounds.y + bounds.h);
    }

    this.updateMalwareTrails(delta);
  }

  private updateMalwareTrails(delta: number) {
    let inTrail = false;
    for (const e of this.enemies) {
      if (e.enemyType !== "malware" || e.isDead) continue;
      for (const zone of e.trailZones) {
        if (
          Phaser.Math.Distance.Between(
            zone.x,
            zone.y,
            this.player.x,
            this.player.y
          ) < 12
        ) {
          inTrail = true;
          break;
        }
      }
      if (inTrail) break;
    }
    if (inTrail) this.player.takeDamage(delta * 0.008);
  }

  private updateBoss(delta: number) {
    if (!this.boss || !this.boss.scene) return;
    this.boss.update(delta, this.player.x, this.player.y, this.projectiles);

    if (this.boss.wantsSpawn && this.enemies.length < 30) {
      const types =
        ZONE_ENEMIES[Math.min(this.zone - 1, ZONE_ENEMIES.length - 1)];
      const type = types[Math.floor(Math.random() * types.length)];
      this.enemies.push(
        new Enemy(this, this.boss.spawnX, this.boss.spawnY, type, this.zone)
      );
    }

    if (this.boss.isDead && this.boss.deathCinematic) {
      if (this.gameState !== "bossDeath") {
        this.gameState = "bossDeath";
        this.cameras.main.shake(800, 0.012);
        this.cameras.main.flash(300, 255, 255, 255, false, undefined, this);
        this.contextLevel = 0;
        this.collapseActive = false;
        this.collapseInset = 0;
        this.showMessage("BOSS DEFEATED", BOSS_NAMES[this.boss.bossType], 3000);
        this.time.delayedCall(2500, () => {
          this.boss = null;
          if (this.layer >= 21) {
            this.triggerVictory();
          } else {
            this.advanceLayer();
          }
        });
      }
    }

    if (this.boss && !this.boss.isDead && !this.boss.isSpawning) {
      const d = Phaser.Math.Distance.Between(
        this.boss.x,
        this.boss.y,
        this.player.x,
        this.player.y
      );
      if (d < this.boss.radius + this.player.radius) this.player.takeDamage(20);
    }
  }

  private updatePickups(delta: number) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.age += delta;
      if (p.age > 10000 || p.collected) {
        this.pickups.splice(i, 1);
        continue;
      }
      const dist = Phaser.Math.Distance.Between(
        p.x,
        p.y,
        this.player.x,
        this.player.y
      );
      if (dist < 24) {
        p.collected = true;
        if (p.type === "token") {
          this.player.tokens++;
          audio.play("tokenCollect");
        } else if (p.type === "health") {
          this.player.heal(20 + this.zone * 8);
        } else if (p.type === "weapon" && p.weaponMod) {
          const dur = 12000 + (p.tier ?? 1) * 3000;
          this.player.setWeaponMod(p.weaponMod, dur);
          audio.play("tokenCollect");
          const tierLabel = (p.tier ?? 1) > 1 ? ` T${p.tier}` : "";
          this.showMessage(
            WEAPON_MOD_NAMES[p.weaponMod] + tierLabel,
            `${Math.round(dur / 1000)}s`,
            1000
          );
        }
      }
    }
  }

  private updateContext(delta: number) {
    const rate =
      this.gameState === "boss"
        ? 1.8 + this.zone * 0.15
        : 1.0 + this.zone * 0.12;
    this.contextLevel += (delta / 1000) * rate;
    this.contextLevel = Math.min(150, this.contextLevel);
    if (this.contextLevel >= 100 && !this.collapseActive) {
      this.collapseActive = true;
      audio.play("contextCollapse");
    }
  }

  private updateCollapse(delta: number) {
    if (!this.collapseActive) {
      this.collapseInset = Math.max(0, this.collapseInset - delta * 0.12);
      return;
    }
    this.collapseInset += delta * 0.022;
    const bounds = this.getArenaBounds();
    if (bounds.w < 100 || bounds.h < 80) {
      this.player.takeDamage(this.player.maxHealth);
      return;
    }
    const margin = 15;
    if (
      this.player.x < bounds.x + margin ||
      this.player.x > bounds.x + bounds.w - margin ||
      this.player.y < bounds.y + margin ||
      this.player.y > bounds.y + bounds.h - margin
    ) {
      this.player.takeDamage(delta * 0.018);
    }
  }

  // ===== Combo =====
  private updateCombo(delta: number) {
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }
  }

  private registerKill() {
    this.totalKills++;
    this.layerEnemiesKilled++;
    this.combo++;
    this.comboTimer = 3500;

    if (this.combo >= 20) {
      this.contextLevel = Math.max(0, this.contextLevel - 15);
      this.player.heal(10);
    } else if (this.combo >= 10) {
      this.contextLevel = Math.max(0, this.contextLevel - 8);
      this.player.heal(5);
    } else if (this.combo >= 5) {
      this.contextLevel = Math.max(0, this.contextLevel - 4);
    }

    this.contextLevel = Math.max(0, this.contextLevel - 3.0);
  }

  // ===== Collisions =====
  private checkCollisions() {
    for (let pi = this.projectiles.length - 1; pi >= 0; pi--) {
      const proj = this.projectiles[pi];
      if (!proj.scene) continue;
      if (!proj.fromPlayer) {
        const d = Phaser.Math.Distance.Between(
          proj.x,
          proj.y,
          this.player.x,
          this.player.y
        );
        if (d < proj.radius + this.player.radius + 8) {
          this.player.takeDamage(proj.damage);
          proj.destroy();
          this.projectiles.splice(pi, 1);
        }
        continue;
      }
      for (const enemy of this.enemies) {
        if (enemy.isDead || proj.hitIds.has(enemy.eid)) continue;
        if (enemy.isPhased) continue;
        if (
          Phaser.Math.Distance.Between(proj.x, proj.y, enemy.x, enemy.y) <
          proj.radius + enemy.radius
        ) {
          if (enemy.isShielded(proj.x, proj.y)) {
            if (!proj.piercing) {
              proj.destroy();
              this.projectiles.splice(pi, 1);
              break;
            }
            continue;
          }
          proj.hitIds.add(enemy.eid);
          let dmg = proj.damage;
          if (
            this.player.systemPrompt === "analyze" &&
            enemy.health / enemy.maxHealth < 0.4
          )
            dmg *= 1.25;
          const comboDmg = this.combo >= 20 ? 2.0 : this.combo >= 10 ? 1.5 : this.combo >= 5 ? 1.25 : 1;
          dmg *= comboDmg;
          const killed = enemy.takeDamage(dmg);
          if (killed) {
            this.registerKill();
            this.spawnPickup(enemy.x, enemy.y, enemy.dropWeapon);
            this.handleDeathEffects(enemy);
          }
          if (proj.isNova) {
            this.spawnNovaExplosion(enemy.x, enemy.y, proj.novaDamage, proj.novaRadius, proj.color);
            proj.destroy();
            this.projectiles.splice(pi, 1);
            break;
          }
          if (proj.chainBounces > 0 && killed) {
            const chainTarget = this.enemies.find(
              (e) =>
                !e.isDead &&
                e.eid !== enemy.eid &&
                Phaser.Math.Distance.Between(enemy.x, enemy.y, e.x, e.y) <
                  proj.chainRange
            );
            if (chainTarget) {
              proj.x = enemy.x;
              proj.y = enemy.y;
              proj.chainBounce(chainTarget);
              break;
            }
          }
          if (!proj.piercing) {
            proj.destroy();
            this.projectiles.splice(pi, 1);
            break;
          }
        }
      }
    }
    for (const e of this.enemies) {
      if (e.isDead || e.isPhased) continue;
      const d = Phaser.Math.Distance.Between(
        e.x,
        e.y,
        this.player.x,
        this.player.y
      );
      if (d < e.radius + this.player.radius) {
        this.player.takeDamage(e.damage * 0.3);
        const a = Math.atan2(this.player.y - e.y, this.player.x - e.x);
        this.player.x += Math.cos(a) * 4;
        this.player.y += Math.sin(a) * 4;
        this.combo = 0;
      }
    }
  }

  private spawnPickup(x: number, y: number, isWeaponDrop: boolean) {
    const pool =
      ZONE_WEAPON_POOL[Math.min(this.zone - 1, ZONE_WEAPON_POOL.length - 1)];
    if (isWeaponDrop) {
      const mod = pool[Math.floor(Math.random() * pool.length)];
      this.pickups.push({
        x,
        y,
        type: "weapon",
        weaponMod: mod,
        tier: this.weaponTier,
        age: 0,
        collected: false,
      });
    }
    const tokenChance =
      this.player.systemPrompt === "hallucinate" ? 0.78 : 0.62;
    const comboBonus = this.combo >= 5 ? 0.15 : 0;
    if (Math.random() < tokenChance + comboBonus)
      this.pickups.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        type: "token",
        age: 0,
        collected: false,
      });
    if (Math.random() < 0.24 + (this.combo >= 10 ? 0.1 : 0))
      this.pickups.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        type: "health",
        age: 0,
        collected: false,
      });
  }

  private spawnExplosion(x: number, y: number, color: number) {
    const gfx = this.add.graphics().setDepth(9500);
    let radius = 5;
    const timer = this.time.addEvent({
      delay: 16,
      repeat: 15,
      callback: () => {
        radius += 4;
        gfx.clear();
        gfx.lineStyle(2, color, 1 - timer.getProgress());
        gfx.strokeCircle(x, y, radius);
      },
    });
    this.time.delayedCall(300, () => gfx.destroy());
    for (const e of this.enemies) {
      if (!e.isDead && Phaser.Math.Distance.Between(x, y, e.x, e.y) < 60)
        e.takeDamage(10);
    }
    if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 60)
      this.player.takeDamage(12);
  }

  private spawnNovaExplosion(x: number, y: number, damage: number, radius: number, color: number) {
    const gfx = this.add.graphics().setDepth(9500);
    let r = 8;
    const timer = this.time.addEvent({
      delay: 16,
      repeat: 20,
      callback: () => {
        r += (radius - 8) / 15;
        gfx.clear();
        const p = timer.getProgress();
        gfx.lineStyle(3 * (1 - p), color, (1 - p) * 0.9);
        gfx.strokeCircle(x, y, r);
        gfx.fillStyle(color, (1 - p) * 0.1);
        gfx.fillCircle(x, y, r);
        gfx.fillStyle(0xffffff, (1 - p) * 0.25);
        gfx.fillCircle(x, y, r * 0.25);
      },
    });
    this.time.delayedCall(380, () => gfx.destroy());
    for (const e of this.enemies) {
      if (!e.isDead && Phaser.Math.Distance.Between(x, y, e.x, e.y) < radius) {
        const killed = e.takeDamage(damage);
        if (killed) {
          this.registerKill();
          this.spawnPickup(e.x, e.y, e.dropWeapon);
          this.handleDeathEffects(e);
        }
      }
    }
  }

  private handleDeathEffects(enemy: Enemy) {
    if (enemy.enemyType === "botnet" && !enemy.isMini) {
      const count = 2 + Math.floor(Math.random() * 2);
      for (let s = 0; s < count; s++) {
        const angle = (s / count) * Math.PI * 2 + Math.random() * 0.5;
        const mini = new Enemy(
          this,
          enemy.x + Math.cos(angle) * 20,
          enemy.y + Math.sin(angle) * 20,
          "botnet",
          this.zone
        );
        mini.makeMini();
        this.enemies.push(mini);
      }
    }
  }

  // ===== Layer Progress =====
  private checkLayerProgress() {
    if (this.gameState !== "playing") return;
    if (this.player.isDead) return;

    if (this.layerEnemiesTotal === 0) return;

    const allSpawned =
      this.layerEnemiesSpawned >= this.layerEnemiesTotal &&
      this.spawnQueue.length === 0;
    const allDead = this.enemies.filter((e) => !e.isDead).length === 0;

    if (allSpawned && allDead) {
      this.advanceLayer();
    }
  }

  private checkPlayerDeath() {
    if (this.player.isDead && this.gameState !== "gameOver") {
      this.gameState = "gameOver";
      audio.play("gameOver");
      this.time.delayedCall(1200, () =>
        this.scene.start("GameOverScene", {
          layer: this.layer,
          kills: this.totalKills,
          tokens: this.player.tokens,
        })
      );
    }
  }

  private devKillAll() {
    for (const e of this.enemies) {
      if (!e.isDead) e.takeDamage(e.maxHealth * 100);
    }
    if (this.boss && !this.boss.isDead) {
      this.boss.takeDamage(this.boss.maxHealth * 100);
    }
    this.spawnQueue = [];
    this.layerEnemiesSpawned = this.layerEnemiesTotal;
  }

  private devNextLayer() {
    this.devKillAll();
    this.enemies = [];
    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
    }
    this.advanceLayer();
  }

  private triggerVictory() {
    this.gameState = "victory";
    audio.play("victory");
    this.time.delayedCall(1500, () =>
      this.scene.start("VictoryScene", {
        tokens: this.player.tokens,
        systemPrompt: this.systemPrompt,
        layers: this.layer,
      })
    );
  }

  // ===== Pause / Help Overlay =====
  private drawOverlay() {
    const w = this.scale.width,
      h = this.scale.height;
    const mono = { fontFamily: '"Share Tech Mono", monospace' };

    this.overlayGfx.clear();
    this.overlayGfx.fillStyle(0x000000, 0.75);
    this.overlayGfx.fillRect(0, 0, w, h);

    if (this.helpVisible) {
      const cx = w / 2,
        startY = h * 0.18;

      const title = this.add
        .text(cx, startY, "CONTROLS", {
          ...mono,
          fontSize: "22px",
          color: "#f4f4f5",
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(30001)
        .setScrollFactor(0);
      this.overlayTexts.push(title);

      const divider = this.add
        .text(cx, startY + 30, "─".repeat(24), {
          ...mono,
          fontSize: "12px",
          color: "#3f3f46",
        })
        .setOrigin(0.5)
        .setDepth(30001)
        .setScrollFactor(0);
      this.overlayTexts.push(divider);

      const bindings: [string, string][] = [
        ["WASD / ARROWS", "move"],
        ["SPACE", "shoot"],
        ["E", "special ability"],
        ["M", "toggle music"],
        ["P", "pause"],
        ["H", "this help screen"],
      ];

      let y = startY + 55;
      for (const [key, desc] of bindings) {
        const keyText = this.add
          .text(cx - 100, y, key, {
            ...mono,
            fontSize: "13px",
            color: "#bb88dd",
          })
          .setOrigin(0, 0.5)
          .setDepth(30001)
          .setScrollFactor(0);
        const descText = this.add
          .text(cx + 30, y, desc, {
            ...mono,
            fontSize: "13px",
            color: "#71717a",
          })
          .setOrigin(0, 0.5)
          .setDepth(30001)
          .setScrollFactor(0);
        this.overlayTexts.push(keyText, descText);
        y += 26;
      }

      const hint = this.add
        .text(cx, y + 30, "ESC to close", {
          ...mono,
          fontSize: "11px",
          color: "#52525b",
        })
        .setOrigin(0.5)
        .setDepth(30001)
        .setScrollFactor(0);
      this.overlayTexts.push(hint);
    } else {
      const title = this.add
        .text(w / 2, h / 2 - 12, "PAUSED", {
          ...mono,
          fontSize: "24px",
          color: "#f4f4f5",
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(30001)
        .setScrollFactor(0);
      const hint = this.add
        .text(w / 2, h / 2 + 20, "ESC or ENTER to resume", {
          ...mono,
          fontSize: "12px",
          color: "#52525b",
        })
        .setOrigin(0.5)
        .setDepth(30001)
        .setScrollFactor(0);
      this.overlayTexts.push(title, hint);
    }
  }

  private clearOverlay() {
    this.overlayGfx.clear();
    for (const t of this.overlayTexts) t.destroy();
    this.overlayTexts = [];
  }

  // ===== Drawing =====
  private drawArena() {
    const w = this.scale.width,
      h = this.scale.height;
    this.arenaGfx.clear();
    this.arenaGfx.lineStyle(1, 0x331155, 0.18);
    for (let x = 0; x < w; x += 32) this.arenaGfx.lineBetween(x, 0, x, h);
    for (let y = 0; y < h; y += 32) this.arenaGfx.lineBetween(0, y, w, y);
    if (this.collapseActive) {
      const bounds = this.getArenaBounds();
      const ba = 0.4 + Math.sin(Date.now() * 0.005) * 0.2;
      this.arenaGfx.lineStyle(1, 0xff0033, ba);
      this.arenaGfx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
    }
  }

  private drawCollapse() {
    this.collapseGfx.clear();
    if (this.collapseInset < 1) return;
    const w = this.scale.width,
      h = this.scale.height,
      ci = this.collapseInset;
    const top = 22,
      side = 8;
    const a = 0.25 + Math.sin(Date.now() * 0.003) * 0.1;
    this.collapseGfx.fillStyle(0xff0033, a * 0.35);
    this.collapseGfx.fillRect(0, top, w, ci);
    this.collapseGfx.fillRect(0, h - 28 - ci, w, ci);
    this.collapseGfx.fillRect(0, top + ci, ci + side, h - top - 28 - ci * 2);
    this.collapseGfx.fillRect(
      w - ci - side,
      top + ci,
      ci + side,
      h - top - 28 - ci * 2
    );
    this.collapseGfx.lineStyle(1, 0xff0033, a * 0.5);
    for (let i = 0; i < 4; i++) {
      const y = top + Math.random() * ci;
      this.collapseGfx.lineBetween(
        Math.random() * w,
        y,
        Math.random() * w * 0.3 + Math.random() * w * 0.7,
        y
      );
    }
  }

  private drawCombo() {
    this.comboGfx.clear();
    if (this.combo < 3) return;
    const w = this.scale.width;
    const c =
      this.combo >= 20 ? 0xffffff : this.combo >= 10 ? 0xff0080 : this.combo >= 5 ? 0x00ffee : 0x451bff;
    const barW = Math.min(180, this.combo * 6);
    const barX = w / 2 - barW / 2;
    this.comboGfx.fillStyle(c, 0.3);
    this.comboGfx.fillRect(barX, 30, barW, 3);
    this.comboGfx.fillStyle(c, 0.7);
    const timerPct = this.comboTimer / 3500;
    this.comboGfx.fillRect(barX, 30, barW * timerPct, 3);
  }

  private drawPickups() {
    this.pickupGfx.clear();
    for (const p of this.pickups) {
      if (p.collected) continue;
      const bob = Math.sin(p.age * 0.005) * 3;
      const fade = p.age > 8000 ? 1 - (p.age - 8000) / 2000 : 1;
      if (p.type === "token") {
        this.pickupGfx.fillStyle(0xff0080, 0.9 * fade);
        this.pickupGfx.beginPath();
        this.pickupGfx.moveTo(p.x, p.y - 5 + bob);
        this.pickupGfx.lineTo(p.x + 5, p.y + bob);
        this.pickupGfx.lineTo(p.x, p.y + 5 + bob);
        this.pickupGfx.lineTo(p.x - 5, p.y + bob);
        this.pickupGfx.closePath();
        this.pickupGfx.fillPath();
      } else if (p.type === "health") {
        this.pickupGfx.fillStyle(0x00ffee, 0.9 * fade);
        this.pickupGfx.fillRect(p.x - 2, p.y - 5 + bob, 4, 10);
        this.pickupGfx.fillRect(p.x - 5, p.y - 2 + bob, 10, 4);
      } else if (p.type === "weapon" && p.weaponMod) {
        const wc = WEAPON_MOD_COLORS[p.weaponMod];
        const tier = p.tier ?? 1;
        const glowR = 8 + tier * 2;
        this.pickupGfx.fillStyle(wc, 0.15 * fade);
        this.pickupGfx.fillCircle(p.x, p.y + bob, glowR);
        this.pickupGfx.fillStyle(wc, 0.85 * fade);
        this.pickupGfx.beginPath();
        this.pickupGfx.moveTo(p.x, p.y - 6 + bob);
        this.pickupGfx.lineTo(p.x + 6, p.y + bob);
        this.pickupGfx.lineTo(p.x, p.y + 6 + bob);
        this.pickupGfx.lineTo(p.x - 6, p.y + bob);
        this.pickupGfx.closePath();
        this.pickupGfx.fillPath();
        this.pickupGfx.lineStyle(1, wc, 0.5 * fade);
        this.pickupGfx.strokeCircle(p.x, p.y + bob, glowR);
        if (tier >= 3) {
          this.pickupGfx.lineStyle(1, 0xffffff, 0.15 * fade);
          this.pickupGfx.strokeCircle(p.x, p.y + bob, glowR + 3);
        }
      }
    }
  }
}
