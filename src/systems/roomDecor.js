import { FLOOR_Y, FLOOR_HEIGHT, WORLD_WIDTH, floorBaseY } from '../data/rooms.js';

// Всё здесь рисуется один раз и запекается в текстуры (см. worldBaker.js),
// поэтому детали декора ничего не стоят во время игры.

function mix(a, b, t) {
  const r = Math.round(((a >> 16) & 0xff) + (((b >> 16) & 0xff) - ((a >> 16) & 0xff)) * t);
  const g = Math.round(((a >> 8) & 0xff) + (((b >> 8) & 0xff) - ((a >> 8) & 0xff)) * t);
  const bl = Math.round((a & 0xff) + ((b & 0xff) - (a & 0xff)) * t);
  return (r << 16) | (g << 8) | bl;
}

/** Мягкая тень: полосы с убывающей прозрачностью (работает и без градиентов). */
export function softBand(g, x, y, w, h, color, alpha, steps = 6) {
  const stepH = h / steps;
  for (let i = 0; i < steps; i += 1) {
    g.fillStyle(color, alpha * (1 - i / steps));
    g.fillRect(x, y + i * stepH, w, stepH + 0.5);
  }
}

function drawLamp(g, cx, top) {
  const spreads = [110, 170, 230];
  spreads.forEach((spread) => {
    g.fillStyle(0xfff3c4, 0.045);
    g.fillTriangle(cx - 34, top + 8, cx + 34, top + 8, cx - spread, top + 330);
    g.fillTriangle(cx + 34, top + 8, cx + spread, top + 330, cx - spread, top + 330);
  });
  g.fillStyle(0xfff3c4, 0.25);
  g.fillCircle(cx, top + 10, 36);
  g.fillStyle(0xdfe8ec, 1);
  g.fillRoundedRect(cx - 46, top - 2, 92, 12, 6);
  g.fillStyle(0xfffbe6, 1);
  g.fillRoundedRect(cx - 38, top + 4, 76, 6, 3);
}

export function drawCeiling(g, room) {
  const { x, y, width } = room;

  g.fillStyle(0xffffff, 0.95);
  g.fillRect(x, y, width, 20);
  g.fillStyle(room.accent, 0.4);
  g.fillRect(x, y + 20, width, 5);
  softBand(g, x, y + 25, width, 30, 0x1b4b5a, 0.12);

  drawLamp(g, x + 160, y + 25);
  drawLamp(g, x + 480, y + 25);
}

export function drawWainscot(g, room) {
  const { x, y, width } = room;
  const top = y + FLOOR_Y - 120;

  g.fillStyle(room.accent, 0.16);
  g.fillRect(x, top, width, 120);
  g.lineStyle(2, room.accent, 0.14);
  for (let gx = x + 40; gx < x + width; gx += 80) {
    g.lineBetween(gx, top + 12, gx, y + FLOOR_Y - 20);
  }
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(x, top - 4, width, 8);
  g.fillStyle(room.accent, 0.3);
  g.fillRect(x, top + 4, width, 3);
}

function drawLandscape(g, x, y, w, h, floor) {
  if (floor === 1) {
    g.fillStyle(0x9ccc65, 1);
    g.fillTriangle(x, y + h, x + w * 0.62, y + h, x + w * 0.22, y + h * 0.74);
    g.fillStyle(0x7cb342, 1);
    g.fillTriangle(x + w * 0.3, y + h, x + w, y + h, x + w * 0.72, y + h * 0.8);
    g.fillRect(x, y + h * 0.92, w, h * 0.08);
    return;
  }

  const buildings = [[0.04, 0.3, 0.17], [0.23, 0.44, 0.17], [0.44, 0.26, 0.15], [0.62, 0.38, 0.2], [0.85, 0.22, 0.12]];
  buildings.forEach(([bx, bh, bw], i) => {
    g.fillStyle(i % 2 === 0 ? 0xaecbe0 : 0x9bbbd2, 1);
    g.fillRect(x + w * bx, y + h * (1 - bh), w * bw, h * bh);
  });
}

