import { button as uiButton } from '../ui/IsoUi.js';
import { iconKey, isoKey } from '../iso/isoAssets.js';
import {
  ACCENTS, PLAYER_SKINS, accentCost, buyAccent, buySkin, isAccentOwned, isSkinOwned,
  normalizePlayer, skinById, skinCost, skinCurrency,
} from '../data/playerSkins.js';

const W = 1280;
const H = 720;
const FONT = 'Arial, "Segoe UI", sans-serif';
const CARD_W = 250;
const CARD_H = 168;
const CARD_COLS = [320, 640, 960];
const CARD_ROWS = [330, 530];

// Этап 12: гардероб v2. Больница и HUD на паузе; выбор бесплатный,
// покупка платного облика подтверждается повторным нажатием.
export default class IsoWardrobeScene extends Phaser.Scene {
  constructor() {
    super('IsoWardrobeScene');
  }

  create() {
    this.hospital = this.scene.get('IsoHospitalScene');
    if (!this.hospital || !this.hospital.player) {
      this.scene.stop();
      return;
    }
    this.closed = false;
    this.player = normalizePlayer(this.hospital.player);
    this.coins = Number.isFinite(this.hospital.coins) ? this.hospital.coins : 0;
    this.crystals = Number.isFinite(this.hospital.crystals) ? this.hospital.crystals : 0;
    this.pending = null;
    this.pendingUntil = 0;
    this.cards = [];
    this.accentDots = [];

    this.drawPanel();
    this.drawHeader();
    this.drawAccents();
    this.drawCards();
    uiButton(this, 640, 674, 'Закрыть', () => this.close(), {
      width: 240, height: 52, fontSize: 24, color: 0x3f9b4a, hoverColor: 0x55b963,
    });

    this.onEsc = () => this.close();
    this.input.keyboard.on('keydown-ESC', this.onEsc);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown-ESC', this.onEsc));
    this.refresh();
  }

