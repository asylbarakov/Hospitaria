#!/usr/bin/env python3
"""Приводит AI-спрайты мебели к изометрии 2:1 (рёбра основания под 26,6°).

Идея: вертикали остаются вертикальными, меняем только y' = a*(y - yv) + b*(x - xv) + yv
(сдвиг + вертикальный масштаб). Из измеренных наклонов нижнего контура
sL (ребро влево-вверх от нижней вершины) и sR (вправо-вверх):
    a = 1 / (sL + sR),  b = 0,5 - a * sL        (если sR неизвестен: a = 1, b = 0,5 - sL)

ПРИМЕНИМО только к предметам, у которых виден наклон основания не менее ~0,3 (кровать,
кушетка, стол врача). Предметы «анфас» (наклон ~0,17: стойка, диваны, столы лаборатории, касса,
аптека, рентген) этим методом размазываются, их надо перерисовывать или перегенерировать.
Предметы 1x1 («столбики») не трогаем: у них нет измеримых рёбер основания.

Исходники читаются из assets/raw/_pre_iso_fix/ (туда копия кладётся при первом запуске),
поэтому запуск идемпотентен. Результат: assets/final/<name>.png и anchors.json.

    python3 tools/fix_iso_angles.py            # применить ко всем из SPECS
    python3 tools/fix_iso_angles.py ward_bed   # только указанные
"""
import json
import math
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FINAL = ROOT / "assets" / "final"
BACKUP = ROOT / "assets" / "raw" / "_pre_iso_fix"
SS = 2  # суперсэмплинг для гладких краёв

# footprint (w, d) в тайлах; flip: зеркалить файл (вершина должна быть правее центра);
# sL/sR: измеренные наклоны нижнего контура (dy/dx), sR=None если боковое ребро не видно.
SPECS = {
    "reception_desk": dict(w=3, d=1, scale=0.78, anchor_y=0.963),
    "doctor_desk": dict(w=2, d=1, flip=True, sL=0.40, sR=None, center=True),
    "exam_couch": dict(w=2, d=1, flip=False, sL=0.82, sR=0.40),
    "ward_bed": dict(w=2, d=1, flip=False, sL=0.60, sR=0.583),
}
# Режим «только масштаб» (scale): без наклона и зеркала, якорь берётся как в исходной раскладке.
# Нужен предметам анфас, которые наклон размазывает (стойка регистратуры).
A_MIN, A_MAX = 0.80, 1.20  # защита от слишком сильного растяжения по вертикали


def solve_affine(sl, sr):
    if sr is None:
        return 1.0, 0.5 - sl
    a = min(max(1.0 / (sl + sr), A_MIN), A_MAX)
    return a, 0.5 - a * sl


def lowest(alpha):
    """(x_вершины, y_нижней точки): вершина = середина самых нижних колонок."""
    cols = np.array([np.where(alpha[:, x])[0].max() if alpha[:, x].any() else -1 for x in range(alpha.shape[1])])
    ymax = cols.max()
    xs = np.where(cols >= ymax - 3)[0]
    return float(xs.mean()), int(ymax)


def shear(im, a, b):
    s = SS
    big = im.resize((im.width * s, im.height * s), Image.LANCZOS)
    arr = np.array(big)[:, :, 3] > 40
    xv, yv = lowest(arr)
    w, h = big.size
    ys = [a * (y - yv) + b * (x - xv) + yv for x in (0, w) for y in (0, h)]
    t = -min(ys)
    out_h = int(math.ceil(max(ys) - min(ys)))
    coef = (1, 0, 0, -b / a, 1 / a, (-t - yv + b * xv) / a + yv)
    out = big.convert("RGBa").transform((w, out_h), Image.AFFINE, coef, Image.BICUBIC).convert("RGBA")
    return out.resize((w // s, max(1, out_h // s)), Image.LANCZOS)


def crop_and_pad(im, w, d, margin=2, center=False):
    """Обрезка по альфе и боковые поля так, чтобы нижняя вершина стояла в W/2 + (w-d)*64."""
    box = im.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
    im = im.crop((max(0, box[0] - margin), max(0, box[1] - margin),
                  min(im.width, box[2] + margin), min(im.height, box[3] + margin)))
    vx, vy = lowest(np.array(im)[:, :, 3] > 40)
    if center:  # закруглённые торцы: вершину не измеряем, центрируем bbox (игра центрирует по footprint)
        return im, (vy + 1) / im.height
    k = (w - d) * 64
    delta = int(round(im.width + 2 * k - 2 * vx))
    pl, pr = (delta, 0) if delta > 0 else (0, -delta)
    canvas = Image.new("RGBA", (im.width + pl + pr, im.height), (0, 0, 0, 0))
    canvas.paste(im, (pl, 0))
    return canvas, (vy + 1) / im.height


def save(name, im, anchor_y):
    im.save(FINAL / f"{name}.png", optimize=True)
    anchors = json.loads((FINAL / "anchors.json").read_text())
    anchors[name] = {"anchorY": round(anchor_y, 3), "h": im.height, "w": im.width}
    (FINAL / "anchors.json").write_text(json.dumps(anchors, indent=1, sort_keys=True) + "\n")


def process(name, spec):
    BACKUP.mkdir(parents=True, exist_ok=True)
    src = BACKUP / f"{name}.png"
    if not src.exists():
        shutil.copy(FINAL / f"{name}.png", src)
    im = Image.open(src).convert("RGBA")
    if "scale" in spec:
        im = im.resize((round(im.width * spec["scale"]), round(im.height * spec["scale"])), Image.LANCZOS)
        save(name, im, spec["anchor_y"])
        return
    if spec["flip"]:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    a, b = solve_affine(spec["sL"], spec["sR"])
    im, anchor_y = crop_and_pad(shear(im, a, b), spec["w"], spec["d"], center=spec.get("center", False))
    save(name, im, anchor_y)
    print(f"{name}: a={a:.3f} b={b:+.3f} flip={spec['flip']} -> {im.size}, anchorY={anchor_y:.3f}")


def main(names):
    for name in names or SPECS:
        process(name, SPECS[name])


if __name__ == "__main__":
    main(sys.argv[1:])
