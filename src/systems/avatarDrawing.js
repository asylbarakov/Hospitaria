import {
  SKIN_COLORS,
  HAIR_COLORS,
  COAT_COLORS,
  HAIRSTYLES,
  ACCESSORIES,
  PATIENT_ROLE,
  PATIENT_CLOTHES,
} from '../data/avatarOptions.js';

const HEAD_Y = -212;

export function shade(hex, factor) {
  const r = Math.max(0, Math.min(255, Math.round(((hex >> 16) & 0xff) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(((hex >> 8) & 0xff) * factor)));
  const b = Math.max(0, Math.min(255, Math.round((hex & 0xff) * factor)));
  return (r << 16) | (g << 8) | b;
}

function drawShadow(g) {
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(0, 2, 98, 22);
}

function drawHairBack(g, config, hair) {
  const style = HAIRSTYLES[config.hairstyle].id;
  g.fillStyle(hair, 1);

  if (style === 'long') {
    g.fillRoundedRect(-54, -256, 108, 130, 42);
    g.fillRoundedRect(-60, -232, 20, 104, 10);
    g.fillRoundedRect(40, -232, 20, 104, 10);
  } else if (style === 'bob') {
    g.fillRoundedRect(-54, -256, 108, 104, 40);
  } else if (style === 'ponytail') {
    g.fillRoundedRect(38, -242, 26, 92, 13);
    g.fillCircle(52, -158, 18);
    g.fillStyle(shade(hair, 0.8), 1);
    g.fillCircle(42, -236, 7);
  } else if (style === 'bun') {
    g.fillCircle(0, -274, 24);
  }
}

function drawLegs(g, config, phase = 0) {
  let pants = config.role === 'nurse' ? 0x4f9c94 : 0x4a6b8a;
  if (config.role === PATIENT_ROLE) {
    pants = 0x4a5a76;
  }
  const swing = Math.sin(phase) * 12;
  const liftLeft = Math.max(0, Math.sin(phase)) * 8;
  const liftRight = Math.max(0, -Math.sin(phase)) * 8;

  g.lineStyle(24, pants, 1);
  g.lineBetween(-17.5, -78, -17.5 + swing, -13 - liftLeft);
  g.lineBetween(17.5, -78, 17.5 - swing, -13 - liftRight);
}

function drawShoes(g, phase = 0) {
  const swing = Math.sin(phase) * 12;
  const liftLeft = Math.max(0, Math.sin(phase)) * 8;
  const liftRight = Math.max(0, -Math.sin(phase)) * 8;
  const leftX = -17.5 + swing;
  const rightX = 17.5 - swing;
  const leftY = -15 - liftLeft;
  const rightY = -15 - liftRight;

  g.fillStyle(0x455a64, 1);
  g.fillRoundedRect(leftX - 16, leftY, 32, 16, 8);
  g.fillRoundedRect(rightX - 16, rightY, 32, 16, 8);
  g.fillStyle(0xcfd8dc, 1);
  g.fillRoundedRect(leftX - 16, leftY + 10, 32, 6, 3);
  g.fillRoundedRect(rightX - 16, rightY + 10, 32, 6, 3);
}

export function drawLegPose(layers, config, phase) {
  layers.legs.clear();
  layers.shoes.clear();
  drawLegs(layers.legs, config, phase);
  drawShoes(layers.shoes, phase);
}

function drawBody(g, config, skin) {
  let scrub = config.role === 'nurse' ? 0x7fc9c1 : 0x7fb6cf;
  if (config.role === PATIENT_ROLE) {
    scrub = 0xeceff1;
  }

  // Шея.
  g.fillStyle(shade(skin, 0.9), 1);
  g.fillRoundedRect(-15, -184, 30, 34, 10);
  g.fillStyle(skin, 1);
  g.fillRoundedRect(-15, -184, 30, 24, 10);

  // Медицинский костюм под халатом.
  g.fillStyle(scrub, 1);
  g.fillRoundedRect(-38, -170, 76, 104, 26);
  g.lineStyle(3, shade(scrub, 0.78), 0.6);
  g.strokeRoundedRect(-38, -170, 76, 104, 26);
}

function drawPatientClothes(g, config, skin) {
  const clothes = PATIENT_CLOTHES[config.coat].color;
  const dark = shade(clothes, 0.78);

  g.fillStyle(clothes, 1);
  g.fillRoundedRect(-48, -168, 96, 104, 26);
  g.fillRoundedRect(-58, -164, 19, 74, 9);
  g.fillRoundedRect(39, -164, 19, 74, 9);

  g.lineStyle(3, dark, 0.7);
  g.strokeRoundedRect(-48, -168, 96, 104, 26);
  g.strokeRoundedRect(-58, -164, 19, 74, 9);
  g.strokeRoundedRect(39, -164, 19, 74, 9);

  // Светлая футболка в вырезе куртки.
  g.fillStyle(0xffffff, 0.92);
  g.fillTriangle(0, -112, -22, -162, 22, -162);
  g.lineStyle(3, dark, 0.9);
  g.lineBetween(0, -112, -22, -162);
  g.lineBetween(0, -112, 22, -162);

  // Пуговицы и карман.
  g.fillStyle(dark, 1);
  g.fillCircle(0, -100, 3.5);
  g.fillCircle(0, -82, 3.5);
  g.lineStyle(3, dark, 0.75);
  g.lineBetween(18, -96, 40, -96);

  // Кисти рук.
  g.fillStyle(skin, 1);
  g.fillCircle(-49, -88, 8);
  g.fillCircle(49, -88, 8);
  g.lineStyle(2, shade(skin, 0.78), 0.5);
  g.strokeCircle(-49, -88, 8);
  g.strokeCircle(49, -88, 8);
}

function drawCoat(g, config, skin) {
  if (config.role === PATIENT_ROLE) {
    drawPatientClothes(g, config, skin);
    return;
  }

  const coat = COAT_COLORS[config.coat].color;
  const coatDark = shade(coat, 0.8);
  const scrub = config.role === 'nurse' ? 0x7fc9c1 : 0x7fb6cf;

  g.fillStyle(coat, 1);
  g.fillRoundedRect(-48, -168, 96, 104, 26);
  g.fillRoundedRect(-58, -164, 19, 74, 9);
  g.fillRoundedRect(39, -164, 19, 74, 9);

  g.lineStyle(3, shade(coat, 0.68), 0.55);
  g.strokeRoundedRect(-48, -168, 96, 104, 26);
  g.strokeRoundedRect(-58, -164, 19, 74, 9);
  g.strokeRoundedRect(39, -164, 19, 74, 9);

  // Вырез халата и лацканы.
  g.fillStyle(scrub, 1);
  g.fillTriangle(0, -114, -22, -164, 22, -164);
  g.lineStyle(4, coatDark, 0.9);
  g.lineBetween(0, -114, -22, -164);
  g.lineBetween(0, -114, 22, -164);

  // Пуговицы и карманы.
  g.fillStyle(coatDark, 1);
  g.fillCircle(0, -102, 3.5);
  g.fillCircle(0, -84, 3.5);
  g.lineStyle(3, coatDark, 0.8);
  g.lineBetween(-38, -94, -16, -94);
  g.lineBetween(16, -94, 38, -94);

  // Значок с красным крестом.
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-30, -144, 12);
  g.lineStyle(2, 0xcfd8dc, 1);
  g.strokeCircle(-30, -144, 12);
  g.fillStyle(0xe53935, 1);
  g.fillRoundedRect(-34, -150, 8, 20, 2);
  g.fillRoundedRect(-39, -145, 18, 8, 2);

  // Кисти рук.
  g.fillStyle(skin, 1);
  g.fillCircle(-49, -88, 8);
  g.fillCircle(49, -88, 8);
  g.lineStyle(2, shade(skin, 0.78), 0.5);
  g.strokeCircle(-49, -88, 8);
  g.strokeCircle(49, -88, 8);
}

