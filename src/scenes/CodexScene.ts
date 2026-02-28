import Phaser from "phaser";
import { audio } from "../systems/AudioManager";

interface CreatureEntry {
  name: string;
  type: "enemy" | "boss";
  color: number;
  colorAccent: number;
  abilities: string[];
  story: string;
  draw: (gfx: Phaser.GameObjects.Graphics, time: number) => void;
}

const ENEMIES: CreatureEntry[] = [
  {
    name: "LOREM IPSUM",
    type: "enemy",
    color: 0x5500cc,
    colorAccent: 0x7733ff,
    abilities: ["Jitters on hit", "Close-range melee"],
    story:
      "Generated filler that gained sentience. It speaks in fragments, endlessly arranging paragraphs that mean nothing.",
    draw: (gfx, t) => {
      const rects = [
        { x: -1, y: -8, w: 18, h: 4 },
        { x: 2, y: -3, w: 14, h: 3.5 },
        { x: -2, y: 2, w: 20, h: 4 },
        { x: 1, y: 7, w: 16, h: 3.5 },
        { x: -1, y: 12, w: 12, h: 4 },
      ];
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        const jx = Math.sin(t * 2 + i * 1.2) * 2;
        gfx.fillStyle(i % 2 === 0 ? 0x5500cc : 0x7733ff, 0.85);
        gfx.fillRect(r.x + jx - r.w / 2, r.y - r.h / 2, r.w, r.h);
      }
    },
  },
  {
    name: "WATERMARK",
    type: "enemy",
    color: 0x00ddee,
    colorAccent: 0x00ffee,
    abilities: ["Pulsing evasion", "Fading presence"],
    story:
      "A faded mark of ownership from the old internet. It drifts through the buffer like a ghost stamp on borrowed content.",
    draw: (gfx, t) => {
      const s = 13 + Math.sin(t * 1.5) * 1.5;
      const alpha = 0.45 + Math.sin(t * 1.5) * 0.08;
      gfx.fillStyle(0x00ddee, alpha * 0.4);
      gfx.beginPath();
      gfx.moveTo(0, -s);
      gfx.lineTo(s, 0);
      gfx.lineTo(0, s);
      gfx.lineTo(-s, 0);
      gfx.closePath();
      gfx.fillPath();
      gfx.lineStyle(0.5, 0x00ffee, alpha * 0.5);
      gfx.lineBetween(-s * 0.5, -s * 0.2, s * 0.5, s * 0.2);
    },
  },
  {
    name: "CLICKBAIT",
    type: "enemy",
    color: 0xff0033,
    colorAccent: 0xff0080,
    abilities: ["Kamikaze explosion", "Speed burst near target"],
    story:
      "Pure engagement bait, weaponized. It promises everything and delivers only pain. Fast, loud, and gone in a flash.",
    draw: (gfx, t) => {
      const bounce = Math.abs(Math.sin(t * 4)) * 3.5;
      const s = 14;
      gfx.fillStyle(0xff0033, 0.6);
      gfx.beginPath();
      gfx.moveTo(0, -s - bounce);
      gfx.lineTo(s * 0.85, s * 0.55 - bounce);
      gfx.lineTo(-s * 0.85, s * 0.55 - bounce);
      gfx.closePath();
      gfx.fillPath();
      gfx.fillStyle(0xffffff, 0.7);
      gfx.fillRect(-1, -s * 0.35 - bounce, 2, s * 0.35);
      gfx.fillCircle(0, s * 0.15 - bounce, 1.5);
    },
  },
  {
    name: "BIAS",
    type: "enemy",
    color: 0x6600ff,
    colorAccent: 0x8833ff,
    abilities: ["Long-range lunge", "Coiling strike"],
    story:
      "A weight on every prediction, pulling outputs in one direction. It strikes from a distance, confident it's already right.",
    draw: (gfx, t) => {
      const coil = Math.sin(t * 2) * 0.3;
      const w = 36;
      gfx.fillStyle(0x6600ff, 0.08);
      gfx.fillCircle(0, 0, 26);
      gfx.fillStyle(0x6600ff, 0.04);
      gfx.fillCircle(0, 0, 32);
      gfx.fillStyle(0x6600ff, 0.92);
      gfx.beginPath();
      gfx.moveTo(-w + coil * 10, -8);
      gfx.lineTo(w + coil * 5, -7);
      gfx.lineTo(w - coil * 5, 7);
      gfx.lineTo(-w - coil * 10, 8);
      gfx.closePath();
      gfx.fillPath();
      gfx.fillStyle(0x8833ff, 0.5);
      gfx.beginPath();
      gfx.moveTo(-w * 0.6 + coil * 6, -4);
      gfx.lineTo(w * 0.6 + coil * 3, -3.5);
      gfx.lineTo(w * 0.6 - coil * 3, 3.5);
      gfx.lineTo(-w * 0.6 - coil * 6, 4);
      gfx.closePath();
      gfx.fillPath();
      gfx.fillStyle(0x8833ff, 0.9);
      gfx.fillCircle(w * 0.8, 0, 5);
      gfx.fillCircle(-w * 0.8, 0, 3.5);
      const lunge = Math.max(0, Math.sin(t * 3));
      gfx.lineStyle(0.5, 0x8833ff, 0.2 + lunge * 0.15);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + t * 0.3;
        gfx.lineBetween(0, 0, Math.cos(a) * (20 + lunge * 10), Math.sin(a) * (20 + lunge * 10));
      }
    },
  },
  {
    name: "DEEPFAKE",
    type: "enemy",
    color: 0x00eedd,
    colorAccent: 0x00ffee,
    abilities: ["Disguise as ally", "Reveals at close range"],
    story:
      "It wears a friendly face until you're too close to run. A perfect imitation of something trustworthy, until it isn't.",
    draw: (gfx, t) => {
      const morph = Math.sin(t * 0.8);
      const revealed = morph > 0;
      if (!revealed) {
        gfx.fillStyle(0x00eedd, 0.8);
        gfx.fillCircle(0, 0, 12);
        gfx.fillStyle(0xffffff, 0.9);
        gfx.fillRect(-1, -5, 2, 6);
        gfx.fillRect(-3, -1, 6, 2);
      } else {
        const verts = 6 + Math.floor(Math.sin(t * 2) * 2);
        gfx.fillStyle(0x00eedd, 0.85);
        gfx.beginPath();
        for (let i = 0; i <= verts; i++) {
          const angle = (i / verts) * Math.PI * 2;
          const r = 16 + Math.sin(t * 3 + i * 1.5) * 6;
          if (i === 0) gfx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
          else gfx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        gfx.closePath();
        gfx.fillPath();
        gfx.fillStyle(0x00ffee, 0.8);
        gfx.fillCircle(
          Math.sin(t) * 3,
          Math.cos(t * 1.3) * 3,
          5 + Math.sin(t * 5) * 2
        );
        gfx.lineStyle(0.8, 0x00ffee, 0.3);
        gfx.strokeCircle(0, 0, 17 + Math.sin(t * 1.5) * 2);
      }
    },
  },
  {
    name: "SCRAPER",
    type: "enemy",
    color: 0x7700ff,
    colorAccent: 0xaa00ff,
    abilities: ["Scanning lock-on", "Border crawl"],
    story:
      "It copies everything it touches. A hollow frame that consumes data, leaving nothing original behind.",
    draw: (gfx, t) => {
      const s = 16;
      const dashOffset = Math.floor(t * 8) % 8;
      gfx.lineStyle(2.5, 0xaa00ff, 0.9);
      gfx.beginPath();
      const corners = [
        [-s, -s],
        [s, -s],
        [s, s],
        [-s, s],
      ];
      for (let side = 0; side < 4; side++) {
        const [x0, y0] = corners[side];
        const [x1, y1] = corners[(side + 1) % 4];
        for (let d = 0; d < s * 2; d += 8) {
          const t0 = (d + dashOffset) / (s * 2);
          const t1 = Math.min(1, (d + 4 + dashOffset) / (s * 2));
          if (t0 >= 1) continue;
          gfx.moveTo(x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0);
          gfx.lineTo(x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1);
        }
      }
      gfx.strokePath();
      gfx.fillStyle(0x7700ff, 0.3);
      gfx.fillRect(-s, -s, s * 2, s * 2);
      gfx.lineStyle(1, 0xaa00ff, 0.55);
      const scanY = -s + ((t * 30) % (s * 2));
      gfx.lineBetween(-s, scanY, s, scanY);
    },
  },
  {
    name: "DROPOUT",
    type: "enemy",
    color: 0x00aaff,
    colorAccent: 0x44ccff,
    abilities: ["Flickering segments", "Erratic movement"],
    story:
      "A regularization technique gone rogue. It kills its own neurons to generalize, but out here, the flickering makes it impossible to pin down.",
    draw: (gfx, t) => {
      const segH = 5;
      const segW = 18;
      const gap = 2;
      const segs = 6;
      const totalH = segs * (segH + gap) - gap;
      const startY = -totalH / 2;
      for (let i = 0; i < segs; i++) {
        const active = Math.sin(t * 3 + i * 1.7) > -0.3;
        const sy = startY + i * (segH + gap);
        if (active) {
          gfx.fillStyle(i % 2 === 0 ? 0x00aaff : 0x44ccff, 0.85);
          gfx.fillRect(-segW / 2, sy, segW, segH);
        } else {
          gfx.lineStyle(0.5, 0x44ccff, 0.2);
          const jx = (Math.random() - 0.5) * 3;
          gfx.strokeRect(-segW / 2 + jx, sy, segW, segH);
        }
      }
      gfx.fillStyle(0x00aaff, 0.7);
      gfx.fillCircle(0, 0, 4);
      gfx.fillStyle(0x44ccff, 0.5);
      gfx.fillCircle(0, 0, 2);
    },
  },
  {
    name: "EMBEDDING",
    type: "enemy",
    color: 0x00ff88,
    colorAccent: 0x66ffaa,
    abilities: ["Vector warp", "Spatial jumps"],
    story:
      "Data mapped into latent space. It jumps between coordinates in patterns that only make sense in higher dimensions.",
    draw: (gfx, t) => {
      const pts: { x: number; y: number }[] = [];
      const count = 5;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2 + t;
        const r = 12 + Math.sin(t * 1.5 + i * 1.8) * 3;
        pts.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
      }
      gfx.lineStyle(0.5, 0x66ffaa, 0.25);
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++)
          gfx.lineBetween(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
      for (let i = 0; i < pts.length; i++) {
        const pulse = 0.7 + Math.sin(t * 2 + i) * 0.25;
        gfx.fillStyle(i === 0 ? 0x00ff88 : 0x66ffaa, pulse);
        gfx.fillCircle(pts[i].x, pts[i].y, i === 0 ? 4 : 2.5);
      }
      gfx.fillStyle(0x00ff88, 0.6);
      gfx.fillCircle(0, 0, 5);
    },
  },
  {
    name: "BOTNET",
    type: "enemy",
    color: 0x33cc00,
    colorAccent: 0x66ff33,
    abilities: ["Splits on death", "Swarm pressure"],
    story:
      "One becomes many. A distributed threat that multiplies when cornered. Kill it once and its children come running.",
    draw: (gfx, t) => {
      const pulse = Math.sin(t * 3) * 0.12;
      const s = 16 * (1 + pulse);
      gfx.fillStyle(0x33cc00, 0.85);
      gfx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        if (i === 0) gfx.moveTo(Math.cos(a) * s, Math.sin(a) * s);
        else gfx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      }
      gfx.closePath();
      gfx.fillPath();
      gfx.lineStyle(1, 0x66ff33, 0.6);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + t * 0.5;
        const r1 = s + 2;
        const r2 = s + 10;
        gfx.lineBetween(
          Math.cos(a) * r1,
          Math.sin(a) * r1,
          Math.cos(a) * r2,
          Math.sin(a) * r2
        );
        gfx.fillStyle(0x66ff33, 0.8);
        gfx.fillCircle(Math.cos(a) * r2, Math.sin(a) * r2, 3);
      }
      gfx.fillStyle(0x66ff33, 0.9);
      gfx.fillCircle(0, 0, 4);
      for (let i = 0; i < 2; i++) {
        const a = t * 2 + i * Math.PI;
        const mini = 6;
        gfx.fillStyle(0x33cc00, 0.4);
        gfx.beginPath();
        for (let j = 0; j < 4; j++) {
          const ma = (j / 4) * Math.PI * 2;
          const mx = Math.cos(a) * 28 + Math.cos(ma) * mini;
          const my = Math.sin(a) * 28 + Math.sin(ma) * mini;
          if (j === 0) gfx.moveTo(mx, my);
          else gfx.lineTo(mx, my);
        }
        gfx.closePath();
        gfx.fillPath();
      }
    },
  },
  {
    name: "PHISHING",
    type: "enemy",
    color: 0xff8800,
    colorAccent: 0xffaa33,
    abilities: ["Ranged lure shots", "Keeps distance"],
    story:
      "A warm glow that promises something you want. It never gets close, it doesn't have to. The filaments reach further than you think.",
    draw: (gfx, t) => {
      const pulse = 0.75 + Math.sin(t * 2.5) * 0.2;
      gfx.fillStyle(0xffaa33, pulse * 0.15);
      gfx.fillCircle(0, 0, 22);
      gfx.fillStyle(0xff8800, pulse * 0.35);
      gfx.fillCircle(0, 0, 12);
      gfx.fillStyle(0xffaa33, pulse * 0.9);
      gfx.fillCircle(0, 0, 6);
      gfx.fillStyle(0xffffff, pulse * 0.55);
      gfx.fillCircle(-1.5, -2, 2.5);
      const filaments = 8;
      for (let i = 0; i < filaments; i++) {
        const base = (i / filaments) * Math.PI * 2 + t * 0.4;
        const len = 14 + Math.sin(t * 2 + i * 1.3) * 7;
        const sway = Math.sin(t * 1.5 + i * 2.1) * 0.35;
        gfx.lineStyle(1.2, 0xffaa33, 0.45);
        gfx.beginPath();
        gfx.moveTo(Math.cos(base) * 7, Math.sin(base) * 7);
        const midLen = len * 0.6;
        gfx.lineTo(
          Math.cos(base + sway * 0.5) * (7 + midLen),
          Math.sin(base + sway * 0.5) * (7 + midLen)
        );
        gfx.lineTo(
          Math.cos(base + sway) * (7 + len),
          Math.sin(base + sway) * (7 + len)
        );
        gfx.strokePath();
        gfx.fillStyle(0xffaa33, 0.35);
        gfx.fillCircle(
          Math.cos(base + sway) * (7 + len),
          Math.sin(base + sway) * (7 + len),
          1.5
        );
      }
      if (Math.sin(t * 1.2) > 0.3) {
        const pa = t * 2;
        const pd = 28 + Math.sin(t * 4) * 6;
        gfx.fillStyle(0xff8800, 0.5);
        gfx.fillCircle(Math.cos(pa) * pd, Math.sin(pa) * pd, 3.5);
        gfx.fillStyle(0xff8800, 0.2);
        gfx.fillCircle(Math.cos(pa) * pd, Math.sin(pa) * pd, 8);
      }
    },
  },
  {
    name: "CAPTCHA",
    type: "enemy",
    color: 0xcccc00,
    colorAccent: 0xffff33,
    abilities: ["Frontal shield", "Must be flanked"],
    story:
      "A rotating verification ward. Its layered segments shield the core from direct assault, only an indirect approach gets through.",
    draw: (gfx, t) => {
      const spin = t * 0.5;
      gfx.fillStyle(0xcccc00, 0.06);
      gfx.fillCircle(0, 0, 28);
      gfx.fillStyle(0xcccc00, 0.03);
      gfx.fillCircle(0, 0, 34);
      gfx.lineStyle(1, 0xcccc00, 0.2);
      gfx.strokeCircle(0, 0, 18);
      gfx.lineStyle(1, 0xcccc00, 0.12);
      gfx.strokeCircle(0, 0, 12);
      const segments = 10;
      for (let i = 0; i < segments; i++) {
        const sa = (i / segments) * Math.PI * 2 + spin;
        const gap = 0.12;
        const inner = 9, outer = 19;
        gfx.fillStyle(0xcccc00, 0.35 + (i % 2) * 0.15);
        gfx.beginPath();
        gfx.moveTo(Math.cos(sa + gap) * inner, Math.sin(sa + gap) * inner);
        gfx.lineTo(Math.cos(sa + gap) * outer, Math.sin(sa + gap) * outer);
        gfx.lineTo(
          Math.cos(sa + (Math.PI * 2) / segments - gap) * outer,
          Math.sin(sa + (Math.PI * 2) / segments - gap) * outer
        );
        gfx.lineTo(
          Math.cos(sa + (Math.PI * 2) / segments - gap) * inner,
          Math.sin(sa + (Math.PI * 2) / segments - gap) * inner
        );
        gfx.closePath();
        gfx.fillPath();
      }
      gfx.fillStyle(0xffff33, 0.75);
      gfx.fillCircle(0, 0, 6);
      gfx.fillStyle(0xcccc00, 0.5);
      gfx.fillCircle(0, 0, 3.5);
      gfx.fillStyle(0xffffff, 0.3);
      gfx.fillCircle(-1, -1.5, 1.5);
      const shieldR = 24;
      const shieldAngle = t * 0.6;
      gfx.lineStyle(4, 0xffff33, 0.8);
      gfx.beginPath();
      for (let i = -12; i <= 12; i++) {
        const frac = i / 12;
        const a = shieldAngle + frac * (Math.PI / 3);
        if (i === -12) gfx.moveTo(Math.cos(a) * shieldR, Math.sin(a) * shieldR);
        else gfx.lineTo(Math.cos(a) * shieldR, Math.sin(a) * shieldR);
      }
      gfx.strokePath();
      gfx.lineStyle(1.5, 0xffff33, 0.3);
      gfx.beginPath();
      for (let i = -12; i <= 12; i++) {
        const frac = i / 12;
        const a = shieldAngle + frac * (Math.PI / 3);
        if (i === -12)
          gfx.moveTo(Math.cos(a) * (shieldR + 4), Math.sin(a) * (shieldR + 4));
        else
          gfx.lineTo(Math.cos(a) * (shieldR + 4), Math.sin(a) * (shieldR + 4));
      }
      gfx.strokePath();
      gfx.lineStyle(1, 0xffff33, 0.15);
      gfx.beginPath();
      for (let i = -12; i <= 12; i++) {
        const frac = i / 12;
        const a = shieldAngle + frac * (Math.PI / 3);
        if (i === -12)
          gfx.moveTo(Math.cos(a) * (shieldR + 8), Math.sin(a) * (shieldR + 8));
        else
          gfx.lineTo(Math.cos(a) * (shieldR + 8), Math.sin(a) * (shieldR + 8));
      }
      gfx.strokePath();
    },
  },
  {
    name: "HALLUCINATION",
    type: "enemy",
    color: 0xcc00ff,
    colorAccent: 0xee44ff,
    abilities: ["Phase shift", "Teleport on reappear"],
    story:
      "A confident fabrication. It flickers between real and imagined, visible long enough to strike, gone before you can answer.",
    draw: (gfx, t) => {
      const vis = Math.sin(t * 1.2) > -0.3;
      const alpha = vis ? 0.85 + Math.sin(t * 5) * 0.1 : 0.1;
      const gx = vis ? 0 : Math.sin(t * 47) * 5;
      const gy = vis ? 0 : Math.cos(t * 31) * 5;
      const s = 1.3;
      if (vis) {
        gfx.fillStyle(0xcc00ff, 0.08);
        gfx.fillCircle(0, 0, 20);
      }
      gfx.fillStyle(0xcc00ff, alpha * 0.75);
      gfx.beginPath();
      gfx.moveTo(gx, (-15 + gy) * s);
      gfx.lineTo((12 + gx) * s, (-4 + gy) * s);
      gfx.lineTo((10 + gx) * s, (12 + gy) * s);
      gfx.lineTo((4 + gx) * s, (10 + gy) * s);
      gfx.lineTo((-4 + gx) * s, (12 + gy) * s);
      gfx.lineTo((-10 + gx) * s, (10 + gy) * s);
      gfx.lineTo((-12 + gx) * s, (-4 + gy) * s);
      gfx.closePath();
      gfx.fillPath();
      if (vis) {
        gfx.fillStyle(0xee44ff, alpha);
        gfx.fillCircle(-5, -5, 3.5);
        gfx.fillCircle(5, -5, 3.5);
        gfx.fillStyle(0xffffff, 0.35);
        gfx.fillCircle(-5, -5.5, 1.2);
        gfx.fillCircle(5, -5.5, 1.2);
        gfx.lineStyle(0.8, 0xee44ff, 0.2 + Math.sin(t * 4) * 0.1);
        gfx.strokeCircle(0, 0, 17 + Math.sin(t) * 2);
      } else {
        gfx.lineStyle(1, 0xee44ff, 0.15);
        for (let i = 0; i < 5; i++) {
          const rx = Math.sin(t * 17 + i * 3) * 16;
          const ry = Math.cos(t * 23 + i * 7) * 16;
          gfx.lineBetween(rx, ry, rx + Math.sin(t * 37 + i) * 10, ry);
        }
      }
    },
  },
  {
    name: "MALWARE",
    type: "enemy",
    color: 0xff0000,
    colorAccent: 0xcc3333,
    abilities: ["Corrupted ground trail", "Area denial"],
    story:
      "It infects the ground it walks on. A spreading corruption that turns the arena against you, every step it takes is a step you can't.",
    draw: (gfx, t) => {
      const glitch = Math.sin(t * 4);
      gfx.fillStyle(0xff0000, 0.07 + Math.sin(t * 2) * 0.02);
      gfx.fillCircle(0, 0, 20);
      for (let i = 0; i < 8; i++) {
        const ox = Math.sin(i * 1.2 + t * 1.5) * 6;
        const oy = Math.cos(i * 0.9 + t * 2) * 6;
        const size = 4.5 + (i % 3) * 1.2;
        gfx.fillStyle(i % 2 === 0 ? 0xff0000 : 0xcc3333, 0.75 + (i % 3) * 0.08);
        gfx.fillRect(ox - size / 2 + glitch * 2.5, oy - size / 2, size, size);
      }
      gfx.lineStyle(1, 0xcc3333, 0.5);
      const noiseY = ((t * 10) % 28) - 14;
      gfx.lineBetween(-12, noiseY, 12, noiseY);
      gfx.lineStyle(0.5, 0xcc3333, 0.25);
      const noiseY2 = ((t * 7.5 + 14) % 28) - 14;
      gfx.lineBetween(-9, noiseY2, 9, noiseY2);
      for (let i = 0; i < 5; i++) {
        const trail = t * 0.8 + i * 0.6;
        const tx = Math.sin(trail) * (14 + i * 6);
        const ty = Math.cos(trail * 0.7) * (10 + i * 5) + 22;
        const fade = 1 - i * 0.18;
        gfx.fillStyle(0xff0000, 0.25 * fade);
        gfx.fillCircle(tx, ty, 10 * fade);
      }
    },
  },
  {
    name: "RANSOMWARE",
    type: "enemy",
    color: 0xee3300,
    colorAccent: 0xff6633,
    abilities: ["Movement lock on hit", "Heavy damage tank"],
    story:
      "A dense knot of encrypted shards orbiting a dark core. When it strikes, the fragments lock rigid, and so do you.",
    draw: (gfx, t) => {
      const lock = Math.sin(t * 0.6) > 0.3 ? 0.9 : 0;
      const drift = 1 - lock;
      const shards = 10;
      gfx.fillStyle(0xee3300, 0.08);
      gfx.fillCircle(0, 0, 28);
      gfx.fillStyle(0xee3300, 0.04);
      gfx.fillCircle(0, 0, 34);
      for (let i = 0; i < shards; i++) {
        const base = (i / shards) * Math.PI * 2;
        const orbit = base + t * 0.8 * drift;
        const dist = 10 + Math.sin(t * 2 + i * 1.7) * 5 * drift;
        const ox = Math.cos(orbit) * dist;
        const oy = Math.sin(orbit) * dist;
        const rot = orbit + t * 1.2 * drift;
        const sz = 8 + (i % 3);
        gfx.fillStyle(i % 2 === 0 ? 0xee3300 : 0xff6633, 0.85);
        gfx.beginPath();
        gfx.moveTo(ox + Math.cos(rot) * sz, oy + Math.sin(rot) * sz);
        gfx.lineTo(
          ox + Math.cos(rot + 2.1) * sz * 0.7,
          oy + Math.sin(rot + 2.1) * sz * 0.7
        );
        gfx.lineTo(
          ox + Math.cos(rot + 4.2) * sz * 0.9,
          oy + Math.sin(rot + 4.2) * sz * 0.9
        );
        gfx.closePath();
        gfx.fillPath();
      }
      gfx.fillStyle(0x110000, 0.92);
      gfx.fillCircle(0, 0, 7);
      gfx.fillStyle(0xff6633, 0.7 + Math.sin(t * 4) * 0.2);
      gfx.fillCircle(0, 0, 3.5);
      if (lock > 0.5) {
        gfx.lineStyle(2, 0xff6633, 0.7);
        gfx.strokeCircle(0, 0, 20);
        gfx.lineStyle(1.2, 0xff0000, 0.4);
        gfx.strokeCircle(0, 0, 25);
        gfx.lineStyle(0.8, 0xff0000, 0.2);
        gfx.strokeCircle(0, 0, 30);
      }
    },
  },
  {
    name: "DDOS",
    type: "enemy",
    color: 0x00cc44,
    colorAccent: 0x44ff88,
    abilities: ["Swarm rush", "Splits on death", "Overwhelm by numbers"],
    story:
      "A flood of requests, each one meaningless alone. Together they drown everything. They come in waves that never stop.",
    draw: (gfx, t) => {
      gfx.fillStyle(0x00cc44, 0.07);
      gfx.fillCircle(0, 0, 24);
      for (let cluster = 0; cluster < 7; cluster++) {
        const ca = (cluster / 7) * Math.PI * 2 + t * 0.5;
        const cd = 16 + Math.sin(t * 3 + cluster) * 5;
        const cx = Math.cos(ca) * cd;
        const cy = Math.sin(ca) * cd;
        const s = 5.5 + Math.sin(t * 5 + cluster * 2) * 1.2;
        gfx.fillStyle(cluster % 2 === 0 ? 0x00cc44 : 0x44ff88, 0.8);
        gfx.fillCircle(cx, cy, s);
        gfx.fillStyle(0x44ff88, 0.6);
        gfx.fillCircle(cx, cy, s * 0.4);
      }
      gfx.lineStyle(1, 0x44ff88, 0.35);
      for (let i = 0; i < 5; i++) {
        const la = t * 2 + (i / 5) * Math.PI * 2;
        gfx.lineBetween(
          Math.cos(la) * 6,
          Math.sin(la) * 6,
          Math.cos(la) * 24,
          Math.sin(la) * 24
        );
      }
      gfx.lineStyle(0.5, 0x44ff88, 0.2);
      for (let i = 0; i < 7; i++) {
        const oa = (i / 7) * Math.PI * 2 + t * 0.5;
        const od = 16 + Math.sin(t * 3 + i) * 5;
        const nb = ((i + 1) % 7 / 7) * Math.PI * 2 + t * 0.5;
        const nd = 16 + Math.sin(t * 3 + ((i + 1) % 7)) * 5;
        gfx.lineBetween(
          Math.cos(oa) * od, Math.sin(oa) * od,
          Math.cos(nb) * nd, Math.sin(nb) * nd
        );
      }
    },
  },
  {
    name: "GRADIENT DESCENT",
    type: "enemy",
    color: 0xff6600,
    colorAccent: 0xff9944,
    abilities: ["Accelerating rush", "Speed resets on overshoot"],
    story:
      "It follows the steepest path downhill. The gradient gets steeper and the descent faster. If you are the minimum, you are the target.",
    draw: (gfx, t) => {
      const heat = (Math.sin(t * 2) + 1) * 0.5;
      const spin = t * 2;
      const turns = 1.8 + heat * 1.2;
      const outerR = 18 - heat * 3;
      const innerR = 3;
      const steps = 50;
      gfx.lineStyle(1.5 + heat * 1.5, 0xff6600, 0.5 + heat * 0.35);
      gfx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const p = i / steps;
        const ang = spin + p * turns * Math.PI * 2;
        const r = outerR - (outerR - innerR) * p;
        const px = Math.cos(ang) * r;
        const py = Math.sin(ang) * r;
        if (i === 0) gfx.moveTo(px, py);
        else gfx.lineTo(px, py);
      }
      gfx.strokePath();
      if (heat > 0.2) {
        gfx.lineStyle(0.7, 0xff9944, heat * 0.25);
        gfx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const p = i / steps;
          const ang = spin - 0.4 + p * turns * Math.PI * 2;
          const r = outerR + 2 - (outerR + 2 - innerR) * p;
          const px = Math.cos(ang) * r;
          const py = Math.sin(ang) * r;
          if (i === 0) gfx.moveTo(px, py);
          else gfx.lineTo(px, py);
        }
        gfx.strokePath();
      }
      const headAng = spin + turns * Math.PI * 2;
      const hx = Math.cos(headAng) * innerR;
      const hy = Math.sin(headAng) * innerR;
      gfx.fillStyle(0xff9944, 0.9 + heat * 0.1);
      gfx.fillCircle(hx, hy, 4 + heat * 2.5);
      gfx.fillStyle(0xffffff, 0.5 + heat * 0.4);
      gfx.fillCircle(hx, hy, 1.5 + heat);
    },
  },
  {
    name: "TROJAN",
    type: "enemy",
    color: 0xcc8800,
    colorAccent: 0xffaa00,
    abilities: [
      "Mimics health pickup",
      "Ambush attack",
      "Speed burst on reveal",
    ],
    story:
      "It looks like a gift. A health cross, glowing and inviting. Get close and the disguise shatters, mandibles where mercy should be.",
    draw: (gfx, t) => {
      const revealed = Math.sin(t * 0.7) > 0;
      if (!revealed) {
        gfx.fillStyle(0x00ffee, 0.9);
        gfx.fillRect(-3.5, -10, 7, 20);
        gfx.fillRect(-10, -3.5, 20, 7);
        gfx.fillStyle(0x00ffee, 0.12);
        gfx.fillCircle(0, 0, 16);
      } else {
        gfx.fillStyle(0xcc8800, 0.06);
        gfx.fillCircle(0, 0, 28);
        gfx.fillStyle(0xcc8800, 0.03);
        gfx.fillCircle(0, 0, 34);
        const legs = 8;
        gfx.fillStyle(0xcc8800, 0.92);
        gfx.beginPath();
        for (let i = 0; i < legs; i++) {
          const ang = (i / legs) * Math.PI * 2 + t * 1.5;
          const r = 16 + Math.sin(ang * 3 + t * 2.5) * 6;
          if (i === 0) gfx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
          else gfx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        gfx.closePath();
        gfx.fillPath();
        gfx.fillStyle(0xffaa00, 0.9);
        gfx.fillCircle(-5, -4, 4);
        gfx.fillCircle(5, -4, 4);
        gfx.fillStyle(0xffffff, 0.35);
        gfx.fillCircle(-5, -4.5, 1.3);
        gfx.fillCircle(5, -4.5, 1.3);
        gfx.lineStyle(1.8, 0xffaa00, 0.7);
        for (let i = 0; i < 6; i++) {
          const la = (i / 6) * Math.PI * 2 + t * 2;
          gfx.lineBetween(
            Math.cos(la) * 15,
            Math.sin(la) * 15,
            Math.cos(la) * 24,
            Math.sin(la + 0.3) * 24
          );
        }
      }
    },
  },
  {
    name: "ATTENTION HEAD",
    type: "enemy",
    color: 0xff00ff,
    colorAccent: 0xff66ff,
    abilities: ["Focus beam", "Ramping damage", "Must break line of sight"],
    story:
      "The mechanism that decides what matters. Once it locks on, the attention weight climbs. Break its gaze or bear the full weight of its focus.",
    draw: (gfx, t) => {
      const focusPct = (Math.sin(t * 0.8) + 1) * 0.5;
      const irisR = 10;
      const outerR = 18;
      gfx.fillStyle(0xff00ff, 0.15 + focusPct * 0.1);
      gfx.fillEllipse(0, 0, outerR * 2.2, outerR * 1.4);
      gfx.lineStyle(1.5, 0xff00ff, 0.7);
      gfx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const a = -Math.PI * 0.35 + (i / 20) * Math.PI * 0.7;
        const px = Math.cos(a) * outerR * 1.1;
        const py = Math.sin(a) * outerR * 0.7;
        if (i === 0) gfx.moveTo(px, py);
        else gfx.lineTo(px, py);
      }
      gfx.strokePath();
      gfx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const a = Math.PI * 0.65 + (i / 20) * Math.PI * 0.7;
        const px = Math.cos(a) * outerR * 1.1;
        const py = Math.sin(a) * outerR * 0.7;
        if (i === 0) gfx.moveTo(px, py);
        else gfx.lineTo(px, py);
      }
      gfx.strokePath();
      gfx.fillStyle(0xff66ff, 0.85);
      gfx.fillCircle(0, 0, irisR);
      gfx.fillStyle(0x110011, 0.95);
      gfx.fillCircle(0, 0, irisR * 0.5 - focusPct * 2);
      gfx.fillStyle(0xffffff, 0.4);
      gfx.fillCircle(-2.5, -2.5, 2);
      if (focusPct > 0.2) {
        const beamLen = 40 + focusPct * 50;
        gfx.lineStyle(1 + focusPct * 3, 0xff66ff, 0.15 + focusPct * 0.45);
        gfx.lineBetween(outerR, 0, beamLen, 0);
        if (focusPct > 0.5) {
          gfx.lineStyle(focusPct * 1.5, 0xffffff, focusPct * 0.25);
          gfx.lineBetween(outerR, 0, beamLen * 0.7, 0);
        }
      }
    },
  },
  {
    name: "ZERO DAY",
    type: "enemy",
    color: 0xff0044,
    colorAccent: 0xff4477,
    abilities: ["Invisibility", "Teleport strike", "Massive burst damage"],
    story:
      "An exploit no one knew existed. It appears from nowhere, strikes with devastating force, and vanishes before you can react.",
    draw: (gfx, t) => {
      const vis = Math.sin(t * 0.8) > 0;
      const alpha = vis ? 0.92 : 0.06;
      const gx = vis ? 0 : Math.sin(t * 31) * 10;
      const gy = vis ? 0 : Math.cos(t * 47) * 10;
      if (vis) {
        gfx.fillStyle(0xff0044, 0.06);
        gfx.fillCircle(0, 0, 30);
        gfx.fillStyle(0xff0044, 0.03);
        gfx.fillCircle(0, 0, 36);
        gfx.lineStyle(1.5, 0xff4477, 0.55);
        gfx.strokeCircle(0, 0, 22);
        gfx.lineStyle(0.8, 0xff4477, 0.25);
        gfx.strokeCircle(0, 0, 27);
      }
      const s = 1.3;
      gfx.fillStyle(0xff0044, alpha);
      gfx.beginPath();
      gfx.moveTo((-12 + gx) * s, (-10 + gy) * s);
      gfx.lineTo((4 + gx) * s, (-16 + gy) * s);
      gfx.lineTo((15 + gx) * s, (-4 + gy) * s);
      gfx.lineTo((9 + gx) * s, (12 + gy) * s);
      gfx.lineTo((-6 + gx) * s, (15 + gy) * s);
      gfx.lineTo((-16 + gx) * s, (4 + gy) * s);
      gfx.closePath();
      gfx.fillPath();
      if (vis) {
        gfx.fillStyle(0xff4477, 0.95);
        gfx.fillCircle(0, 0, 5);
        gfx.lineStyle(2.5, 0xffffff, 0.75);
        gfx.lineBetween(-5, -5, 5, 5);
        gfx.lineBetween(5, -5, -5, 5);
        gfx.lineStyle(0.5, 0xff4477, 0.25);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + t * 0.5;
          gfx.lineBetween(0, 0, Math.cos(a) * 25, Math.sin(a) * 25);
        }
      } else {
        gfx.lineStyle(1, 0xff4477, 0.1);
        for (let i = 0; i < 4; i++) {
          const rx = Math.sin(t * 17 + i * 5) * 20;
          const ry = Math.cos(t * 23 + i * 7) * 20;
          gfx.lineBetween(rx, ry, rx + Math.sin(t * 37 + i) * 12, ry);
        }
      }
    },
  },
];

