import Phaser from "phaser";

export default class Projectile extends Phaser.GameObjects.Container {
  public vx: number;
  public vy: number;
  public damage: number;
  public lifetime: number;
  public age = 0;
  public radius = 5;
  public fromPlayer: boolean;
  public piercing = false;
  public piercingScale = 1;
  public homing = false;
  public homingStrength = 2.5;
  public homingTargets: { x: number; y: number }[] = [];
  public hitIds = new Set<number>();
  public chainBounces = 0;
  public chainRange = 120;
  public isNova = false;
  public novaRadius = 60;
  public novaDamage = 0;
  public isExplosive = false;
  public explosiveRadius = 70;
  public explosiveDamage = 0;
  public explosiveCluster = false;
  public isLaser = false;
  public critKillExplosion = false;
  public aoeRadius = 0;
  public aoeDamageMult = 0;

  private gfx: Phaser.GameObjects.Graphics;
  public color: number;
  private trail: { x: number; y: number }[] = [];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    color = 0x00ffee,
    lifetime = 1500,
    fromPlayer = true
  ) {
    super(scene, x, y);
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.lifetime = lifetime;
    this.color = color;
    this.fromPlayer = fromPlayer;
    this.gfx = scene.add.graphics();
    this.add(this.gfx);
    this.setDepth(9000);
    scene.add.existing(this);
  }

  update(delta: number): boolean {
    this.age += delta;
    if (this.age > this.lifetime) {
      this.destroy();
      return false;
    }

    if (this.homing && this.homingTargets.length > 0) {
      let nearest: { x: number; y: number } | null = null;
      let nd = 300;
      for (const t of this.homingTargets) {
        const d = Phaser.Math.Distance.Between(this.x, this.y, t.x, t.y);
        if (d < nd) {
          nd = d;
          nearest = t;
        }
      }
      if (nearest) {
        const desired = Math.atan2(nearest.y - this.y, nearest.x - this.x);
        const current = Math.atan2(this.vy, this.vx);
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const turnRate = this.homingStrength * (delta / 1000);
        let diff = desired - current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const newAngle =
          current + Math.sign(diff) * Math.min(Math.abs(diff), turnRate);
        this.vx = Math.cos(newAngle) * speed;
        this.vy = Math.sin(newAngle) * speed;
      }
    }

    this.trail.push({ x: this.x, y: this.y });
    const maxTrail = this.isLaser ? 14 : this.chainBounces > 0 ? 10 : this.piercing ? 8 : 6;
    if (this.trail.length > maxTrail) this.trail.shift();

    this.x += this.vx * (delta / 1000);
    this.y += this.vy * (delta / 1000);

    this.gfx.clear();
    const isChain = this.chainBounces > 0;
    const isPiercing = this.piercing;

    for (let i = 0; i < this.trail.length; i++) {
      const a = (i / this.trail.length) * (isChain ? 0.45 : 0.3);
      this.gfx.fillStyle(this.color, a);
      const tSize = isChain ? 3 : isPiercing ? 3.5 : 2.5;
      this.gfx.fillCircle(
        this.trail[i].x - this.x,
        this.trail[i].y - this.y,
        tSize * (i / this.trail.length)
      );
    }

    if (this.isExplosive) {
      const spin = this.age * 0.004;
      const s = 9;
      // outer rotating square — reads as heavy/angular
      this.gfx.fillStyle(this.color, 0.07);
      for (let i = 0; i < 4; i++) {
        const a = spin + (i / 4) * Math.PI * 2;
        this.gfx.fillTriangle(
          0, 0,
          Math.cos(a) * 18, Math.sin(a) * 18,
          Math.cos(a + Math.PI * 0.5) * 18, Math.sin(a + Math.PI * 0.5) * 18
        );
      }
      // core diamond shape
      const c = Math.cos(spin), sn = Math.sin(spin);
      this.gfx.fillStyle(this.color, 0.85);
      this.gfx.beginPath();
      this.gfx.moveTo(c * s, sn * s);
      this.gfx.lineTo(-sn * s, c * s);
      this.gfx.lineTo(-c * s, -sn * s);
      this.gfx.lineTo(sn * s, -c * s);
      this.gfx.closePath();
      this.gfx.fillPath();
      // inner hot core
      this.gfx.fillStyle(0xffaa00, 0.9);
      this.gfx.beginPath();
      const si = s * 0.5;
      this.gfx.moveTo(c * si, sn * si);
      this.gfx.lineTo(-sn * si, c * si);
      this.gfx.lineTo(-c * si, -sn * si);
      this.gfx.lineTo(sn * si, -c * si);
      this.gfx.closePath();
      this.gfx.fillPath();
      this.gfx.fillStyle(0xffffff, 0.8);
      this.gfx.fillRect(-1.5, -1.5, 3, 3);
      // orbiting fragments for cluster-capable projectiles
      if (this.explosiveCluster) {
        for (let i = 0; i < 4; i++) {
          const fa = spin * 1.5 + (i / 4) * Math.PI * 2;
          const fd = 12 + Math.sin(this.age * 0.01 + i) * 2;
          this.gfx.fillStyle(this.color, 0.6);
          this.gfx.fillRect(
            Math.cos(fa) * fd - 1.5,
            Math.sin(fa) * fd - 1.5,
            3, 3
          );
        }
      }
    } else if (this.isLaser) {
      const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const dirX = spd > 0 ? this.vx / spd : 0;
      const dirY = spd > 0 ? this.vy / spd : 1;
      const len = 28 + this.radius * 2;
      const perpX = -dirY;
      const perpY = dirX;
      const w = this.radius * 0.6;
      this.gfx.fillStyle(this.color, 0.08);
      this.gfx.fillRect(-perpX * w * 3 - dirX * len * 0.5, -perpY * w * 3 - dirY * len * 0.5, w * 6, len);
      this.gfx.fillStyle(this.color, 0.55);
      const hw = w * 1.2;
      this.gfx.beginPath();
      this.gfx.moveTo(-perpX * hw - dirX * len * 0.5, -perpY * hw - dirY * len * 0.5);
      this.gfx.lineTo(perpX * hw - dirX * len * 0.5, perpY * hw - dirY * len * 0.5);
      this.gfx.lineTo(perpX * hw + dirX * len * 0.5, perpY * hw + dirY * len * 0.5);
      this.gfx.lineTo(-perpX * hw + dirX * len * 0.5, -perpY * hw + dirY * len * 0.5);
      this.gfx.closePath();
      this.gfx.fillPath();
      this.gfx.fillStyle(0xffffff, 0.85);
      const cw = w * 0.5;
      this.gfx.beginPath();
      this.gfx.moveTo(-perpX * cw - dirX * len * 0.4, -perpY * cw - dirY * len * 0.4);
      this.gfx.lineTo(perpX * cw - dirX * len * 0.4, perpY * cw - dirY * len * 0.4);
      this.gfx.lineTo(perpX * cw + dirX * len * 0.4, perpY * cw + dirY * len * 0.4);
      this.gfx.lineTo(-perpX * cw + dirX * len * 0.4, -perpY * cw + dirY * len * 0.4);
      this.gfx.closePath();
      this.gfx.fillPath();
    } else if (this.isNova) {
      const pulse = Math.sin(this.age * 0.015) * 2;
      this.gfx.fillStyle(this.color, 0.12);
      this.gfx.fillCircle(0, 0, 16 + pulse);
      this.gfx.fillStyle(this.color, 0.6);
      this.gfx.fillCircle(0, 0, 8);
      this.gfx.fillStyle(0xffffff, 0.95);
      this.gfx.fillCircle(0, 0, 3.5);
      this.gfx.lineStyle(1.5, this.color, 0.5);
      this.gfx.strokeCircle(0, 0, 12 + pulse);
      this.gfx.lineStyle(1, 0xffffff, 0.2);
      this.gfx.strokeCircle(0, 0, 16 + pulse);
    } else if (isChain) {
      this.gfx.fillStyle(this.color, 0.2);
      this.gfx.fillCircle(0, 0, 10);
      this.gfx.fillStyle(this.color, 0.7);
      this.gfx.fillCircle(0, 0, 5);
      this.gfx.fillStyle(0xffffff, 0.95);
      this.gfx.fillCircle(0, 0, 2.5);
      this.gfx.lineStyle(1, this.color, 0.3);
      this.gfx.strokeCircle(0, 0, 8 + Math.sin(this.age * 0.02) * 2);
    } else if (isPiercing) {
      const scale = this.piercingScale;
      this.gfx.fillStyle(this.color, 0.65);
      this.gfx.fillRect(-2 * scale, -8 * scale, 4 * scale, 16 * scale);
      this.gfx.fillStyle(0xffffff, 0.9);
      this.gfx.fillRect(-1 * scale, -6 * scale, 2 * scale, 12 * scale);
    } else {
      this.gfx.fillStyle(this.color, 0.65);
      this.gfx.fillCircle(0, 0, this.radius);
      this.gfx.fillStyle(0xffffff, 0.9);
      this.gfx.fillCircle(0, 0, this.radius * 0.4);
    }

    return true;
  }

  chainBounce(target: { x: number; y: number }) {
    if (this.chainBounces <= 0) return;
    this.chainBounces--;
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.damage *= 0.75;
    this.age = Math.max(0, this.age - 300);
    this.trail = [];
  }
}
