export const HUD_FONT = 'Arial, "Segoe UI", sans-serif';

export function drawTopBar(g, width) {
  g.fillStyle(0x1b4b5a, 0.16);
  g.fillRoundedRect(24, 22, width - 48, 72, 24);
  g.fillStyle(0xffffff, 0.95);
  g.fillRoundedRect(20, 12, width - 40, 72, 24);
  // Нижняя половина чуть темнее: панель выглядит объёмной.
  g.fillStyle(0xe4f1f7, 0.9);
  g.fillRoundedRect(20, 48, width - 40, 36, { tl: 0, tr: 0, bl: 24, br: 24 });
  g.fillStyle(0xffffff, 0.7);
  g.fillRoundedRect(34, 16, width - 68, 6, 3);
  g.lineStyle(2, 0xbad8e4, 0.95);
  g.strokeRoundedRect(20, 12, width - 40, 72, 24);
}

export function drawPill(g, x, y, width, height, color, borderColor) {
  g.fillStyle(color, 1);
  g.fillRoundedRect(x, y, width, height, 16);
  g.fillStyle(0xffffff, 0.45);
  g.fillRoundedRect(x + 8, y + 4, width - 16, 5, 2.5);
  g.lineStyle(2, borderColor, 0.75);
  g.strokeRoundedRect(x, y, width, height, 16);
}

export function drawCoinIcon(g, x, y, radius) {
  g.fillStyle(0xf6c343, 1);
  g.fillCircle(x, y, radius);
  g.lineStyle(2.5, 0xd19a12, 1);
  g.strokeCircle(x, y, radius);
  g.fillStyle(0xffe082, 1);
  g.fillCircle(x - radius * 0.3, y - radius * 0.3, radius * 0.3);
  g.lineStyle(2, 0xc48a0a, 0.9);
  g.lineBetween(x, y - radius * 0.45, x, y + radius * 0.45);
  g.lineBetween(x - radius * 0.3, y - radius * 0.1, x + radius * 0.3, y - radius * 0.1);
}

export function drawHeartIcon(g, x, y, radius, color) {
  g.fillStyle(color, 1);
  g.fillCircle(x - radius * 0.42, y - radius * 0.18, radius * 0.52);
  g.fillCircle(x + radius * 0.42, y - radius * 0.18, radius * 0.52);
  g.fillTriangle(
    x - radius * 0.92,
    y + radius * 0.05,
    x + radius * 0.92,
    y + radius * 0.05,
    x,
    y + radius * 1.02,
  );
}

export function drawCrossIcon(g, x, y, radius, ringColor) {
  g.fillStyle(0xffffff, 1);
  g.fillCircle(x, y, radius);
  g.lineStyle(2.5, ringColor, 0.85);
  g.strokeCircle(x, y, radius);
  g.fillStyle(0xe53935, 1);
  g.fillRoundedRect(x - 2.5, y - radius * 0.55, 5, radius * 1.1, 2);
  g.fillRoundedRect(x - radius * 0.55, y - 2.5, radius * 1.1, 5, 2);
}

export function drawXpBar(g, x, y, width, height, progress) {
  g.clear();

  g.fillStyle(0xcfdfe8, 1);
  g.fillRoundedRect(x, y, width, height, height / 2);

  const clamped = Math.max(0, Math.min(1, progress));
  if (clamped > 0) {
    const fillWidth = Math.max(height, width * clamped);
    g.fillStyle(0x43a047, 1);
    g.fillRoundedRect(x, y, fillWidth, height, height / 2);
    // Светлая полоска сверху даёт блик на заполнении.
    g.fillStyle(0xa5d6a7, 0.85);
    g.fillRoundedRect(x + 3, y + 2, Math.max(2, fillWidth - 6), height * 0.35, height * 0.17);
  }

  g.lineStyle(1.5, 0xa9c3d1, 0.85);
  g.strokeRoundedRect(x, y, width, height, height / 2);
}
