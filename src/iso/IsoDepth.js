// Сортировка по глубине для изометрии.
//
// Простое depth = x + y ломается на длинных предметах (стойка 3x1): персонаж,
// стоящий сбоку от стойки, оказывается «не там». Поэтому каждый объект описывается
// прямоугольником основания на карте {minX, maxX, minY, maxY} (в тайлах), а порядок
// получается топологической сортировкой: объект A рисуется раньше B, если A целиком
// «позади» B по оси x или по оси y. Если объекты лежат рядом по диагонали и на экране
// не перекрываются, порядок между ними не важен.

const EPS = 1e-6;

function isBehind(a, b) {
  return a.maxX <= b.minX + EPS || a.maxY <= b.minY + EPS;
}

export default class IsoDepth {
  constructor(baseDepth = 100) {
    this.baseDepth = baseDepth;
    this.items = [];
    this.dirty = true;
  }

  add(obj, box) {
    this.items.push({ obj, ...box });
    this.dirty = true;
  }

  remove(obj) {
    const index = this.items.findIndex((item) => item.obj === obj);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.dirty = true;
    }
  }

  updateBox(obj, box) {
    const item = this.items.find((it) => it.obj === obj);
    if (!item) {
      return;
    }
    item.minX = box.minX;
    item.maxX = box.maxX;
    item.minY = box.minY;
    item.maxY = box.maxY;
    this.dirty = true;
  }

  /** Пересчитывает depth у всех объектов, если что-то менялось. Возвращает true, если пересчитал. */
  sort() {
    if (!this.dirty) {
      return false;
    }
    this.dirty = false;
    const items = this.items;
    const n = items.length;
    const key = items.map((it) => it.minX + it.maxX + it.minY + it.maxY);
    const incoming = new Array(n).fill(0);
    const outgoing = items.map(() => []);

    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const ab = isBehind(items[i], items[j]);
        const ba = isBehind(items[j], items[i]);
        if (ab && !ba) {
          outgoing[i].push(j);
          incoming[j] += 1;
        } else if (ba && !ab) {
          outgoing[j].push(i);
          incoming[i] += 1;
        }
      }
    }

    const done = new Array(n).fill(false);
    for (let order = 0; order < n; order += 1) {
      let pick = -1;
      for (let i = 0; i < n; i += 1) {
        if (!done[i] && incoming[i] === 0 && (pick === -1 || key[i] < key[pick])) {
          pick = i;
        }
      }
      if (pick === -1) {
        // Цикл (редкая ситуация): берём самый дальний по сумме координат.
        for (let i = 0; i < n; i += 1) {
          if (!done[i] && (pick === -1 || key[i] < key[pick])) {
            pick = i;
          }
        }
      }
      done[pick] = true;
      items[pick].obj.setDepth(this.baseDepth + order);
      for (const next of outgoing[pick]) {
        incoming[next] -= 1;
      }
    }
    return true;
  }
}
