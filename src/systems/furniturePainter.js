function shadow(g, x, y, width) {
  g.fillStyle(0x000000, 0.1);
  g.fillEllipse(x, y + 4, width, 16);
}

function drawDesk(g, x, y) {
  const w = 220;
  shadow(g, x, y, w * 0.85);

  g.fillStyle(0xb08968, 1);
  g.fillRoundedRect(x - w / 2 + 10, y - 72, w - 20, 72, 10);
  g.fillStyle(0xd7b899, 1);
  g.fillRoundedRect(x - w / 2, y - 90, w, 24, 8);
  g.lineStyle(2, 0x8d6e63, 0.5);
  g.lineBetween(x - w / 2 + 30, y - 40, x + w / 2 - 30, y - 40);

  // Монитор.
  g.fillStyle(0x546e7a, 1);
  g.fillRoundedRect(x + 20, y - 146, 64, 44, 6);
  g.fillStyle(0x90caf9, 1);
  g.fillRoundedRect(x + 25, y - 141, 54, 34, 4);
  g.fillStyle(0x546e7a, 1);
  g.fillRect(x + 46, y - 102, 10, 12);

  // Бумаги.
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(x - 92, y - 100, 46, 14, 3);
  g.fillStyle(0xe3f2fd, 1);
  g.fillRoundedRect(x - 40, y - 100, 30, 14, 3);

  g.fillStyle(0x8d6e63, 1);
  g.fillCircle(x - w / 4, y - 56, 3);
  g.fillCircle(x + w / 4, y - 56, 3);
}

function drawBench(g, x, y) {
  shadow(g, x, y, 220);
  g.fillStyle(0x8d6e63, 1);
  g.fillRoundedRect(x - 110, y - 128, 220, 24, 8);
  g.fillRoundedRect(x - 110, y - 80, 220, 22, 8);
  g.fillStyle(0x5d4037, 1);
  g.fillRect(x - 96, y - 58, 12, 58);
  g.fillRect(x + 84, y - 58, 12, 58);
}

function drawChair(g, x, y) {
  shadow(g, x, y, 70);
  g.fillStyle(0x90a4ae, 1);
  g.fillRoundedRect(x - 30, y - 70, 60, 16, 6);
  g.fillRoundedRect(x - 34, y - 142, 12, 80, 6);
  g.fillStyle(0x78909c, 1);
  g.fillRect(x - 28, y - 54, 10, 54);
  g.fillRect(x + 18, y - 54, 10, 54);
}

function drawCabinet(g, x, y) {
  shadow(g, x, y, 110);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(x - 55, y - 192, 110, 192, 10);
  g.lineStyle(3, 0xb0bec5, 1);
  g.strokeRoundedRect(x - 55, y - 192, 110, 192, 10);
  g.lineBetween(x - 55, y - 118, x + 55, y - 118);
  g.fillStyle(0x90a4ae, 1);
  g.fillRect(x - 8, y - 160, 16, 5);
  g.fillRect(x - 8, y - 88, 16, 5);
}

function drawBed(g, x, y) {
  const w = 210;
  shadow(g, x, y, w);

  g.fillStyle(0xb0bec5, 1);
  g.fillRoundedRect(x - w / 2 - 8, y - 138, 12, 138, 5);
  g.fillRect(x - w / 2 + 8, y - 58, 10, 58);
  g.fillRect(x + w / 2 - 18, y - 58, 10, 58);

  g.fillStyle(0xe0e0e0, 1);
  g.fillRoundedRect(x - w / 2, y - 78, w, 22, 8);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(x - w / 2 + 4, y - 98, w - 8, 28, 10);
  g.fillStyle(0x90caf9, 1);
  g.fillRoundedRect(x - w / 2 + 12, y - 104, 48, 26, 8);
  g.fillStyle(0x64b5f6, 1);
  g.fillRoundedRect(x - w / 2 + 72, y - 100, w - 84, 22, 6);
}

function drawIv(g, x, y) {
  shadow(g, x, y, 60);
  g.lineStyle(6, 0x90a4ae, 1);
  g.lineBetween(x, y - 190, x, y - 22);
  g.fillStyle(0x78909c, 1);
  g.fillCircle(x, y - 18, 12);
  g.fillStyle(0xe3f2fd, 1);
  g.fillRoundedRect(x - 16, y - 190, 32, 50, 8);
  g.fillStyle(0x42a5f5, 1);
  g.fillRoundedRect(x - 12, y - 172, 24, 28, 6);
  g.lineStyle(2, 0x90a4ae, 1);
  g.lineBetween(x, y - 140, x + 28, y - 118);
}

