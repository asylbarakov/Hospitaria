// Окно «Открыть кабинет» (этап 17.5): цена, чего не хватает и покупка.
// Вынесено из IsoHospitalHud, чтобы HUD оставался про кнопки и панели.

import { openDialog } from '../ui/Dialog.js';
import { roomUnlockOf } from '../data/roomUnlocks.js';

/**
 * @param {import('../scenes/IsoHospitalHud.js').default} hud
 * @param {string} roomId
 * @returns {object|null} диалог openDialog
 */
export default function openRoomUnlockDialog(hud, roomId) {
  const main = hud.world();
  const entry = roomUnlockOf(roomId);
  if (!entry || !main) {
    return null;
  }
  if (main.isRoomUnlocked(roomId)) {
    main.notify('Этот кабинет уже открыт');
    return null;
  }
  if (hud.roomDialogOpen && hud.roomDialog) {
    hud.roomDialog.close();
  }
  const check = main.roomLocks.canUnlock(roomId, main.stats);
  const missing = check.missing || { coins: 0, crystals: 0, levels: 0 };
  let status = 'Выберите, чем заплатить.';
  if (missing.levels > 0) {
    status = `Не хватает: уровень ${entry.minLevel}.`;
  } else if (check.reason === 'funds') {
    status = `Не хватает: ${missing.coins} монет или ${missing.crystals} кристаллов.`;
  }
  const text = [
    `Кабинет «${entry.title}» закрыт.`,
    '',
    `Цена: ${entry.coins} монет или ${entry.crystals} кристаллов.`,
    `Нужен уровень ${entry.minLevel} (сейчас ${main.stats.level}).`,
    '',
    status,
  ].join('\n');

  // Одна кнопка на валюту: платит игрок только той, которую выбрал.
  const payButton = (currency, label) => {
    const can = main.roomLocks.canUnlock(roomId, main.stats, currency).ok;
    return {
      label,
      color: can ? 0x3f9b4a : 0x8a6d5b,
      hoverColor: can ? 0x55b963 : 0xa88a76,
      onClick: () => {
        const current = main.roomLocks.canUnlock(roomId, main.stats, currency);
        if (!current.ok) {
          main.notify(current.hint);
          return;
        }
        main.unlockRoom(roomId, currency);
      },
    };
  };

  hud.roomDialogOpen = true;
  main.modalOpen = true;
  hud.status.setVisible(false);
  const dialog = openDialog(hud, {
    title: 'Открыть кабинет',
    subtitle: entry.title,
    text,
    accent: 0xc9622f,
    buttons: [
      payButton('coins', `${entry.coins} монет`),
      payButton('crystals', `${entry.crystals} кристаллов`),
      { label: 'Позже', color: 0x5b7f8c, hoverColor: 0x729aa8 },
    ],
    onClose: () => {
      hud.roomDialog = null;
      hud.roomDialogOpen = false;
      main.modalOpen = false;
      hud.status.setVisible(true);
    },
  });
  hud.roomDialog = dialog;
  return dialog;
}
