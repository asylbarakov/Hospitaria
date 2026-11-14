// Сортировка по глубине для изометрии.
//
// Простое depth = x + y ломается на длинных предметах (стойка 3x1): персонаж,
// стоящий сбоку от стойки, оказывается «не там». Поэтому каждый объект описывается
// прямоугольником основания на карте {minX, maxX, minY, maxY} (в тайлах), а порядок
// получается так: объект A рисуется раньше B, если A целиком «позади» B по оси x
// или по оси y. Если объекты лежат рядом по диагонали и на экране не перекрываются,
// порядок между ними не важен.
//
// Объекты бывают двух видов:
//   static  (стены, мебель): порядок считается топологической сортировкой один раз,
//           пока набор не изменился (O(n^2), только при постановке/продаже);
//   dynamic (персонажи): их глубина вставляется между статичными за O(n) на объект.

const EPS = 1e-6;

export function isBehind(a, b) {
  return a.maxX <= b.minX + EPS || a.maxY <= b.minY + EPS;
}

/** a обязательно рисуется раньше b? (a позади b и b не позади a) */
function mustPrecede(a, b) {
  return isBehind(a, b) && !isBehind(b, a);
}

export default class IsoDepth {
  constructor(baseDepth = 100) {
    this.baseDepth = baseDepth;
    this.statics = [];
    this.dynamics = [];
    this.order = []; // статичные в порядке отрисовки
    this.staticDirty = true;
  }

  get items() {
    return this.statics.concat(this.dynamics);
  }

  add(obj, box, options = {}) {
    const item = { obj, ...box, dynamic: !!options.dynamic, rank: 0 };
    if (item.dynamic) {
      this.dynamics.push(item);
    } else {
      this.statics.push(item);
      this.staticDirty = true;
    }
    return item;
  }

  remove(obj) {
    let index = this.statics.findIndex((it) => it.obj === obj);
    if (index !== -1) {
      this.statics.splice(index, 1);
      this.staticDirty = true;
      return;
    }
    index = this.dynamics.findIndex((it) => it.obj === obj);
    if (index !== -1) {
      this.dynamics.splice(index, 1);
    }
  }

  updateBox(obj, box) {
    const item = this.dynamics.find((it) => it.obj === obj);
    if (!item) {
      return;
    }
    item.minX = box.minX;
    item.maxX = box.maxX;
    item.minY = box.minY;
    item.maxY = box.maxY;
  }

  /** Пересчитывает depth. Статичные сортируются только если набор менялся. */
  sort() {
    if (this.staticDirty) {
      this.sortStatics();
      this.staticDirty = false;
    }
    this.placeDynamics();
    return true;
  }

  sortStatics() {
    const items = this.statics;
    const n = items.length;
    const key = items.map((it) => it.minX + it.maxX + it.minY + it.maxY);
    const incoming = new Array(n).fill(0);
    const outgoing = items.map(() => []);

    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        if (mustPrecede(items[i], items[j])) {
          outgoing[i].push(j);
          incoming[j] += 1;
        } else if (mustPrecede(items[j], items[i])) {
          outgoing[j].push(i);
          incoming[i] += 1;
        }
      }
    }

    // Очередь готовых вершин, упорядоченная по key: берём самую дальнюю по сумме координат.
    const ready = [];
    const push = (i) => {
      let lo = 0;
      let hi = ready.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (key[ready[mid]] > key[i]) {
          lo = mid + 1;
        } else {
          hi = mid;
        }
      }
      ready.splice(lo, 0, i);
    };
    for (let i = 0; i < n; i += 1) {
      if (incoming[i] === 0) {
        push(i);
      }
    }

    const done = new Array(n).fill(false);
    this.order = [];
    while (this.order.length < n) {
      let pick = ready.length ? ready.pop() : -1;
      if (pick === -1) {
        // Цикл (редкая ситуация): берём самый дальний из оставшихся.
        for (let i = 0; i < n; i += 1) {
          if (!done[i] && (pick === -1 || key[i] < key[pick])) {
            pick = i;
          }
        }
      }
      done[pick] = true;
      this.order.push(items[pick]);
      items[pick].rank = this.order.length - 1;
      items[pick].obj.setDepth(this.baseDepth + items[pick].rank);
      for (const next of outgoing[pick]) {
        incoming[next] -= 1;
        if (incoming[next] === 0 && !done[next]) {
          push(next);
        }
      }
    }
  }

  placeDynamics() {
    const statics = this.statics;
    this.dynamics.forEach((d) => {
      let lo = -1; // самый поздний статичный объект, который должен быть раньше d
      let hi = statics.length; // самый ранний статичный, который должен быть позже d
      for (let i = 0; i < statics.length; i += 1) {
        const s = statics[i];
        if (mustPrecede(s, d)) {
          if (s.rank > lo) {
            lo = s.rank;
          }
        } else if (mustPrecede(d, s)) {
          if (s.rank < hi) {
            hi = s.rank;
          }
        }
      }
      // Между lo и hi; при конфликте (цикл) считаем, что d ближе к камере.
      const span = hi > lo ? (hi - lo) : 1;
      d.rank = lo + 0.5 * Math.min(1, span) + 0.001 * (d.minX + d.maxX + d.minY + d.maxY);
      d.obj.setDepth(this.baseDepth + d.rank);
    });
  }
}
