// Запуск: обычный режим открывает главное меню v0.2, ?legacy=1 меню боковой версии v0.1,
// ?debug=1 тестовую изометрическую сцену.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.remove();
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('legacy') === '1') {
      this.scene.start('MenuScene');
    } else if (params.get('debug') === '1') {
      this.scene.start('IsoTestScene');
    } else {
      this.scene.start('MainMenuScene');
    }
  }
}
