import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import MiniGameScene from './scenes/MiniGameScene.js';
import IsoHospitalScene from './scenes/IsoHospitalScene.js';
import IsoHospitalHud from './scenes/IsoHospitalHud.js';
import IsoCreatorScene from './scenes/IsoCreatorScene.js';
import IsoWardrobeScene from './scenes/IsoWardrobeScene.js';
import { applyTextQuality } from './ui/textQuality.js';

applyTextQuality();

// Сцены v0.1 (?legacy=1) и отладочные (?debug=1) подгружаются динамически,
// поэтому в обычном запуске их код не скачивается.
const params = new URLSearchParams(window.location.search);

async function loadExtraScenes() {
  const extra = [];
  if (params.get('legacy') === '1') {
    const legacy = await import('./legacy/index.js');
    extra.push(...legacy.default);
  }
  if (params.get('debug') === '1') {
    const debug = await import('./debug/index.js');
    extra.push(...debug.default);
  }
  return extra;
}

function makeConfig(extra) {
  return {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#10222e',
  banner: false,
  disableContextMenu: true,
  loader: { maxParallelDownloads: 6, timeout: 30000 }, // телефон: меньше обрывов при первой загрузке
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
    MainMenuScene,
    MiniGameScene,
    IsoHospitalScene,
    IsoHospitalHud,
    IsoCreatorScene,
    IsoWardrobeScene,
    ...extra,
  ],
  };
}

loadExtraScenes()
  .catch(() => [])
  .then((extra) => {
    const game = new Phaser.Game(makeConfig(extra));
    // Доступ из консоли разработчика (F12) для отладки.
    window.hospitalGame = game;
  });
