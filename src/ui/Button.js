import { playClick } from '../systems/Sound.js';

/**
 * Универсальная кнопка: скруглённый прямоугольник + подпись.
 * Возвращает Phaser.Container, который можно ставить на сцену и анимировать.
 */
export function createButton(scene, x, y, label, onClick, options = {}) {
  const {
    width = 340,
    height = 72,
    radius = 16,
    color = 0x4caf50,
    hoverColor = 0x66bb6a,
    textColor = '#ffffff',
    fontSize = 30,
    disabled = false,
    depth = 0,
  } = options;

  const container = scene.add.container(x, y).setDepth(depth);

  const bg = scene.add.graphics();

  const paint = (fill) => {
    bg.clear();
    // Мягкая тень под кнопкой.
    bg.fillStyle(0x000000, 0.18);
    bg.fillRoundedRect(-width / 2 + 4, -height / 2 + 6, width, height, radius);
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    bg.lineStyle(3, 0xffffff, 0.55);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
  };

  const caption = scene.add
    .text(0, 0, label, {
      fontFamily: 'Arial, "Segoe UI", sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      color: textColor,
    })
    .setOrigin(0.5);

  container.add([bg, caption]);

  if (disabled) {
    paint(0x9e9e9e);
    caption.setAlpha(0.75);
    return container;
  }

  paint(color);

  const zone = scene.add
    .zone(0, 0, width, height)
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  container.add(zone);

  zone.on('pointerover', () => paint(hoverColor));
  zone.on('pointerout', () => {
    paint(color);
    container.setScale(1);
  });
  zone.on('pointerdown', () => container.setScale(0.96));
  zone.on('pointerup', () => {
    container.setScale(1);
    playClick();
    onClick();
  });

  return container;
}
