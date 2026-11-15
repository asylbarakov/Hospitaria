export const BUBBLE_OFFSET_Y = 405;
export const NAME_OFFSET_Y = 350;
export const BAR_OFFSET_Y = 326;

function drawSnow(g, color) {
  g.lineStyle(2.5, color, 1);
  for (let i = 0; i < 3; i += 1) {
    const angle = (i * Math.PI) / 3;
    const dx = Math.cos(angle) * 12;
    const dy = Math.sin(angle) * 12;
    g.lineBetween(-dx, -dy, dx, dy);
  }
}

function drawThroat(g, color) {
  g.fillStyle(0xffab91, 1);
  g.fillEllipse(0, 2, 20, 16);
  g.fillStyle(0xc62828, 1);
  g.fillEllipse(0, 3, 10, 8);
  g.lineStyle(2, color, 1);
  g.strokeEllipse(0, 2, 20, 16);
}

function drawThermo(g, color) {
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(-4, -14, 8, 21, 4);
  g.lineStyle(2, color, 1);
  g.strokeRoundedRect(-4, -14, 8, 21, 4);
  g.fillStyle(0xef5350, 1);
  g.fillCircle(0, 11, 6);
  g.fillRect(-2, 0, 4, 10);
  g.fillStyle(color, 1);
  g.fillRect(-1, -8, 2, 9);
}

function drawFlower(g, color) {
  g.fillStyle(color, 1);
  for (let i = 0; i < 4; i += 1) {
    const angle = (i * Math.PI) / 2;
    g.fillEllipse(Math.cos(angle) * 7, Math.sin(angle) * 7, 11, 11);
  }
  g.fillStyle(0xfff59d, 1);
  g.fillCircle(0, 0, 5);
}

function drawBruise(g, color) {
  g.fillStyle(0xd1c4e9, 1);
  g.fillCircle(0, 0, 12);
  g.fillStyle(color, 0.9);
  g.fillCircle(2, 1, 7);
  g.fillStyle(0x7e57c2, 0.8);
  g.fillCircle(-4, -3, 3);
}

function drawCough(g, color) {
  g.fillStyle(0xb2dfdb, 1);
  g.fillCircle(-6, 2, 7);
  g.fillCircle(3, 0, 9);
  g.fillCircle(9, 5, 6);
  g.lineStyle(2, color, 0.9);
  g.strokeCircle(3, 0, 9);
}

function drawStomach(g, color) {
  g.fillStyle(0xffcc80, 1);
  g.fillEllipse(2, 1, 20, 18);
  g.fillStyle(0xffb74d, 1);
  g.fillCircle(-7, -5, 4);
  g.lineStyle(2, color, 1);
  g.strokeEllipse(2, 1, 20, 18);
}

function drawEar(g, color) {
  g.fillStyle(0xffccbc, 1);
  g.fillCircle(2, 2, 8);
  g.lineStyle(3, color, 1);
  g.beginPath();
  g.arc(0, 0, 10, -1.1 * Math.PI, 0.9 * Math.PI, false);
  g.strokePath();
  g.lineStyle(2, 0x8d6e63, 1);
  g.strokeCircle(2, 2, 5);
}

function drawSun(g, color) {
  g.fillStyle(0xffd54f, 1);
  g.fillCircle(0, 0, 8);
  g.lineStyle(2.5, color, 1);
  for (let i = 0; i < 8; i += 1) {
    const angle = (i * Math.PI) / 4;
    g.lineBetween(
      Math.cos(angle) * 11,
      Math.sin(angle) * 11,
      Math.cos(angle) * 15,
      Math.sin(angle) * 15,
    );
  }
}

function drawSleepy(g, color) {
  g.lineStyle(3, color, 1);
  g.lineBetween(-4, -11, 7, -11);
  g.lineBetween(7, -11, -4, 0);
  g.lineBetween(-4, 0, 7, 0);
  g.lineStyle(2.5, color, 0.8);
  g.lineBetween(8, 5, 13, 5);
  g.lineBetween(13, 5, 8, 11);
  g.lineBetween(8, 11, 13, 11);
}

function drawSinus(g, color) {
  g.fillStyle(0xffccbc, 1);
  g.fillRoundedRect(-8, -12, 16, 26, 8);
  g.fillCircle(0, 10, 8);
  g.lineStyle(2.5, color, 1);
  g.strokeRoundedRect(-8, -12, 16, 26, 8);
  g.lineBetween(-13, -4, -8, -4);
  g.lineBetween(8, -4, 13, -4);
  g.fillStyle(0xff8a80, 0.5);
  g.fillCircle(-4, 4, 2);
  g.fillCircle(4, 4, 2);
}

function drawLungs(g, color) {
  g.fillStyle(0xb2dfdb, 1);
  g.fillRoundedRect(-3, -16, 6, 18, 3);
  g.fillEllipse(-11, 6, 16, 24);
  g.fillEllipse(11, 6, 16, 24);
  g.lineStyle(2.5, color, 1);
  g.strokeEllipse(-11, 6, 16, 24);
  g.strokeEllipse(11, 6, 16, 24);
  g.lineBetween(0, -14, -8, -2);
  g.lineBetween(0, -14, 8, -2);
}

