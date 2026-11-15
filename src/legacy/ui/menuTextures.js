import { ensureTexture, ensureVerticalGradient } from './textures.js';

// Все картинки главного меню рисуются кодом один раз и сохраняются как текстуры.

export const MENU_TEXTURES = {
  sky: 'menu-sky',
  sun: 'menu-sun',
  rays: 'menu-rays',
  cloudA: 'menu-cloud-a',
  cloudB: 'menu-cloud-b',
  hills: 'menu-hills',
  tree: 'menu-tree',
  building: 'menu-building',
  ambulance: 'menu-ambulance',
  cross: 'menu-cross',
  badge: 'menu-badge',
  ecg: 'menu-ecg',
};

export const BUILDING_SIZE = { w: 640, h: 390 };
export const AMBULANCE_SIZE = { w: 230, h: 120 };

function paintSun(g) {
  g.fillStyle(0xfff2b3, 0.18);
  g.fillCircle(180, 180, 170);
  g.fillStyle(0xffeb9c, 0.3);
  g.fillCircle(180, 180, 128);
  g.fillStyle(0xffe082, 0.6);
  g.fillCircle(180, 180, 94);
  g.fillStyle(0xffd54f, 1);
  g.fillCircle(180, 180, 62);
  g.fillStyle(0xfff59d, 0.7);
  g.fillCircle(162, 162, 20);
}

function paintRays(g) {
  const c = 260;
  g.fillStyle(0xfff6c8, 0.2);
  for (let i = 0; i < 12; i += 1) {
    const a = (i * Math.PI) / 6;
    g.fillTriangle(
      c,
      c,
      c + Math.cos(a - 0.11) * 250,
      c + Math.sin(a - 0.11) * 250,
      c + Math.cos(a + 0.11) * 250,
      c + Math.sin(a + 0.11) * 250,
    );
  }
}

