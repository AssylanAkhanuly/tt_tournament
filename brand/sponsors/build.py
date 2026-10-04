# -*- coding: utf-8 -*-
"""Сборка логотипов партнёров из присланных исходников.

    python brand/sponsors/build.py

Читает `brand/sponsors/src/` (оригиналы, как прислали) и пишет:

  brand/sponsors/png/<имя>.png     — логотип в родных цветах, фон прозрачный
  front/public/sponsors/<имя>.png  — версия для эфира (полоса партнёров табло)

Нужны PyMuPDF и Pillow. CorelDRAW (`.cdr`) здесь читать нечем, поэтому ERG
берётся из присланного растра, а знак ФНТ — из уже сконвертированного
`brand/fnt/`.
"""

from __future__ import annotations

import io
import re
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
SRC = HERE / "src"
PNG = HERE / "png"
AIR = HERE.parents[1] / "front" / "public" / "sponsors"
FNT = HERE.parent / "fnt" / "png" / "fnt-logo-1024.png"

AIR_HEIGHT = 240  # высота эфирной версии: с запасом под источник OBS в 2x


# ── помощники ──────────────────────────────────────────────────────────────

def trim(im: Image.Image) -> Image.Image:
    """Обрезать прозрачные поля. Едва заметные точки (шум сжатия исходника)
    за содержимое не считаются — иначе поля остаются."""
    box = im.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    return im.crop(box) if box else im


def page_png(doc: fitz.Document, page: int, dpi: int) -> Image.Image:
    pm = doc[page].get_pixmap(dpi=dpi, alpha=False)
    return Image.open(io.BytesIO(pm.tobytes("png"))).convert("RGB")


