// Карта изометрического мира: есть ли пол, занят ли тайл мебелью, поиск пути (простой BFS).
// EasyStar подключается на этапе 13 и строит сетку из toMatrix().

const DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

export default class IsoGrid {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.floor = new Uint8Array(cols * rows);
    this.blocked = new Uint8Array(cols * rows); // стены и прочие непроходимые тайлы
    this.owner = new Int32Array(cols * rows).fill(-1); // индекс предмета, занимающего тайл
    this.objects = [];
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }

  index(x, y) {
    return y * this.cols + x;
  }

  setFloor(x, y, value = 1) {
    if (this.inBounds(x, y)) {
      this.floor[this.index(x, y)] = value ? 1 : 0;
    }
  }

  setBlocked(x, y, value = 1) {
    if (this.inBounds(x, y)) {
      this.blocked[this.index(x, y)] = value ? 1 : 0;
    }
  }

  isBlocked(x, y) {
    return this.inBounds(x, y) && this.blocked[this.index(x, y)] === 1;
  }

  fillFloor(x0, y0, w, d, value = 1) {
    for (let y = y0; y < y0 + d; y += 1) {
      for (let x = x0; x < x0 + w; x += 1) {
        this.setFloor(x, y, value);
      }
    }
  }

  hasFloor(x, y) {
    return this.inBounds(x, y) && this.floor[this.index(x, y)] === 1;
  }

  isOccupied(x, y) {
    return this.inBounds(x, y) && this.owner[this.index(x, y)] !== -1;
  }

  isWalkable(x, y) {
    return this.hasFloor(x, y) && !this.isBlocked(x, y) && !this.isOccupied(x, y);
  }

  canPlace(x, y, w, d) {
    for (let j = y; j < y + d; j += 1) {
      for (let i = x; i < x + w; i += 1) {
        if (!this.isWalkable(i, j)) {
          return false;
        }
      }
    }
    return true;
  }

  /** Ставит предмет, возвращает его id (или -1, если место занято). */
  place(x, y, w, d, data = null) {
    if (!this.canPlace(x, y, w, d)) {
      return -1;
    }
    const id = this.objects.length;
    this.objects.push({ id, x, y, w, d, data, removed: false });
    for (let j = y; j < y + d; j += 1) {
      for (let i = x; i < x + w; i += 1) {
        this.owner[this.index(i, j)] = id;
      }
    }
    return id;
  }

  remove(id) {
    const obj = this.objects[id];
    if (!obj || obj.removed) {
      return;
    }
    obj.removed = true;
    for (let j = obj.y; j < obj.y + obj.d; j += 1) {
      for (let i = obj.x; i < obj.x + obj.w; i += 1) {
        this.owner[this.index(i, j)] = -1;
      }
    }
  }

  objectAt(x, y) {
    if (!this.inBounds(x, y)) {
      return null;
    }
    const id = this.owner[this.index(x, y)];
    return id === -1 ? null : this.objects[id];
  }

  /** Матрица для EasyStar: matrix[y][x], 0 проходимо, 1 нет. */
  toMatrix() {
    const matrix = [];
    for (let y = 0; y < this.rows; y += 1) {
      const row = [];
      for (let x = 0; x < this.cols; x += 1) {
        row.push(this.isWalkable(x, y) ? 0 : 1);
      }
      matrix.push(row);
    }
    return matrix;
  }

  /**
   * Путь по тайлам, 8 направлений, диагональ не режет углы.
   * Возвращает массив тайлов без стартового, либо null, если дойти нельзя.
   */
  findPath(sx, sy, tx, ty) {
    if (!this.isWalkable(tx, ty) || !this.inBounds(sx, sy)) {
      return null;
    }
    if (sx === tx && sy === ty) {
      return [];
    }
    const size = this.cols * this.rows;
    const prev = new Int32Array(size).fill(-2);
    const start = this.index(sx, sy);
    const goal = this.index(tx, ty);
    prev[start] = -1;
    const queue = [start];
    for (let head = 0; head < queue.length; head += 1) {
      const cur = queue[head];
      if (cur === goal) {
        break;
      }
      const cx = cur % this.cols;
      const cy = (cur - cx) / this.cols;
      for (const [dx, dy] of DIRS) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (!this.isWalkable(nx, ny)) {
          continue;
        }
        if (dx !== 0 && dy !== 0 && (!this.isWalkable(cx + dx, cy) || !this.isWalkable(cx, cy + dy))) {
          continue;
        }
        const ni = this.index(nx, ny);
        if (prev[ni] === -2) {
          prev[ni] = cur;
          queue.push(ni);
        }
      }
    }
    if (prev[goal] === -2) {
      return null;
    }
    const path = [];
    for (let cur = goal; cur !== start; cur = prev[cur]) {
      path.push({ x: cur % this.cols, y: Math.floor(cur / this.cols) });
    }
    return path.reverse();
  }
}
