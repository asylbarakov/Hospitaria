import { normalizeAvatar } from '../data/avatarOptions.js';
import { drawAvatarLayers } from './avatarDrawing.js';

const LAYER_NAMES = [
  'shadow',
  'hairBack',
  'legs',
  'shoes',
  'body',
  'coat',
  'head',
  'face',
  'hairFront',
  'accessory',
];

export class Avatar {
  constructor(scene, x, y, config = {}, options = {}) {
    const { scale = 1 } = options;

    this.scene = scene;
    this.config = normalizeAvatar(config);
    this.container = scene.add.container(x, y);
    this.container.setScale(scale);

    this.layers = {};
    LAYER_NAMES.forEach((name) => {
      const layer = scene.add.graphics();
      this.layers[name] = layer;
      this.container.add(layer);
    });

    this.redraw();
  }

  setConfig(config) {
    this.config = normalizeAvatar({ ...this.config, ...config });
    this.redraw();
  }

  redraw() {
    drawAvatarLayers(this.layers, this.config);
  }

  setPosition(x, y) {
    this.container.setPosition(x, y);
    return this;
  }

  destroy() {
    this.container.destroy();
  }
}

export default Avatar;
