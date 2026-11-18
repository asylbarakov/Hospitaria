#!/usr/bin/env python3
"""Рисует мини-сцену по формулам игры (IsoMath.js / IsoWorld.createItemSprite).

    python3 tools/preview_iso.py out.png               # спрайты из assets/final
    python3 tools/preview_iso.py out.png --before      # спрайты из assets/raw/_pre_iso_fix (если есть)

Красный ромб: footprint предмета. Нижние рёбра предмета должны идти вдоль рёбер ромба.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
FINAL = ROOT / "assets" / "final"
BACKUP = ROOT / "assets" / "raw" / "_pre_iso_fix"
HALF_W, HALF_H, SCALE = 64, 32, 0.5

# (type, x, y, w, d, rot)
SCENE = [
    ("reception_desk", 1, 0, 3, 1, 0),
    ("doctor_desk", 1, 3, 2, 1, 0),
    ("exam_couch", 4, 3, 2, 1, 0),
    ("ward_bed", 1, 6, 2, 1, 0),
    ("doctor_desk", 5, 0, 1, 2, 1),  # повёрнутый (flipX)
]
COLS, ROWS = 8, 8


def to_screen(x, y):
    return ((x - y) * HALF_W, (x + y) * HALF_H)


def load(name, before):
    path = (BACKUP / f"{name}.png") if before and (BACKUP / f"{name}.png").exists() else FINAL / f"{name}.png"
    return Image.open(path).convert("RGBA")


def anchor_y(name, im, before):
    if before and (BACKUP / f"{name}.png").exists():
        # backup хранит исходный anchorY в git HEAD; для превью берём нижний видимый пиксель
        a = im.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
        return (a[3]) / im.height
    return json.loads((FINAL / "anchors.json").read_text())[name]["anchorY"]


def render(out, before):
    ox, oy = ROWS * HALF_W + 40, 360
    canvas = Image.new("RGBA", ((COLS + ROWS) * HALF_W + 80, (COLS + ROWS) * HALF_H + 420), (232, 236, 240, 255))
    floor = load("floor_clinic", False)
    floor = floor.resize((int(floor.width * SCALE), int(floor.height * SCALE)), Image.LANCZOS)
    for ty in range(ROWS):
        for tx in range(COLS):
            sx, sy = to_screen(tx + 0.5, ty + 0.5)
            canvas.alpha_composite(floor, (int(ox + sx - floor.width / 2), int(oy + sy - floor.height / 2)))
    draw = ImageDraw.Draw(canvas)
    for name, x, y, w, d, rot in sorted(SCENE, key=lambda s: s[1] + s[3] + s[2] + s[4]):
        im = load(name, before)
        if rot:
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
        ay = anchor_y(name, im, before)
        sp = im.resize((int(im.width * SCALE), int(im.height * SCALE)), Image.LANCZOS)
        cx = (to_screen(x + w / 2, y + d / 2))[0]
        by = to_screen(x + w, y + d)[1]
        canvas.alpha_composite(sp, (int(ox + cx - sp.width / 2), int(oy + by - ay * sp.height)))
        pts = [to_screen(x, y), to_screen(x + w, y), to_screen(x + w, y + d), to_screen(x, y + d)]
        draw.polygon([(ox + px, oy + py) for px, py in pts], outline=(229, 57, 53, 255), width=2)
    canvas.crop(canvas.getbbox()).convert("RGB").save(out)


if __name__ == "__main__":
    render(sys.argv[1], "--before" in sys.argv)
