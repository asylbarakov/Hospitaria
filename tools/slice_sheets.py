#!/usr/bin/env python3
"""Нарезка листов на зелёном фоне: assets/raw/icons_*.png, ui_frames.png -> assets/final/.

  icons_symptoms.png, icons_status_roles.png  (сетка 4x3)  -> assets/final/icons/icon_*.png (192x192, 2x от 96)
  ui_frames.png (3 кнопки, окно, панель, полоска + заливка) -> assets/final/ui/ui_*.png (вдвое меньше исходника)

Фон вырезается по расстоянию до чистого зелёного, поэтому мятные цвета иконок не страдают.
Запуск из корня проекта: python3 tools/slice_sheets.py
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "raw"
FINAL = ROOT / "assets" / "final"
ICON = 192
GRIDS = {
    "icons_symptoms": [
        "icon_fever", "icon_cough", "icon_sore_throat", "icon_runny_nose",
        "icon_headache", "icon_stomach", "icon_rash", "icon_sprain",
        "icon_fracture", "icon_fatigue", "icon_coin", "icon_crystal",
    ],
    "icons_status_roles": [
        "icon_patience", "icon_waiting", "icon_error", "icon_role_doctor",
        "icon_role_nurse", "icon_role_receptionist", "icon_role_labtech", "icon_role_janitor",
        "icon_role_admin", "icon_quest_daily", "icon_quest_weekly", "icon_quest_story",
    ],
}


def key_green(img: Image.Image) -> Image.Image:
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    bg = np.median(a[:8, :8].reshape(-1, 3), axis=0)  # цвет фона по углу
    dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
    alpha = np.clip((dist - 55) / 65, 0, 1)
    out = a.copy()
    edge = (alpha > 0) & (alpha < 1)
    # despill: на краях подрезаем зелёный до уровня max(R, B)
    out[..., 1] = np.where(edge, np.minimum(a[..., 1], np.maximum(a[..., 0], a[..., 2]) + 8), a[..., 1])
    rgba = np.dstack([out, alpha * 255]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def bbox(img: Image.Image, thr: int = 24):
    return img.getchannel("A").point(lambda v: 255 if v > thr else 0).getbbox()


def fit_square(img: Image.Image, size: int) -> Image.Image:
    img = img.crop(bbox(img))
    s = (size - 8) / max(img.size)
    img = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(img, ((size - img.width) // 2, (size - img.height) // 2))
    return canvas


def slice_icons() -> int:
    out_dir = FINAL / "icons"
    out_dir.mkdir(parents=True, exist_ok=True)
    n = 0
    for sheet, names in GRIDS.items():
        path = RAW / f"{sheet}.png"
        if not path.exists():
            print(f"нет файла {path.name}, пропуск")
            continue
        keyed = key_green(Image.open(path))
        W, H = keyed.size
        mask = np.asarray(keyed.getchannel("A")) > 24
        labels, _ = ndimage.label(ndimage.binary_closing(mask, iterations=16))  # склеиваем искры и детали
        boxes = []
        for sl in ndimage.find_objects(labels):
            y, x = sl
            if (y.stop - y.start) * (x.stop - x.start) > 40000:
                boxes.append((x.start, y.start, x.stop, y.stop))
        boxes.sort(key=lambda b: (int(((b[1] + b[3]) / 2) // (H / 3)), b[0]))
        if len(boxes) != len(names):
            print(f"ВНИМАНИЕ: {sheet}: найдено {len(boxes)} иконок вместо {len(names)}")
        for name, (x0, y0, x1, y1) in zip(names, boxes):
            fit_square(keyed.crop((x0, y0, x1, y1)), ICON).save(out_dir / f"{name}.png", optimize=True)
            n += 1
    return n


def slice_ui() -> dict:
    path = RAW / "ui_frames.png"
    if not path.exists():
        return {}
    keyed = key_green(Image.open(path))
    mask = np.asarray(keyed.getchannel("A")) > 24
    mask = ndimage.binary_closing(mask, iterations=6)  # склеиваем тень и детали одного элемента
    labels, count = ndimage.label(mask)
    boxes = []
    for sl in ndimage.find_objects(labels):
        y, x = sl
        if (y.stop - y.start) * (x.stop - x.start) > 20000:
            boxes.append((x.start, y.start, x.stop, y.stop))
    # порядок: сверху вниз, внутри ряда слева направо
    boxes.sort(key=lambda b: (round(b[1] / 150), b[0]))
    names = ["ui_button", "ui_button_hover", "ui_button_down", "ui_window", "ui_panel", "ui_bar", "ui_bar_fill"]
    out_dir = FINAL / "ui"
    out_dir.mkdir(parents=True, exist_ok=True)
    info = {}
    if len(boxes) != len(names):
        print(f"ВНИМАНИЕ: найдено {len(boxes)} элементов UI вместо {len(names)}: {boxes}")
    for name, (x0, y0, x1, y1) in zip(names, boxes):
        piece = keyed.crop((x0, y0, x1, y1))
        piece = piece.crop(bbox(piece))
        piece = piece.resize((max(1, piece.width // 2), max(1, piece.height // 2)), Image.LANCZOS)
        piece.save(out_dir / f"{name}.png", optimize=True)
        info[name] = {"w": piece.width, "h": piece.height}
    (out_dir / "ui.json").write_text(json.dumps(info, indent=1), encoding="utf-8")
    return info


def main() -> int:
    n = slice_icons()
    ui = slice_ui()
    print(f"иконок: {n}, элементов UI: {len(ui)}")
    for k, v in ui.items():
        print(f"  {k:16s} {v['w']}x{v['h']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
