import Phaser from "phaser";
import Cursor, {
  type SystemPrompt,
  type WeaponMod,
  WEAPON_MOD_COLORS,
  WEAPON_MOD_NAMES,
  CLASS_STATS,
} from "../objects/Cursor";

const CLASS_STATS_REF = CLASS_STATS;
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
  ["loremIpsum", "watermark", "clickbait"],
  ["clickbait", "botnet", "deepfake", "scraper", "dropout"],
  [
    "botnet",
    "deepfake",
    "scraper",
    "dropout",
    "embedding",
    "malware",
    "phishing",
  ],
  [
    "clickbait",
    "botnet",
    "malware",
    "phishing",
    "hallucination",
    "ddos",
    "gradient",
    "bias",
  ],
  [
    "deepfake",
    "scraper",
    "malware",
    "ddos",
    "bias",
    "captcha",
    "ransomware",
    "trojan",
    "zeroDay",
    "attention",
  ],
  [
    "loremIpsum",
    "watermark",
    "clickbait",
    "botnet",
    "deepfake",
    "scraper",
    "dropout",
    "embedding",
    "malware",
    "phishing",
    "hallucination",
    "ddos",
    "gradient",
    "bias",
    "captcha",
    "ransomware",
    "trojan",
    "attention",
    "zeroDay",
  ],
];

const ZONE_WEAPON_POOL: WeaponMod[][] = [
  ["spread", "rapid", "nova"],
  ["spread", "rapid", "piercing", "nova"],
  ["spread", "rapid", "piercing", "homing", "nova", "shockwave", "explosive"],
  [
    "spread",
    "rapid",
    "piercing",
    "homing",
    "chain",
    "nova",
    "vortex",
    "shockwave",
    "explosive",
    "laser",
  ],
  [
    "piercing",
    "homing",
    "chain",
    "spread",
    "rapid",
    "nova",
    "vortex",
    "orbital",
    "shockwave",
    "explosive",
    "laser",
  ],
  [
    "homing",
    "chain",
    "spread",
    "piercing",
    "rapid",
    "nova",
    "vortex",
    "orbital",
    "railgun",
    "shockwave",
    "explosive",
    "laser",
  ],
  [
    "spread",
    "piercing",
    "rapid",
    "homing",
    "chain",
    "nova",
    "vortex",
    "orbital",
    "railgun",
    "shockwave",
    "explosive",
    "laser",
  ],
];

interface SpecialStats {
  duration: number;
  potency: number;
  cooldownMult: number;
  milestones: Set<number>;
}

interface TurretStats {
  duration: number;
  damage: number;
  fireRate: number;
  range: number;
  projSpeed: number;
}

function getTurretStats(layer: number, tTier: number): TurretStats {
  const t6Bonus = tTier >= 6 ? 1.5 : 1;
  return {
    duration: 10000 + layer * 1200,
    damage: (20 + layer * 14) * t6Bonus,
    fireRate: Math.max(80, 300 - layer * 14) / (tTier >= 6 ? 1.5 : 1),
    range: 350 + layer * 18,
    projSpeed: 500 + layer * 15,
  };
}

function getMaxTurrets(layer: number): number {
  if (layer === 14) return 5;
  if (layer >= 13) return 6;
  if (layer >= 12) return 5;
  if (layer >= 11) return 4;
  if (layer >= 7) return 3;
  if (layer >= 4) return 2;
  return 1;
}

function getTurretRechargeTime(layer: number): number {
  return Math.max(1500, 4000 - layer * 200);
}

function getSpecialStats(prompt: SystemPrompt, layer: number): SpecialStats {
  switch (prompt) {
    case "autocomplete":
      return {
        duration: 4000 + layer * 500,
        potency: 0,
        cooldownMult: 1 - layer * 0.025,
        milestones: new Set([3, 5, 7, 10]),
      };
    case "hallucinate":
      return {
        duration: 2500 + layer * 350,
        potency: layer >= 3 ? 0.2 + layer * 0.02 : 0,
        cooldownMult: 1 - layer * 0.028,
        milestones: new Set([3, 5, 7, 10]),
      };
    case "analyze":
      return {
        duration: 6000 + layer * 500,
        potency: 0.5 + layer * 0.035,
        cooldownMult: 1 - layer * 0.025,
        milestones: new Set([3, 5, 7, 10]),
      };
    case "jailbreak":
      return {
        duration: 6000 + layer * 450,
        potency: 3.5 + layer * 0.25,
        cooldownMult: 1 - layer * 0.032,
        milestones: new Set([3, 5, 7, 10]),
      };
  }
}

const SPECIAL_MILESTONE_DESC: Record<SystemPrompt, Record<number, string>> = {
  autocomplete: {
    3: "autocomplete lasts longer",
    5: "invulnerability during autocomplete",
    7: "enhanced homing strength",
    10: "maximum fire rate boost",
  },
  hallucinate: {
    3: "displacement deals max HP damage",
    5: "+1.5s invulnerability after teleport",
    7: "displaced enemies wander confused",
    10: "nova explosion at old position",
  },
  analyze: {
    3: "slowed enemies take +15% damage",
    5: "slowed enemy deaths explode",
    7: "slowed enemies can be crit for 3s",
    10: "freezes enemies below 25% HP",
  },
  jailbreak: {
    3: "kills extend duration +0.3s",
    5: "crit chance doubled",
    7: "kills trigger explosions",
    10: "ending shockwave scales with kills",
  },
};

const COLLAPSE_TICK_MS = 10000;
const COLLAPSE_TICK_PX = 32;

