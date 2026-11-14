// Загрузка PNG из assets/final для изометрического мира.
// Ключ текстуры: iso_<имя файла без .png>. Размеры и anchorY берём из anchors.json.

const ANCHORS_KEY = 'iso_anchors';
const BASE = 'assets/final/';

export function isoKey(name) {
  return `iso_${name}`;
}

/** Вызывать в preload() сцены: ставит в очередь anchors.json, затем все спрайты из него. */
export function queueIsoAssets(scene, extraFiles = []) {
  const { load } = scene;
  if (!scene.cache.json.exists(ANCHORS_KEY)) {
    load.json(ANCHORS_KEY, `${BASE}anchors.json`);
  }
  const queue = () => {
    const anchors = scene.cache.json.get(ANCHORS_KEY) || {};
    Object.keys(anchors).forEach((name) => {
      if (!scene.textures.exists(isoKey(name))) {
        load.image(isoKey(name), `${BASE}${name}.png`);
      }
    });
    extraFiles.forEach((path) => {
      const key = isoKey(path.replace(/\.png$/, '').replace(/\//g, '_'));
      if (!scene.textures.exists(key)) {
        load.image(key, `${BASE}${path}`);
      }
    });
  };
  if (scene.cache.json.exists(ANCHORS_KEY)) {
    queue();
  } else {
    load.once(`filecomplete-json-${ANCHORS_KEY}`, queue);
  }
}

/** anchorY спрайта (доля высоты, где лежит низ основания). */
export function anchorOf(scene, name) {
  const anchors = scene.cache.json.get(ANCHORS_KEY) || {};
  return anchors[name] ? anchors[name].anchorY : 1;
}

// ---- стены (assets/final/walls) ----------------------------------------------------------

const WALLS_KEY = 'iso_walls_meta';
const WALL_NAMES = [
  'wall_tall_r', 'wall_tall_l', 'col_tall', 'wall_low_r', 'wall_low_l', 'col_low',
  'door_tall_r', 'door_tall_l', 'door_low_r', 'door_low_l', 'window_tall_r', 'window_tall_l',
];

export function wallKey(name) {
  return isoKey(`walls_${name}`);
}

/** Вызывать в preload(): PNG стен и walls.json (размеры и якоря). */
export function queueWallAssets(scene) {
  if (!scene.cache.json.exists(WALLS_KEY)) {
    scene.load.json(WALLS_KEY, `${BASE}walls/walls.json`);
  }
  WALL_NAMES.forEach((name) => {
    if (!scene.textures.exists(wallKey(name))) {
      scene.load.image(wallKey(name), `${BASE}walls/${name}.png`);
    }
  });
}

/** {w, h, ax, ay} куска стены в пикселях PNG (2x). */
export function wallMeta(scene, name) {
  const meta = scene.cache.json.get(WALLS_KEY) || {};
  return meta[name] || { w: 0, h: 0, ax: 0, ay: 0 };
}
