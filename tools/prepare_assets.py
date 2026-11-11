#!/usr/bin/env python3
"""Подготовка ассетов: assets/raw/*.png -> assets/final/*.png.

Что делает:
  1. Вырезает однотонный ярко-зелёный фон (#00FF00 и близкие оттенки) в прозрачность.
  2. Убирает зелёную «кайму» по краям (despill).
  3. Обрезает пустые поля, оставляя запас MARGIN px.
  4. Сохраняет PNG и печатает размер каждого файла и общий вес.

Запуск из корня проекта:
  python3 tools/prepare_assets.py            # все файлы из assets/raw
  python3 tools/prepare_assets.py --tol 70   # допуск по зелёному (по умолчанию 60)

Нужны Pillow и numpy.
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "raw"
FINAL = ROOT / "assets" / "final"
MARGIN = 4
LIMIT_MB = 8.0


def key_green(img: Image.Image, tol: int) -> Image.Image:
    """Делает зелёный фон прозрачным и убирает зелёный оттенок на краях."""
    a = np.asarray(img.convert("RGBA")).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]

    # «Зелёность»: насколько G превосходит максимум из R и B.
    greenness = g - np.maximum(r, b)
    is_bg = (greenness > tol) & (g > 150)

    # Мягкий край: полупрозрачность там, где зелёность средняя.
    soft = np.clip((greenness - tol // 2) / max(tol // 2, 1), 0, 1)
    alpha = np.where(is_bg, 0, np.where(greenness > tol // 2, (1 - soft) * 255, 255))
    a[..., 3] = np.minimum(a[..., 3], alpha.astype(np.int16))

    # Despill: на краях подрезаем G до уровня max(R, B).
    edge = (greenness > 0) & ~is_bg
    a[..., 1] = np.where(edge, np.maximum(r, b), g)

    return Image.fromarray(a.clip(0, 255).astype(np.uint8), "RGBA")


def crop_to_content(img: Image.Image) -> Image.Image:
    bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if bbox is None:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - MARGIN)
    top = max(0, top - MARGIN)
    right = min(img.width, right + MARGIN)
    bottom = min(img.height, bottom + MARGIN)
    return img.crop((left, top, right, bottom))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--tol", type=int, default=60, help="допуск по зелёному (больше = агрессивнее)")
    args = parser.parse_args()

    if not RAW.is_dir():
        print(f"Нет папки {RAW}. Положите исходники из Higgsfield в assets/raw/.")
        return 1

    files = sorted(p for p in RAW.glob("*.png"))
    if not files:
        print(f"В {RAW} нет PNG-файлов.")
        return 1

    FINAL.mkdir(parents=True, exist_ok=True)
    total = 0
    for path in files:
        out = crop_to_content(key_green(Image.open(path), args.tol))
        if out.getchannel("A").getbbox() is None:
            print(f"{path.name:40s} ПРОПУЩЕН: после вырезания фона ничего не осталось (проверьте --tol)")
            continue
        target = FINAL / path.name
        out.save(target, optimize=True)
        size = target.stat().st_size
        total += size
        print(f"{path.name:40s} {out.width:4d}x{out.height:<4d} {size / 1024:7.1f} KB")

    total_mb = total / (1024 * 1024)
    print(f"\nИтого: {len(files)} файлов, {total_mb:.2f} МБ (лимит {LIMIT_MB:.0f} МБ)")
    if total_mb > LIMIT_MB:
        print("ВНИМАНИЕ: вес выше лимита. Уменьшите кадры персонажей до 128 px или пережмите в PNG-8/WebP.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