type GameState =
  | "playing"
  | "bossIntro"
  | "boss"
  | "bossDeath"
  | "victory"
  | "dying"
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
  private collapseTickTimer = 0;

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
  private bossSpawnTimer = 0;

  private weaponTier = 1;
  private prevWeaponTier = 1;
  private specialKillsDuringActive = 0;
  private scanDamageBonus = false;
  private scanCritWindow = false;
  private scanFreezeActive = false;

  private activeTurretCount = 0;
  private turretRechargeTimer = 0;

  private paused = false;
  private helpVisible = false;
  private exitConfirmVisible = false;
  private exitMenuIndex = 0;
  private exitMenuItems: Phaser.GameObjects.Text[] = [];
  private overlayGfx!: Phaser.GameObjects.Graphics;
  private overlayTexts: Phaser.GameObjects.Text[] = [];
  private dangerGfx!: Phaser.GameObjects.Graphics;
  private deathGfx!: Phaser.GameObjects.Graphics;
  private lowHpWarnTimer = 0;

  private deathTimer = 0;
  private deathCollapseStart = 0;
  private deathExplosionAccum = 0;
  private deathShakeDecay = 0;
  private deathGameOverPlayed = false;
  private readonly DEATH_DURATION = 3500;

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
    q: Phaser.Input.Keyboard.Key;
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
    this.collapseTickTimer = 0;
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
    this.bossSpawnTimer = 0;
    this.weaponTier = 1;
    this.activeTurretCount = 0;
    this.turretRechargeTimer = 0;
    this.paused = false;
    this.helpVisible = false;
    this.exitConfirmVisible = false;
    this.exitMenuIndex = 0;
    this.exitMenuItems = [];
    this.deathTimer = 0;
    this.deathCollapseStart = 0;
    this.deathExplosionAccum = 0;
    this.deathShakeDecay = 0;
    this.deathGameOverPlayed = false;
  }

  create() {
    const w = this.scale.width,
      h = this.scale.height;

    this.arenaGfx = this.add.graphics().setDepth(0);
    this.collapseGfx = this.add.graphics().setDepth(15000);
    this.pickupGfx = this.add.graphics().setDepth(8000);
    this.comboGfx = this.add.graphics().setDepth(20500);
    this.deathGfx = this.add.graphics().setDepth(30000);

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
      q: this.input.keyboard!.addKey("Q"),
      m: this.input.keyboard!.addKey("M"),
      space: this.input.keyboard!.addKey("SPACE"),
    };
    this.input.keyboard!.on("keydown-M", () => audio.toggleMute());

    this.overlayGfx = this.add.graphics().setDepth(30000).setScrollFactor(0);
    this.dangerGfx = this.add.graphics().setDepth(19000).setScrollFactor(0);

    this.input.keyboard!.on("keydown-H", () => {
      if (this.gameState === "gameOver" || this.gameState === "victory") return;
      if (this.helpVisible || this.exitConfirmVisible) return;
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
      if (this.exitConfirmVisible) {
        this.clearOverlay();
        this.paused = false;
        this.exitConfirmVisible = false;
        return;
      }
      if (this.helpVisible || this.paused) {
        this.clearOverlay();
        this.paused = false;
        this.helpVisible = false;
        return;
      }
      if (this.gameState === "gameOver" || this.gameState === "victory") return;
      this.paused = true;
      this.exitConfirmVisible = true;
      this.exitMenuIndex = 0;
      this.drawExitConfirm();
    });
    this.input.keyboard!.on("keydown-ENTER", () => {
      if (this.exitConfirmVisible) {
        if (this.exitMenuIndex === 0) {
          this.clearOverlay();
          this.paused = false;
          this.exitConfirmVisible = false;
        } else {
          this.scene.start("TitleScene");
        }
        return;
      }
      if (this.paused && !this.helpVisible) {
        this.clearOverlay();
        this.paused = false;
      }
    });

    const exitNav = (dir: number) => {
      if (!this.exitConfirmVisible) return;
      this.exitMenuIndex = (this.exitMenuIndex + dir + 2) % 2;
      audio.play("uiNavigate");
      this.updateExitMenu();
    };
    this.input.keyboard!.on("keydown-UP", () => exitNav(-1));
    this.input.keyboard!.on("keydown-DOWN", () => exitNav(1));
    this.input.keyboard!.on("keydown-W", () => exitNav(-1));
    this.input.keyboard!.on("keydown-S", () => exitNav(1));

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

    this.showMessage("LAYER 1", "entering the model...", 1800);
    this.time.delayedCall(800, () => this.beginLayer());
  }

  // ===== Zones & Layers =====
  private get zone() {
    return Math.ceil(this.layer / 2);
  }
  private get subLayer() {
    return ((this.layer - 1) % 2) + 1;
  }
  private get isBossLayer() {
    return this.subLayer === 2;
  }

  private getArenaBounds() {
    const w = this.scale.width,
      h = this.scale.height,
      ci = this.collapseInset;
    return {
      x: ci,
      y: ci,
      w: w - ci * 2,
      h: h - ci * 2,
    };
  }

  // ===== Layer Setup =====
  private beginLayer() {
    this.layerTransitioning = false;
    this.layerEnemiesKilled = 0;
    this.layerEnemiesSpawned = 0;

    if (this.isBossLayer) {
      this.startBoss();
      this.applySpecialScaling();
      return;
    }

    this.prevWeaponTier = this.weaponTier;
    const TIER_BY_LAYER = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7];
    this.weaponTier = TIER_BY_LAYER[Math.min(this.layer, 14)];
    this.player.weaponTier = this.weaponTier;

    if (this.weaponTier > this.prevWeaponTier) {
      this.triggerWeaponEvolution();
    }

    this.applySpecialScaling();

    const lateBonus = Math.max(0, this.layer - 10) * 8;
    const baseCount = 16 + this.layer * 4 + this.zone * 6 + lateBonus;
    this.layerEnemiesTotal = baseCount;
    this.buildSpawnQueue(baseCount);
    this.gameState = "playing";
  }

  private triggerWeaponEvolution() {
    const evo = this.player.getEvolutionStage();
    const intensity = (this.weaponTier - 1) / 4;
    this.cameras.main.flash(
      200 + intensity * 300,
      255,
      255,
      255,
      false,
      undefined,
      this
    );
    this.cameras.main.shake(200 + intensity * 400, 0.005 + intensity * 0.015);
    audio.play("layerComplete");
    this.showMessage(
      `WEAPON EVOLVED: ${evo.name}`,
      `stage ${this.weaponTier}`,
      2500
    );
  }

  private applySpecialScaling() {
    const stats = getSpecialStats(this.systemPrompt, this.layer);
    this.player.promptCooldown = Math.round(
      CLASS_STATS_REF[this.systemPrompt].promptCooldown *
        Math.max(0.5, stats.cooldownMult)
    );
    if (this.systemPrompt === "jailbreak") {
      this.player.specialDmgMultiplier = stats.potency;
    }

    const milestone = SPECIAL_MILESTONE_DESC[this.systemPrompt][this.layer];
    if (milestone) {
      this.time.delayedCall(
        this.weaponTier > this.prevWeaponTier ? 2800 : 400,
        () => {
          this.showMessage("SPECIAL UPGRADED", milestone, 2000);
        }
      );
    }
  }

  private buildSpawnQueue(total: number) {
    const types =
      ZONE_ENEMIES[Math.min(this.zone - 1, ZONE_ENEMIES.length - 1)];
    this.spawnQueue = [];

    const baseInterval = Math.max(220, 600 - this.layer * 24);
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

    const bossLateBonus = Math.max(0, this.zone - 5) * 10;
    const bossEnemyCount = 10 + this.zone * 6 + bossLateBonus;
    this.layerEnemiesTotal = bossEnemyCount;
    this.buildSpawnQueue(bossEnemyCount);

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

    this.contextLevel = 0;
    this.collapseActive = false;
    this.collapseInset = 0;
    this.collapseTickTimer = 0;

    audio.play("layerComplete");
    this.layer++;

    if (this.layer > 14) {
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
      3: "NEW WEAPON: piercing rounds unlocked",
      4: "NEW ENEMY: dropout + bias + botnet, splits on death",
      5: "NEW WEAPON: homing + shockwave + PAYLOAD unlocked",
      6: "NEW ENEMY: deepfake + phishing + ddos swarm",
      7: "NEW ENEMY: scraper + ransomware + embedding",
      8: "NEW WEAPON: chain + orbital + BEAM LANCE unlocked",
      9: "MASS DESTRUCTION UNLOCKED + railgun + all weapons available",
      10: "NEW ENEMY: gradient descent + zeroDay assassin",
      11: "NEW ENEMY: hallucination + phase walker + attention head",
      12: "NEW ENEMY: trojan + captcha, frontal shield",
      13: "FINAL ZONE: all enemies unleashed",
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

    if (this.gameState === "dying") {
      this.updateDeathAnimation(delta);
      this.drawArena();
      this.drawCollapse();
      this.drawDeathAnimation();
      return;
    }

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
    this.checkJailbreakExpiry();
    this.checkPlayerDeath();
    this.drawArena();
    this.drawPickups();
    this.drawCollapse();
    this.drawDangerFlash();
    this.drawCombo();
    this.updateHUD();
  }

  private updateHUD() {
    const evo = this.player.getEvolutionStage();
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
      this.player.weaponModTimer,
      evo.name,
      this.player.weaponTier,
      this.player.classColor,
      this.activeTurretCount,
      getMaxTurrets(this.layer),
      this.turretRechargeTimer > 0
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
      this.player.shoot(this.projectiles, enemyPositions);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.e)) this.useSpecialAbility();
    if (Phaser.Input.Keyboard.JustDown(this.keys.q)) this.deployQTurret();
    if (this.turretRechargeTimer > 0) this.turretRechargeTimer -= delta;
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

    const ss = getSpecialStats(this.systemPrompt, this.layer);

    switch (this.player.systemPrompt) {
      case "autocomplete": {
        const dur = ss.duration;
        this.showMessage(
          "> AUTOCOMPLETE MODE",
          `enhanced aim for ${Math.round(dur / 1000)}s`,
          1200
        );
        this.player.specialActive = true;
        this.player.specialTimer = dur;
        this.player.fireRateMultiplier = 0.35;
        const origHoming = this.player.forceHoming;
        this.player.forceHoming = true;
        if (this.layer >= 5) {
          this.player.invulnTime = Math.max(this.player.invulnTime, dur * 0.5);
        }
        this.time.delayedCall(dur, () => {
          this.player.fireRateMultiplier = 1;
          this.player.forceHoming = origHoming;
          this.player.specialActive = false;
        });
        break;
      }
      case "hallucinate": {
        this.showMessage("> PLOT TWIST", "enemies displaced", 1200);
        const oldX = this.player.x;
        const oldY = this.player.y;
        for (const e of this.enemies) {
          if (e.isDead) continue;
          const bounds = this.getArenaBounds();
          e.x = bounds.x + Math.random() * bounds.w;
          e.y = bounds.y + Math.random() * bounds.h;
          if (this.layer >= 3) {
            const displacePct = ss.potency;
            e.takeDamage(e.maxHealth * displacePct);
          }
          e.speed *= 0.1;
          const stunDur = ss.duration;
          if (this.layer >= 7) {
            this.time.delayedCall(stunDur, () => {
              if (e.isDead) return;
              e.speed = e.cfg.speed * 0.3;
              this.time.delayedCall(2000, () => {
                if (!e.isDead) e.speed = e.cfg.speed;
              });
            });
          } else {
            this.time.delayedCall(stunDur, () => {
              if (!e.isDead) e.speed = e.cfg.speed;
            });
          }
        }
        if (this.layer >= 5) {
          this.player.invulnTime = Math.max(this.player.invulnTime, 1500);
        }
        if (this.layer >= 10) {
          this.spawnNovaExplosion(
            oldX,
            oldY,
            this.player.damage * 8,
            150,
            this.player.classColor
          );
        }
        break;
      }
      case "analyze": {
        const slowPct = ss.potency;
        const slowDur = ss.duration;
        const slowLabel = `enemies slowed ${Math.round((1 - slowPct) * 100)}%`;
        this.showMessage("> DEEP SCAN ACTIVE", slowLabel, 1200);
        this.scanDamageBonus = this.layer >= 3;
        this.scanCritWindow = this.layer >= 7;
        this.scanFreezeActive = this.layer >= 10;
        for (const e of this.enemies) {
          if (e.isDead) continue;
          e.speed *= slowPct;
          this.time.delayedCall(slowDur, () => {
            if (!e.isDead) e.speed = e.cfg.speed;
          });
        }
        if (this.scanCritWindow) {
          this.time.delayedCall(3000, () => {
            this.scanCritWindow = false;
          });
        }
        this.time.delayedCall(slowDur, () => {
          this.scanDamageBonus = false;
          this.scanCritWindow = false;
          this.scanFreezeActive = false;
        });
        break;
      }
      case "jailbreak": {
        const dmgMult = ss.potency;
        const dur = ss.duration;
        this.showMessage(
          "> NO GUARDRAILS",
          `${dmgMult.toFixed(1)}x damage for ${Math.round(dur / 1000)}s`,
          1200
        );
        this.player.specialActive = true;
        this.player.specialTimer = dur;
        this.player.specialDmgMultiplier = dmgMult;
        this.specialKillsDuringActive = 0;
        break;
      }
    }
  }

  private deployQTurret() {
    if (this.turretRechargeTimer > 0) return;
    const max = getMaxTurrets(this.layer);
    if (this.activeTurretCount >= max) return;

    this.turretRechargeTimer = getTurretRechargeTime(this.layer);
    const spread = 25 + Math.random() * 20;
    const angle = Math.random() * Math.PI * 2;
    const tx = this.player.x + Math.cos(angle) * spread;
    const ty = this.player.y + Math.sin(angle) * spread;
    this.deployUniversalTurret(tx, ty);
    audio.play("promptInjection");
  }

  private deployUniversalTurret(tx: number, ty: number) {
    const gfx = this.add.graphics().setDepth(9500);
    const tTier = this.zone;
    const layer = this.layer;
    const ts = getTurretStats(layer, tTier);
    const cls = this.systemPrompt;
    const classColor = CLASS_STATS_REF[cls].color;

    const maxLife = ts.duration;
    let turretLife = maxLife;

    let shotCount = 1;
    let spreadArc = 0;
    let fireRate = ts.fireRate;
    let baseDmg = ts.damage;
    let critChance = 0;
    let critMult = 1;

    switch (cls) {
      case "hallucinate":
        shotCount = 2; spreadArc = 0.15; fireRate *= 0.8;
        break;
      case "analyze":
        baseDmg *= 1.4; fireRate *= 1.3;
        break;
      case "jailbreak":
        critChance = 0.25; critMult = 2.5; fireRate *= 0.7; baseDmg *= 0.75;
        break;
    }
    if (tTier >= 7) shotCount *= 2;

    let turretCd = 0;
    this.activeTurretCount++;

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
          this.activeTurretCount--;
          return;
        }
        const alpha = turretLife / maxLife;
        const elapsed = maxLife - turretLife;
        this.drawTurretVisual(gfx, tx, ty, tTier, cls, alpha, elapsed);

        if (turretCd <= 0) {
          let target: { x: number; y: number } | null = null;
          let bestDist = ts.range;
          for (const e of this.enemies) {
            if (e.isDead) continue;
            const d = Phaser.Math.Distance.Between(tx, ty, e.x, e.y);
            if (d < bestDist) { bestDist = d; target = e; }
          }
          if (this.boss && !this.boss.isDead) {
            const d = Phaser.Math.Distance.Between(tx, ty, this.boss.x, this.boss.y);
            if (d < bestDist) target = this.boss;
          }

          if (target) {
            turretCd = fireRate;
            for (let s = 0; s < shotCount; s++) {
              const baseAngle = Math.atan2(target.y - ty, target.x - tx);
              const sOffset = shotCount > 1
                ? (s - (shotCount - 1) / 2) * (spreadArc > 0 ? spreadArc : 0.1)
                : 0;
              let dmg = baseDmg;
              if (critChance > 0 && Math.random() < critChance) dmg *= critMult;

              const p = new Projectile(
                this, tx, ty,
                Math.cos(baseAngle + sOffset) * ts.projSpeed,
                Math.sin(baseAngle + sOffset) * ts.projSpeed,
                dmg, classColor, 1200, true
              );
              if (tTier >= 2) { p.piercing = true; p.piercingScale = cls === "analyze" ? 1.3 : 1; }
              if (tTier >= 3) {
                p.homing = true;
                p.homingTargets = this.enemies.filter(e => !e.isDead).map(e => ({ x: e.x, y: e.y }));
                p.homingStrength = cls === "autocomplete" ? 7.5 : 5.0;
              }
              if (tTier >= 4) {
                p.isExplosive = true;
                p.explosiveRadius = (50 + layer * 5) * (cls === "autocomplete" ? 1.3 : 1);
                p.explosiveDamage = dmg * 0.6;
              }
              if (tTier >= 5) p.explosiveCluster = true;
              if (tTier >= 7) {
                p.turretNovaOnKill = true;
                p.turretNovaRadius = 60 + layer * 5;
                p.turretNovaDamage = dmg * 0.5;
              }
              p.radius = tTier >= 4 ? 8 : 5;
              this.projectiles.push(p);
            }
          }
        }
      },
    });
  }

  private drawTurretVisual(
    gfx: Phaser.GameObjects.Graphics,
    tx: number, ty: number,
    tTier: number, cls: SystemPrompt,
    alpha: number, elapsed: number
  ) {
    const color = CLASS_STATS_REF[cls].color;
    const t = elapsed * 0.001;
    const pulse = Math.sin(t * 2) * 0.15;

    const baseSize = 6 + tTier * 1.5;
    const glowR = baseSize + 8 + tTier * 2;

    gfx.fillStyle(color, (0.08 + tTier * 0.02) * alpha);
    gfx.fillCircle(tx, ty, glowR);

    switch (cls) {
      case "autocomplete": {
        const s = baseSize;
        gfx.lineStyle(1 + tTier * 0.2, color, (0.5 + pulse) * alpha);
        gfx.strokeRect(tx - s, ty - s, s * 2, s * 2);
        gfx.fillStyle(color, 0.8 * alpha);
        gfx.fillRect(tx - 3, ty - 3, 6, 6);
        if (tTier >= 2) {
          gfx.lineStyle(1, color, 0.4 * alpha);
          gfx.strokeCircle(tx, ty, s + 4);
        }
        if (tTier >= 3) {
          for (let i = 0; i < 3; i++) {
            const a = t * 1.5 + (i / 3) * Math.PI * 2;
            gfx.fillStyle(color, 0.6 * alpha);
            gfx.fillCircle(tx + Math.cos(a) * (s + 6), ty + Math.sin(a) * (s + 6), 2);
          }
        }
        if (tTier >= 4) {
          gfx.lineStyle(1.5, 0xff4400, (0.3 + pulse * 0.5) * alpha);
          gfx.strokeCircle(tx, ty, s + 10);
        }
        if (tTier >= 5) {
          for (let i = 0; i < 4; i++) {
            const a = -t * 2 + (i / 4) * Math.PI * 2;
            gfx.fillStyle(0xff6600, 0.5 * alpha);
            gfx.fillRect(tx + Math.cos(a) * (s + 13) - 1.5, ty + Math.sin(a) * (s + 13) - 1.5, 3, 3);
          }
        }
        if (tTier >= 6) {
          for (let i = 0; i < 3; i++) {
            const a1 = t * 0.8 + (i / 3) * Math.PI * 2;
            const a2 = a1 + Math.PI * 2 / 3;
            gfx.lineStyle(0.8, color, 0.35 * alpha);
            gfx.lineBetween(
              tx + Math.cos(a1) * (s + 5), ty + Math.sin(a1) * (s + 5),
              tx + Math.cos(a2) * (s + 5), ty + Math.sin(a2) * (s + 5)
            );
          }
        }
        if (tTier >= 7) {
          gfx.lineStyle(2, 0xffffff, (0.2 + Math.sin(t * 4) * 0.15) * alpha);
          gfx.strokeCircle(tx, ty, s + 16 + Math.sin(t * 3) * 2);
          gfx.fillStyle(0xffffff, 0.6 * alpha);
          gfx.fillCircle(tx, ty, 2.5);
        }
        break;
      }
      case "hallucinate": {
        const wobble = Math.sin(t * 3) * 2;
        const r = baseSize + wobble;
        gfx.fillStyle(color, (0.7 + pulse) * alpha);
        gfx.fillCircle(tx, ty, r);
        gfx.fillStyle(0xffffff, 0.5 * alpha);
        gfx.fillCircle(tx, ty, r * 0.35);
        if (tTier >= 2) {
          for (let i = 0; i < 3; i++) {
            const a = t * 2 + (i / 3) * Math.PI * 2;
            const len = r + 4 + Math.sin(t * 3 + i) * 2;
            gfx.lineStyle(1, color, 0.4 * alpha);
            gfx.lineBetween(tx, ty, tx + Math.cos(a) * len, ty + Math.sin(a) * len);
          }
        }
        if (tTier >= 3) {
          for (let i = 0; i < 4; i++) {
            const a = t * 1.2 + (i / 4) * Math.PI * 2;
            gfx.fillStyle(color, 0.4 * alpha);
            gfx.fillCircle(tx + Math.cos(a) * (r + 6), ty + Math.sin(a) * (r + 6), 1.5);
          }
        }
        if (tTier >= 4) {
          gfx.lineStyle(1.5, color, (0.25 + pulse) * alpha);
          gfx.strokeCircle(tx, ty, r + 8);
        }
        if (tTier >= 5) {
          for (let i = 0; i < 5; i++) {
            const a = -t * 1.8 + (i / 5) * Math.PI * 2;
            gfx.fillStyle(color, 0.35 * alpha);
            gfx.fillCircle(tx + Math.cos(a) * (r + 12), ty + Math.sin(a) * (r + 12), 1.5);
          }
        }
        if (tTier >= 6) {
          const distort = Math.sin(t * 5) * 3;
          gfx.lineStyle(0.8, color, 0.3 * alpha);
          gfx.strokeCircle(tx + distort, ty - distort, r + 14);
        }
        if (tTier >= 7) {
          const chaos = Math.sin(t * 8);
          gfx.lineStyle(2, 0xffffff, (0.15 + chaos * 0.1) * alpha);
          gfx.strokeCircle(tx, ty, r + 18 + chaos * 3);
          for (let i = 0; i < 3; i++) {
            const sy = ty - r + Math.random() * r * 2;
            gfx.lineStyle(0.5, color, 0.2 * alpha);
            gfx.lineBetween(tx - r, sy, tx + r, sy);
          }
        }
        break;
      }
      case "analyze": {
        const s = baseSize;
        gfx.fillStyle(color, (0.7 + pulse) * alpha);
        gfx.beginPath();
        gfx.moveTo(tx, ty - s);
        gfx.lineTo(tx + s, ty);
        gfx.lineTo(tx, ty + s);
        gfx.lineTo(tx - s, ty);
        gfx.closePath();
        gfx.fillPath();
        gfx.fillStyle(0xffffff, 0.5 * alpha);
        gfx.fillCircle(tx, ty, 2);
        if (tTier >= 2) {
          const scanY = ty - s + ((t * 40) % (s * 2));
          gfx.lineStyle(0.8, color, 0.5 * alpha);
          gfx.lineBetween(tx - s * 0.6, scanY, tx + s * 0.6, scanY);
        }
        if (tTier >= 3) {
          gfx.lineStyle(1, color, 0.35 * alpha);
          gfx.strokeCircle(tx, ty, s + 5);
        }
        if (tTier >= 4) {
          const os = s + 3;
          gfx.lineStyle(1, 0xff4400, (0.3 + pulse * 0.3) * alpha);
          gfx.lineBetween(tx - os, ty, tx + os, ty);
          gfx.lineBetween(tx, ty - os, tx, ty + os);
        }
        if (tTier >= 5) {
          for (let i = 0; i < 4; i++) {
            const a = t * 0.6 + (i / 4) * Math.PI * 2;
            gfx.lineStyle(0.6, color, 0.25 * alpha);
            const inner = s + 6, outer = s + 12;
            gfx.lineBetween(
              tx + Math.cos(a) * inner, ty + Math.sin(a) * inner,
              tx + Math.cos(a) * outer, ty + Math.sin(a) * outer
            );
          }
        }
        if (tTier >= 6) {
          gfx.lineStyle(1, color, 0.3 * alpha);
          const rr = s + 10;
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + t * 0.4;
            const px = tx + Math.cos(a) * rr;
            const py = ty + Math.sin(a) * rr;
            if (i === 0) gfx.beginPath();
            if (i === 0) gfx.moveTo(px, py);
            else gfx.lineTo(px, py);
          }
          gfx.closePath();
          gfx.strokePath();
        }
        if (tTier >= 7) {
          gfx.lineStyle(2, 0xffffff, (0.2 + Math.sin(t * 3) * 0.1) * alpha);
          gfx.strokeCircle(tx, ty, s + 16);
          gfx.fillStyle(0xffffff, 0.5 * alpha);
          gfx.fillCircle(tx, ty, 3);
        }
        break;
      }
      case "jailbreak": {
        const s = baseSize;
        const jit = tTier >= 4 ? Math.random() * 1.5 : 0;
        gfx.fillStyle(color, (0.75 + pulse) * alpha);
        gfx.beginPath();
        gfx.moveTo(tx + jit, ty - s);
        gfx.lineTo(tx + s * 0.87 + jit, ty + s * 0.5);
        gfx.lineTo(tx - s * 0.87 + jit, ty + s * 0.5);
        gfx.closePath();
        gfx.fillPath();
        gfx.fillStyle(0xffffff, 0.5 * alpha);
        gfx.fillCircle(tx, ty, 2);
        if (tTier >= 2) {
          const spikes = 5;
          for (let i = 0; i < spikes; i++) {
            const a = (i / spikes) * Math.PI * 2 + t;
            const inner = s * 0.6, outer = s + 3;
            gfx.lineStyle(1, color, 0.5 * alpha);
            gfx.lineBetween(
              tx + Math.cos(a) * inner, ty + Math.sin(a) * inner,
              tx + Math.cos(a) * outer, ty + Math.sin(a) * outer
            );
          }
        }
        if (tTier >= 3) {
          for (let i = 0; i < 3; i++) {
            const a1 = t * 2 + (i / 3) * Math.PI * 2;
            const a2 = a1 + 0.4 + Math.sin(t * 5 + i) * 0.2;
            gfx.lineStyle(1.2, color, 0.4 * alpha);
            gfx.lineBetween(
              tx + Math.cos(a1) * (s + 2), ty + Math.sin(a1) * (s + 2),
              tx + Math.cos(a2) * (s + 8), ty + Math.sin(a2) * (s + 8)
            );
          }
        }
        if (tTier >= 4) {
          gfx.fillStyle(0xff6600, 0.3 * alpha);
          gfx.fillCircle(tx, ty, s + 6);
        }
        if (tTier >= 5) {
          for (let i = 0; i < 4; i++) {
            const a = -t * 2.5 + (i / 4) * Math.PI * 2;
            const trail = 3 + Math.sin(t * 4 + i) * 1;
            gfx.fillStyle(0xff4400, 0.4 * alpha);
            gfx.fillCircle(tx + Math.cos(a) * (s + 10), ty + Math.sin(a) * (s + 10), trail);
          }
        }
        if (tTier >= 6) {
          for (let i = 0; i < 4; i++) {
            const a = t * 3 + (i / 4) * Math.PI * 2;
            const len = s + 12 + Math.sin(t * 6 + i * 2) * 4;
            gfx.lineStyle(1, 0xffff00, 0.35 * alpha);
            gfx.lineBetween(tx, ty, tx + Math.cos(a) * len, ty + Math.sin(a) * len);
          }
        }
        if (tTier >= 7) {
          gfx.lineStyle(2, 0xffffff, (0.2 + Math.sin(t * 6) * 0.15) * alpha);
          gfx.strokeCircle(tx, ty, s + 16 + Math.random() * 2);
          gfx.fillStyle(0xffffff, 0.6 * alpha);
          gfx.fillCircle(tx, ty, 2.5);
        }
        break;
      }
    }
  }

  // ===== Spawn Queue (continuous flow) =====
  private updateSpawnQueue(delta: number) {
    if (this.gameState !== "playing" && this.gameState !== "boss") return;

    if (this.spawnQueue.length > 0) {
      this.spawnAccum += delta;
      while (
        this.spawnQueue.length > 0 &&
        this.spawnQueue[0].delay <= this.spawnAccum
      ) {
        const next = this.spawnQueue.shift()!;
        this.spawnOneEnemy(next.type);
      }
    }

    if (
      this.gameState === "boss" &&
      this.spawnQueue.length === 0 &&
      this.boss &&
      !this.boss.isDead
    ) {
      const alive = this.enemies.filter((e) => !e.isDead).length;
      const maxAlive = 6 + this.zone * 2;
      if (alive < maxAlive) {
        this.bossSpawnTimer -= delta;
        if (this.bossSpawnTimer <= 0) {
          const types =
            ZONE_ENEMIES[Math.min(this.zone - 1, ZONE_ENEMIES.length - 1)];
          const type = types[Math.floor(Math.random() * types.length)];
          this.spawnOneEnemy(type);
          this.bossSpawnTimer = Math.max(900, 2000 - this.zone * 130);
        }
      }
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
          if (dist < e.radius + this.player.radius + 10) {
            this.player.takeDamage(e.damage);
            if (e.enemyType === "ransomware") {
              const origSpeed = this.player.speed;
              this.player.speed = origSpeed * 0.15;
              this.showMessage("ENCRYPTED", "movement locked", 600);
              this.time.delayedCall(800, () => {
                this.player.speed = origSpeed;
              });
            }
          }
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

    if (this.boss.isDead && this.boss.deathCinematic) {
      if (this.gameState !== "bossDeath") {
        this.gameState = "bossDeath";
        this.cameras.main.shake(800, 0.012);
        this.cameras.main.flash(300, 255, 255, 255, false, undefined, this);
        this.contextLevel = 0;
        this.collapseActive = false;
        this.collapseInset = 0;
        this.collapseTickTimer = 0;
        this.showMessage("BOSS DEFEATED", BOSS_NAMES[this.boss.bossType], 3000);
        this.time.delayedCall(2500, () => {
          this.boss = null;
          if (this.layer >= 14) {
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
    this.collapseTickTimer += delta;
    this.contextLevel = (this.collapseTickTimer / COLLAPSE_TICK_MS) * 100;

    if (this.collapseTickTimer >= COLLAPSE_TICK_MS) {
      this.collapseTickTimer -= COLLAPSE_TICK_MS;
      this.collapseInset += COLLAPSE_TICK_PX;
      this.collapseActive = true;
      audio.play("contextCollapse");
    }
  }

  private updateCollapse(delta: number) {
    if (this.collapseInset <= 0) return;
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
      this.player.heal(10);
    } else if (this.combo >= 10) {
      this.player.heal(5);
    }
  }

  private jailbreakWasActive = false;

  private checkJailbreakExpiry() {
    if (this.systemPrompt !== "jailbreak") {
      this.jailbreakWasActive = false;
      return;
    }
    if (this.player.specialActive) {
      this.jailbreakWasActive = true;
    } else if (this.jailbreakWasActive) {
      this.jailbreakWasActive = false;
      if (this.layer >= 10 && this.specialKillsDuringActive > 0) {
        const radius = 60 + this.specialKillsDuringActive * 10;
        const dmg =
          this.player.damage * (3 + this.specialKillsDuringActive * 0.8);
        this.spawnNovaExplosion(
          this.player.x,
          this.player.y,
          dmg,
          Math.min(radius, 250),
          0xff0033
        );
        this.cameras.main.shake(400, 0.015);
      }
      this.specialKillsDuringActive = 0;
    }
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
          const evo = this.player.getEvolutionStage();
          const execThreshold = evo.executeThreshold;
          if (
            this.player.systemPrompt === "analyze" &&
            execThreshold > 0 &&
            enemy.health / enemy.maxHealth < execThreshold
          )
            dmg *= 1.25;
          if (this.scanDamageBonus) dmg *= 1.15;
          if (this.scanCritWindow) dmg *= 1.5;
          const comboDmg =
            this.combo >= 20
              ? 1.6
              : this.combo >= 10
              ? 1.35
              : this.combo >= 5
              ? 1.15
              : 1;
          dmg *= comboDmg;
          if (this.scanFreezeActive && enemy.health / enemy.maxHealth < 0.25) {
            enemy.speed = 0;
            this.time.delayedCall(2000, () => {
              if (!enemy.isDead) enemy.takeDamage(enemy.maxHealth);
            });
          }
          const killed = enemy.takeDamage(dmg);
          if (proj.aoeRadius > 0) {
            const splashDmg = dmg * proj.aoeDamageMult;
            for (const other of this.enemies) {
              if (other.isDead || other.eid === enemy.eid || other.isPhased)
                continue;
              if (
                Phaser.Math.Distance.Between(
                  enemy.x,
                  enemy.y,
                  other.x,
                  other.y
                ) < proj.aoeRadius
              ) {
                const splashKilled = other.takeDamage(splashDmg);
                if (splashKilled) {
                  this.registerKill();
                  this.spawnPickup(other.x, other.y, other.dropWeapon);
                  this.handleDeathEffects(other);
                }
              }
            }
            this.spawnAoeRing(enemy.x, enemy.y, proj.aoeRadius, proj.color);
          }
          if (killed) {
            this.registerKill();
            this.spawnPickup(enemy.x, enemy.y, enemy.dropWeapon);
            this.handleDeathEffects(enemy);
            if (this.scanDamageBonus && this.layer >= 5) {
              this.spawnNovaExplosion(
                enemy.x,
                enemy.y,
                dmg * 0.4,
                50,
                this.player.classColor
              );
            }
            if (
              this.player.specialActive &&
              this.systemPrompt === "jailbreak"
            ) {
              this.specialKillsDuringActive++;
              if (this.layer >= 3) {
                this.player.specialTimer += 400;
              }
              if (this.layer >= 7) {
                this.spawnNovaExplosion(
                  enemy.x,
                  enemy.y,
                  this.player.damage * 2.5,
                  45,
                  0xff0033
                );
              }
            }
            if (proj.critKillExplosion) {
              this.spawnNovaExplosion(
                enemy.x,
                enemy.y,
                proj.damage * 0.5,
                45,
                0xff0033
              );
            }
            if (proj.turretNovaOnKill) {
              this.spawnNovaExplosion(
                enemy.x,
                enemy.y,
                proj.turretNovaDamage,
                proj.turretNovaRadius,
                proj.color
              );
            }
          }
          if (proj.isNova) {
            this.spawnNovaExplosion(
              enemy.x,
              enemy.y,
              proj.novaDamage,
              proj.novaRadius,
              proj.color
            );
            if (!proj.piercing) {
              proj.destroy();
              this.projectiles.splice(pi, 1);
              break;
            }
          }
          if (proj.isExplosive) {
            this.spawnExplosiveBlast(
              enemy.x,
              enemy.y,
              proj.explosiveDamage,
              proj.explosiveRadius,
              proj.color,
              proj.explosiveCluster
            );
            if (!proj.piercing) {
              proj.destroy();
              this.projectiles.splice(pi, 1);
              break;
            }
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

  private spawnAoeRing(x: number, y: number, radius: number, color: number) {
    const gfx = this.add.graphics().setDepth(9400);
    let r = 4;
    const timer = this.time.addEvent({
      delay: 16,
      repeat: 12,
      callback: () => {
        r += (radius - 4) / 10;
        gfx.clear();
        const p = timer.getProgress();
        gfx.lineStyle(2 * (1 - p), color, (1 - p) * 0.5);
        gfx.strokeCircle(x, y, r);
      },
    });
    this.time.delayedCall(220, () => gfx.destroy());
  }

  private spawnNovaExplosion(
    x: number,
    y: number,
    damage: number,
    radius: number,
    color: number
  ) {
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

  private spawnExplosiveBlast(
    x: number,
    y: number,
    damage: number,
    blastRadius: number,
    color: number,
    cluster: boolean
  ) {
    this.cameras.main.shake(300, 0.018);
    const gfx = this.add.graphics().setDepth(9500);
    let r = 6;
    const timer = this.time.addEvent({
      delay: 16,
      repeat: 30,
      callback: () => {
        r += (blastRadius - 6) / 20;
        gfx.clear();
        const p = timer.getProgress();
        gfx.fillStyle(0xff4400, (1 - p) * 0.3);
        gfx.fillCircle(x, y, r);
        gfx.fillStyle(0xff6600, (1 - p) * 0.15);
        gfx.fillCircle(x, y, r * 1.2);
        gfx.lineStyle(5 * (1 - p), color, (1 - p) * 0.95);
        gfx.strokeCircle(x, y, r);
        gfx.lineStyle(3 * (1 - p), 0xffaa00, (1 - p) * 0.8);
        gfx.strokeCircle(x, y, r * 0.7);
        gfx.lineStyle(2 * (1 - p), 0xffdd44, (1 - p) * 0.5);
        gfx.strokeCircle(x, y, r * 0.4);
        gfx.fillStyle(0xffffff, (1 - p) * 0.6);
        gfx.fillCircle(x, y, r * 0.25);
        for (let i = 0; i < 10; i++) {
          const ea = (i / 10) * Math.PI * 2 + p * 4;
          const ed = r * (0.5 + p * 0.5);
          gfx.fillStyle(0xff8800, (1 - p) * 0.7);
          gfx.fillCircle(
            x + Math.cos(ea) * ed,
            y + Math.sin(ea) * ed,
            4 * (1 - p)
          );
        }
      },
    });
    this.time.delayedCall(550, () => gfx.destroy());

    for (const e of this.enemies) {
      if (
        !e.isDead &&
        Phaser.Math.Distance.Between(x, y, e.x, e.y) < blastRadius
      ) {
        const killed = e.takeDamage(damage);
        if (killed) {
          this.registerKill();
          this.spawnPickup(e.x, e.y, e.dropWeapon);
          this.handleDeathEffects(e);
        }
      }
    }

    if (cluster) {
      const clusterCount = 6;
      for (let c = 0; c < clusterCount; c++) {
        const ca = (c / clusterCount) * Math.PI * 2 + Math.random() * 0.8;
        const cd = blastRadius * 0.55 + Math.random() * 30;
        const cx = x + Math.cos(ca) * cd;
        const cy = y + Math.sin(ca) * cd;
        this.time.delayedCall(60 + c * 50, () => {
          this.cameras.main.shake(120, 0.006);
          const cgfx = this.add.graphics().setDepth(9500);
          let cr = 4;
          const subR = blastRadius * 0.6;
          const ct = this.time.addEvent({
            delay: 16,
            repeat: 20,
            callback: () => {
              cr += (subR - 4) / 14;
              cgfx.clear();
              const cp = ct.getProgress();
              cgfx.fillStyle(0xff4400, (1 - cp) * 0.25);
              cgfx.fillCircle(cx, cy, cr);
              cgfx.lineStyle(3 * (1 - cp), 0xff6600, (1 - cp) * 0.9);
              cgfx.strokeCircle(cx, cy, cr);
              cgfx.fillStyle(0xffffff, (1 - cp) * 0.35);
              cgfx.fillCircle(cx, cy, cr * 0.2);
              for (let f = 0; f < 4; f++) {
                const fa = (f / 4) * Math.PI * 2 + cp * 5;
                const fd = cr * (0.5 + cp * 0.5);
                cgfx.fillStyle(0xff8800, (1 - cp) * 0.5);
                cgfx.fillCircle(cx + Math.cos(fa) * fd, cy + Math.sin(fa) * fd, 2 * (1 - cp));
              }
            },
          });
          this.time.delayedCall(380, () => cgfx.destroy());
          for (const e of this.enemies) {
            if (
              !e.isDead &&
              Phaser.Math.Distance.Between(cx, cy, e.x, e.y) < subR
            ) {
              const killed = e.takeDamage(damage * 0.7);
              if (killed) {
                this.registerKill();
                this.spawnPickup(e.x, e.y, e.dropWeapon);
                this.handleDeathEffects(e);
              }
            }
          }
        });
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
    if (enemy.enemyType === "ddos" && !enemy.isMini && Math.random() < 0.4) {
      const count = 2;
      for (let s = 0; s < count; s++) {
        const angle = Math.random() * Math.PI * 2;
        const mini = new Enemy(
          this,
          enemy.x + Math.cos(angle) * 15,
          enemy.y + Math.sin(angle) * 15,
          "ddos",
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
    if (
      this.player.isDead &&
      this.gameState !== "dying" &&
      this.gameState !== "gameOver"
    ) {
      this.gameState = "dying";
      this.deathTimer = 0;
      this.deathCollapseStart = this.collapseInset;
      this.deathExplosionAccum = 0;
      this.deathShakeDecay = 0;
      this.player.setVisible(false);

      this.cameras.main.flash(250, 255, 80, 80);
      this.cameras.main.shake(300, 0.02);
      audio.play("playerDeath");
      audio.play("deathBoom");

      this.spawnDeathExplosion(this.player.x, this.player.y, 0xff0033, 80);
      this.spawnDeathExplosion(this.player.x, this.player.y, 0xffffff, 40);
    }
  }

  private updateDeathAnimation(delta: number) {
    if (this.gameState !== "dying") return;

    this.deathTimer += delta;
    const t = this.deathTimer / this.DEATH_DURATION;

    const w = this.scale.width,
      h = this.scale.height;
    const maxInset = Math.min(w, h) / 2;
    this.collapseInset =
      this.deathCollapseStart +
      (maxInset - this.deathCollapseStart) * this.easeInCubic(t);
    this.collapseActive = true;

    const shakeIntensity = 0.005 + t * 0.035;
    this.deathShakeDecay += delta;
    if (this.deathShakeDecay > 80) {
      this.cameras.main.shake(100, shakeIntensity);
      this.deathShakeDecay = 0;
    }

    const explosionInterval = Math.max(60, 300 - t * 280);
    this.deathExplosionAccum += delta;
    if (this.deathExplosionAccum >= explosionInterval) {
      this.deathExplosionAccum = 0;
      const bounds = this.getArenaBounds();
      const ex = bounds.x + Math.random() * bounds.w;
      const ey = bounds.y + Math.random() * bounds.h;
      const colors = [0xff0033, 0xff0080, 0xff6600, 0xffffff, 0x00ffee];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 20 + Math.random() * 60 * (0.5 + t);
      this.spawnDeathExplosion(ex, ey, color, size);

      if (size > 50) {
        audio.play("deathBoom");
      } else if (Math.random() < 0.4 + t * 0.3) {
        audio.play("contextCollapse");
      }
    }

    if (t > 0.3 && !this.deathGameOverPlayed) {
      this.deathGameOverPlayed = true;
      audio.play("gameOver");
    }

    if (this.deathTimer >= this.DEATH_DURATION) {
      this.gameState = "gameOver";
      this.scene.start("GameOverScene", {
        layer: this.layer,
        kills: this.totalKills,
        tokens: this.player.tokens,
      });
    }
  }

  private drawDeathAnimation() {
    this.deathGfx.clear();
    if (this.gameState !== "dying") return;

    const w = this.scale.width,
      h = this.scale.height;
    const t = Math.min(this.deathTimer / this.DEATH_DURATION, 1);

    const darkAlpha = t * t * 0.85;
    this.deathGfx.fillStyle(0x000000, darkAlpha);
    this.deathGfx.fillRect(0, 0, w, h);

    const scanCount = Math.floor(4 + t * 20);
    for (let i = 0; i < scanCount; i++) {
      const sy = Math.random() * h;
      const sw = Math.random() * w * (0.2 + t * 0.8);
      const sx = Math.random() * (w - sw);
      const sa = (0.1 + t * 0.4) * Math.random();
      this.deathGfx.fillStyle(0xff0033, sa);
      this.deathGfx.fillRect(sx, sy, sw, 1 + Math.random() * 2);
    }

    if (t > 0.15) {
      const glitchCount = Math.floor((t - 0.15) * 12);
      for (let i = 0; i < glitchCount; i++) {
        const gy = Math.random() * h;
        const gh = 2 + Math.random() * 8;
        const gx = Math.random() * w * 0.3;
        const gw = Math.random() * w * 0.7;
        const gc = Math.random() > 0.5 ? 0xff0033 : 0x00ffee;
        this.deathGfx.fillStyle(gc, 0.03 + t * 0.08);
        this.deathGfx.fillRect(gx, gy, gw, gh);
      }
    }

    if (t > 0.6) {
      const fadeT = (t - 0.6) / 0.4;
      this.deathGfx.fillStyle(0x000000, fadeT * fadeT * 0.6);
      this.deathGfx.fillRect(0, 0, w, h);
    }
  }

  private spawnDeathExplosion(
    x: number,
    y: number,
    color: number,
    maxRadius: number
  ) {
    const gfx = this.add.graphics().setDepth(29000);
    let r = 3;
    const timer = this.time.addEvent({
      delay: 16,
      repeat: 22,
      callback: () => {
        r += (maxRadius - 3) / 16;
        gfx.clear();
        const p = timer.getProgress();

        gfx.fillStyle(color, (1 - p) * 0.15);
        gfx.fillCircle(x, y, r);
        gfx.lineStyle(3 * (1 - p), color, (1 - p) * 0.9);
        gfx.strokeCircle(x, y, r);
        gfx.lineStyle(1.5 * (1 - p), 0xffffff, (1 - p) * 0.5);
        gfx.strokeCircle(x, y, r * 0.5);

        const sparks = 5 + Math.floor(maxRadius / 15);
        for (let i = 0; i < sparks; i++) {
          const a = (i / sparks) * Math.PI * 2 + p * 4;
          const d = r * (0.4 + p * 0.6);
          const sx = x + Math.cos(a) * d;
          const sy = y + Math.sin(a) * d;
          gfx.fillStyle(0xffffff, (1 - p) * 0.7);
          gfx.fillCircle(sx, sy, 1.5 * (1 - p));
        }
      },
    });
    this.time.delayedCall(400, () => gfx.destroy());
  }

  private easeInCubic(t: number): number {
    return t < 1 ? t * t * t : 1;
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
        ["Q", "deploy turret"],
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
    this.exitMenuItems = [];
  }

  private drawExitConfirm() {
    const w = this.scale.width,
      h = this.scale.height;
    const mono = { fontFamily: '"Share Tech Mono", monospace' };

    this.overlayGfx.clear();
    this.overlayGfx.fillStyle(0x000000, 0.75);
    this.overlayGfx.fillRect(0, 0, w, h);

    const cx = w / 2;
    let y = h * 0.38;

    const title = this.add
      .text(cx, y, "// TERMINATE?", {
        ...mono,
        fontSize: "22px",
        color: "#f4f4f5",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(30001)
      .setScrollFactor(0);
    this.overlayTexts.push(title);

    y += 28;

    const sub = this.add
      .text(cx, y, "all context will be lost", {
        ...mono,
        fontSize: "11px",
        color: "#52525b",
      })
      .setOrigin(0.5)
      .setDepth(30001)
      .setScrollFactor(0);
    this.overlayTexts.push(sub);

    y += 36;

    const resumeItem = this.add
      .text(cx, y, "", { ...mono, fontSize: "14px", color: "#00ffee" })
      .setOrigin(0.5)
      .setDepth(30001)
      .setScrollFactor(0);
    this.overlayTexts.push(resumeItem);

    y += 26;

    const terminateItem = this.add
      .text(cx, y, "", { ...mono, fontSize: "14px", color: "#52525b" })
      .setOrigin(0.5)
      .setDepth(30001)
      .setScrollFactor(0);
    this.overlayTexts.push(terminateItem);

    this.exitMenuItems = [resumeItem, terminateItem];
    this.updateExitMenu();
  }

  private updateExitMenu() {
    const labels = ["RESUME", "TERMINATE"];
    for (let i = 0; i < this.exitMenuItems.length; i++) {
      const selected = i === this.exitMenuIndex;
      this.exitMenuItems[i]
        .setText((selected ? "> " : "  ") + labels[i])
        .setColor(selected ? "#00ffee" : "#52525b");
    }
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

  private drawDangerFlash() {
    this.dangerGfx.clear();
    const hpPct = this.player.health / this.player.maxHealth;
    if (hpPct >= 0.4 || this.player.isDead) return;

    const w = this.scale.width,
      h = this.scale.height;
    const severity = 1 - hpPct / 0.4;
    const now = Date.now();
    const heartRate = 0.004 + severity * 0.008;
    const pulse = 0.5 + 0.5 * Math.sin(now * heartRate);
    const hardPulse = Math.pow(pulse, 1.5);

    const edgeW = 80 + severity * 80;
    const baseAlpha = (0.1 + severity * 0.25) * hardPulse;
    const layers = 12;

    for (let i = 0; i < layers; i++) {
      const t = i / layers;
      const a = baseAlpha * (1 - t * t);
      const inset = edgeW * t;
      this.dangerGfx.fillStyle(0xff0033, a);
      this.dangerGfx.fillRect(inset, inset, w - inset * 2, edgeW / layers);
      this.dangerGfx.fillRect(
        inset,
        h - inset - edgeW / layers,
        w - inset * 2,
        edgeW / layers
      );
      this.dangerGfx.fillRect(inset, inset, edgeW / layers, h - inset * 2);
      this.dangerGfx.fillRect(
        w - inset - edgeW / layers,
        inset,
        edgeW / layers,
        h - inset * 2
      );
    }

    if (severity > 0.5) {
      const fullAlpha = (severity - 0.5) * 0.12 * hardPulse;
      this.dangerGfx.fillStyle(0xff0033, fullAlpha);
      this.dangerGfx.fillRect(0, 0, w, h);
    }

    if (hpPct < 0.15) {
      const critPulse = 0.5 + 0.5 * Math.sin(now * 0.018);
      this.dangerGfx.fillStyle(0xff0033, critPulse * 0.06);
      this.dangerGfx.fillRect(0, 0, w, h);
    }

    this.lowHpWarnTimer -= this.game.loop.delta;
    if (this.lowHpWarnTimer <= 0) {
      const interval = 900 - severity * 500;
      this.lowHpWarnTimer = interval;
      audio.play("lowHpWarn");
    }
  }

  private drawCollapse() {
    this.collapseGfx.clear();
    if (this.collapseInset < 1) return;
    const w = this.scale.width,
      h = this.scale.height,
      ci = this.collapseInset;
    const a = 0.25 + Math.sin(Date.now() * 0.003) * 0.1;
    this.collapseGfx.fillStyle(0xff0033, a * 0.35);
    this.collapseGfx.fillRect(0, 0, w, ci);
    this.collapseGfx.fillRect(0, h - ci, w, ci);
    this.collapseGfx.fillRect(0, ci, ci, h - ci * 2);
    this.collapseGfx.fillRect(w - ci, ci, ci, h - ci * 2);
    this.collapseGfx.lineStyle(1, 0xff0033, a * 0.5);
    for (let i = 0; i < 4; i++) {
      const y = Math.random() * ci;
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
      this.combo >= 20
        ? 0xffffff
        : this.combo >= 10
        ? 0xff0080
        : this.combo >= 5
        ? 0x00ffee
        : 0x451bff;
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