function drawSink(g, x, y) {
  shadow(g, x, y, 110);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(x - 55, y - 92, 110, 54, 10);
  g.lineStyle(3, 0xb0bec5, 1);
  g.strokeRoundedRect(x - 55, y - 92, 110, 54, 10);
  g.fillStyle(0xb3e5fc, 1);
  g.fillEllipse(x, y - 76, 78, 24);
  g.lineStyle(6, 0x90a4ae, 1);
  g.lineBetween(x, y - 92, x, y - 124);
  g.lineBetween(x, y - 124, x + 18, y - 124);
  g.fillStyle(0xcfd8dc, 1);
  g.fillRoundedRect(x + 14, y - 132, 12, 14, 4);
}

function drawTable(g, x, y) {
  shadow(g, x, y, 210);
  g.fillStyle(0x8d6e63, 1);
  g.fillRoundedRect(x - 90, y - 84, 180, 18, 8);
  g.fillRect(x - 66, y - 66, 12, 66);
  g.fillRect(x + 54, y - 66, 12, 66);

  g.fillStyle(0xa1887f, 1);
  g.fillCircle(x - 118, y - 38, 18);
  g.fillRect(x - 124, y - 28, 12, 28);
  g.fillCircle(x + 118, y - 38, 18);
  g.fillRect(x + 112, y - 28, 12, 28);
}

function drawVending(g, x, y) {
  shadow(g, x, y, 100);
  g.fillStyle(0x546e7a, 1);
  g.fillRoundedRect(x - 50, y - 200, 100, 200, 12);
  g.fillStyle(0x90caf9, 1);
  g.fillRoundedRect(x - 38, y - 188, 76, 100, 8);
  g.fillStyle(0xffcc80, 1);
  g.fillCircle(x - 20, y - 168, 8);
  g.fillCircle(x + 4, y - 168, 8);
  g.fillStyle(0xef9a9a, 1);
  g.fillCircle(x + 26, y - 168, 8);
  g.fillStyle(0xa5d6a7, 1);
  g.fillCircle(x - 8, y - 138, 8);
  g.fillCircle(x + 18, y - 138, 8);
  g.fillStyle(0x263238, 1);
  g.fillRoundedRect(x - 28, y - 64, 56, 20, 5);
}

function drawCounter(g, x, y) {
  const w = 220;
  shadow(g, x, y, w * 0.85);
  g.fillStyle(0xbc8f6b, 1);
  g.fillRoundedRect(x - w / 2 + 10, y - 74, w - 20, 74, 10);
  g.fillStyle(0xd7b899, 1);
  g.fillRoundedRect(x - w / 2, y - 92, w, 24, 8);

  g.fillStyle(0x546e7a, 1);
  g.fillRoundedRect(x + 30, y - 140, 50, 48, 6);
  g.fillStyle(0x90caf9, 1);
  g.fillRoundedRect(x + 35, y - 135, 40, 22, 4);
  g.fillStyle(0x263238, 1);
  g.fillRoundedRect(x + 42, y - 106, 26, 10, 3);

  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(x - 84, y - 102, 34, 14, 3);
  g.fillStyle(0xef9a9a, 1);
  g.fillCircle(x - 96, y - 96, 9);
}

function drawNightstand(g, x, y) {
  shadow(g, x, y, 60);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(x - 30, y - 74, 60, 74, 8);
  g.lineStyle(2, 0xb0bec5, 1);
  g.strokeRoundedRect(x - 30, y - 74, 60, 74, 8);
  g.lineBetween(x - 30, y - 40, x + 30, y - 40);
  g.fillStyle(0x90a4ae, 1);
  g.fillRect(x - 8, y - 56, 16, 4);

  g.fillStyle(0xffd54f, 1);
  g.fillTriangle(x - 18, y - 88, x + 18, y - 88, x + 10, y - 110);
  g.fillRect(x - 2, y - 88, 4, 14);
  g.fillStyle(0x5d4037, 1);
  g.fillRect(x - 10, y - 74, 20, 5);
}

function drawPlant(g, x, y) {
  shadow(g, x, y, 70);
  g.fillStyle(0xc47a4a, 1);
  g.fillRoundedRect(x - 34, y - 64, 68, 64, 8);
  g.fillStyle(0x6aa84f, 1);
  g.fillCircle(x, y - 92, 32);
  g.fillCircle(x - 28, y - 76, 24);
  g.fillCircle(x + 28, y - 76, 24);
  g.fillStyle(0x4f8f3a, 1);
  g.fillCircle(x, y - 116, 24);
}

const PAINTERS = {
  desk: drawDesk,
  bench: drawBench,
  chair: drawChair,
  cabinet: drawCabinet,
  bed: drawBed,
  iv: drawIv,
  sink: drawSink,
  table: drawTable,
  vending: drawVending,
  counter: drawCounter,
  nightstand: drawNightstand,
  plant: drawPlant,
};

export function drawFurniture(g, type, x, y) {
  const painter = PAINTERS[type];
  if (painter) {
    painter(g, x, y);
  }
}