function drawWindow(g, x, y, w, h, floor) {
  g.fillStyle(0x1b4b5a, 0.1);
  g.fillRoundedRect(x - 6, y - 2, w + 20, h + 22, 14);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(x - 9, y - 9, w + 18, h + 18, 12);

  const bands = 7;
  for (let i = 0; i < bands; i += 1) {
    g.fillStyle(mix(0x7ec8ee, 0xe3f6ff, i / (bands - 1)), 1);
    g.fillRect(x, y + (h / bands) * i, w, h / bands + 1);
  }

  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(x + 30, y + 40, 12);
  g.fillCircle(x + 46, y + 34, 15);
  g.fillCircle(x + 62, y + 42, 11);
  g.fillRoundedRect(x + 22, y + 40, 50, 14, 7);

  drawLandscape(g, x, y, w, h, floor);

  g.fillStyle(0xffffff, 1);
  g.fillRect(x + w / 2 - 3, y, 6, h);
  g.fillRect(x, y + h / 2 - 3, w, 6);
  g.lineStyle(3, 0xcfe0e8, 1);
  g.strokeRoundedRect(x - 9, y - 9, w + 18, h + 18, 12);

  g.fillStyle(0xffffff, 0.22);
  g.fillTriangle(x + 6, y + 6, x + w * 0.5, y + 6, x + 6, y + h * 0.55);

  g.fillStyle(0xe3eef3, 1);
  g.fillRoundedRect(x - 16, y + h + 8, w + 32, 12, 6);
  g.fillStyle(0xffffff, 0.8);
  g.fillRoundedRect(x - 16, y + h + 8, w + 32, 4, 2);
}

const WINDOW_X = [168, 372];

export function drawWindows(g, room) {
  WINDOW_X.forEach((wx) => drawWindow(g, room.x + wx, room.y + 66, 100, 140, room.floor));
}

/** Солнечные пятна на полу под окнами (рисуются после пола). */
export function drawSunPatches(g, room) {
  const base = room.y + FLOOR_Y;
  g.fillStyle(0xffffff, 0.16);
  WINDOW_X.forEach((wx) => {
    const x = room.x + wx;
    g.fillTriangle(x + 10, base + 6, x + 90, base + 6, x + 70, base + 150);
    g.fillTriangle(x + 10, base + 6, x + 70, base + 150, x - 10, base + 150);
  });
}

function drawPosterIcon(g, id, cx, cy, color) {
  if (id === 'doctor' || id === 'staff') {
    g.lineStyle(4, color, 1);
    const pts = [[-26, 4], [-14, 4], [-8, -16], [0, 20], [8, -6], [14, 4], [26, 4]];
    for (let i = 0; i < pts.length - 1; i += 1) {
      g.lineBetween(cx + pts[i][0], cy + pts[i][1], cx + pts[i + 1][0], cy + pts[i + 1][1]);
    }
  } else if (id === 'procedure') {
    g.fillStyle(0x81d4fa, 1);
    g.fillCircle(cx, cy + 8, 15);
    g.fillTriangle(cx - 13, cy + 2, cx + 13, cy + 2, cx, cy - 22);
  } else if (id === 'ward' || id === 'rest') {
    g.fillStyle(0xe05c7a, 1);
    g.fillCircle(cx - 9, cy - 3, 11);
    g.fillCircle(cx + 9, cy - 3, 11);
    g.fillTriangle(cx - 19, cy + 2, cx + 19, cy + 2, cx, cy + 22);
  } else if (id === 'cafeteria') {
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(cx - 15, cy - 8, 28, 26, 6);
    g.lineStyle(3, color, 1);
    g.strokeRoundedRect(cx - 15, cy - 8, 28, 26, 6);
    g.strokeCircle(cx + 18, cy + 4, 7);
  } else if (id === 'lab') {
    [0x81d4fa, 0xa5d6a7, 0xffcc80].forEach((c, i) => {
      g.fillStyle(c, 1);
      g.fillRoundedRect(cx - 24 + i * 18, cy - 14, 12, 34, 6);
    });
  } else if (id === 'pharmacy') {
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(cx - 24, cy - 9, 48, 20, 10);
    g.fillStyle(color, 1);
    g.fillRoundedRect(cx - 24, cy - 9, 24, 20, { tl: 10, bl: 10, tr: 0, br: 0 });
  } else if (id === 'archive') {
    g.fillStyle(0xf6c343, 1);
    g.fillRoundedRect(cx - 24, cy - 8, 48, 32, 6);
    g.fillRoundedRect(cx - 24, cy - 16, 22, 12, 4);
  } else {
    g.fillStyle(0xe53935, 1);
    g.fillRoundedRect(cx - 7, cy - 22, 14, 44, 3);
    g.fillRoundedRect(cx - 22, cy - 7, 44, 14, 3);
  }
}

