// Боковая версия v0.1: регистрируется только при открытии index.html?legacy=1.
// Сохранение v0.1 (hospital_save_v1) эти сцены читают и пишут сами, v0.2 его не меняет.
import MenuScene from './scenes/MenuScene.js';
import CreatorScene from './scenes/CreatorScene.js';
import HospitalScene from './scenes/HospitalScene.js';
import UIScene from './scenes/UIScene.js';
import ShopScene from './scenes/ShopScene.js';
import TasksScene from './scenes/TasksScene.js';
import PauseScene from './scenes/PauseScene.js';
import DisclaimerScene from './scenes/DisclaimerScene.js';
import AchievementsScene from './scenes/AchievementsScene.js';

export default [
  MenuScene, CreatorScene, HospitalScene, UIScene, ShopScene,
  TasksScene, PauseScene, DisclaimerScene, AchievementsScene,
];
