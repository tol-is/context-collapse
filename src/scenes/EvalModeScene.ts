import Phaser from "phaser";
import Cursor, {
  type SystemPrompt,
  type WeaponMod,
  WEAPON_MOD_COLORS,
  WEAPON_MOD_NAMES,
  CLASS_STATS,
} from "../objects/Cursor";
import Projectile from "../objects/Projectile";
import Enemy, { type EnemyType } from "../objects/Enemy";
import { audio } from "../systems/AudioManager";

const ALL_WEAPONS: WeaponMod[] = [
  null,
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
];

const WAVE_POOL: EnemyType[][] = [
  ["loremIpsum", "watermark"],
  ["loremIpsum", "watermark", "clickbait"],
  ["clickbait", "botnet", "deepfake", "scraper"],
  ["botnet", "deepfake", "scraper", "malware", "overfit", "phishing"],
  ["malware", "overfit", "phishing", "hallucination", "ddos", "bias"],
  ["bias", "ddos", "captcha", "ransomware", "trojan", "zeroDay"],
  [
    "loremIpsum", "watermark", "clickbait",
    "botnet", "deepfake", "scraper", "overfit",
    "malware", "phishing", "hallucination", "ddos",
    "bias", "captcha", "ransomware", "trojan", "zeroDay",
  ],
];

export default class EvalModeScene extends Phaser.Scene {
  private player!: Cursor;
  private projectiles: Projectile[] = [];
  private enemies: Enemy[] = [];
  private systemPrompt: SystemPrompt = "autocomplete";

  private wave = 0;
  private waveActive = false;
  private spawnQueue: { type: EnemyType; delay: number }[] = [];
  private spawnAccum = 0;
  private waveEnemiesSpawned = 0;
  private waveEnemiesTotal = 0;

  private selectedWeapon = 0;
  private weaponTier = 1;
  private totalKills = 0;
  private combo = 0;
  private comboTimer = 0;
  private chargeRegenTimer = 0;

  private pickups: {
    x: number;
    y: number;
    type: "health" | "token";
    age: number;
    collected: boolean;
  }[] = [];

  private dead = false;
  private deathMenuIndex = 0;
  private deathMenuItems: Phaser.GameObjects.Text[] = [];

