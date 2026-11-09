import { normalizeAvatar } from '../data/avatarOptions.js';
import { drawAvatarLayers, drawLegPose } from './avatarDrawing.js';

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
    this.scaleValue = scale;
    this.baseY = y;
    this.facing = 1;

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

  setFacing(direction) {
    if (!direction || direction === this.facing) {
      return;
    }
    this.facing = direction;
    this.container.setScale(direction < 0 ? -this.scaleValue : this.scaleValue, this.scaleValue);
  }

  setWalking(phase) {
    drawLegPose(this.layers, this.config, phase);
    this.container.y = this.baseY - Math.abs(Math.sin(phase)) * 3;
  }

  stopWalking() {
    drawLegPose(this.layers, this.config, 0);
    this.container.y = this.baseY;
  }

  setPosition(x, y) {
    this.baseY = y;
    this.container.setPosition(x, y);
    return this;
  }

  destroy() {
    this.container.destroy();
  }
}

export default Avatar;