export function drawPoster(g, room) {
  const px = room.x + 515;
  const py = room.y + 84;
  const w = 84;
  const h = 108;

  g.fillStyle(0x1b4b5a, 0.12);
  g.fillRoundedRect(px + 4, py + 6, w, h, 8);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(px, py, w, h, 8);
  g.lineStyle(3, room.accent, 0.8);
  g.strokeRoundedRect(px, py, w, h, 8);
  g.fillStyle(room.accent, 0.9);
  g.fillRoundedRect(px + 8, py + 8, w - 16, 14, 4);

  drawPosterIcon(g, room.id, px + w / 2, py + 52, room.accent);

  g.fillStyle(0xb0c4cd, 1);
  for (let i = 0; i < 3; i += 1) {
    g.fillRoundedRect(px + 10, py + 80 + i * 9, w - 20 - (i === 2 ? 24 : 0), 4, 2);
  }
}

/** Пол на всю ширину мира: градиент, плитка, блики и тень от стены. */
export function drawFloorPolish(g, floor) {
  const base = floorBaseY(floor);
  const height = FLOOR_HEIGHT - FLOOR_Y;

  g.fillGradientStyle(0xf7efde, 0xf7efde, 0xe4d8bf, 0xe4d8bf, 1);
  g.fillRect(0, base, WORLD_WIDTH, height);

  g.fillStyle(0xffffff, 0.16);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col * 80 < WORLD_WIDTH; col += 1) {
      if ((row + col) % 2 === 0) {
        g.fillRect(col * 80, base + row * 40, 80, 40);
      }
    }
  }

  g.lineStyle(2, 0xd8c9a8, 0.75);
  for (let x = 0; x <= WORLD_WIDTH; x += 80) {
    g.lineBetween(x, base, x, base + height);
  }
  for (let y = base + 40; y < base + height; y += 40) {
    g.lineBetween(0, y, WORLD_WIDTH, y);
  }

  g.fillStyle(0xffffff, 0.1);
  for (let x = 0; x < WORLD_WIDTH; x += 400) {
    g.fillTriangle(x + 70, base + 4, x + 160, base + 4, x + 90, base + height);
    g.fillTriangle(x + 70, base + 4, x + 90, base + height, x, base + height);
  }

  softBand(g, 0, base, WORLD_WIDTH, 36, 0x3a2a14, 0.16, 7);

  // Торец перекрытия внизу этажа.
  g.fillStyle(0x9fb6c0, 1);
  g.fillRect(0, base + height - 14, WORLD_WIDTH, 14);
  g.fillStyle(0xffffff, 0.35);
  g.fillRect(0, base + height - 14, WORLD_WIDTH, 3);
}

export function drawBaseboard(g, room) {
  const base = room.y + FLOOR_Y;
  g.fillStyle(0xffffff, 1);
  g.fillRect(room.x, base - 18, room.width, 18);
  g.fillStyle(room.accent, 0.4);
  g.fillRect(room.x, base - 18, room.width, 4);
  g.fillStyle(0x000000, 0.06);
  g.fillRect(room.x, base - 4, room.width, 4);
}
