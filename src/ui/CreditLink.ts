import Phaser from 'phaser';

export function addCreditLink(scene: Phaser.Scene): void {
  const w = scene.scale.width;
  const h = scene.scale.height;

  const gfx = scene.add.graphics().setDepth(20);
  const cursorW = 2;
  const cursorH = 14;
  const gap = 1;

  // T O L I S — each box width varies to hint at letter shape
  const boxes = [
    { w: 8 },  // T
    { w: 8 },  // O
    { w: 7 },  // L
    { w: 4 },  // I
    { w: 7 },  // S
  ];
  const totalW = boxes.reduce((s, b) => s + b.w, 0) + gap * (boxes.length - 1);

  const baseX = w - 14;
  const baseY = h - 12;

  let hovered = false;
  let tick = 0;

  const draw = () => {
    gfx.clear();
    if (hovered) {
      let bx = baseX - totalW;
      for (let i = 0; i < boxes.length; i++) {
        const wave = Math.sin((tick * 0.4) + i * 1.8);
        const alpha = 0.3 + 0.35 * (wave * 0.5 + 0.5);
        gfx.fillStyle(0xffffff, alpha);
        gfx.fillRect(bx, baseY - cursorH, boxes[i].w, cursorH);
        bx += boxes[i].w + gap;
      }
    } else {
      const flicker = Math.sin(tick * 0.55);
      const alpha = 0.4 + 0.6 * (flicker * 0.5 + 0.5);
      gfx.fillStyle(0xffffff, alpha);
      gfx.fillRect(baseX - cursorW, baseY - cursorH, cursorW, cursorH);
    }
  };
  draw();

  scene.time.addEvent({
    delay: 90, loop: true,
    callback: () => { tick++; draw(); },
  });

  const zone = scene.add.zone(baseX - totalW / 2, baseY - cursorH / 2, totalW, cursorH)
    .setDepth(20)
    .setInteractive({ useHandCursor: true });

  zone.on('pointerover', () => { hovered = true; tick = 0; draw(); });
  zone.on('pointerout', () => { hovered = false; draw(); });

  zone.on('pointerdown', () => {
    window.open('https://tol.is/', '_blank');
  });
}