function drawFood(g, color) {
  g.fillStyle(0xfff8e1, 1);
  g.fillEllipse(0, 6, 28, 10);
  g.lineStyle(2.5, color, 1);
  g.strokeEllipse(0, 6, 28, 10);
  g.fillStyle(0xa5d6a7, 1);
  g.fillCircle(-2, 0, 8);
  g.fillStyle(0xef9a9a, 1);
  g.fillCircle(7, 1, 4);
  g.lineStyle(2, color, 0.7);
  g.lineBetween(-10, -10, -7, -15);
  g.lineBetween(0, -11, 3, -16);
  g.lineBetween(10, -10, 13, -15);
}

function drawWater(g, color) {
  g.fillStyle(0x81d4fa, 1);
  g.fillCircle(0, 4, 10);
  g.fillTriangle(-8, 1, 8, 1, 0, -16);
  g.lineStyle(2.5, color, 1);
  g.strokeCircle(0, 4, 10);
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(-4, 1, 3);
}

function drawBandage(g, color) {
  g.fillStyle(0xffe0b2, 1);
  g.fillRoundedRect(-14, -7, 28, 14, 7);
  g.lineStyle(2.5, color, 1);
  g.strokeRoundedRect(-14, -7, 28, 14, 7);
  g.fillStyle(0xffcc80, 0.9);
  g.fillRoundedRect(-5, -7, 10, 14, 4);
  g.fillStyle(color, 1);
  g.fillCircle(-9, 0, 1.6);
  g.fillCircle(9, 0, 1.6);
  g.fillCircle(0, -2, 1.6);
  g.fillCircle(0, 3, 1.6);
}

function drawBug(g, color) {
  g.fillStyle(0xc5e1a5, 0.9);
  g.fillEllipse(-7, -6, 12, 18);
  g.fillEllipse(7, -6, 12, 18);
  g.fillStyle(0x8bc34a, 1);
  g.fillEllipse(0, 4, 14, 20);
  g.lineStyle(2, color, 1);
  g.strokeEllipse(0, 4, 14, 20);
  g.lineBetween(-3, -6, -8, -14);
  g.lineBetween(3, -6, 8, -14);
  g.fillStyle(0x33691e, 1);
  g.fillCircle(-7, -14, 2);
  g.fillCircle(8, -14, 2);
}

function drawHead(g, color) {
  g.fillStyle(0xffccbc, 1);
  g.fillCircle(0, 2, 13);
  g.fillStyle(0xffab91, 1);
  g.fillRoundedRect(-13, -12, 26, 10, 6);
  g.lineStyle(2.5, color, 1);
  g.beginPath();
  g.arc(0, 1, 14, Math.PI * 0.15, Math.PI * 0.85, false);
  g.strokePath();
  g.lineBetween(-9, -2, -2, 4);
  g.lineBetween(-2, 4, 4, -2);
  g.lineBetween(4, -2, 9, 4);
}

function drawPill(g, color) {
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(-16, -8, 32, 16, 8);
  g.lineStyle(2.5, color, 1);
  g.strokeRoundedRect(-16, -8, 32, 16, 8);
  g.fillStyle(color, 1);
  g.fillRoundedRect(-16, -8, 16, 16, { tl: 8, bl: 8, tr: 0, br: 0 });
  g.lineBetween(0, -8, 0, 8);
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(-8, -3, 2.5);
}

const ICONS = {
  snow: drawSnow,
  throat: drawThroat,
  thermo: drawThermo,
  flower: drawFlower,
  bruise: drawBruise,
  cough: drawCough,
  stomach: drawStomach,
  ear: drawEar,
  sun: drawSun,
  sleepy: drawSleepy,
  sinus: drawSinus,
  lungs: drawLungs,
  food: drawFood,
  water: drawWater,
  bandage: drawBandage,
  bug: drawBug,
  head: drawHead,
  pill: drawPill,
};

export function drawSymptomBubble(g, disease) {
  g.clear();

  g.fillStyle(0xffffff, 0.98);
  g.fillTriangle(-8, 21, 8, 21, 0, 34);
  g.fillCircle(0, 0, 24);
  g.lineStyle(3, disease.color, 1);
  g.strokeCircle(0, 0, 24);

  g.fillStyle(0xffffff, 0.65);
  g.fillCircle(-9, -10, 5);

  const drawIcon = ICONS[disease.icon];
  if (drawIcon) {
    drawIcon(g, disease.color);
  }
}

export function drawPatienceBar(g, ratio) {
  const clamped = Math.max(0, Math.min(1, ratio));

  g.clear();
  g.fillStyle(0x1b4b5a, 0.3);
  g.fillRoundedRect(-36, -5, 72, 10, 5);

  if (clamped > 0) {
    const color = clamped > 0.5 ? 0x66bb6a : clamped > 0.25 ? 0xffb74d : 0xef5350;
    g.fillStyle(color, 1);
    g.fillRoundedRect(-34, -3, Math.max(4, 68 * clamped), 6, 3);
  }

  g.lineStyle(1.5, 0xffffff, 0.9);
  g.strokeRoundedRect(-36, -5, 72, 10, 5);
}
