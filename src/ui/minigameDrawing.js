export const MG_FONT = 'Arial, "Segoe UI", sans-serif';
export const MG_WIDTH = 1280;
export const MG_HEIGHT = 720;

export function drawMiniGameBackground(g) {
  g.fillGradientStyle(0xdff2fb, 0xdff2fb, 0xf9fdff, 0xf9fdff, 1);
  g.fillRect(0, 0, MG_WIDTH, MG_HEIGHT);

  g.fillStyle(0xffffff, 0.3);
  g.fillCircle(150, 160, 170);
  g.fillCircle(1130, 230, 210);

  g.fillStyle(0xcfe9f2, 0.32);
  g.fillRoundedRect(70, 126, 1140, 470, 32);
  g.lineStyle(3, 0xffffff, 0.55);
  g.strokeRoundedRect(70, 126, 1140, 470, 32);

  g.fillStyle(0xf0e6d2, 1);
  g.fillRect(0, 600, MG_WIDTH, MG_HEIGHT - 600);
  g.lineStyle(2, 0xdccfb4, 1);
  for (let x = 0; x <= MG_WIDTH; x += 80) {
    g.lineBetween(x, 600, x, MG_HEIGHT);
  }
  g.lineBetween(0, 650, MG_WIDTH, 650);
  g.fillStyle(0xc4dde7, 1);
  g.fillRect(0, 588, MG_WIDTH, 14);

  g.fillStyle(0xffffff, 0.72);
  g.fillCircle(1210, 654, 34);
  g.fillStyle(0xe05c6e, 1);
  g.fillRoundedRect(1202, 630, 16, 48, 5);
  g.fillRoundedRect(1186, 646, 48, 16, 5);
}

export function drawMiniGameHeader(g) {
  g.fillStyle(0x1b4b5a, 0.12);
  g.fillRoundedRect(20, 14, 1240, 88, 22);
  g.fillStyle(0xffffff, 0.95);
  g.fillRoundedRect(16, 8, 1248, 88, 22);
  g.lineStyle(2, 0xbad8e4, 1);
  g.strokeRoundedRect(16, 8, 1248, 88, 22);
}

export function drawStarShape(g, cx, cy, radius, color, alpha = 1) {
  const inner = radius * 0.45;
  const points = [];

  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? radius : inner;
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }

  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    g.lineTo(points[i].x, points[i].y);
  }
  g.closePath();
  g.fillPath();

  g.lineStyle(3, 0xffffff, 0.7);
  g.strokePath();
}

export function drawInfoCard(g, x, y, width, height, color = 0xffffff) {
  g.fillStyle(0x0b1e28, 0.12);
  g.fillRoundedRect(x + 5, y + 7, width, height, 18);
  g.fillStyle(color, 1);
  g.fillRoundedRect(x, y, width, height, 18);
  g.lineStyle(3, 0x9fc3d1, 0.8);
  g.strokeRoundedRect(x, y, width, height, 18);
}
