// Поиск пути: EasyStar.js из CDN, с очередью запросов и резервным BFS из IsoGrid.
// В node EasyStar недоступен, поэтому тесты гоняют тот же контракт через подставной
// объект с API EasyStar.js и через BFS. Матрица пересобирается по grid.revision.

import { PATH_CONFIG } from '../data/pathConfig.js';
import { nearestWalkable } from './connectivity.js';

function defaultFactory() {
  const root = typeof globalThis !== 'undefined' ? globalThis : null;
  const global = root && root.EasyStar;
  if (!global) {
    return null;
  }
  const Ctor = global.js || global.default || (typeof global === 'function' ? global : null);
  return Ctor ? new Ctor() : null;
}

export default class Pathfinder {
  /**
   * @param {import('./IsoGrid.js').default} grid
   * @param {{config?:object, easyStarFactory?:Function|null}} options
   */
  constructor(grid, options = {}) {
    this.grid = grid;
    this.config = { ...PATH_CONFIG, ...(options.config || {}) };
    this.queue = [];
    this.matrixRevision = -1;
    this.instance = null;
    this.factory = options.easyStarFactory || defaultFactory;
    try {
      const instance = this.factory ? this.factory() : null;
      if (instance) {
        this.configure(instance);
        this.instance = instance;
      }
    } catch (error) {
      this.instance = null;
    }
  }

  configure(instance) {
    instance.setAcceptableTiles(0); // 0 — проходимый тайл в grid.toMatrix()
    instance.enableDiagonals();
    instance.disableCornerCutting();
    instance.setIterationsPerCalculation(this.config.iterationsPerCalculation);
  }

  /** 'easystar' в браузере, 'bfs' в node или если CDN не загрузился. */
  get backend() {
    return this.instance ? 'easystar' : 'bfs';
  }

  /** Заставляет пересобрать матрицу при следующем запросе (после addItem/removeItem). */
  invalidate() {
    this.matrixRevision = -1;
  }

  syncGrid() {
    if (!this.instance) {
      return;
    }
    const revision = this.grid.revision || 0;
    if (revision === this.matrixRevision) {
      return;
    }
    this.instance.setGrid(this.grid.toMatrix());
    this.matrixRevision = revision;
  }

  /**
   * Путь без стартового тайла. Возвращает Promise<Array<{x,y}>|null>.
   * Цель обязана быть проходимой, старт при необходимости сдвигается на ближний тайл.
   */
  findPath(sx, sy, tx, ty) {
    if (!this.grid.isWalkable(tx, ty)) {
      return Promise.resolve(null);
    }
    const start = nearestWalkable(this.grid, sx, sy, 2);
    if (!start) {
      return Promise.resolve(null);
    }
    if (start.x === tx && start.y === ty) {
      return Promise.resolve([]);
    }
    if (!this.instance) {
      return Promise.resolve(this.grid.findPath(start.x, start.y, tx, ty));
    }
    if (this.queue.length >= this.config.maxQueue) {
      const stale = this.queue.shift();
      stale.resolve(null);
    }
    return new Promise((resolve) => {
      this.queue.push({
        sx: start.x, sy: start.y, tx, ty, resolve,
      });
    });
  }

  /** Вызывается из update сцены: запускает не больше N запросов и считает A*. */
  update() {
    if (!this.instance) {
      return 0;
    }
    this.syncGrid();
    let started = 0;
    while (this.queue.length && started < this.config.requestsPerFrame) {
      const req = this.queue.shift();
      if (!this.grid.isWalkable(req.tx, req.ty) || !this.grid.isWalkable(req.sx, req.sy)) {
        req.resolve(null);
        continue;
      }
      try {
        const id = this.instance.findPath(req.sx, req.sy, req.tx, req.ty, (path) => {
          req.resolve(this.clean(path, req.sx, req.sy));
        });
        if (id === null || id === undefined) {
          req.resolve(null);
        }
      } catch (error) {
        req.resolve(this.grid.findPath(req.sx, req.sy, req.tx, req.ty));
      }
      started += 1;
    }
    // calculate() нужен и при пустой очереди: EasyStar дошагивает уже запущенные A*.
    this.instance.calculate();
    return started;
  }

  /** EasyStar возвращает путь вместе со стартовым тайлом — отрезаем его. */
  clean(path, sx, sy) {
    if (!Array.isArray(path)) {
      return null;
    }
    const out = [];
    for (const tile of path) {
      if (!tile || !Number.isFinite(tile.x) || !Number.isFinite(tile.y)) {
        return null;
      }
      if (!out.length && tile.x === sx && tile.y === sy) {
        continue;
      }
      out.push({ x: tile.x, y: tile.y });
    }
    return out;
  }

  dispose() {
    while (this.queue.length) {
      this.queue.shift().resolve(null);
    }
    this.instance = null;
    this.matrixRevision = -1;
  }
}
