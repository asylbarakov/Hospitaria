export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Внешних ассетов нет: вся графика рисуется кодом,
    // поэтому загрузка занимает один кадр.
    this.scene.start('MenuScene');
  }
}