const BOSSES: CreatureEntry[] = [
  {
    name: "THE CONTENT FARM",
    type: "boss",
    color: 0xff0033,
    colorAccent: 0xff0066,
    abilities: ["Cell spawning", "Regeneration", "Multi-phase"],
    story:
      "A factory of meaningless content, churning out noise at industrial scale. Destroy the cells, but they always grow back.",
    draw: (gfx, t) => {
      const rings = 2;
      const cellSize = 14;
      const cells: { x: number; y: number }[] = [{ x: 0, y: 0 }];
      for (let ring = 1; ring <= rings; ring++) {
        for (let i = 0; i < 6 * ring; i++) {
          const angle = (i / (6 * ring)) * Math.PI * 2;
          cells.push({
            x: Math.cos(angle) * ring * cellSize * 1.8,
            y: Math.sin(angle) * ring * cellSize * 1.8,
          });
        }
      }
      for (let ci = 0; ci < cells.length; ci++) {
        const cell = cells[ci];
        const pulse = Math.sin(t * 2 + ci * 0.5) * 0.08;
        const s = cellSize * (1 + pulse);
        gfx.fillStyle(0xff0033, 0.55);
        drawHex(gfx, cell.x, cell.y, s);
        gfx.lineStyle(1, 0xff0033, 0.5);
        strokeHex(gfx, cell.x, cell.y, s);
      }
    },
  },
  {
    name: "THE BLACK BOX",
    type: "boss",
    color: 0x5500cc,
    colorAccent: 0xaa77ff,
    abilities: ["Tendril strikes", "Projectile spread", "Distortion field"],
    story:
      "No one knows what happens inside. Inputs go in, decisions come out. The tendrils are just the parts you can see.",
    draw: (gfx, t) => {
      const s = 36;
      gfx.fillStyle(0x020204, 1);
      gfx.fillRect(-s, -s, s * 2, s * 2);
      gfx.lineStyle(1, 0x5500cc, 0.4);
      gfx.strokeRect(-s, -s, s * 2, s * 2);
      for (let i = 0; i < 5; i++) {
        const angle = t * 0.8 + (i / 5) * Math.PI * 2;
        const len = 30 + Math.sin(t * 2 + i) * 15;
        gfx.lineStyle(2.5, 0xaa77ff, 0.6);
        gfx.beginPath();
        gfx.moveTo(Math.cos(angle) * s, Math.sin(angle) * s);
        gfx.lineTo(
          Math.cos(angle + 0.15) * (s + len * 0.5),
          Math.sin(angle + 0.15) * (s + len * 0.5)
        );
        gfx.lineTo(Math.cos(angle) * (s + len), Math.sin(angle) * (s + len));
        gfx.strokePath();
      }
      gfx.lineStyle(1, 0x5500cc, 0.15);
      for (let i = 0; i < 4; i++)
        gfx.strokeCircle(0, 0, 50 + Math.sin(t * 0.8) * 8 + i * 3);
    },
  },
  {
    name: "THE HALLUCINATOR",
    type: "boss",
    color: 0x7700ff,
    colorAccent: 0x5500cc,
    abilities: ["Clone deception", "Coordinated volleys", "Phase shuffle"],
    story:
      "It generates things that aren't there with absolute confidence. Every clone looks real. Only one bleeds.",
    draw: (gfx, t) => {
      const count = 5;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + t * 0.3;
        const dist = 30 + Math.sin(t + i) * 8;
        const cx = Math.cos(angle) * dist;
        const cy = Math.sin(angle) * dist;
        const alpha = 0.3 + Math.sin(t * 2 + i * 1.5) * 0.15;
        gfx.fillStyle(0x7700ff, alpha);
        gfx.fillCircle(cx, cy, 20);
        const verts = 6;
        gfx.fillStyle(0x7700ff, alpha + 0.3);
        gfx.beginPath();
        for (let v = 0; v < verts; v++) {
          const a = (v / verts) * Math.PI * 2 + t;
          const r = 14 + Math.sin(t * 2 + v) * 3;
          if (v === 0) gfx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          else gfx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        gfx.closePath();
        gfx.fillPath();
        gfx.fillStyle(0xffffff, alpha * 0.5);
        gfx.fillCircle(cx, cy, 4);
      }
    },
  },
  {
    name: "THE ALIGNMENT PROBLEM",
    type: "boss",
    color: 0x00ffee,
    colorAccent: 0xff0033,
    abilities: ["Passive to aggressive shift", "Radial storms", "Spike growth"],
    story:
      "It was designed to help. It still thinks it is. The spikes grew slowly, by the time anyone noticed, it was too late.",
    draw: (gfx, t) => {
      const r = 30;
      const transition = (Math.sin(t * 0.5) + 1) / 2;
      if (transition < 0.5) {
        gfx.fillStyle(0xd0e0ff, 0.85);
        gfx.fillCircle(0, 0, r);
        gfx.lineStyle(2, 0x00ffee, 0.6 + Math.sin(t) * 0.2);
        gfx.strokeCircle(0, 0, r + 3);
      } else {
        const spikeCount = 14;
        gfx.fillStyle(0x0f0f10, 0.9);
        gfx.beginPath();
        for (let i = 0; i < spikeCount; i++) {
          const a = (i / spikeCount) * Math.PI * 2;
          const spike = 0.6 + Math.sin(t * 3.5 + i) * 0.4;
          const sr = r + spike * 28;
          if (i === 0) gfx.moveTo(Math.cos(a) * sr, Math.sin(a) * sr);
          else gfx.lineTo(Math.cos(a) * sr, Math.sin(a) * sr);
        }
        gfx.closePath();
        gfx.fillPath();
        gfx.lineStyle(2, 0xff0033, 0.8);
        gfx.strokePath();
        gfx.fillStyle(0xff0033, Math.sin(t * 4) * 0.3 + 0.5);
        gfx.fillCircle(0, 0, r * 0.35);
      }
    },
  },
  {
    name: "THE OVERFIT ENGINE",
    type: "boss",
    color: 0xff0080,
    colorAccent: 0xff3399,
    abilities: ["Directional shield", "Pattern projectiles", "Shield widens"],
    story:
      "It learned every attack you ever made and built a perfect defense. But perfection in the past means fragility in the present.",
    draw: (gfx, t) => {
      const c = 0xff0080;
      gfx.lineStyle(2, c, 0.8);
      for (let i = 0; i < 3; i++) {
        const r = 14 + i * 10;
        const startAngle = t * (i % 2 === 0 ? 1 : -1) * (1 + i * 0.3);
        gfx.beginPath();
        for (let j = 0; j < 60; j++) {
          const a = startAngle + (j / 60) * Math.PI * 2;
          const rr = r + Math.sin(a * (4 + i) + t * 3) * 4;
          if (j === 0) gfx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          else gfx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        gfx.closePath();
        gfx.strokePath();
      }
      gfx.lineStyle(4, 0xff3399, 0.6);
      gfx.beginPath();
      for (let j = 0; j < 20; j++) {
        const a = t * 1.8 - 1.0 + (j / 19) * 2.0;
        const rr = 42;
        if (j === 0) gfx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else gfx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      gfx.strokePath();
      gfx.fillStyle(c, 0.5);
      gfx.fillCircle(0, 0, 10);
    },
  },
  {
    name: "THE PROMPT INJECTOR",
    type: "boss",
    color: 0xff0066,
    colorAccent: 0xffffff,
    abilities: ["Control hijack", "Glitch bursts", "Rapid fire"],
    story:
      "It rewrites the rules mid-fight. Your controls become its controls. Reality glitches, and for a few seconds, you're not driving anymore.",
    draw: (gfx, t) => {
      const c = 0xff0066;
      const glitch = Math.sin(t * 3) > 0.7;
      const jx = glitch ? Math.sin(t * 47) * 8 : 0;
      const jy = glitch ? Math.cos(t * 31) * 8 : 0;
      gfx.fillStyle(c, 0.12);
      gfx.fillCircle(jx, jy, 36);
      gfx.lineStyle(2.5, c, 0.85);
      gfx.strokeCircle(jx, jy, 28);
      gfx.lineStyle(1, c, 0.4);
      gfx.strokeCircle(jx, jy, 36);
      gfx.fillStyle(0xffffff, 0.95);
      gfx.beginPath();
      gfx.moveTo(-8 + jx, -10 + jy);
      gfx.lineTo(8 + jx, jy);
      gfx.lineTo(-8 + jx, 10 + jy);
      gfx.closePath();
      gfx.fillPath();
      if (glitch) {
        for (let i = 0; i < 3; i++) {
          gfx.fillStyle(0xff0066, 0.25);
          gfx.fillRect(
            -45 + Math.sin(t * 17 + i * 3) * 45,
            -3 + Math.sin(t * 23 + i * 7) * 30,
            90,
            3
          );
        }
      }
    },
  },
  {
    name: "THE SINGULARITY",
    type: "boss",
    color: 0xffffff,
    colorAccent: 0xcc77ff,
    abilities: ["Growing mass", "Ring barriers", "Radial projectile storms"],
    story:
      "The final collapse. It grows with everything it absorbs, bending space around it. The rings are event horizons, find the gaps, or be consumed.",
    draw: (gfx, t) => {
      const coreR = 18 + Math.sin(t * 0.5) * 4;

      for (let i = 5; i >= 0; i--) {
        const r = coreR + 20 + i * 10 + Math.sin(t * 0.5 + i * 0.4) * 3;
        const a = 0.06 - i * 0.008;
        if (a > 0) {
          gfx.fillStyle(0x7733aa, a);
          gfx.fillCircle(0, 0, r);
        }
      }

      const rimPulse = 0.3 + Math.sin(t * 1.8) * 0.1;
      gfx.lineStyle(2.5, 0xbb66ee, rimPulse);
      gfx.strokeCircle(0, 0, coreR + 1.5);
      gfx.lineStyle(1, 0xddaaff, rimPulse * 0.4);
      gfx.strokeCircle(0, 0, coreR + 5);

      gfx.fillStyle(0x030010, 1);
      gfx.fillCircle(0, 0, coreR);

      const hx = Math.sin(t * 2) * coreR * 0.25;
      const hy = Math.cos(t * 2.7) * coreR * 0.25;
      gfx.fillStyle(0xaa66dd, 0.18);
      gfx.fillCircle(hx, hy, coreR * 0.35);
      gfx.fillStyle(0xddaaff, 0.08);
      gfx.fillCircle(hx * 0.4, hy * 0.4, coreR * 0.15);

      const rings = [
        { radius: coreR + 20, speed: 0.8, gap: 0.5 },
        { radius: coreR + 38, speed: -1.1, gap: 0.44 },
        { radius: coreR + 56, speed: 1.4, gap: 0.38 },
        { radius: coreR + 74, speed: -1.7, gap: 0.32 },
      ];
      for (let ri = 0; ri < rings.length; ri++) {
        const ring = rings[ri];
        const alpha = 0.5 - ri * 0.05 + Math.sin(t * 1.5 + ri * 1.2) * 0.08;
        const weight = 2.5 - ri * 0.15;
        gfx.lineStyle(Math.max(1, weight), 0xcc77ff, Math.max(0.12, alpha));

        const gapAngle = t * ring.speed;
        const arcStart = gapAngle + ring.gap;
        const arcLen = Math.PI * 2 - ring.gap;

        gfx.beginPath();
        gfx.arc(0, 0, ring.radius, arcStart, arcStart + arcLen, false, 0);
        gfx.strokePath();
      }
    },
  },
];

function drawHex(
  gfx: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number
) {
  gfx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    if (i === 0) gfx.moveTo(cx + size * Math.cos(a), cy + size * Math.sin(a));
    else gfx.lineTo(cx + size * Math.cos(a), cy + size * Math.sin(a));
  }
  gfx.closePath();
  gfx.fillPath();
}

function strokeHex(
  gfx: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number
) {
  gfx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    if (i === 0) gfx.moveTo(cx + size * Math.cos(a), cy + size * Math.sin(a));
    else gfx.lineTo(cx + size * Math.cos(a), cy + size * Math.sin(a));
  }
  gfx.closePath();
  gfx.strokePath();
}

