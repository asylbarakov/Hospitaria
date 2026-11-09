import { ACCESSORIES, HATS } from '../data/avatarOptions.js';
import { shade } from './avatarColors.js';

export function drawAccessory(g, config, skin) {
  const hat = HATS[config.hat] || HATS[0];

  if (hat.id === 'beret') {
    g.fillStyle(hat.color, 1);
    g.fillEllipse(0, -260, 108, 44);
    g.fillCircle(34, -274, 10);
  } else if (hat.id === 'cap') {
    g.fillStyle(hat.color, 1);
    g.fillRoundedRect(-34, -278, 68, 26, 9);
    g.lineStyle(2, 0xc7d8e0, 1);
    g.strokeRoundedRect(-34, -278, 68, 26, 9);
    g.fillStyle(0xe53935, 1);
    g.fillRoundedRect(-3, -274, 6, 18, 2);
    g.fillRoundedRect(-9, -268, 18, 6, 2);
  } else if (config.role === 'nurse') {
    // Шапочка медсестры по умолчанию.
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
  } else if (accessory === 'headmirror') {
    g.lineStyle(5, 0x546e7a, 1);
    g.strokeCircle(0, -246, 16);
    g.fillStyle(0xe3f2fd, 0.9);
    g.fillCircle(0, -246, 12);
    g.lineStyle(2, 0xffffff, 0.8);
    g.lineBetween(-7, -252, 5, -242);
  }

  // Лёгкая тень под подбородком.
  g.fillStyle(shade(skin, 0.7), 0.12);
  g.fillEllipse(0, -178, 28, 10);
}

export default drawAccessory;
