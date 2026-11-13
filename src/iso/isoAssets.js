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