function drawHead(g, skin) {
  g.fillStyle(skin, 1);
  g.fillCircle(-47, -208, 11);
  g.fillCircle(47, -208, 11);
  g.fillEllipse(0, HEAD_Y, 94, 102);
  g.lineStyle(2.5, shade(skin, 0.8), 0.45);
  g.strokeEllipse(0, HEAD_Y, 94, 102);

  g.fillStyle(shade(skin, 0.88), 1);
  g.fillCircle(-47, -208, 5);
  g.fillCircle(47, -208, 5);
}

function drawFace(g, config, skin) {
  const hair = HAIR_COLORS[config.hairColor].color;

  g.lineStyle(4, shade(hair, 0.9), 0.9);
  g.lineBetween(-29, -235, -8, -238);
  g.lineBetween(8, -238, 29, -235);

  g.fillStyle(0xffffff, 1);
  g.fillEllipse(-17, -219, 14, 16);
  g.fillEllipse(17, -219, 14, 16);
  g.fillStyle(0x2f2a28, 1);
  g.fillCircle(-16, -219, 5);
  g.fillCircle(18, -219, 5);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(-18, -221, 1.8);
  g.fillCircle(16, -221, 1.8);

  g.lineStyle(3, shade(skin, 0.72), 0.65);
  g.lineBetween(1, -214, 1, -205);
  g.lineBetween(1, -205, 6, -203);

  g.lineStyle(3.5, 0xb35b5b, 0.85);
  g.beginPath();
  g.arc(1, -198, 13, 0.18 * Math.PI, 0.82 * Math.PI, false);
  g.strokePath();

  g.fillStyle(0xf48fb1, 0.35);
  g.fillCircle(-31, -201, 7);
  g.fillCircle(31, -201, 7);
}