function paintCloud(g, w, h) {
  g.fillStyle(0xcfe6f2, 1);
  g.fillRoundedRect(8, h * 0.52, w - 16, h * 0.4, h * 0.2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(w * 0.28, h * 0.58, h * 0.3);
  g.fillCircle(w * 0.48, h * 0.42, h * 0.4);
  g.fillCircle(w * 0.7, h * 0.56, h * 0.32);
  g.fillRoundedRect(w * 0.1, h * 0.5, w * 0.8, h * 0.36, h * 0.18);
}

function paintHills(g, w, h) {
  g.fillStyle(0xa8dba0, 1);
  g.fillEllipse(200, 170, 700, 200);
  g.fillEllipse(760, 190, 820, 240);
  g.fillEllipse(1170, 175, 640, 200);
  g.fillStyle(0x8ccf7a, 1);
  g.fillEllipse(90, 215, 520, 160);
  g.fillEllipse(560, 225, 700, 150);
  g.fillEllipse(1100, 220, 600, 160);

  g.fillStyle(0x72b552, 1);
  g.fillRect(0, h - 76, w, 76);
  g.fillStyle(0x8bc34a, 1);
  g.fillRect(0, h - 76, w, 8);

  const palette = [0xffffff, 0xffeb3b, 0xf48fb1, 0xff8a65];
  for (let i = 0; i < 30; i += 1) {
    const x = (i * 97 + 40) % 1240;
    const y = h - 60 + ((i * 37) % 48);
    g.fillStyle(palette[i % palette.length], 1);
    g.fillCircle(x, y, 4);
    g.fillStyle(0xffd54f, 1);
    g.fillCircle(x, y, 1.6);
  }
}

function paintTree(g) {
  g.fillStyle(0x8d6e63, 1);
  g.fillRoundedRect(52, 130, 16, 80, 6);
  g.fillStyle(0x4f9a4a, 1);
  g.fillCircle(60, 95, 52);
  g.fillStyle(0x66b256, 1);
  g.fillCircle(38, 108, 34);
  g.fillCircle(84, 110, 34);
  g.fillStyle(0x8fd27a, 0.8);
  g.fillCircle(48, 78, 22);
}

function paintBuilding(g, w, h) {
  const left = 40;
  const right = 600;
  const top = 75;
  const bw = right - left;

  g.fillStyle(0x000000, 0.12);
  g.fillRoundedRect(left + 12, top + 14, bw, h - top, 18);

  // Башня и корпус.
  g.fillStyle(0xeaf4f9, 1);
  g.fillRoundedRect(left + 200, top - 52, 160, 80, 14);
  g.fillStyle(0xf7fbfd, 1);
  g.fillRoundedRect(left, top, bw, h - top, 18);
  g.lineStyle(4, 0xd7e6ee, 1);
  g.strokeRoundedRect(left, top, bw, h - top, 18);
  g.fillStyle(0x1b4b5a, 0.05);
  g.fillRoundedRect(right - 120, top + 4, 116, h - top - 8, 14);
  g.fillStyle(0xffffff, 0.7);
  g.fillRoundedRect(left + 6, top + 6, 14, h - top - 12, 7);

  // Карниз и эмблема.
  g.fillStyle(0xe3f1f7, 1);
  g.fillRoundedRect(left - 18, top - 22, bw + 36, 34, 12);
  g.fillStyle(0xffffff, 0.6);
  g.fillRoundedRect(left - 12, top - 18, bw + 24, 8, 4);

  const cx = left + 280;
  const cy = top - 14;
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx, cy, 30);
  g.lineStyle(4, 0xe0eef5, 1);
  g.strokeCircle(cx, cy, 30);
  g.fillStyle(0xe53935, 1);
  g.fillRoundedRect(cx - 5, cy - 18, 10, 36, 3);
  g.fillRoundedRect(cx - 18, cy - 5, 36, 10, 3);

  // Окна: часть горит тёплым светом.
  const lit = ['0-1', '2-0', '3-1', '1-0'];
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const wx = left + 52 + col * 122;
      const wy = top + 54 + row * 92;
      const on = lit.includes(`${col}-${row}`);

      g.fillStyle(0x000000, 0.06);
      g.fillRoundedRect(wx + 3, wy + 4, 86, 64, 8);
      g.fillStyle(on ? 0xfff0b3 : 0xbfe3f5, 1);
      g.fillRoundedRect(wx, wy, 86, 64, 8);
      g.fillStyle(on ? 0xffe28a : 0x9bd0ea, 1);
      g.fillRoundedRect(wx, wy + 34, 86, 30, { tl: 0, tr: 0, bl: 8, br: 8 });
      g.fillStyle(0xffffff, 0.35);
      g.fillTriangle(wx + 6, wy + 6, wx + 40, wy + 6, wx + 6, wy + 40);
      g.lineStyle(3, 0xffffff, 1);
      g.strokeRoundedRect(wx, wy, 86, 64, 8);
      g.lineStyle(2, 0xffffff, 0.9);
      g.lineBetween(wx + 43, wy, wx + 43, wy + 64);
      g.lineBetween(wx, wy + 32, wx + 86, wy + 32);
    }
  }

  // Вход с козырьком.
  g.fillStyle(0x3f8fb0, 1);
  g.fillRoundedRect(250, 246, 140, 22, 8);
  g.fillStyle(0xffffff, 0.25);
  g.fillRoundedRect(256, 250, 128, 6, 3);
  g.fillStyle(0xcfe8f2, 1);
  g.fillRoundedRect(270, 268, 100, 122, 10);
  g.fillStyle(0x8fb7c7, 1);
  g.fillRoundedRect(282, 282, 36, 108, 6);
  g.fillRoundedRect(322, 282, 36, 108, 6);
  g.fillStyle(0xffffff, 0.35);
  g.fillTriangle(286, 286, 312, 286, 286, 330);
  g.fillTriangle(326, 286, 352, 286, 326, 330);
  g.fillStyle(0xdbe9ef, 1);
  g.fillRect(250, h - 10, 140, 10);
}