  private arenaGfx!: Phaser.GameObjects.Graphics;
  private pickupGfx!: Phaser.GameObjects.Graphics;
  private hudGfx!: Phaser.GameObjects.Graphics;
  private weaponBarGfx!: Phaser.GameObjects.Graphics;
  private comboGfx!: Phaser.GameObjects.Graphics;
  private overlayGfx!: Phaser.GameObjects.Graphics;
  private dangerGfx!: Phaser.GameObjects.Graphics;
  private texts: Record<string, Phaser.GameObjects.Text> = {};
  private overlayTexts: Phaser.GameObjects.Text[] = [];
  private msgText!: Phaser.GameObjects.Text;
  private subMsgText!: Phaser.GameObjects.Text;

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
    space: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super("EvalModeScene");
  }

  init(data: { systemPrompt?: SystemPrompt }) {
    this.systemPrompt = data.systemPrompt ?? "autocomplete";
    this.wave = 0;
    this.waveActive = false;
    this.spawnQueue = [];
    this.spawnAccum = 0;
    this.waveEnemiesSpawned = 0;
    this.waveEnemiesTotal = 0;
    this.projectiles = [];
    this.enemies = [];
    this.pickups = [];
    this.selectedWeapon = 0;
    this.weaponTier = 1;
    this.totalKills = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.chargeRegenTimer = 0;
    this.dead = false;
    this.deathMenuIndex = 0;
    this.deathMenuItems = [];
    this.overlayTexts = [];
  }

  create() {
    const w = this.scale.width,
      h = this.scale.height;
    const mono = { fontFamily: '"Share Tech Mono", monospace' };

    this.arenaGfx = this.add.graphics().setDepth(0);
    this.pickupGfx = this.add.graphics().setDepth(8000);
    this.comboGfx = this.add.graphics().setDepth(20500);
    this.weaponBarGfx = this.add.graphics().setDepth(20001);
    this.hudGfx = this.add.graphics().setDepth(20000);
    this.overlayGfx = this.add.graphics().setDepth(30000).setScrollFactor(0);
    this.dangerGfx = this.add.graphics().setDepth(19000).setScrollFactor(0);

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

    const font = { ...mono, fontSize: "13px", color: "#bb88dd" };
    this.texts.mode = this.add
      .text(8, 6, "EVAL", { ...font, color: "#52525b", fontSize: "11px" })
      .setDepth(20002)
      .setScrollFactor(0);
    this.texts.wave = this.add
      .text(60, 6, "", { ...font, fontSize: "13px", color: "#f4f4f5" })
      .setDepth(20002)
      .setScrollFactor(0);
    this.texts.hp = this.add
      .text(10, 0, "", font)
      .setDepth(20002)
      .setScrollFactor(0);
    this.texts.kills = this.add
      .text(0, 0, "", { ...font, color: "#ff0080" })
      .setDepth(20002)
      .setScrollFactor(0);
    this.texts.weapon = this.add
      .text(0, 0, "", { ...font, fontSize: "11px" })
      .setDepth(20002)
      .setScrollFactor(0);
    this.texts.tabHint = this.add
      .text(0, 0, "TAB", { ...font, fontSize: "9px", color: "#3f3f46" })
      .setDepth(20002)
      .setScrollFactor(0);
    this.texts.combo = this.add
      .text(0, 0, "", { ...font, fontSize: "12px" })
      .setDepth(20002)
      .setScrollFactor(0);
    this.texts.prompt = this.add
      .text(10, 0, "", { ...font, color: "#7700ff" })
      .setDepth(20002)
      .setScrollFactor(0);

    this.player = new Cursor(this, w / 2, h / 2, this.systemPrompt);
    this.applyWeapon();

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
      space: this.input.keyboard!.addKey("SPACE"),
    };

    this.input.keyboard!.addCapture("TAB");
    this.input.keyboard!.on("keydown-TAB", () => {
      if (this.dead) return;
      this.selectedWeapon = (this.selectedWeapon + 1) % ALL_WEAPONS.length;
      this.applyWeapon();
      audio.play("uiNavigate");
    });
    this.input.keyboard!.on("keydown-M", () => audio.toggleMute());
    this.input.keyboard!.on("keydown-ESC", () => {
      this.scene.start("TitleScene");
    });

    const deathNav = (dir: number) => {
      if (!this.dead || this.deathMenuItems.length === 0) return;
      this.deathMenuIndex =
        (this.deathMenuIndex + dir + 2) % 2;
      audio.play("uiNavigate");
      this.updateDeathMenu();
    };
    this.input.keyboard!.on("keydown-UP", () => deathNav(-1));
    this.input.keyboard!.on("keydown-DOWN", () => deathNav(1));
    this.input.keyboard!.on("keydown-W", () => deathNav(-1));
    this.input.keyboard!.on("keydown-S", () => deathNav(1));

    this.input.keyboard!.on("keydown-ENTER", () => {
      if (!this.dead) return;
      if (this.deathMenuIndex === 0) {
        this.scene.start("EvalModeScene", {
          systemPrompt: this.systemPrompt,
        });
      } else {
        this.scene.start("TitleScene");
      }
    });

    this.showMessage("EVAL MODE", "TAB to switch weapons", 2200);
    this.time.delayedCall(1500, () => this.startNextWave());
  }

  private get zone() {
    return Math.min(7, Math.ceil(this.wave / 2));
  }

  private getArenaBounds() {
    const w = this.scale.width,
      h = this.scale.height;
    return { x: 8, y: 22, w: w - 16, h: h - 22 - 54 };
  }

  private applyWeapon() {
    const mod = ALL_WEAPONS[this.selectedWeapon];
    if (mod === null) {
      this.player.weaponMod = null;
      this.player.weaponModTimer = 0;
    } else {
      this.player.setWeaponMod(mod, 999999);
    }
    this.player.weaponTier = this.weaponTier;
  }

  // ===== Waves =====
  private startNextWave() {
    this.wave++;
    this.waveActive = true;
    this.waveEnemiesSpawned = 0;
    this.spawnAccum = 0;

    this.weaponTier = Math.min(5, Math.ceil(this.wave / 2));
    this.player.weaponTier = this.weaponTier;
    this.applyWeapon();

    if (this.player.promptCharges < this.player.maxPromptCharges) {
      this.player.promptCharges = Math.min(
        this.player.maxPromptCharges,
        this.player.promptCharges + 1
      );
    }

    const count = 12 + this.wave * 5;
    this.waveEnemiesTotal = count;
    this.buildSpawnQueue(count);

    if (this.wave > 1) {
      this.showMessage(`WAVE ${this.wave}`, `tier ${this.weaponTier}`, 1200);
    }
  }

  private buildSpawnQueue(total: number) {
    const pool = WAVE_POOL[Math.min(this.zone - 1, WAVE_POOL.length - 1)];
    this.spawnQueue = [];
    const baseInterval = Math.max(140, 520 - this.wave * 22);
    const jitter = baseInterval * 0.5;
    let accum = 300;
    for (let i = 0; i < total; i++) {
      const type = pool[Math.floor(Math.random() * pool.length)];
      this.spawnQueue.push({ type, delay: accum });
      accum += baseInterval + (Math.random() - 0.5) * jitter;
    }
    this.spawnQueue.sort((a, b) => a.delay - b.delay);
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
    this.waveEnemiesSpawned++;
  }

  // ===== Special Ability =====
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
    return nearest;
  }

  // ===== Main Loop =====
  update(_time: number, delta: number) {
    if (this.dead) return;

    this.updateInput(delta);
    this.updateSpawnQueue(delta);
    this.updateEnemies(delta);
    this.updateProjectiles(delta);
    this.updatePickups(delta);
    this.updateCombo(delta);
    this.updateChargeRegen(delta);
    this.keepWeaponAlive();
    this.checkCollisions();
    this.checkWaveProgress();
    this.checkPlayerDeath();
    this.drawArena();
    this.drawPickups();
    this.drawDangerFlash();
    this.drawCombo();
    this.drawHUD();
    this.drawWeaponBar();
  }

  private keepWeaponAlive() {
    if (this.player.weaponMod && this.player.weaponModTimer < 500000) {
      this.player.weaponModTimer = 999999;
    }
  }

  private updateChargeRegen(delta: number) {
    if (
      this.player.promptCharges < this.player.maxPromptCharges &&
      this.player.currentPromptCd <= 0
    ) {
      this.chargeRegenTimer += delta;
      if (this.chargeRegenTimer >= 10000) {
        this.chargeRegenTimer = 0;
        this.player.promptCharges++;
      }
    } else {
      this.chargeRegenTimer = 0;
    }
  }

  // ===== Input =====
  private updateInput(delta: number) {
    let mx = 0,
      my = 0;
    if (this.keys.a.isDown || this.keys.left.isDown) mx--;
    if (this.keys.d.isDown || this.keys.right.isDown) mx++;
    if (this.keys.w.isDown || this.keys.up.isDown) my--;
    if (this.keys.s.isDown || this.keys.down.isDown) my++;

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
  }

  // ===== Spawn Queue =====
  private updateSpawnQueue(delta: number) {
    if (!this.waveActive || this.spawnQueue.length === 0) return;
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
        if (e.enemyType !== "phishing") {
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
        if (p.type === "health") {
          this.player.heal(20 + this.zone * 8);
        }
      }
    }
  }

  private updateCombo(delta: number) {
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) this.combo = 0;
    }
  }

  private registerKill() {
    this.totalKills++;
    this.combo++;
    this.comboTimer = 3500;

    if (this.combo >= 20) {
      this.player.heal(10);
    } else if (this.combo >= 10) {
      this.player.heal(5);
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
          if (
            this.player.systemPrompt === "analyze" &&
            enemy.health / enemy.maxHealth < 0.4
          )
            dmg *= 1.25;
          const comboDmg =
            this.combo >= 20
              ? 1.6
              : this.combo >= 10
                ? 1.35
                : this.combo >= 5
                  ? 1.15
                  : 1;
          dmg *= comboDmg;
          const killed = enemy.takeDamage(dmg);
          if (killed) {
            this.registerKill();
            this.spawnPickup(enemy.x, enemy.y);
            this.handleDeathEffects(enemy);
          }
          if (proj.isNova) {
            this.spawnNovaExplosion(
              enemy.x,
              enemy.y,
              proj.novaDamage,
              proj.novaRadius,
              proj.color
            );
            proj.destroy();
            this.projectiles.splice(pi, 1);
            break;
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

  private spawnPickup(x: number, y: number) {
    if (Math.random() < 0.28 + (this.combo >= 10 ? 0.1 : 0)) {
      this.pickups.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        type: "health",
        age: 0,
        collected: false,
      });
    }
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

  private spawnNovaExplosion(
    x: number,
    y: number,
    damage: number,
    novaRadius: number,
    color: number
  ) {
    const gfx = this.add.graphics().setDepth(9500);
    let r = 8;
    const timer = this.time.addEvent({
      delay: 16,
      repeat: 20,
      callback: () => {
        r += (novaRadius - 8) / 15;
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
      if (
        !e.isDead &&
        Phaser.Math.Distance.Between(x, y, e.x, e.y) < novaRadius
      ) {
        const killed = e.takeDamage(damage);
        if (killed) {
          this.registerKill();
          this.spawnPickup(e.x, e.y);
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
    this.cameras.main.shake(200, 0.008);
    const gfx = this.add.graphics().setDepth(9500);
    let r = 6;
    const timer = this.time.addEvent({
      delay: 16,
      repeat: 25,
      callback: () => {
        r += (blastRadius - 6) / 18;
        gfx.clear();
        const p = timer.getProgress();
        gfx.fillStyle(0xff6600, (1 - p) * 0.2);
        gfx.fillCircle(x, y, r);
        gfx.lineStyle(4 * (1 - p), color, (1 - p) * 0.95);
        gfx.strokeCircle(x, y, r);
        gfx.lineStyle(2 * (1 - p), 0xffaa00, (1 - p) * 0.7);
        gfx.strokeCircle(x, y, r * 0.7);
        gfx.fillStyle(0xffffff, (1 - p) * 0.4);
        gfx.fillCircle(x, y, r * 0.2);
        for (let i = 0; i < 6; i++) {
          const ea = (i / 6) * Math.PI * 2 + p * 3;
          const ed = r * (0.6 + p * 0.4);
          gfx.fillStyle(0xff8800, (1 - p) * 0.6);
          gfx.fillCircle(x + Math.cos(ea) * ed, y + Math.sin(ea) * ed, 3 * (1 - p));
        }
      },
    });
    this.time.delayedCall(450, () => gfx.destroy());

    for (const e of this.enemies) {
      if (
        !e.isDead &&
        Phaser.Math.Distance.Between(x, y, e.x, e.y) < blastRadius
      ) {
        const killed = e.takeDamage(damage);
        if (killed) {
          this.registerKill();
          this.spawnPickup(e.x, e.y);
          this.handleDeathEffects(e);
        }
      }
    }

    if (cluster) {
      for (let c = 0; c < 4; c++) {
        const ca = (c / 4) * Math.PI * 2 + Math.random() * 0.5;
        const cd = blastRadius * 0.5 + Math.random() * 20;
        const cx = x + Math.cos(ca) * cd;
        const cy = y + Math.sin(ca) * cd;
        this.time.delayedCall(80 + c * 60, () => {
          const cgfx = this.add.graphics().setDepth(9500);
          let cr = 4;
          const subR = blastRadius * 0.45;
          const ct = this.time.addEvent({
            delay: 16,
            repeat: 15,
            callback: () => {
              cr += (subR - 4) / 12;
              cgfx.clear();
              const cp = ct.getProgress();
              cgfx.fillStyle(0xff4400, (1 - cp) * 0.15);
              cgfx.fillCircle(cx, cy, cr);
              cgfx.lineStyle(2 * (1 - cp), 0xff6600, (1 - cp) * 0.8);
              cgfx.strokeCircle(cx, cy, cr);
            },
          });
          this.time.delayedCall(300, () => cgfx.destroy());
          for (const e of this.enemies) {
            if (
              !e.isDead &&
              Phaser.Math.Distance.Between(cx, cy, e.x, e.y) < subR
            ) {
              const killed = e.takeDamage(damage * 0.5);
              if (killed) {
                this.registerKill();
                this.spawnPickup(e.x, e.y);
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
      for (let s = 0; s < 2; s++) {
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

  // ===== Wave Progress =====
  private checkWaveProgress() {
    if (!this.waveActive) return;
    const allSpawned =
      this.waveEnemiesSpawned >= this.waveEnemiesTotal &&
      this.spawnQueue.length === 0;
    const allDead = this.enemies.filter((e) => !e.isDead).length === 0;

    if (allSpawned && allDead) {
      this.waveActive = false;
      audio.play("layerComplete");
      this.time.delayedCall(1500, () => {
        if (!this.dead) this.startNextWave();
      });
    }
  }

  private checkPlayerDeath() {
    if (this.player.isDead && !this.dead) {
      this.dead = true;
      audio.play("gameOver");
      this.time.delayedCall(800, () => this.showDeathOverlay());
    }
  }

  private showDeathOverlay() {
    const w = this.scale.width,
      h = this.scale.height;
    const mono = { fontFamily: '"Share Tech Mono", monospace' };

    this.overlayGfx.fillStyle(0x000000, 0.8);
    this.overlayGfx.fillRect(0, 0, w, h);

    const cx = w / 2;
    let y = h * 0.3;

    const title = this.add
      .text(cx, y, "CONTEXT LOST", {
        ...mono,
        fontSize: "28px",
        color: "#f4f4f5",
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setDepth(30001)
      .setScrollFactor(0);
    this.overlayTexts.push(title);
    y += 50;

    const divider = this.add
      .text(cx, y, "─".repeat(20), {
        ...mono,
        fontSize: "12px",
        color: "#27272a",
      })
      .setOrigin(0.5)
      .setDepth(30001)
      .setScrollFactor(0);
    this.overlayTexts.push(divider);
    y += 30;

    const stats: [string, string][] = [
      ["WAVE", `${this.wave}`],
      ["KILLS", `${this.totalKills}`],
    ];
    for (const [label, val] of stats) {
      const labelT = this.add
        .text(cx - 60, y, label, {
          ...mono,
          fontSize: "13px",
          color: "#71717a",
        })
        .setOrigin(0, 0.5)
        .setDepth(30001)
        .setScrollFactor(0);
      const valT = this.add
        .text(cx + 60, y, val, {
          ...mono,
          fontSize: "13px",
          color: "#f4f4f5",
        })
        .setOrigin(1, 0.5)
        .setDepth(30001)
        .setScrollFactor(0);
      this.overlayTexts.push(labelT, valT);
      y += 24;
    }
    y += 30;

    const retry = this.add
      .text(cx, y, "", { ...mono, fontSize: "14px", color: "#00ffee" })
      .setOrigin(0.5)
      .setDepth(30001)
      .setScrollFactor(0);
    this.overlayTexts.push(retry);
    y += 26;
    const exit = this.add
      .text(cx, y, "", { ...mono, fontSize: "14px", color: "#52525b" })
      .setOrigin(0.5)
      .setDepth(30001)
      .setScrollFactor(0);
    this.overlayTexts.push(exit);

    this.deathMenuItems = [retry, exit];
    this.deathMenuIndex = 0;
    this.updateDeathMenu();
  }

  private updateDeathMenu() {
    const labels = ["RETRY", "EXIT"];
    for (let i = 0; i < this.deathMenuItems.length; i++) {
      const selected = i === this.deathMenuIndex;
      this.deathMenuItems[i]
        .setText((selected ? "> " : "  ") + labels[i])
        .setColor(selected ? "#00ffee" : "#52525b");
    }
  }

  // ===== Messages =====
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

  // ===== Drawing =====
  private drawDangerFlash() {
    this.dangerGfx.clear();
    const hpPct = this.player.health / this.player.maxHealth;
    if (hpPct >= 0.25 || this.player.isDead) return;

    const w = this.scale.width,
      h = this.scale.height;
    const severity = 1 - hpPct / 0.25;
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * (0.004 + severity * 0.006));
    const baseAlpha = (0.08 + severity * 0.18) * pulse;
    const edgeW = 60 + severity * 40;

    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      const a = baseAlpha * (1 - t);
      const inset = edgeW * t;
      this.dangerGfx.fillStyle(0xff0033, a);
      this.dangerGfx.fillRect(inset, inset, w - inset * 2, edgeW / 8);
      this.dangerGfx.fillRect(inset, h - inset - edgeW / 8, w - inset * 2, edgeW / 8);
      this.dangerGfx.fillRect(inset, inset, edgeW / 8, h - inset * 2);
      this.dangerGfx.fillRect(w - inset - edgeW / 8, inset, edgeW / 8, h - inset * 2);
    }
  }

  private drawArena() {
    const w = this.scale.width,
      h = this.scale.height;
    this.arenaGfx.clear();
    this.arenaGfx.lineStyle(1, 0x331155, 0.12);
    for (let x = 0; x < w; x += 32) this.arenaGfx.lineBetween(x, 0, x, h);
    for (let y = 0; y < h; y += 32) this.arenaGfx.lineBetween(0, y, w, y);
  }

  private drawPickups() {
    this.pickupGfx.clear();
    for (const p of this.pickups) {
      if (p.collected) continue;
      const bob = Math.sin(p.age * 0.005) * 3;
      const fade = p.age > 8000 ? 1 - (p.age - 8000) / 2000 : 1;
      this.pickupGfx.fillStyle(0x00ffee, 0.9 * fade);
      this.pickupGfx.fillRect(p.x - 2, p.y - 5 + bob, 4, 10);
      this.pickupGfx.fillRect(p.x - 5, p.y - 2 + bob, 10, 4);
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

  private drawHUD() {
    const w = this.scale.width,
      h = this.scale.height;
    this.hudGfx.clear();

    this.texts.wave.setText(`W${this.wave}`).setPosition(60, 6);

    const botY = h - 24;
    this.hudGfx.fillStyle(0x000000, 0.35);
    this.hudGfx.fillRect(0, botY, w, 24);

    const hpPct = this.player.health / this.player.maxHealth;
    const hpColor =
      hpPct > 0.5 ? "#00ffee" : hpPct > 0.25 ? "#ff0080" : "#ff0033";
    this.texts.hp
      .setText(`HP [${this.bar(hpPct, 10)}] ${Math.ceil(this.player.health)}`)
      .setPosition(10, botY + 5)
      .setColor(hpColor);

    this.texts.kills
      .setText(`KL:${this.totalKills}`)
      .setPosition(200, botY + 5);

    const cdPct =
      this.player.currentPromptCd > 0
        ? ` ${Math.ceil(this.player.currentPromptCd / 1000)}s`
        : "";
    const charges =
      "\u25C6".repeat(this.player.promptCharges) +
      "\u25C7".repeat(
        this.player.maxPromptCharges - this.player.promptCharges
      );
    this.texts.prompt
      .setText(`E [${charges}]${cdPct}`)
      .setPosition(270, botY + 5);

    const mod = ALL_WEAPONS[this.selectedWeapon];
    if (mod) {
      const wc =
        "#" + WEAPON_MOD_COLORS[mod].toString(16).padStart(6, "0");
      this.texts.weapon
        .setText(WEAPON_MOD_NAMES[mod])
        .setColor(wc)
        .setPosition(w / 2 - 50, botY + 5)
        .setAlpha(1);
    } else {
      this.texts.weapon
        .setText("BASE")
        .setColor(
          "#" +
            CLASS_STATS[this.systemPrompt].color.toString(16).padStart(6, "0")
        )
        .setPosition(w / 2 - 50, botY + 5)
        .setAlpha(0.7);
    }
    this.texts.tabHint
      .setPosition(w / 2 + 42, botY + 7)
      .setAlpha(0.5);

    if (this.combo >= 3) {
      const cc =
        this.combo >= 10
          ? "#ff0080"
          : this.combo >= 5
            ? "#00ffee"
            : "#bb88dd";
      const label =
        this.combo >= 10
          ? "RAMPAGE"
          : this.combo >= 5
            ? "STREAK"
            : "COMBO";
      this.texts.combo
        .setText(`${label} x${this.combo}`)
        .setColor(cc)
        .setPosition(w - 110, botY + 5)
        .setAlpha(1);
    } else {
      this.texts.combo.setAlpha(0);
    }
  }

  private drawWeaponBar() {
    const w = this.scale.width,
      h = this.scale.height;
    this.weaponBarGfx.clear();

    const barY = h - 50;
    const totalW = ALL_WEAPONS.length * 16;
    const startX = w / 2 - totalW / 2;

    for (let i = 0; i < ALL_WEAPONS.length; i++) {
      const mod = ALL_WEAPONS[i];
      const selected = i === this.selectedWeapon;
      const cx = startX + i * 16 + 8;
      const cy = barY;

      let color: number;
      if (mod === null) {
        color = CLASS_STATS[this.systemPrompt].color;
      } else {
        color = WEAPON_MOD_COLORS[mod];
      }

      if (selected) {
        this.weaponBarGfx.fillStyle(color, 0.12);
        this.weaponBarGfx.fillCircle(cx, cy, 8);
        this.weaponBarGfx.fillStyle(color, 0.95);
        this.weaponBarGfx.beginPath();
        this.weaponBarGfx.moveTo(cx, cy - 5);
        this.weaponBarGfx.lineTo(cx + 5, cy);
        this.weaponBarGfx.lineTo(cx, cy + 5);
        this.weaponBarGfx.lineTo(cx - 5, cy);
        this.weaponBarGfx.closePath();
        this.weaponBarGfx.fillPath();
        this.weaponBarGfx.lineStyle(1, color, 0.5);
        this.weaponBarGfx.strokeCircle(cx, cy, 8);
      } else {
        this.weaponBarGfx.fillStyle(color, 0.35);
        this.weaponBarGfx.fillCircle(cx, cy, 2.5);
      }
    }
  }

  private bar(pct: number, len: number): string {
    const f = Math.round(pct * len);
    return "\u2588".repeat(f) + "\u2591".repeat(len - f);
  }
}
