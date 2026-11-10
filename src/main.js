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

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#bfe3f5',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
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