function paintAmbulance(g) {
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(115, 112, 200, 14);

  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(10, 26, 170, 70, 14);
  g.fillRoundedRect(150, 46, 70, 50, { tl: 14, tr: 18, bl: 6, br: 10 });
  g.lineStyle(3, 0xcfd8dc, 1);
  g.strokeRoundedRect(10, 26, 170, 70, 14);

  g.fillStyle(0xe53935, 1);
  g.fillRect(14, 68, 204, 9);
  g.fillRoundedRect(76, 36, 14, 30, 3);
  g.fillRoundedRect(68, 44, 30, 14, 3);

  g.fillStyle(0x8fd3f4, 1);
  g.fillRoundedRect(178, 52, 36, 24, 6);
  g.fillStyle(0xffffff, 0.5);
  g.fillTriangle(182, 55, 196, 55, 182, 72);

  g.fillStyle(0xe53935, 1);
  g.fillRoundedRect(96, 16, 20, 10, 4);
  g.fillStyle(0x2196f3, 1);
  g.fillRoundedRect(120, 16, 20, 10, 4);

  g.fillStyle(0x263238, 1);
  g.fillCircle(60, 98, 16);
  g.fillCircle(172, 98, 16);
  g.fillStyle(0xb0bec5, 1);
  g.fillCircle(60, 98, 7);
  g.fillCircle(172, 98, 7);
}

function paintCross(g) {
  g.fillStyle(0xffffff, 0.85);
  g.fillRoundedRect(13, 3, 14, 34, 4);
  g.fillRoundedRect(3, 13, 34, 14, 4);
}

function paintBadge(g) {
  g.fillStyle(0x000000, 0.18);
  g.fillRoundedRect(6, 10, 84, 84, 20);
  g.fillStyle(0xe53935, 1);
  g.fillRoundedRect(2, 2, 84, 84, 20);
  g.fillStyle(0xffffff, 0.2);
  g.fillRoundedRect(8, 8, 72, 22, 11);
  g.lineStyle(4, 0xffffff, 0.9);
  g.strokeRoundedRect(2, 2, 84, 84, 20);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(37, 16, 14, 56, 4);
  g.fillRoundedRect(16, 37, 56, 14, 4);
}

function paintEcg(g) {
  const pts = [[0, 30], [110, 30], [130, 30], [142, 8], [156, 52], [168, 18], [178, 30], [200, 30], [360, 30]];
  g.lineStyle(5, 0xe53935, 0.9);
  for (let i = 0; i < pts.length - 1; i += 1) {
    g.lineBetween(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
  }
}

export function ensureMenuTextures(scene) {
  const t = MENU_TEXTURES;

  ensureVerticalGradient(scene, t.sky, 4, 720, [
    [0, '#58b4ec'],
    [0.5, '#9fdcf8'],
    [1, '#eefaff'],
  ]);
  ensureTexture(scene, t.sun, 360, 360, paintSun);
  ensureTexture(scene, t.rays, 520, 520, paintRays);
  ensureTexture(scene, t.cloudA, 300, 130, paintCloud);
  ensureTexture(scene, t.cloudB, 220, 100, paintCloud);
  ensureTexture(scene, t.hills, 1280, 260, paintHills);
  ensureTexture(scene, t.tree, 120, 210, paintTree);
  ensureTexture(scene, t.building, BUILDING_SIZE.w, BUILDING_SIZE.h, paintBuilding);
  ensureTexture(scene, t.ambulance, AMBULANCE_SIZE.w, AMBULANCE_SIZE.h, paintAmbulance);
  ensureTexture(scene, t.cross, 40, 40, paintCross);
  ensureTexture(scene, t.badge, 92, 100, paintBadge);
  ensureTexture(scene, t.ecg, 360, 60, paintEcg);
}