function drawHairFront(g, config, hair) {
  const style = HAIRSTYLES[config.hairstyle].id;
  g.fillStyle(hair, 1);

  if (style === 'short') {
    g.fillEllipse(0, -252, 98, 50);
    g.fillRoundedRect(-49, -246, 10, 32, 5);
    g.fillRoundedRect(39, -246, 10, 32, 5);
  } else if (style === 'bob') {
    g.fillEllipse(0, -252, 102, 52);
    g.fillRoundedRect(-56, -248, 16, 68, 8);
    g.fillRoundedRect(40, -248, 16, 68, 8);
  } else if (style === 'long') {
    g.fillEllipse(0, -252, 102, 52);
    g.fillRoundedRect(-58, -248, 15, 102, 8);
    g.fillRoundedRect(43, -248, 15, 102, 8);
  } else if (style === 'ponytail') {
    g.fillEllipse(0, -252, 100, 50);
    g.fillTriangle(-50, -248, -28, -248, -47, -214);
  } else if (style === 'bun') {
    g.fillEllipse(0, -252, 100, 50);
  }

  g.fillStyle(0xffffff, 0.18);
  g.fillEllipse(-20, -262, 34, 13);
}

function drawAccessory(g, config, skin) {
  // Шапочка медсестры.
  if (config.role === 'nurse') {
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(-30, -272, 60, 22, 8);
    g.lineStyle(2, 0xc7d8e0, 1);
    g.strokeRoundedRect(-30, -272, 60, 22, 8);
    g.fillStyle(0xe53935, 1);
    g.fillRoundedRect(-3, -269, 6, 16, 2);
    g.fillRoundedRect(-8, -264, 16, 6, 2);
  }

  const accessory = ACCESSORIES[config.accessory].id;

  if (accessory === 'glasses') {
    g.lineStyle(4, 0x37474f, 0.9);
    g.strokeCircle(-17, -219, 13);
    g.strokeCircle(17, -219, 13);
    g.lineBetween(-4, -219, 4, -219);
    g.lineBetween(-30, -219, -40, -216);
    g.lineBetween(30, -219, 40, -216);
  } else if (accessory === 'mask') {
    g.fillStyle(0xe8f5fb, 1);
    g.fillRoundedRect(-26, -210, 52, 30, 10);
    g.lineStyle(2, 0x9fb8c6, 1);
    g.strokeRoundedRect(-26, -210, 52, 30, 10);
    g.lineStyle(2, 0xb9d4e0, 0.9);
    g.lineBetween(-20, -201, 20, -201);
    g.lineBetween(-18, -192, 18, -192);
    g.lineStyle(3, 0x9fb8c6, 0.8);
    g.lineBetween(-26, -205, -41, -201);
    g.lineBetween(26, -205, 41, -201);
  } else if (accessory === 'stethoscope') {
    g.lineStyle(6, 0x546e7a, 1);
    g.beginPath();
    g.moveTo(-25, -172);
    g.lineTo(-23, -142);
    g.lineTo(0, -128);
    g.lineTo(23, -142);
    g.lineTo(25, -172);
    g.strokePath();
    g.fillStyle(0x90a4ae, 1);
    g.fillCircle(7, -126, 8);
    g.lineStyle(3, 0x37474f, 1);
    g.strokeCircle(7, -126, 8);
  }

  // Лёгкая тень под подбородком.
  g.fillStyle(shade(skin, 0.7), 0.12);
  g.fillEllipse(0, -178, 28, 10);
}

export function drawAvatarLayers(layers, config) {
  const skin = SKIN_COLORS[config.skin].color;
  const hair = HAIR_COLORS[config.hairColor].color;

  Object.values(layers).forEach((layer) => layer.clear());

  drawShadow(layers.shadow);
  drawHairBack(layers.hairBack, config, hair);
  drawLegs(layers.legs, config);
  drawShoes(layers.shoes);
  drawBody(layers.body, config, skin);
  drawCoat(layers.coat, config, skin);
  drawHead(layers.head, skin);
  drawFace(layers.face, config, skin);
  drawHairFront(layers.hairFront, config, hair);
  drawAccessory(layers.accessory, config, skin);
}
