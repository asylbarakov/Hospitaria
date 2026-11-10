export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Внешних ассетов нет: вся графика рисуется кодом,
    // поэтому загрузка занимает один кадр.
    const loader = document.getElementById('loader');
    if (loader) {
      loader.remove();
    }

    this.scene.start('MenuScene');
  }
}
