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
  const missing = [];
  if (check.missing && check.missing.levels > 0) {
    missing.push(`уровень ${entry.minLevel}`);
  }
  if (check.missing && check.missing.coins > 0) {
    missing.push(`${check.missing.coins} монет`);
  }
  if (check.missing && check.missing.crystals > 0) {
    missing.push(`${check.missing.crystals} кристаллов`);
  }
  const text = [
    `Кабинет «${entry.title}» закрыт.`,
    '',
    `Цена: ${entry.coins} монет и ${entry.crystals} кристаллов.`,
    `Нужен уровень ${entry.minLevel} (сейчас ${main.stats.level}).`,
    '',
    missing.length ? `Не хватает: ${missing.join(', ')}.` : 'Всё готово — можно открывать!',
  ].join('\n');

  hud.roomDialogOpen = true;
  main.modalOpen = true;
  hud.status.setVisible(false);
  const dialog = openDialog(hud, {
    title: 'Открыть кабинет',
    subtitle: entry.title,
    text,
    accent: 0xc9622f,
    buttons: [
      {
        label: 'Открыть',
        color: check.ok ? 0x3f9b4a : 0x8a6d5b,
        hoverColor: check.ok ? 0x55b963 : 0xa88a76,
        onClick: () => {
          const current = main.roomLocks.canUnlock(roomId, main.stats);
          if (!current.ok) {
            main.notify(current.hint);
            return;
          }
          main.unlockRoom(roomId);
        },
      },
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
