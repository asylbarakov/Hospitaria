// «Итоги дня» (этап 17): доходы, расходы, штрафы и кредит доверия.
// Окно поверх игры, открывается из HUD по событию HospitalEconomy.onDayEnd.

import { createButton } from '../ui/Button.js';
import { isoKey } from './isoAssets.js';

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

    const win = scene.add.nineslice(640, 360, isoKey('ui_ui_window'), undefined, 900, 500, 48, 48, 48, 48);
    this.root.add(win);

    this.title = scene.add.text(640, 160, 'Итоги дня', {
      fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#0d3b3a', strokeThickness: 4,
    }).setOrigin(0.5);
    this.root.add(this.title);

    this.income = this.makeLine(226, '#b9f6ca');
    this.expenses = this.makeLine(286, '#ffd180');
    this.penalties = this.makeLine(346, '#ff8a80');
    this.net = this.makeLine(414, '#ffe082', 30);
    this.debt = scene.add.text(640, 462, '', {
      fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#ff8a80',
    }).setOrigin(0.5);
    this.root.add(this.debt);

    this.footer = scene.add.text(640, 504, '', {
      fontFamily: FONT, fontSize: '15px', color: '#b9e6df', align: 'center',
    }).setOrigin(0.5);
    this.root.add(this.footer);

    const button = createButton(scene, 640, 565, 'Продолжить', () => this.close(), {
      width: 230, height: 48, fontSize: 20, color: 0x3f9b4a, hoverColor: 0x55b963,
    });
    this.root.add(button);
  }

  makeLine(y, color, size = 22) {
    const text = this.scene.add.text(640, y, '', {
      fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color,
      stroke: '#10222e', strokeThickness: 4,
    }).setOrigin(0.5);
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
