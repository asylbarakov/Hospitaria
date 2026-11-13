#!/usr/bin/env python3
"""Подготовка ассетов: assets/raw/*.png -> assets/final/*.png + anchors.json.

Что делает:
  1. Файлы с прозрачностью берёт как есть; зелёный фон (#00FF00) вырезает только у тех,
     где прозрачности нет (флаг --green-bg для листов иконок). Фон белого цвета у
     ward_bed вырезается заливкой от краёв.
  2. Полы (floor_*): квадратная текстура превращается в ромб 256x128 (2x от тайла 128x64).
  3. Обрезает пустые поля (MARGIN px), масштабирует по assets/spec.json:
     (w + d) * 128 px по ширине, либо width_px / height_px.
  4. Делает зеркальные копии стен (wall_left = зеркало wall_right и т.д.).
  5. Пишет assets/final/anchors.json: размер и anchorY (низ основания, доля высоты).
  6. Печатает вес каждого файла и общий (лимит 8 МБ).

Запуск из корня проекта:
  python3 tools/prepare_assets.py
  python3 tools/prepare_assets.py --png8     # палитра 256 цветов, если вес выше лимита

Нужны Pillow и numpy.
"""
import argparse
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "raw"
FINAL = ROOT / "assets" / "final"
SPEC = ROOT / "assets" / "spec.json"
MARGIN = 4
LIMIT_MB = 8.0
TILE_W, TILE_H = 256, 128  # тайл 128x64 в масштабе 2x
SKIP = {"icons_symptoms", "icons_status_roles", "ui_frames"}  # листы режет tools/slice_sheets.py
MIRRORS = {
    "wall_left": "wall_right",
    "wall_door_left": "wall_door_right",
    "wall_window_left": "wall_window_right",
}


