import { playClick } from '../systems/Sound.js';
import { shade } from '../systems/avatarColors.js';

/**
 * Универсальная кнопка: объёмный скруглённый прямоугольник с бликом + подпись.
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
  const bodyHeight = height - 4;

  const paint = (fill) => {
    bg.clear();
    // Мягкая тень под кнопкой.
    bg.fillStyle(0x000000, 0.2);
    bg.fillRoundedRect(-width / 2 + 3, -height / 2 + 7, width, height, radius);
    // Нижний борт даёт ощущение толщины.
    bg.fillStyle(shade(fill, 0.72), 1);
    bg.fillRoundedRect(-width / 2, -height / 2 + 4, width, bodyHeight, radius);
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, bodyHeight, radius);
    // Глянцевый блик сверху.
    bg.fillStyle(0xffffff, 0.2);
    bg.fillRoundedRect(
      -width / 2 + 6,
      -height / 2 + 5,
      width - 12,
      bodyHeight * 0.42,
      Math.max(6, radius - 6),
    );
    bg.lineStyle(2.5, 0xffffff, 0.5);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, bodyHeight, radius);
  };

  const caption = scene.add
    .text(0, -2, label, {
      fontFamily: 'Arial, "Segoe UI", sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      color: textColor,
      shadow: { offsetX: 0, offsetY: 2, color: 'rgba(0, 0, 0, 0.28)', blur: 2, fill: true },
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

  const scaleTo = (value, duration) => {
    scene.tweens.killTweensOf(container);
    scene.tweens.add({
      targets: container,
      scale: value,
      duration,
      ease: 'Quad.easeOut',
    });
  };

  zone.on('pointerover', () => {
    paint(hoverColor);
    scaleTo(1.04, 90);
  });
  zone.on('pointerout', () => {
    paint(color);
    scaleTo(1, 90);
  });
  zone.on('pointerdown', () => scaleTo(0.96, 50));
  zone.on('pointerup', () => {
    scaleTo(1.04, 80);
    playClick();
    onClick();
  });

  return container;
}
