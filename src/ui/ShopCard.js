import { createButton } from './Button.js';
import { HUD_FONT, drawCoinIcon } from './hudDrawing.js';

const CARD_W = 252;
const CARD_H = 205;

function getButtonState(item, state) {
  if (state.locked) {
    return { label: `С ур. ${item.level}`, color: 0x9e9e9e, disabled: true };
  }
  if (state.owned && state.equipped) {
    return { label: 'Надето', color: 0x3f9b4a, disabled: true };
  }
  if (state.owned && item.tab === 'clothes') {
    return { label: 'Надеть', color: 0x3f8fb0, disabled: false };
  }
  if (state.owned) {
    return { label: 'Куплено', color: 0x3f9b4a, disabled: true };
  }
  if (!state.affordable) {
    return { label: 'Не хватает монет', color: 0x9e9e9e, disabled: true };
  }
  return { label: 'Купить', color: 0x3f9b4a, disabled: false };
}

export function createShopCard(scene, root, x, y, item, state, onAction) {
  const container = scene.add.container(x, y);

  const bg = scene.add.graphics();
  bg.fillStyle(0x0b1e28, 0.1);
  bg.fillRoundedRect(-CARD_W / 2 + 5, -CARD_H / 2 + 6, CARD_W, CARD_H, 16);
  bg.fillStyle(0xf6fbfd, 1);
  bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 16);
  bg.lineStyle(2, 0xb9d4e0, 1);
  bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 16);
  bg.fillStyle(item.color || 0x9fc3d1, 1);
  bg.fillRoundedRect(-CARD_W / 2 + 12, -CARD_H / 2 + 14, 7, 42, 4);

  const title = scene.add
    .text(-CARD_W / 2 + 30, -CARD_H / 2 + 24, item.name, {
      fontFamily: HUD_FONT,
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#24444f',
      wordWrap: { width: CARD_W - 48 },
    })
    .setOrigin(0, 0);

  const category = scene.add
    .text(-CARD_W / 2 + 30, -CARD_H / 2 + 66, `${item.category}  •  с ур. ${item.level}`, {
      fontFamily: HUD_FONT,
      fontSize: '13px',
      color: '#6b8e99',
    })
    .setOrigin(0, 0);

  const coin = scene.add.graphics();
  drawCoinIcon(coin, -CARD_W / 2 + 34, 12, 9);

  const price = scene.add
    .text(-CARD_W / 2 + 50, 12, `${item.price}`, {
      fontFamily: HUD_FONT,
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#8a5a00',
    })
    .setOrigin(0, 0.5);

  const status = scene.add
    .text(CARD_W / 2 - 16, 12, state.owned ? 'В коллекции' : 'Не куплено', {
      fontFamily: HUD_FONT,
      fontSize: '12px',
      color: state.owned ? '#2e7d32' : '#8aa6b0',
    })
    .setOrigin(1, 0.5);

  const buttonState = getButtonState(item, state);
  const button = createButton(
    scene,
    0,
    CARD_H / 2 - 38,
    buttonState.label,
    onAction,
    {
      width: CARD_W - 40,
      height: 40,
      fontSize: 15,
      color: buttonState.color,
      hoverColor: 0x66bb6a,
      disabled: buttonState.disabled,
    },
  );

  container.add([bg, title, category, coin, price, status, button]);
  root.add(container);

  return container;
}

export default createShopCard;