  drawPanel() {
    const g = this.add.graphics();
    g.fillStyle(0x07161f, 0.74);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0xf4fbfd, 1);
    g.fillRoundedRect(120, 92, 1040, 548, 26);
    g.lineStyle(4, 0x4fb3a5, 1);
    g.strokeRoundedRect(120, 92, 1040, 548, 26);
  }

  drawHeader() {
    this.add
      .text(640, 136, `Гардероб · ${this.player.name || 'Доктор'}`, {
        fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#24444f',
      })
      .setOrigin(0.5);
    this.add.image(960, 56, iconKey('icon_coin')).setScale(0.24).setDepth(10);
    this.coinText = this.add
      .text(986, 56, '', { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#fff3b0', stroke: '#10222e', strokeThickness: 5 })
      .setOrigin(0, 0.5)
      .setDepth(10);
    this.add.image(1062, 56, iconKey('icon_crystal')).setScale(0.22).setDepth(10);
    this.crystalText = this.add
      .text(1086, 56, '', { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#9fe7ff', stroke: '#10222e', strokeThickness: 5 })
      .setOrigin(0, 0.5)
      .setDepth(10);
    this.hintText = this.add
      .text(640, 626, 'Бесплатные облики и акценты доступны сразу. Платные: нажмите дважды', {
        fontFamily: FONT, fontSize: '17px', color: '#4d7b8a', align: 'center', wordWrap: { width: 940 },
      })
      .setOrigin(0.5);
  }

  drawAccents() {
    this.add
      .text(235, 196, 'Акцент роли', { fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#2f5d6b' })
      .setOrigin(0, 0.5);
    ACCENTS.forEach((accent, index) => {
      const dot = this.add.circle(390 + index * 58, 196, 18, accent.color);
      dot.setInteractive({ useHandCursor: true });
      dot.on('pointerup', () => this.onAccent(accent));
      const price = this.add
        .text(390 + index * 58, 226, accentCost(accent) ? `${accentCost(accent)}✦` : '', {
          fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#7a8f97',
        })
        .setOrigin(0.5);
      this.accentDots.push({ id: accent.id, dot, price });
    });
  }

  drawCards() {
    PLAYER_SKINS.forEach((skin, index) => {
      const x = CARD_COLS[index % 3];
      const y = CARD_ROWS[Math.floor(index / 3)];
      const card = this.add.container(x, y);
      const bg = this.add.graphics();
      const img = this.add.image(0, -42, isoKey(skin.id));
      img.setScale(Math.min(84 / img.width, 96 / img.height));
      const title = this.add
        .text(0, 14, skin.title, {
          fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#24444f', align: 'center', wordWrap: { width: 220 },
        })
        .setOrigin(0.5, 0);
      const status = this.add
        .text(0, 52, '', { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#7a8f97' })
        .setOrigin(0.5);
      const zone = this.add.zone(0, 0, CARD_W, CARD_H).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => this.onCard(skin));
      card.add([bg, img, title, status, zone]);
      this.cards.push({ id: skin.id, skin, bg, status });
    });
  }

  paintCards() {
    this.cards.forEach((entry) => {
      const owned = isSkinOwned(entry.id, this.player.owned);
      const selected = entry.id === this.player.skin;
      entry.bg.clear();
      entry.bg.fillStyle(selected ? 0xdff4ea : 0xffffff, 0.98);
      entry.bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 16);
      const color = selected ? 0x2f7f4f : (owned ? 0x4fb3a5 : 0x8fa7b0);
      entry.bg.lineStyle(selected ? 4 : 2, color, 1);
      entry.bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 16);
      if (selected) {
        entry.status.setText('Выбран').setColor('#2f7f4f');
      } else if (owned) {
        entry.status.setText('Есть').setColor('#3d8f7a');
      } else {
        const cost = skinCost(entry.skin);
        const currency = skinCurrency(entry.skin) === 'crystals' ? 'крист.' : 'монет';
        entry.status.setText(`${cost} ${currency}`).setColor('#b07a18');
      }
    });
  }

  paintAccents() {
    this.accentDots.forEach((entry) => {
      const on = entry.id === this.player.accent;
      const owned = isAccentOwned(entry.id, this.player.ownedAccents);
      entry.dot.setStrokeStyle(on ? 5 : 2, on ? 0x24444f : 0xffffff, on ? 1 : 0.8);
      entry.dot.setAlpha(owned || on ? 1 : 0.55);
      if (entry.price) {
        entry.price.setColor(on ? '#2f7f4f' : (owned ? '#3d8f7a' : '#b07a18'));
      }
    });
  }

  onAccent(accent) {
    if (isAccentOwned(accent.id, this.player.ownedAccents)) {
      this.player.accent = accent.id;
      this.pending = null;
      this.apply();
      return;
    }
    const cost = accentCost(accent);
    if (this.crystals < cost) {
      this.setHint(`Не хватает ${cost - this.crystals} кристаллов`, '#b3261e');
      return;
    }
    const key = `accent:${accent.id}`;
    if (this.pending === key && this.time.now < this.pendingUntil) {
      this.purchaseAccent(accent);
      return;
    }
    this.pending = key;
    this.pendingUntil = this.time.now + 4000;
    this.setHint(`Нажмите на акцент «${accent.title}» ещё раз: ${cost} кристаллов`, '#b07a18');
  }

  purchaseAccent(accent) {
    const result = buyAccent(this.player, this.crystals, accent.id);
    if (!result.ok) {
      return;
    }
    this.crystals = result.crystals;
    this.player = result.player;
    this.pending = null;
    this.apply();
    this.setHint(`Куплено: акцент «${accent.title}»`, '#2f7f4f');
  }

  onCard(skin) {
    if (isSkinOwned(skin.id, this.player.owned)) {
      this.player.skin = skin.id;
      this.pending = null;
      this.apply();
      return;
    }
    const currency = skinCurrency(skin);
    const cost = skinCost(skin);
    const wallet = currency === 'crystals' ? this.crystals : this.coins;
    if (wallet < cost) {
      const label = currency === 'crystals' ? 'кристаллов' : 'монет';
      this.setHint(`Не хватает ${cost - wallet} ${label}`, '#b3261e');
      return;
    }
    const key = `skin:${skin.id}`;
    if (this.pending === key && this.time.now < this.pendingUntil) {
      this.buy(skin);
      return;
    }
    this.pending = key;
    this.pendingUntil = this.time.now + 4000;
    const label = currency === 'crystals' ? 'кристаллов' : 'монет';
    this.setHint(`Нажмите «${skin.title}» ещё раз: купить за ${cost} ${label}`, '#b07a18');
  }

  buy(skin) {
    const result = buySkin(this.player, this.coins, skin.id, this.crystals);
    if (!result.ok) {
      return;
    }
    this.coins = result.coins;
    this.crystals = result.crystals;
    this.player = result.player;
    this.pending = null;
    this.apply();
    this.setHint(`Куплено: ${skin.title}`, '#2f7f4f');
  }

  apply() {
    this.hospital.applyPlayer(this.player, this.coins, this.crystals);
    this.refresh();
  }

  setHint(text, color = '#4d7b8a') {
    this.hintText.setText(text).setColor(color);
  }

  refresh() {
    this.coinText.setText(`${this.coins}`);
    this.crystalText.setText(`${this.crystals}`);
    this.player.skin = skinById(this.player.skin).id;
    this.paintCards();
    this.paintAccents();
  }

  close() {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.hospital.closeWardrobe();
    this.scene.stop();
  }
}
