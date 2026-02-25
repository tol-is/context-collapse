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

  private gfx: Phaser.GameObjects.Graphics;
  private color: number;
  private trail: { x: number; y: number }[] = [];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    color = 0x38bdf8,
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
    const maxTrail = this.chainBounces > 0 ? 10 : this.piercing ? 8 : 6;
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

    if (isChain) {
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