def key_green(img: Image.Image, tol: int = 60) -> Image.Image:
    a = np.asarray(img.convert("RGBA")).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    greenness = g - np.maximum(r, b)
    is_bg = (greenness > tol) & (g > 150)
    soft = np.clip((greenness - tol // 2) / max(tol // 2, 1), 0, 1)
    alpha = np.where(is_bg, 0, np.where(greenness > tol // 2, (1 - soft) * 255, 255))
    a[..., 3] = np.minimum(a[..., 3], alpha.astype(np.int16))
    edge = (greenness > 0) & ~is_bg
    a[..., 1] = np.where(edge, np.maximum(r, b), g)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), "RGBA")


def key_white_flood(img: Image.Image, thr: int = 226) -> Image.Image:
    """Белый фон: заливка от краёв, внутренние белые области (простыни) остаются."""
    a = np.asarray(img.convert("RGBA")).copy()
    near_white = (a[..., :3].min(axis=2) >= thr)
    h, w = near_white.shape
    seen = np.zeros_like(near_white)
    dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near_white[y, x] and not seen[y, x]:
                seen[y, x] = True
                dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near_white[y, x] and not seen[y, x]:
                seen[y, x] = True
                dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near_white[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                dq.append((ny, nx))
    a[..., 3] = np.where(seen, 0, 255)
    out = Image.fromarray(a, "RGBA")
    # лёгкое сглаживание края, чтобы не было белой каймы
    alpha = out.getchannel("A").filter(__import__("PIL.ImageFilter", fromlist=["x"]).GaussianBlur(0.8))
    out.putalpha(alpha)
    return out


def has_alpha(img: Image.Image) -> bool:
    if img.mode != "RGBA":
        return False
    return np.asarray(img.getchannel("A")).min() < 250


def crop_to_content(img: Image.Image) -> Image.Image:
    bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if bbox is None:
        return img
    l, t, r, b = bbox
    return img.crop((max(0, l - MARGIN), max(0, t - MARGIN), min(img.width, r + MARGIN), min(img.height, b + MARGIN)))


def floor_to_diamond(img: Image.Image) -> Image.Image:
    """Квадратная текстура -> ромб 256x128 (рендер в 2x и уменьшение для гладких краёв)."""
    src = img.convert("RGBA")
    W, H = src.size
    k = 2
    ow, oh = TILE_W * k, TILE_H * k
    # обратное отображение: u = X/ow + Y/oh - 0.5 ; v = Y/oh - X/ow + 0.5
    coeffs = (W / ow, W / oh, -0.5 * W, -H / ow, H / oh, 0.5 * H)
    big = src.transform((ow, oh), Image.AFFINE, coeffs, resample=Image.BICUBIC, fillcolor=(0, 0, 0, 0))
    return big.resize((TILE_W, TILE_H), Image.LANCZOS)


def resize_by_spec(img: Image.Image, spec: dict) -> Image.Image:
    if "height_px" in spec:
        scale = spec["height_px"] / img.height
    elif "width_px" in spec:
        scale = spec["width_px"] / img.width
    elif "w" in spec and "d" in spec:
        scale = (spec["w"] + spec["d"]) * 128 / img.width
    else:
        return img
    return img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)


def anchor_y(img: Image.Image) -> float:
    """Нижняя точка основания: самая нижняя строка с заметной непрозрачностью, доля высоты."""
    alpha = np.asarray(img.getchannel("A"))
    rows = np.where((alpha > 128).any(axis=1))[0]
    return round(float((rows.max() + 1) / img.height), 3) if len(rows) else 1.0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--png8", action="store_true", help="сохранять палитрой 256 цветов (легче)")
    parser.add_argument("--green-bg", nargs="*", default=[], help="имена файлов с зелёным фоном (листы иконок)")
    args = parser.parse_args()

    if not RAW.is_dir():
        print(f"Нет папки {RAW}")
        return 1
    spec = json.loads(SPEC.read_text(encoding="utf-8")) if SPEC.exists() else {}
    files = sorted(RAW.glob("*.png"))
    FINAL.mkdir(parents=True, exist_ok=True)

    anchors, total, count = {}, 0, 0

    def save(name: str, img: Image.Image) -> None:
        nonlocal total, count
        target = FINAL / f"{name}.png"
        out = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE) if args.png8 else img
        out.save(target, optimize=True)
        size = target.stat().st_size
        total += size
        count += 1
        anchors[name] = {"w": img.width, "h": img.height, "anchorY": 1.0 if name.startswith("floor_") else anchor_y(img)}
        print(f"{name:24s} {img.width:4d}x{img.height:<4d} {size / 1024:7.1f} KB  anchorY={anchors[name]['anchorY']}")

    for path in files:
        name = path.stem
        if name in SKIP:
            continue
        img = Image.open(path)
        if name.startswith("floor_"):
            save(name, floor_to_diamond(img))
            continue
        if name == "ward_bed_ref_whitebg" or (img.mode != "RGBA" and not has_alpha(img) and name not in args.green_bg):
            img = key_white_flood(img)
            name = "ward_bed" if name == "ward_bed_ref_whitebg" else name
        elif name in args.green_bg:
            img = key_green(img)
        out = crop_to_content(img.convert("RGBA"))
        if out.getchannel("A").getbbox() is None:
            print(f"{name:24s} ПРОПУЩЕН: пусто после вырезания фона")
            continue
        out = resize_by_spec(out, spec.get(name, {}))
        save(name, out)

    for mirror, src in MIRRORS.items():
        p = FINAL / f"{src}.png"
        if p.exists():
            save(mirror, ImageOps.mirror(Image.open(p).convert("RGBA")))

    (FINAL / "anchors.json").write_text(json.dumps(anchors, indent=1, sort_keys=True), encoding="utf-8")
    total_mb = total / (1024 * 1024)
    print(f"\nИтого: {count} файлов, {total_mb:.2f} МБ (лимит {LIMIT_MB:.0f} МБ)")
    if total_mb > LIMIT_MB:
        print("ВНИМАНИЕ: вес выше лимита. Запустите с --png8.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