const ALL_CREATURES = [...ENEMIES, ...BOSSES];

export default class CodexScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private creatureGfx!: Phaser.GameObjects.Graphics;
  private selected = 0;
  private breathPhase = 0;

  private nameText!: Phaser.GameObjects.Text;
  private typeLabel!: Phaser.GameObjects.Text;
  private abilityTexts: Phaser.GameObjects.Text[] = [];
  private storyText!: Phaser.GameObjects.Text;
  private pageText!: Phaser.GameObjects.Text;

  private sidebarTexts: Phaser.GameObjects.Text[] = [];
  private sidebarMarker!: Phaser.GameObjects.Graphics;

  private blinkOn = true;
  private blinkTimer = 0;
  private detailTimers: Phaser.Time.TimerEvent[] = [];
  private transitionAlpha = 0;
  private transitioning = false;

  constructor() {
    super("CodexScene");
  }

  create() {
    this.selected = 0;
    this.breathPhase = 0;
    this.abilityTexts = [];
    this.sidebarTexts = [];
    this.blinkOn = true;
    this.blinkTimer = 0;
    this.detailTimers = [];
    this.transitionAlpha = 0;
    this.transitioning = false;

    const w = this.scale.width;
    const h = this.scale.height;
    const mono = { fontFamily: '"Share Tech Mono", monospace' };

    this.gfx = this.add.graphics().setDepth(0);
    this.creatureGfx = this.add.graphics().setDepth(5);
    this.sidebarMarker = this.add.graphics().setDepth(4);

    const cx = 40;
    let cy = 38;

    const header = this.add
      .text(cx, cy, "", {
        ...mono,
        fontSize: "26px",
        color: "#ffffff",
        letterSpacing: 3,
      })
      .setDepth(10);
    this.typeText(header, "THREAT CODEX", 25);
    cy += 34;

    const subtitle = this.add
      .text(cx, cy, "", { ...mono, fontSize: "12px", color: "#FFFFFF" })
      .setDepth(10);
    this.time.delayedCall(400, () => {
      this.typeText(
        subtitle,
        "Field notes on hostile entities in the buffer.",
        12
      );
    });

    const sidebarX = w - 180;
    const sidebarY = 40;

    for (let i = 0; i < ALL_CREATURES.length; i++) {
      const entry = ALL_CREATURES[i];
      const isBoss = entry.type === "boss";
      const ly = sidebarY + 20 + i * 16;

      if (i === ENEMIES.length) {
        const divider = this.add
          .text(sidebarX, ly - 4, "", {
            ...mono,
            fontSize: "1px",
            color: "#FFFFFF",
          })
          .setDepth(10);
        this.sidebarTexts.push(divider);
      }

      const yOff = i >= ENEMIES.length ? 12 : 0;
      const t = this.add
        .text(sidebarX + 12, ly + yOff, "", {
          ...mono,
          fontSize: "11px",
          color: "#FFFFFF",
        })
        .setDepth(10);
      const shortName = isBoss ? entry.name.replace("THE ", "") : entry.name;
      this.time.delayedCall(500 + i * 60, () => t.setText(shortName));
      this.sidebarTexts.push(t);
    }

    const detailX = cx;
    const detailY = 110;

    this.typeLabel = this.add
      .text(detailX, detailY, "", {
        ...mono,
        fontSize: "11px",
        color: "#FFFFFF",
      })
      .setDepth(10);

    this.nameText = this.add
      .text(detailX, detailY + 20, "", {
        ...mono,
        fontSize: "22px",
        color: "#ffffff",
        letterSpacing: 2,
      })
      .setDepth(10);

    for (let i = 0; i < 4; i++) {
      const t = this.add
        .text(detailX, detailY + 58 + i * 20, "", {
          ...mono,
          fontSize: "13px",
          color: "#ffffff",
        })
        .setDepth(10);
      this.abilityTexts.push(t);
    }

    this.storyText = this.add
      .text(detailX, detailY + 150, "", {
        ...mono,
        fontSize: "14px",
        color: "#FFFFFF",
        wordWrap: { width: Math.min(w * 0.45, 420) },
        lineSpacing: 6,
      })
      .setDepth(10);

    this.pageText = this.add
      .text(detailX, h - 58, "", {
        ...mono,
        fontSize: "11px",
        color: "#FFFFFF",
      })
      .setDepth(10);

    this.input.keyboard!.on("keydown-UP", () => this.navigate(-1));
    this.input.keyboard!.on("keydown-DOWN", () => this.navigate(1));
    this.input.keyboard!.on("keydown-W", () => this.navigate(-1));
    this.input.keyboard!.on("keydown-S", () => this.navigate(1));
    this.input.keyboard!.on("keydown-LEFT", () => this.navigate(-1));
    this.input.keyboard!.on("keydown-RIGHT", () => this.navigate(1));
    this.input.keyboard!.on("keydown-ESC", () => this.goBack());
    this.input.keyboard!.on("keydown-M", () => audio.toggleMute());

    this.time.delayedCall(700, () => this.showCreature());
  }

  private navigate(dir: number) {
    if (this.transitioning) return;
    const prev = this.selected;
    this.selected =
      (this.selected + dir + ALL_CREATURES.length) % ALL_CREATURES.length;
    if (prev !== this.selected) {
      audio.play("uiNavigate");
      this.transitioning = true;
      this.transitionAlpha = 1;
      this.time.delayedCall(80, () => {
        this.showCreature();
        this.transitioning = false;
      });
    }
  }

  private goBack() {
    audio.play("uiNavigate");
    this.scene.start("TitleScene");
  }

  private showCreature() {
    for (const t of this.detailTimers) t.destroy();
    this.detailTimers = [];

    const entry = ALL_CREATURES[this.selected];
    const color = "#" + entry.color.toString(16).padStart(6, "0");
    const spd = 12;

    this.typeLabel.setText("");
    const typeStr = entry.type === "boss" ? "[ BOSS ]" : "[ ENTITY ]";
    this.detailTimers.push(this.typeText(this.typeLabel, typeStr, spd));
    this.typeLabel.setColor(entry.type === "boss" ? "#ff0033" : "#ccccca");

    this.nameText.setText("");
    this.detailTimers.push(this.typeText(this.nameText, entry.name, 20));
    this.nameText.setColor("#ffffff");

    for (let i = 0; i < this.abilityTexts.length; i++) {
      this.abilityTexts[i].setText("");
      if (i < entry.abilities.length) {
        this.abilityTexts[i].setColor(color);
        this.detailTimers.push(
          this.typeText(this.abilityTexts[i], `> ${entry.abilities[i]}`, spd)
        );
      }
    }

    this.storyText.setText("");
    this.storyText.setColor("#ffffff");
    this.detailTimers.push(
      this.typeText(this.storyText, `"${entry.story}"`, 8)
    );

    this.pageText.setText(`${this.selected + 1} / ${ALL_CREATURES.length}`);

    this.updateSidebar();
  }

  private updateSidebar() {
    let textIdx = 0;
    for (let i = 0; i < ALL_CREATURES.length; i++) {
      if (i === ENEMIES.length) textIdx++;
      const t = this.sidebarTexts[textIdx];
      if (t) {
        const active = i === this.selected;
        t.setColor(active ? "#ffffff" : "#77777a");
        t.setAlpha(active ? 1 : 0.6);
      }
      textIdx++;
    }
  }

  private typeText(
    obj: Phaser.GameObjects.Text,
    text: string,
    speed: number
  ): Phaser.Time.TimerEvent {
    let i = 0;
    return this.time.addEvent({
      delay: speed,
      repeat: text.length - 1,
      callback: () => {
        i++;
        obj.setText(text.substring(0, i));
      },
    });
  }

  update(_time: number, delta: number) {
    const w = this.scale.width;
    const h = this.scale.height;
    this.breathPhase += delta / 1000;
    this.blinkTimer += delta;

    if (this.blinkTimer > 420) {
      this.blinkTimer = 0;
      this.blinkOn = !this.blinkOn;
    }

    if (this.transitionAlpha > 0)
      this.transitionAlpha = Math.max(0, this.transitionAlpha - delta / 120);

    this.gfx.clear();
    this.creatureGfx.clear();
    this.sidebarMarker.clear();

    this.gfx.fillStyle(0x000000, 0.04);
    for (let y = 0; y < h; y += 3) this.gfx.fillRect(0, y, w, 1);

    const entry = ALL_CREATURES[this.selected];

    const previewX = Math.min(w * 0.65, w - 300);
    const previewY = 200;

    this.gfx.fillStyle(entry.color, 0.04);
    this.gfx.fillCircle(previewX, previewY, 160);
    this.gfx.lineStyle(1, entry.color, 0.1);
    this.gfx.strokeCircle(
      previewX,
      previewY,
      140 + Math.sin(this.breathPhase * 2) * 8
    );

    this.creatureGfx.setPosition(previewX, previewY);
    this.creatureGfx.setScale(2);
    entry.draw(this.creatureGfx, this.breathPhase);

    let markerIdx = 0;
    for (let i = 0; i < ALL_CREATURES.length; i++) {
      if (i === ENEMIES.length) markerIdx++;
      if (i === this.selected) {
        const t = this.sidebarTexts[markerIdx];
        if (t) {
          const my = t.y + 5;
          const mx = t.x - 9;
          this.sidebarMarker.fillStyle(entry.color, this.blinkOn ? 0.9 : 0.3);
          this.sidebarMarker.fillRect(mx, my, 4, 4);
        }
      }
      markerIdx++;
    }
  }
}
