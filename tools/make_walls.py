#!/usr/bin/env python3
"""Генератор сегментов стен: assets/final/walls/*.png + walls.json.

Стены в игре собираются из сегментов длиной 1 тайл, поэтому их рисуем кодом (стык в стык,
без швов), в стиле сгенерированных стен (мятный верх, белая панель, белый кант).
Все размеры в px при масштабе 2x (в игре scale 0.5). Тайл: x -> (+128, +64), y -> (-128, +64).

Сегмент ставится так: точка A (начало нижней кромки лицевой грани) = позиция якоря ax, ay из walls.json.
  wall_*_r  стена вдоль оси x (север комнаты), лицевая грань смотрит в +y
  wall_*_l  стена вдоль оси y (запад комнаты), зеркало с затемнением
  col_*     столб-угол t x t, якорь в переднем нижнем углу
  door_tall_*, window_tall_*  сегмент с проёмом / окном
  door_low_*  проём в низкой стене (рамка выше стены, это дверь комнаты)
tall = полная высота 192 px (384 в 2x), low = низкая стена 64 px (128 в 2x).

Запуск: python3 tools/make_walls.py
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "final" / "walls"
SS = 4  # суперсэмплинг для гладких краёв
TILE_DX, TILE_DY = 128, 64
T = 0.16  # толщина стены в тайлах
H_TALL, H_LOW = 384, 128
DOOR_H = 280

TEAL = (125, 198, 194)
TEAL_TOP = (134, 206, 201)
WAIN = (226, 225, 226)
GROOVE = (196, 194, 196)
RAIL = (240, 242, 243)
RAIL_SH = (181, 175, 172)
CAP = (236, 239, 242)
CAP_TOP = (248, 250, 252)
WHITE = (244, 246, 247)


def shade(c, k):
    return tuple(max(0, min(255, round(v * k))) for v in c)


def pt(u, v, h=0.0):
    """Точка на экране (в px 2x) относительно якоря: u вдоль x, v вдоль y, h высота."""
    return ((u - v) * TILE_DX, (u + v) * TILE_DY - h)


class Canvas:
    def __init__(self, w, h, ax, ay):
        self.w, self.h, self.ax, self.ay = w, h, ax, ay
        self.img = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img)

    def p(self, point):
        return ((self.ax + point[0]) * SS, (self.ay + point[1]) * SS)

    def poly(self, pts, color, alpha=255):
        self.d.polygon([self.p(q) for q in pts], fill=color + (alpha,))

    def line(self, a, b, color, width=1.0):
        self.d.line([self.p(a), self.p(b)], fill=color + (255,), width=max(1, round(width * SS)))

    def finish(self):
        return self.img.resize((self.w, self.h), Image.LANCZOS)


def lerp(a, b, s):
    return (a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s)


def band(cv, p0, p1, h0, h1, color, k=1.0):
    """Полоса грани между высотами h0 и h1; p0 левая, p1 правая точки нижней кромки."""
    cv.poly(
        [(p0[0], p0[1] - h0), (p1[0], p1[1] - h0), (p1[0], p1[1] - h1), (p0[0], p0[1] - h1)],
        shade(color, k),
    )


def draw_face(cv, p0, p1, H, k, groove_step=0.5, tile_len=1.0):
    """Лицевая грань: плинтус, панель с канавками, кант, мятная часть, белый верх."""
    base_h = 14
    wain_h = round(H * (0.34 if H > 200 else 0.42))
    rail_h = 18 if H > 200 else 12
    cap_h = 26 if H > 200 else 20
    band(cv, p0, p1, 0, base_h, RAIL, k)                       # плинтус
    band(cv, p0, p1, base_h, wain_h, WAIN, k)                  # панель
    n = int(round(tile_len / groove_step))
    for i in range(0, n + 1):                                  # канавки панели
        s = i * groove_step / tile_len
        if 0 < s < 1:
            a, b = lerp(p0, p1, s), lerp(p0, p1, s)
            cv.line((a[0], a[1] - base_h - 4), (b[0], b[1] - wain_h + 10), shade(GROOVE, k), 2.2)
            cv.line((a[0] + 2.4, a[1] - base_h - 4), (b[0] + 2.4, b[1] - wain_h + 10), shade((250, 250, 251), k), 1.4)
    band(cv, p0, p1, wain_h, wain_h + rail_h, RAIL, k)         # кант
    cv.line((p0[0], p0[1] - wain_h), (p1[0], p1[1] - wain_h), shade(RAIL_SH, k), 2)
    teal_top = H - cap_h
    for i in range(6):                                         # лёгкий градиент мятной части
        h0 = wain_h + rail_h + (teal_top - wain_h - rail_h) * i / 6
        h1 = wain_h + rail_h + (teal_top - wain_h - rail_h) * (i + 1) / 6 + 1
        t = i / 5
        color = tuple(round(TEAL[j] + (TEAL_TOP[j] - TEAL[j]) * t) for j in range(3))
        band(cv, p0, p1, h0, h1, color, k)
    band(cv, p0, p1, teal_top, H, CAP, k)                      # белый верхний кант
    cv.line((p0[0], p0[1] - teal_top), (p1[0], p1[1] - teal_top), shade((200, 208, 214), k), 2)


def top_cap(cv, pts, H):
    cv.poly([(x, y - H) for x, y in pts], CAP_TOP)


def segment_r(H, kind="plain", canvas_h=None):
    """Сегмент стены вдоль x: лицевая грань v=0, толщина уходит в -v.
    canvas_h выше H нужен для двери в низкой стене: рамка проёма выше самой стены."""
    w = int(TILE_DX * (1 + T)) + 8
    ax, ay = 4, (canvas_h or H) + 14
    hc = ay + TILE_DY + 8
    cv = Canvas(w, hc, ax, ay)
    a, b = pt(0, 0), pt(1, 0)
    back = pt(0, -T)
    # верх: от лицевой кромки к задней
    top_cap(cv, [pt(0, 0), pt(1, 0), pt(1, -T), pt(0, -T)], H)
    draw_face(cv, a, b, H, 1.0)
    if kind == "door" and canvas_h:
        door_low(cv, a, b)
    elif kind == "door":
        door(cv, a, b, H)
    elif kind == "window":
        window(cv, a, b, H)
    return cv.finish(), ax, ay


def carve(cv, pts):
    """Вырезает полигон из уже нарисованного слоя (делает прозрачным)."""
    mask = Image.new("L", cv.img.size, 255)
    ImageDraw.Draw(mask).polygon([cv.p(q) for q in pts], fill=0)
    alpha = cv.img.getchannel("A")
    cv.img.putalpha(Image.composite(alpha, Image.new("L", cv.img.size, 0), mask))
    cv.d = ImageDraw.Draw(cv.img)


def door(cv, a, b, H):
    u0, u1 = 0.16, 0.84
    p0, p1 = lerp(a, b, u0), lerp(a, b, u1)
    hole = [(p0[0], p0[1]), (p1[0], p1[1]), (p1[0], p1[1] - DOOR_H), (p0[0], p0[1] - DOOR_H)]
    carve(cv, hole)
    # внутренняя левая боковина проёма (смотрит в +x, видна) и притолока
    jx = pt(u0, 0)
    back = pt(u0, -T)
    cv.poly([jx, back, (back[0], back[1] - DOOR_H), (jx[0], jx[1] - DOOR_H)], shade(WHITE, 0.9))
    # белая рамка вокруг проёма
    fr = 9
    cv.poly([(p0[0] - fr, p0[1]), (p0[0], p0[1]), (p0[0], p0[1] - DOOR_H), (p0[0] - fr, p0[1] - DOOR_H - fr)], WHITE)
    cv.poly([(p1[0], p1[1]), (p1[0] + fr, p1[1]), (p1[0] + fr, p1[1] - DOOR_H - fr), (p1[0], p1[1] - DOOR_H)], shade(WHITE, 0.93))
    cv.poly([(p0[0] - fr, p0[1] - DOOR_H - fr), (p0[0], p0[1] - DOOR_H), (p1[0], p1[1] - DOOR_H), (p1[0] + fr, p1[1] - DOOR_H - fr)], WHITE)


def door_low(cv, a, b):
    """Проём в низкой стене: объёмные белые косяки с мятной вставкой и перемычка выше стены."""
    u0, u1 = 0.18, 0.82
    p0, p1 = lerp(a, b, u0), lerp(a, b, u1)
    carve(cv, [(p0[0], p0[1]), (p1[0], p1[1]), (p1[0], p1[1] - DOOR_H - 40), (p0[0], p0[1] - DOOR_H - 40)])
    fr, beam = 24, 36
    top = DOOR_H
    # внутренняя боковина левого косяка (видна, смотрит в +x)
    jx, back = pt(u0, 0), pt(u0, -T)
    cv.poly([jx, back, (back[0], back[1] - top), (jx[0], jx[1] - top)], shade(WHITE, 0.86))
    # косяки: белая лицевая полоса с мятной вставкой посередине
    for (x0, y0, x1, y1, k) in ((p0[0] - fr, p0[1] - (fr * 0.5), p0[0], p0[1], 1.0),
                                (p1[0], p1[1], p1[0] + fr, p1[1] - (fr * 0.5), 0.93)):
        cv.poly([(x0, y0 + 0), (x1, y1 + 0), (x1, y1 - top), (x0, y0 - top)], shade(WHITE, k))
        mx0, mx1 = x0 + (x1 - x0) * 0.3, x0 + (x1 - x0) * 0.7
        my0 = y0 + (y1 - y0) * 0.3
        my1 = y0 + (y1 - y0) * 0.7
        cv.poly([(mx0, my0), (mx1, my1), (mx1, my1 - top + 10), (mx0, my0 - top + 10)], shade(TEAL, k))
    # перемычка: мятная лицевая грань + белый кант сверху
    l0 = (p0[0] - fr, p0[1] - fr * 0.5)
    r1 = (p1[0] + fr, p1[1] - fr * 0.5)
    cv.poly([(l0[0], l0[1] - top), (r1[0], r1[1] - top), (r1[0], r1[1] - top - beam), (l0[0], l0[1] - top - beam)], TEAL)
    cv.poly([(l0[0], l0[1] - top - beam), (r1[0], r1[1] - top - beam), (r1[0], r1[1] - top - beam - 9), (l0[0], l0[1] - top - beam - 9)], CAP)
    cv.line((l0[0], l0[1] - top), (r1[0], r1[1] - top), shade(RAIL_SH, 1.0), 2)
    # порог: светлая плашка на полу
    cv.poly([(p0[0], p0[1]), (p1[0], p1[1]), (p1[0], p1[1] - 6), (p0[0], p0[1] - 6)], shade(RAIL, 0.96))


def window(cv, a, b, H):
    u0, u1 = 0.14, 0.86
    h0, h1 = round(H * 0.44), round(H * 0.84)
    p0, p1 = lerp(a, b, u0), lerp(a, b, u1)
    glass = [(p0[0], p0[1] - h0), (p1[0], p1[1] - h0), (p1[0], p1[1] - h1), (p0[0], p0[1] - h1)]
    fr = 9
    cv.poly([(x + dx, y + dy) for (x, y), (dx, dy) in zip(glass, [(-fr, fr), (fr, fr), (fr, -fr), (-fr, -fr)])], WHITE)
    for i in range(10):                                         # небо: градиент сверху вниз
        s0, s1 = i / 10, (i + 1) / 10
        def at(s, left):
            pp = p0 if left else p1
            return (pp[0], pp[1] - (h1 - (h1 - h0) * s))
        c = (round(150 + 65 * s0), round(205 + 33 * s0), round(246 + 6 * s0))
        cv.poly([at(s0, True), at(s0, False), at(s1 + 0.01, False), at(s1 + 0.01, True)], c)
    mid = lerp(p0, p1, 0.5)
    cv.line((mid[0], mid[1] - h0), (mid[0], mid[1] - h1), WHITE, 5)
    cv.line((p0[0], (p0[1] + p1[1]) / 2 - (h0 + h1) / 2), (p1[0], (p0[1] + p1[1]) / 2 - (h0 + h1) / 2), WHITE, 5)
    # подоконник
    sill = [(p0[0] - fr - 4, p0[1] - h0 + fr), (p1[0] + fr + 4, p1[1] - h0 + fr), (p1[0] + fr + 4, p1[1] - h0 + fr + 8), (p0[0] - fr - 4, p0[1] - h0 + fr + 8)]
    cv.poly(sill, shade(WHITE, 0.95))


def column(H):
    """Столб t x t: занимает u,v in [-T, 0], якорь в переднем нижнем углу (u=v=0)."""
    w = int(TILE_DX * T * 2) + 12
    ax = int(TILE_DX * T) + 6
    ay = H + int(TILE_DY * T * 2) + 6
    cv = Canvas(w, ay + 8, ax, ay)
    # грань +x (плоскость u=0): от v=0 (слева) до v=-T (справа, выше)
    draw_face(cv, pt(0, 0), pt(0, -T), H, 0.88, tile_len=T)
    # грань +y (плоскость v=0): от u=-T (слева) до u=0
    draw_face(cv, pt(-T, 0), pt(0, 0), H, 1.0, tile_len=T)
    top_cap(cv, [pt(-T, -T), pt(0, -T), pt(0, 0), pt(-T, 0)], H)
    return cv.finish(), ax, ay


def mirror(img, ax, k=0.94):
    m = img.transpose(Image.FLIP_LEFT_RIGHT)
    px = m.load()
    for y in range(m.height):
        for x in range(m.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (round(r * k), round(g * k), round(b * k), a)
    return m, img.width - ax


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}

    def save(name, img, ax, ay):
        img.save(OUT / f"{name}.png", optimize=True)
        meta[name] = {"w": img.width, "h": img.height, "ax": ax, "ay": ay}

    for label, H in (("tall", H_TALL), ("low", H_LOW)):
        img, ax, ay = segment_r(H)
        save(f"wall_{label}_r", img, ax, ay)
        m, mx = mirror(img, ax)
        save(f"wall_{label}_l", m, mx, ay)
        c, cax, cay = column(H)
        save(f"col_{label}", c, cax, cay)
    for kind in ("door", "window"):
        img, ax, ay = segment_r(H_TALL, kind)
        save(f"{kind}_tall_r", img, ax, ay)
        m, mx = mirror(img, ax)
        save(f"{kind}_tall_l", m, mx, ay)
    # Дверь в низкой стене: низкие стенки по краям и белая рамка проёма высотой DOOR_H.
    img, ax, ay = segment_r(H_LOW, "door", canvas_h=DOOR_H + 14 + 50)
    save("door_low_r", img, ax, ay)
    m, mx = mirror(img, ax)
    save("door_low_l", m, mx, ay)
    meta["_comment"] = "w,h: размер PNG (2x). ax,ay: пиксель якоря. Подробности в tools/make_walls.py"
    meta["_const"] = {"T": T, "H_TALL": H_TALL, "H_LOW": H_LOW}
    (OUT / "walls.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False), encoding="utf-8")
    total = sum(p.stat().st_size for p in OUT.glob("*.png"))
    print(f"{len(meta) - 2} спрайтов, {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
