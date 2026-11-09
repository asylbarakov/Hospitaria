import { createButton } from '../ui/Button.js';
import Save from '../systems/Save.js';
import Avatar from '../systems/Avatar.js';
import { DEFAULT_AVATAR, normalizeAvatar } from '../data/avatarOptions.js';
import { createHospitalWorld } from '../systems/roomPainter.js';
import {
  VIEW_WIDTH,
  VIEW_HEIGHT,
  WORLD_WIDTH,
  FLOOR_Y,
} from '../data/rooms.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
const START_X = 400;
const MIN_X = 70;
const MAX_X = WORLD_WIDTH - 70;
const WALK_SPEED = 380;
const NAME_OFFSET_Y = -350;

export default class HospitalScene extends Phaser.Scene {
  constructor() {
    super('HospitalScene');
  }

  create() {
    this.saveData = Save.load();
    const player = this.saveData && this.saveData.player ? this.saveData.player : null;
    this.playerName = player && player.name ? player.name : 'Игрок';

    this.playerX = START_X;
    this.targetX = START_X;
    this.walkPhase = 0;

    this.world = createHospitalWorld(this);
    this.createPlayer(player);
    this.createCamera();
    this.createControls();
    this.createFixedUi();
  }

  createPlayer(player) {
    const config = normalizeAvatar(player || DEFAULT_AVATAR);

    this.avatar = new Avatar(this, START_X, FLOOR_Y, config, { scale: 1.15 });
    this.avatar.container.setDepth(10);

    this.nameText = this.add
      .text(START_X, FLOOR_Y + NAME_OFFSET_Y, this.playerName, {
        fontFamily: FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#2f5d6b',
        stroke: '#ffffff',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(11);
  }

  createCamera() {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, VIEW_HEIGHT);
    camera.startFollow(this.avatar.container, true, 0.09, 0.09);
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.extraKeys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.input.on('pointerdown', (pointer) => {
      // Работаем только с кликами по полу, а не по верхнему интерфейсу.
      if (pointer.worldY < FLOOR_Y - 40) {
        return;
      }

      const targetX = Phaser.Math.Clamp(pointer.worldX, MIN_X, MAX_X);
      this.targetX = targetX;
      this.spawnRipple(targetX);
    });

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
  }

  spawnRipple(x) {
    const ripple = this.add
      .ellipse(x, FLOOR_Y - 6, 38, 16, 0x3f8fb0, 0.4)
      .setDepth(9);

    this.tweens.add({
      targets: ripple,
      scaleX: 1.9,
      scaleY: 1.9,
      alpha: 0,
      duration: 430,
      ease: 'Quad.easeOut',
      onComplete: () => ripple.destroy(),
    });
  }

  update(time, delta) {
    if (!this.avatar) {
      return;
    }

    const dt = Math.min(delta, 50) / 1000;
    const step = WALK_SPEED * dt;
    const leftDown = this.cursors.left.isDown || this.extraKeys.left.isDown;
    const rightDown = this.cursors.right.isDown || this.extraKeys.right.isDown;

    let direction = 0;
    let moving = false;

    if (leftDown !== rightDown) {
      // Стрелки и A/D двигают персонажа напрямую.
      direction = leftDown ? -1 : 1;
      this.playerX = Phaser.Math.Clamp(
        this.playerX + direction * step,
        MIN_X,
        MAX_X,
      );
      this.targetX = this.playerX;
      moving = true;
    } else {
      const dx = this.targetX - this.playerX;
      if (Math.abs(dx) > 0.5) {
        direction = Math.sign(dx);
        this.playerX = Math.abs(dx) <= step
          ? this.targetX
          : this.playerX + direction * step;
        moving = true;
      }
    }

    if (moving) {
      this.avatar.setFacing(direction);
      this.walkPhase += delta * 0.016;
    }

    this.avatar.setPosition(this.playerX, FLOOR_Y);
    if (moving) {
      this.avatar.setWalking(this.walkPhase);
    } else {
      this.avatar.stopWalking();
    }

    this.nameText.setX(this.playerX);
  }

  createFixedUi() {
    const backButton = createButton(
      this,
      118,
      62,
      'В меню',
      () => this.scene.start('MenuScene'),
      {
        width: 180,
        height: 56,
        fontSize: 22,
        color: 0x5b7f8c,
        hoverColor: 0x729aa8,
        depth: 30,
      },
    );
    this.fixToCamera(backButton);

    if (this.saveData) {
      const label = this.add
        .text(VIEW_WIDTH - 24, 24, 'Сохранение загружено', {
          fontFamily: FONT,
          fontSize: '18px',
          color: '#6b8e99',
        })
        .setOrigin(1, 0)
        .setDepth(30);
      this.fixToCamera(label);
    }

    const hint = this.add
      .text(
        VIEW_WIDTH / 2,
        VIEW_HEIGHT - 16,
        'Кликните по полу, чтобы идти   •   Стрелки ← → или A / D',
        {
          fontFamily: FONT,
          fontSize: '20px',
          color: '#ffffff',
          stroke: '#4d7b8a',
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5, 1)
      .setDepth(30);
    this.fixToCamera(hint);
  }

  fixToCamera(target) {
    target.setScrollFactor(0);
    if (target.list) {
      target.list.forEach((child) => child.setScrollFactor(0));
    }
    return target;
  }
}
