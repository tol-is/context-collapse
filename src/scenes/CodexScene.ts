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
      const s = 16 + Math.sin(t * 1.5) * 2;
      const alpha = 0.65 + Math.sin(t * 1.5) * 0.1;
      gfx.fillStyle(0x00ddee, alpha * 0.5);
      gfx.beginPath();
      gfx.moveTo(0, -s - 4);
      gfx.lineTo(s + 4, 0);
      gfx.lineTo(0, s + 4);
      gfx.lineTo(-s - 4, 0);
      gfx.closePath();
      gfx.fillPath();
      gfx.fillStyle(0x00ffee, alpha);
      gfx.beginPath();
      gfx.moveTo(0, -s);
      gfx.lineTo(s, 0);
      gfx.lineTo(0, s);
      gfx.lineTo(-s, 0);
      gfx.closePath();
      gfx.fillPath();
      gfx.lineStyle(1, 0x00ffee, alpha * 0.7);
      gfx.lineBetween(-s * 0.7, -s * 0.3, s * 0.7, s * 0.3);
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
      const bounce = Math.abs(Math.sin(t * 4)) * 6;
      const s = 17;
      const colors = [0xff0033, 0xff0080, 0xff0055];
      gfx.fillStyle(colors[Math.floor(t * 5) % 3], 0.9);
      gfx.beginPath();
      gfx.moveTo(0, -s - bounce);
      gfx.lineTo(s * 0.9, s * 0.6 - bounce);
      gfx.lineTo(-s * 0.9, s * 0.6 - bounce);
      gfx.closePath();
      gfx.fillPath();
      gfx.fillStyle(0xffffff, 0.95);
      gfx.fillRect(-1.5, -s * 0.4 - bounce, 3, s * 0.4);
      gfx.fillCircle(0, s * 0.2 - bounce, 2.5);
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
      const w = 32;
      gfx.fillStyle(0x6600ff, 0.9);
      gfx.beginPath();
      gfx.moveTo(-w + coil * 8, -7);
      gfx.lineTo(w + coil * 4, -6);
      gfx.lineTo(w - coil * 4, 6);
      gfx.lineTo(-w - coil * 8, 7);
      gfx.closePath();
      gfx.fillPath();
      gfx.fillStyle(0x8833ff, 0.8);
      gfx.fillCircle(w * 0.8, 0, 4);
      gfx.fillCircle(-w * 0.8, 0, 3);
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
        const verts = 5 + Math.floor(Math.sin(t * 2) * 2);
        gfx.fillStyle(0x00eedd, 0.92);
        gfx.beginPath();
        for (let i = 0; i <= verts; i++) {
          const angle = (i / verts) * Math.PI * 2;
          const r = 14 + Math.sin(t * 3 + i * 1.5) * 5;
          if (i === 0) gfx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
          else gfx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        gfx.closePath();
        gfx.fillPath();
        gfx.fillStyle(0x00ffee, 0.85);
        gfx.fillCircle(
          Math.sin(t) * 2,
          Math.cos(t * 1.3) * 2,
          4 + Math.sin(t * 5) * 2
        );
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
    name: "OVERFIT",
    type: "enemy",
    color: 0xff0066,
    colorAccent: 0xff0099,
    abilities: ["Predicts movement", "Pattern lock"],
    story:
      "It memorized the training data too well. Layered echoes of every pattern it's seen, drifting in and out of sync. Confident, rigid, and always one step behind the present.",
    draw: (gfx, t) => {
      const echoes = 4;
      for (let e = echoes; e >= 0; e--) {
        const delay = e * 0.35;
        const phase = t * 1.5 - delay;
        const drift = e * 2 * (1 + Math.sin(t + e) * 0.3);
        const ox = Math.sin(phase * 2 + e * 0.8) * drift;
        const oy = Math.cos(phase * 1.6 + e * 1.1) * drift;
        const fade = 1 - e * 0.2;
        const r = 12 - e * 0.5;
        gfx.lineStyle(
          1.5,
          e === 0 ? 0xff0066 : 0xff0099,
          fade * (e === 0 ? 0.85 : 0.35)
        );
        gfx.beginPath();
        const verts = 5;
        for (let i = 0; i <= verts; i++) {
          const va = (i / verts) * Math.PI * 2 + phase;
          const vr = r + Math.sin(va * 2 + t * 1.5) * 2;
          if (i === 0)
            gfx.moveTo(ox + Math.cos(va) * vr, oy + Math.sin(va) * vr);
          else gfx.lineTo(ox + Math.cos(va) * vr, oy + Math.sin(va) * vr);
        }
        gfx.closePath();
        gfx.strokePath();
      }
      gfx.fillStyle(0xff0066, 0.8);
      gfx.fillCircle(0, 0, 5);
      gfx.fillStyle(0xff0099, 0.6);
      gfx.fillCircle(0, 0, 3);
      for (let i = 1; i <= 3; i++) {
        const fade = 0.4 - i * 0.1;
        gfx.lineStyle(1, 0xff0099, fade);
        gfx.strokeCircle(18 + i * 9, -3 + i * 2, 3.5);
        gfx.fillStyle(0xff0099, fade * 0.5);
        gfx.fillCircle(18 + i * 9, -3 + i * 2, 1.5);
      }
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
      const pulse = 0.7 + Math.sin(t * 2.5) * 0.25;
      gfx.fillStyle(0xffaa33, pulse * 0.12);
      gfx.fillCircle(0, 0, 18);
      gfx.fillStyle(0xff8800, pulse * 0.35);
      gfx.fillCircle(0, 0, 10);
      gfx.fillStyle(0xffaa33, pulse * 0.9);
      gfx.fillCircle(0, 0, 5);
      gfx.fillStyle(0xffffff, pulse * 0.6);
      gfx.fillCircle(-1.5, -1.5, 2);
      const filaments = 6;
      for (let i = 0; i < filaments; i++) {
        const base = (i / filaments) * Math.PI * 2 + t * 0.4;
        const len = 10 + Math.sin(t * 2 + i * 1.3) * 6;
        const sway = Math.sin(t * 1.5 + i * 2.1) * 0.3;
        gfx.lineStyle(1, 0xffaa33, 0.35);
        gfx.beginPath();
        gfx.moveTo(Math.cos(base) * 6, Math.sin(base) * 6);
        gfx.lineTo(
          Math.cos(base + sway) * (6 + len),
          Math.sin(base + sway) * (6 + len)
        );
        gfx.strokePath();
      }
      if (Math.sin(t * 1.2) > 0.3) {
        const pa = t * 2;
        const pd = 24 + Math.sin(t * 4) * 6;
        gfx.fillStyle(0xff8800, 0.5);
        gfx.fillCircle(Math.cos(pa) * pd, Math.sin(pa) * pd, 3);
        gfx.fillStyle(0xff8800, 0.2);
        gfx.fillCircle(Math.cos(pa) * pd, Math.sin(pa) * pd, 7);
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
      gfx.lineStyle(1, 0xcccc00, 0.2);
      gfx.strokeCircle(0, 0, 15);
      gfx.lineStyle(1, 0xcccc00, 0.12);
      gfx.strokeCircle(0, 0, 10);
      const segments = 8;
      for (let i = 0; i < segments; i++) {
        const sa = (i / segments) * Math.PI * 2 + spin;
        const gap = 0.15;
        const inner = 8,
          outer = 16;
        gfx.fillStyle(0xcccc00, 0.3 + (i % 2) * 0.15);
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
      gfx.fillStyle(0xffff33, 0.7);
      gfx.fillCircle(0, 0, 5);
      gfx.fillStyle(0xcccc00, 0.45);
      gfx.fillCircle(0, 0, 3);
      const shieldR = 21;
      const shieldAngle = t * 0.6;
      gfx.lineStyle(3.5, 0xffff33, 0.75);
      gfx.beginPath();
      for (let i = -12; i <= 12; i++) {
        const frac = i / 12;
        const a = shieldAngle + frac * (Math.PI / 3);
        if (i === -12) gfx.moveTo(Math.cos(a) * shieldR, Math.sin(a) * shieldR);
        else gfx.lineTo(Math.cos(a) * shieldR, Math.sin(a) * shieldR);
      }
      gfx.strokePath();
      gfx.lineStyle(1.5, 0xffff33, 0.25);
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
      const alpha = vis ? 0.8 + Math.sin(t * 5) * 0.12 : 0.12;
      const gx = vis ? 0 : Math.sin(t * 47) * 4;
      const gy = vis ? 0 : Math.cos(t * 31) * 4;
      gfx.fillStyle(0xcc00ff, alpha * 0.7);
      gfx.beginPath();
      gfx.moveTo(gx, -14 + gy);
      gfx.lineTo(10 + gx, -3 + gy);
      gfx.lineTo(8 + gx, 10 + gy);
      gfx.lineTo(3 + gx, 8 + gy);
      gfx.lineTo(-3 + gx, 10 + gy);
      gfx.lineTo(-8 + gx, 8 + gy);
      gfx.lineTo(-10 + gx, -3 + gy);
      gfx.closePath();
      gfx.fillPath();
      if (vis) {
        gfx.fillStyle(0xee44ff, alpha);
        gfx.fillCircle(-4, -4, 3);
        gfx.fillCircle(4, -4, 3);
      } else {
        gfx.lineStyle(1, 0xee44ff, 0.2);
        for (let i = 0; i < 4; i++) {
          const rx = Math.sin(t * 17 + i * 3) * 12;
          const ry = Math.cos(t * 23 + i * 7) * 12;
          gfx.lineBetween(rx, ry, rx + Math.sin(t * 37 + i) * 8, ry);
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
      for (let i = 0; i < 6; i++) {
        const ox = Math.sin(i * 1.2 + t * 1.5) * 5;
        const oy = Math.cos(i * 0.9 + t * 2) * 5;
        const size = 4 + (i % 3);
        gfx.fillStyle(i % 2 === 0 ? 0xff0000 : 0xcc3333, 0.7 + (i % 3) * 0.1);
        gfx.fillRect(ox - size / 2 + glitch * 2, oy - size / 2, size, size);
      }
      gfx.lineStyle(1, 0xcc3333, 0.5);
      const noiseY = ((t * 10) % 24) - 12;
      gfx.lineBetween(-10, noiseY, 10, noiseY);
      for (let i = 0; i < 5; i++) {
        const trail = t * 0.8 + i * 0.6;
        const tx = Math.sin(trail) * (12 + i * 6);
        const ty = Math.cos(trail * 0.7) * (8 + i * 5) + 20;
        const fade = 1 - i * 0.18;
        gfx.fillStyle(0xff0000, 0.2 * fade);
        gfx.fillCircle(tx, ty, 8 * fade);
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
      const shards = 7;
      gfx.fillStyle(0xee3300, 0.15);
      gfx.fillCircle(0, 0, 20);
      for (let i = 0; i < shards; i++) {
        const base = (i / shards) * Math.PI * 2;
        const orbit = base + t * 0.8 * drift;
        const dist = 8 + Math.sin(t * 2 + i * 1.7) * 4 * drift;
        const ox = Math.cos(orbit) * dist;
        const oy = Math.sin(orbit) * dist;
        const rot = orbit + t * 1.2 * drift;
        const sz = 7 + (i % 3);
        gfx.fillStyle(i % 2 === 0 ? 0xee3300 : 0xff6633, 0.8);
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
      gfx.fillStyle(0x110000, 0.9);
      gfx.fillCircle(0, 0, 5);
      gfx.fillStyle(0xff6633, 0.6 + Math.sin(t * 4) * 0.2);
      gfx.fillCircle(0, 0, 2.5);
      if (lock > 0.5) {
        gfx.lineStyle(1.5, 0xff6633, 0.6);
        gfx.strokeCircle(0, 0, 17);
        gfx.lineStyle(1, 0xff0000, 0.35);
        gfx.strokeCircle(0, 0, 22);
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
      for (let cluster = 0; cluster < 5; cluster++) {
        const ca = (cluster / 5) * Math.PI * 2 + t * 0.5;
        const cd = 14 + Math.sin(t * 3 + cluster) * 4;
        const cx = Math.cos(ca) * cd;
        const cy = Math.sin(ca) * cd;
        const s = 5 + Math.sin(t * 5 + cluster * 2) * 1;
        gfx.fillStyle(cluster % 2 === 0 ? 0x00cc44 : 0x44ff88, 0.75);
        gfx.fillCircle(cx, cy, s);
        gfx.fillStyle(0x44ff88, 0.6);
        gfx.fillCircle(cx, cy, s * 0.4);
      }
      gfx.lineStyle(1, 0x44ff88, 0.3);
      for (let i = 0; i < 3; i++) {
        const la = t * 2 + (i / 3) * Math.PI * 2;
        gfx.lineBetween(
          Math.cos(la) * 6,
          Math.sin(la) * 6,
          Math.cos(la) * 20,
          Math.sin(la) * 20
        );
      }
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
        gfx.fillRect(-3, -8, 6, 16);
        gfx.fillRect(-8, -3, 16, 6);
        gfx.fillStyle(0x00ffee, 0.15);
        gfx.fillCircle(0, 0, 12);
      } else {
        const legs = 6;
        gfx.fillStyle(0xcc8800, 0.9);
        gfx.beginPath();
        for (let i = 0; i < legs; i++) {
          const ang = (i / legs) * Math.PI * 2 + t * 1.5;
          const r = 13 + Math.sin(ang * 3 + t * 2.5) * 5;
          if (i === 0) gfx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
          else gfx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        gfx.closePath();
        gfx.fillPath();
        gfx.fillStyle(0xffaa00, 0.85);
        gfx.fillCircle(-4, -3, 3);
        gfx.fillCircle(4, -3, 3);
        gfx.lineStyle(1.5, 0xffaa00, 0.6);
        for (let i = 0; i < 4; i++) {
          const la = (i / 4) * Math.PI * 2 + t * 2;
          gfx.lineBetween(
            Math.cos(la) * 12,
            Math.sin(la) * 12,
            Math.cos(la) * 19,
            Math.sin(la + 0.3) * 19
          );
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
      const alpha = vis ? 0.9 : 0.08;
      const gx = vis ? 0 : Math.sin(t * 31) * 8;
      const gy = vis ? 0 : Math.cos(t * 47) * 8;
      if (vis) {
        gfx.lineStyle(1.5, 0xff4477, 0.6);
        gfx.strokeCircle(0, 0, 18);
      }
      gfx.fillStyle(0xff0044, alpha);
      gfx.beginPath();
      gfx.moveTo(-10 + gx, -8 + gy);
      gfx.lineTo(3 + gx, -13 + gy);
      gfx.lineTo(12 + gx, -3 + gy);
      gfx.lineTo(7 + gx, 10 + gy);
      gfx.lineTo(-5 + gx, 12 + gy);
      gfx.lineTo(-13 + gx, 3 + gy);
      gfx.closePath();
      gfx.fillPath();
      if (vis) {
        gfx.fillStyle(0xff4477, 0.95);
        gfx.fillCircle(0, 0, 4);
        gfx.lineStyle(2, 0xffffff, 0.7);
        gfx.lineBetween(-4, -4, 4, 4);
        gfx.lineBetween(4, -4, -4, 4);
      } else {
        gfx.lineStyle(1, 0xff4477, 0.12);
        for (let i = 0; i < 3; i++) {
          const rx = Math.sin(t * 17 + i * 5) * 16;
          const ry = Math.cos(t * 23 + i * 7) * 16;
          gfx.lineBetween(rx, ry, rx + Math.sin(t * 37 + i) * 10, ry);
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
      const size = 18 + Math.sin(t * 0.5) * 4;
      gfx.fillStyle(0xcc77ff, 0.15);
      gfx.fillCircle(0, 0, size + 12);
      gfx.fillStyle(0x050011, 1);
      gfx.fillCircle(0, 0, size);
      gfx.fillStyle(0xcc77ff, 0.4);
      gfx.fillCircle(
        Math.sin(t * 2) * size * 0.3,
        Math.cos(t * 3) * size * 0.3,
        size * 0.3
      );
      const rings = [
        { radius: size + 18, speed: 0.8, gap: 0.5 },
        { radius: size + 34, speed: -1.1, gap: 0.44 },
        { radius: size + 50, speed: 1.4, gap: 0.38 },
        { radius: size + 66, speed: -1.7, gap: 0.32 },
      ];
      for (const ring of rings) {
        gfx.lineStyle(2.5, 0xcc77ff, 0.45);
        gfx.beginPath();
        let started = false;
        const gapAngle = t * ring.speed;
        for (let i = 0; i <= 50; i++) {
          const a = (i / 50) * Math.PI * 2;
          const rel =
            (((a - gapAngle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          if (rel < ring.gap) {
            started = false;
            continue;
          }
          const px = Math.cos(a) * ring.radius;
          const py = Math.sin(a) * ring.radius;
          if (!started) {
            gfx.moveTo(px, py);
            started = true;
          } else gfx.lineTo(px, py);
        }
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
    this.cameras.main.fadeIn(400, 24, 24, 27);
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
    this.cameras.main.fadeOut(400, 24, 24, 27);
    this.time.delayedCall(450, () => this.scene.start("TitleScene"));
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
    this.gfx.fillCircle(previewX, previewY, 80);
    this.gfx.lineStyle(1, entry.color, 0.1);
    this.gfx.strokeCircle(
      previewX,
      previewY,
      70 + Math.sin(this.breathPhase * 2) * 4
    );

    this.creatureGfx.setPosition(previewX, previewY);
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
