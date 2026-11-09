import { createButton } from './Button.js';

const FONT = 'Arial, "Segoe UI", sans-serif';

/**
 * Переключатель варианта: подпись, значение и две стрелки.
 * accessors.get/set читают и меняют индекс в конфиге персонажа.
 */
export function createStepper(scene, x, y, title, options, accessors, onChange) {
  const container = scene.add.container(x, y);

  const label = scene.add
    .text(0, -44, title, {
      fontFamily: FONT,
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#4d7b8a',
    })
    .setOrigin(0.5);

  const value = scene.add
    .text(0, 0, '', {
      fontFamily: FONT,
      fontSize: '21px',
      color: '#24444f',
      align: 'center',
    })
    .setOrigin(0.5);

  const swatch = scene.add.graphics();

  const refresh = () => {
    const option = options[accessors.get()];
    const hasColor = option.color !== undefined;

    value.setText(option.label);
    value.setX(hasColor ? -14 : 0);

    swatch.clear();
    if (hasColor) {
      swatch.fillStyle(option.color, 1);
      swatch.fillCircle(86, 0, 11);
      swatch.lineStyle(2, 0x5b7f8c, 0.6);
      swatch.strokeCircle(86, 0, 11);
    }
  };

  const step = (delta) => {
    const count = options.length;
    accessors.set((accessors.get() + delta + count) % count);
    refresh();
    onChange();
  };

  const left = createButton(scene, -126, 0, '◀', () => step(-1), {
    width: 54,
    height: 54,
    radius: 14,
    fontSize: 20,
    color: 0x5b8fa8,
    hoverColor: 0x74a9c2,
  });

  const right = createButton(scene, 126, 0, '▶', () => step(1), {
    width: 54,
    height: 54,
    radius: 14,
    fontSize: 20,
    color: 0x5b8fa8,
    hoverColor: 0x74a9c2,
  });

  container.add([label, value, swatch, left, right]);
  refresh();

  return container;
}

export default createStepper;
