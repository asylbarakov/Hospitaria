// «Итоги дня» (этап 17): доходы, расходы, штрафы и кредит доверия.
// Окно поверх игры, открывается из HUD по событию HospitalEconomy.onDayEnd.

import { button as uiButton, plate, text as uiText, windowFrame } from '../ui/IsoUi.js';

const FONT = 'Arial, "Segoe UI", sans-serif';

function money(value) {
  const n = Math.round(Number(value) || 0);
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
}

export default class DaySummary {
  constructor(scene, hooks = {}) {
    this.scene = scene;
    this.hooks = hooks;
    this.summary = null;
    this.root = scene.add.container(0, 0).setDepth(26).setVisible(false);

    const overlay = scene.add.graphics();
    overlay.fillStyle(0x06141d, 0.78);
    overlay.fillRect(0, 0, 1280, 720);
    this.root.add(overlay);

    this.root.add(windowFrame(scene, 640, 360, 900, 500));

    // Заголовок — тёмная табличка слева в шапке: по центру её перекрывает крест.
    this.root.add(plate(scene, 380, 168, 320, 56, { tint: 0x123240 }));
    this.title = uiText(scene, 246, 168, 'Итоги дня', {
      size: 32, bold: true, color: '#ffffff', origin: [0, 0.5],
    });
    this.root.add(this.title);

    // Строки начинаются ниже шапки окна, а не на её границе.
    this.income = this.makeLine(272, '#1d7a4f');
    this.expenses = this.makeLine(322, '#9a5b12');
    this.penalties = this.makeLine(372, '#b5423c');
    this.net = this.makeLine(428, '#1b4b5a', 30);
    this.debt = uiText(scene, 640, 472, '', {
      size: 22, bold: true, color: '#b5423c', origin: [0.5, 0.5],
    });
    this.root.add(this.debt);

    this.footer = uiText(scene, 640, 512, '', {
      size: 21, color: '#4d7b8a', origin: [0.5, 0.5], align: 'center',
    });
    this.root.add(this.footer);

    const button = uiButton(scene, 640, 566, 'Продолжить', () => this.close(), {
      width: 230, height: 56, fontSize: 20, variant: 'green',
    });
    this.root.add(button);
  }

  makeLine(y, color, size = 22) {
    const text = uiText(this.scene, 640, y, '', {
      size, bold: true, color, origin: [0.5, 0.5],
    });
    this.root.add(text);
    return text;
  }

  get visible() {
    return this.root.visible;
  }

  show(summary) {
    this.summary = summary || null;
    this.root.setVisible(true);
    this.render();
  }

  hide() {
    this.root.setVisible(false);
  }

  close() {
    this.hide();
    if (typeof this.hooks.onClose === 'function') {
      this.hooks.onClose();
    }
  }

  render() {
    const s = this.summary;
    if (!s) {
      return;
    }
    this.title.setText(`Итоги дня ${s.day}`);
    this.income.setText(`Доходы: ${money(s.income)}  (чаевые ${s.tips})`);
    const purchases = s.purchases ? ` · покупки ${s.purchases}` : '';
    this.expenses.setText(`Расходы: −${s.bills + s.purchases}  (зарплаты ${s.salaries} · помещения ${s.utilities} · лекарства ${s.supplies}${purchases})`);
    this.penalties.setText(`Штрафы: −${s.penalties}${s.overcrowded ? '  (очередь была переполнена)' : ''}`);
    this.net.setText(`Итог дня: ${money(s.net)}`);
    this.debt.setText(s.debt > 0 ? `Кредит доверия: ${s.debt}. Доходы сначала закроют его.` : '');
    this.footer.setText(`Принято пациентов: ${s.treated} · Ушли недовольными: ${s.angry} · Монет сейчас: ${s.coins}`);
  }
}