def knock_out(im: Image.Image, bg: tuple[int, int, int], full: int) -> Image.Image:
    """Убрать однотонный фон: прозрачность — по удалению цвета от фона.
    `full` — расстояние (по самому далёкому каналу), с которого точка уже
    непрозрачна; ближе — сглаженный край."""
    diff = ImageChops.difference(im, Image.new("RGB", im.size, bg))
    r, g, b = diff.split()
    far = ImageChops.lighter(ImageChops.lighter(r, g), b)
    floor = 8  # «почти фон»: у снимка экрана белый не ровно 255
    alpha = far.point(lambda v: max(0, min(255, (v - floor) * 255 // (full - floor))))
    out = im.convert("RGBA")
    out.putalpha(alpha)
    return out


def whiten(im: Image.Image) -> Image.Image:
    """Тот же силуэт, залитый белым: эфирная версия идёт поверх видео."""
    out = Image.new("RGBA", im.size, (255, 255, 255, 0))
    out.putalpha(im.getchannel("A"))
    return out


def darkness_to_white(im: Image.Image) -> Image.Image:
    """Чёрно-белый логотип на белом → белый на прозрачном: чем темнее точка,
    тем плотнее белый. Белые буквы внутри чёрной плашки становятся просветом."""
    alpha = im.convert("L").point(lambda v: 255 - v)
    out = Image.new("RGBA", im.size, (255, 255, 255, 0))
    out.putalpha(alpha)
    return out


def fit(im: Image.Image, height: int) -> Image.Image:
    im = trim(im)
    width = max(1, round(im.width * height / im.height))
    return im.resize((width, height), Image.LANCZOS)


def save(im: Image.Image, color_to: str | None, air: Image.Image, name: str) -> None:
    PNG.mkdir(exist_ok=True)
    AIR.mkdir(parents=True, exist_ok=True)
    if color_to is not None:
        trim(im).save(PNG / f"{color_to}.png", optimize=True)
    fit(air, AIR_HEIGHT).save(AIR / f"{name}.png", optimize=True)
    print(f"{name}: ok")


# ── Illustrator 8 (PostScript) → SVG ───────────────────────────────────────
# Allur прислан в старом .ai — это PostScript, а не PDF, и PyMuPDF его не
# открывает. Внутри только заливки и контуры (m / L / C / f), поэтому разбираем
# сами. Составные контуры (*u … *U) — буквы с отверстиями — идут одним путём.

def cmyk_hex(c: float, m: float, y: float, k: float) -> str:
    rgb = [round(255 * (1 - v) * (1 - k)) for v in (c, m, y)]
    return "#%02x%02x%02x" % tuple(rgb)


def ai8_to_svg(text: str, only: str | None = None) -> str:
    """`only` — оставить контуры одного цвета: в файле Allur три версии знака
    друг под другом (белая, красная, чёрная)."""
    box = [float(v) for v in re.search(r"%%BoundingBox:\s*(.+)", text).group(1).split()]
    x0, y0, x1, y1 = box
    body = text.split("%%EndSetup", 1)[1]
    fill, d, paths, compound = "#000000", [], [], False

    def flush() -> None:
        if d and only in (None, fill):
            paths.append(f'<path fill="{fill}" fill-rule="evenodd" d="{" ".join(d)}"/>')
        d.clear()

    for line in body.splitlines():
        parts = line.split()
        if not parts:
            continue
        op, nums = parts[-1], parts[:-1]
        if op == "k" and len(nums) == 4:
            flush()
            fill = cmyk_hex(*map(float, nums))
        elif op in ("m", "L", "l", "C", "c") and len(nums) in (2, 6):
            v = [float(n) for n in nums]
            pts = " ".join(f"{v[i] - x0:.2f},{y1 - v[i + 1]:.2f}" for i in range(0, len(v), 2))
            d.append({"m": "M", "L": "L", "l": "L", "C": "C", "c": "C"}[op] + pts)
        elif op in ("f", "F"):
            d.append("Z")
            if not compound:
                flush()
        elif op == "*u":
            compound = True
        elif op == "*U":
            compound = False
            flush()
    flush()
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {x1 - x0:.2f} {y1 - y0:.2f}" '
        f'width="{x1 - x0:.2f}" height="{y1 - y0:.2f}">' + "".join(paths) + "</svg>"
    )


def svg_png(svg: str, zoom: float) -> Image.Image:
    doc = fitz.open(stream=svg.encode("utf-8"), filetype="svg")
    pm = doc[0].get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=True)
    return Image.open(io.BytesIO(pm.tobytes("png"))).convert("RGBA")


# ── логотипы ───────────────────────────────────────────────────────────────

def halyk() -> None:
    doc = fitz.open(SRC / "ЛОГО - ВЕКТОР.pdf")
    # стр. 1 — цветной на белом; стр. 2 — белый на сером, он и идёт в эфир
    color = knock_out(page_png(doc, 0, 40), (255, 255, 255), 60)
    white = page_png(doc, 1, 40)
    # серая подложка на волос не доходит до края листа — белая кромка сошла бы
    # за часть знака
    white = white.crop((6, 6, white.width - 6, white.height - 6))
    alpha = white.convert("L").point(lambda v: max(0, min(255, (v - 238) * 255 // 16)))
    air = Image.new("RGBA", white.size, (255, 255, 255, 0))
    air.putalpha(alpha)
    save(color, "halyk", air, "halyk")


def add_capital() -> None:
    doc = fitz.open(SRC / "ADD Capital logo 2.pdf")
    page = page_png(doc, 0, 200)
    save(knock_out(page, (255, 255, 255), 40), "add-capital", darkness_to_white(page), "add-capital")


def kazakhmys() -> None:
    # в имени снимка экрана macOS перед «PM» стоит узкий неразрывный пробел —
    # буквально его не набрать, поэтому ищем по маске
    shot = Image.open(next(SRC.glob("Screenshot*.png"))).convert("RGB")
    color = knock_out(shot, (255, 255, 255), 90)
    save(color, "kazakhmys", whiten(color), "kazakhmys")


def erg() -> None:
    light = Image.open(SRC / "erg-light.webp").convert("RGBA")  # уже белый на прозрачном
    save(light, "erg", light, "erg")


def ministry() -> None:
    logo = Image.open(SRC / "ЛОГО АҚ 01.png").convert("RGBA")  # герб в цвете, подпись белая
    save(logo, "ministry", logo, "ministry")


def allur() -> None:
    text = (SRC / "Allur logo (1).ai").read_text("latin-1")
    red, white = cmyk_hex(0, 0.91, 0.98, 0), cmyk_hex(0, 0, 0, 0)
    save(svg_png(ai8_to_svg(text, red), 2), "allur", svg_png(ai8_to_svg(text, white), 2), "allur")


def fnt() -> None:
    logo = Image.open(FNT).convert("RGBA")  # PNG-версия уже лежит в brand/fnt/png
    save(logo, None, logo, "fnt")


if __name__ == "__main__":
    for build in (ministry, fnt, halyk, erg, kazakhmys, add_capital, allur):
        build()
