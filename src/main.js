import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import CreatorScene from './scenes/CreatorScene.js';
import HospitalScene from './scenes/HospitalScene.js';
import UIScene from './scenes/UIScene.js';
import MiniGameScene from './scenes/MiniGameScene.js';
import ShopScene from './scenes/ShopScene.js';
import TasksScene from './scenes/TasksScene.js';
import PauseScene from './scenes/PauseScene.js';
import DisclaimerScene from './scenes/DisclaimerScene.js';
import AchievementsScene from './scenes/AchievementsScene.js';
import { applyTextQuality } from './ui/textQuality.js';

applyTextQuality();

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#10222e',
  banner: false,
  disableContextMenu: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    powerPreference: 'high-performance',
  },
  fps: {
    target: 60,
  },
  scene: [
    BootScene,
    MenuScene,
    CreatorScene,
    HospitalScene,
    UIScene,
    MiniGameScene,
    ShopScene,
    TasksScene,
    PauseScene,
    DisclaimerScene,
    AchievementsScene,
  ],
};

const game = new Phaser.Game(config);

// Удобный доступ из консоли разработчика (F12) для отладки.
window.hospitalGame = game;
