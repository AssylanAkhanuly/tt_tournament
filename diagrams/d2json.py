"""D2 SVG -> compact JSON.

D2 нужен нам ради раскладки: он считает координаты узлов и кривые рёбер, а
рисуем мы потом родными объектами Penpot. Скрипт вытаскивает из SVG только
геометрию и подписи, без CSS, шрифтов и прочего веса.

    python diagrams/d2json.py flow-offline     # -> diagrams/out/flow-offline.json
    python diagrams/d2json.py                  # все схемы разом
"""

import html
import json
import re
import sys
from pathlib import Path

OUT = Path(__file__).parent / "out"

# служебные классы D2, не являющиеся смысловым типом узла
NOISE = {"shape", "connection", "d2-svg", "text", "text-bold", "md", "sequence"}


def _attr(tag, name, cast=str):
    m = re.search(rf'{name}="([^"]*)"', tag)
    return cast(m.group(1)) if m else None


def _cls(tag):
    """Осмысленный класс D2 (step/good/decide/block/engine/...) из class-списка."""
    raw = _attr(tag, "class") or ""
    for c in raw.split():
        if c in NOISE or c.startswith(("fill-", "stroke-", "d2-", "text-")):
            continue
        if re.fullmatch(r"[A-Za-z0-9+/]+={0,2}", c) and len(c) > 6:
            continue  # base64-идентификатор
        return c
    return None


def parse(name):
    svg = (OUT / f"{name}.svg").read_text(encoding="utf-8")
    svg = re.sub(r"<style[^>]*>.*?</style>", "", svg, flags=re.S)

    # Внутренний <svg> смещён своим viewBox — приводим координаты к нулю.
    inner = re.search(r'<svg class="d2-\d+ d2-svg"[^>]*viewBox="([^"]+)"', svg)
    vb = [float(v) for v in inner.group(1).split()] if inner else [0, 0, 0, 0]
    ox, oy, W, H = -vb[0], -vb[1], vb[2], vb[3]

    nodes, edges = [], []

    for g in re.finditer(r'<g class="([^"]*)"\s*>(.*?)</g>\s*(?=<g class="|</svg>|</g>)', svg, re.S):
        body = g.group(2)
        klass = _cls(f'<g class="{g.group(1)}">')

        conn = re.search(r'<path[^>]*class="[^"]*connection[^"]*"[^>]*/>', body)
        if conn:
            d = _attr(conn.group(0), "d")
            edges.append({
                "d": _shift_path(d, ox, oy),
                "stroke": _attr(conn.group(0), "stroke") or "#0D32B2",
                "dash": "dash" in (_attr(conn.group(0), "style") or ""),
                "labels": _texts(body, ox, oy),
            })
            continue

        rect = re.search(r"<rect[^>]*/>", body)
        oval = re.search(r"<ellipse[^>]*/>", body)
        path = re.search(r"<path[^>]*/>", body)
        node = {"cls": klass, "labels": _texts(body, ox, oy)}
        if oval:
            # D2 рисует class:start эллипсом; без этой ветки узлы «Вход» молча пропадали
            t = oval.group(0)
            cx, cy = _attr(t, "cx", float), _attr(t, "cy", float)
            rx, ry = _attr(t, "rx", float), _attr(t, "ry", float)
            node.update({
                "kind": "oval",
                "x": cx - rx + ox, "y": cy - ry + oy, "w": rx * 2, "h": ry * 2,
                "fill": _attr(t, "fill"), "stroke": _attr(t, "stroke"),
            })
        elif rect:
            t = rect.group(0)
            node.update({
                "kind": "rect",
                "x": _attr(t, "x", float) + ox, "y": _attr(t, "y", float) + oy,
                "w": _attr(t, "width", float), "h": _attr(t, "height", float),
                "rx": _attr(t, "rx", float) or 0,
                "fill": _attr(t, "fill"), "stroke": _attr(t, "stroke"),
            })
        elif path:
            t = path.group(0)
            node.update({
                "kind": "path", "d": _shift_path(_attr(t, "d"), ox, oy),
                "fill": _attr(t, "fill"), "stroke": _attr(t, "stroke"),
            })
        else:
            continue
        if node["labels"] or node.get("w"):
            nodes.append(node)

    return {"name": name, "w": W, "h": H, "nodes": nodes, "edges": edges}


def _texts(body, ox, oy):
    out = []
    for t in re.finditer(r"<text[^>]*>(.*?)</text>", body, re.S):
        tag = t.group(0)
        # Многострочные подписи D2 разбивает на <tspan>: между ними перенос,
        # иначе строки слипаются («по порядкувремя устройства»).
        raw = re.sub(r"</tspan>\s*<tspan[^>]*>", "\n", t.group(1))
        chars = html.unescape(re.sub(r"<[^>]+>", "", raw)).strip()
        if not chars:
            continue
        size = re.search(r"font-size:(\d+)", _attr(tag, "style") or "")
        out.append({
            "t": chars,
            "x": _attr(tag, "x", float) + ox,
            "y": _attr(tag, "y", float) + oy,
            "size": int(size.group(1)) if size else 14,
            "fill": _attr(tag, "fill") or "#0A0F25",
            "bold": "text-bold" in (_attr(tag, "class") or ""),
        })
    return out


def _shift_path(d, ox, oy):
    """Сдвигает абсолютный path на (ox, oy): координаты идут парами."""
    if not d:
        return d
    toks, i, out = re.findall(r"[A-Za-z]|-?[\d.]+", d), 0, []
    flip = 0
    for tok in toks:
        if re.match(r"[A-Za-z]", tok):
            out.append(tok)
            flip = 0
            continue
        out.append(f"{float(tok) + (ox if flip % 2 == 0 else oy):.1f}")
        flip += 1
    return " ".join(out)


if __name__ == "__main__":
    # Пишем файл сами: редирект stdout на Windows кодируется в cp1251 и рвёт UTF-8.
    names = sys.argv[1:] or [p.stem for p in sorted(OUT.glob("*.svg"))]
    for n in names:
        data = parse(n)
        dst = OUT / f"{n}.json"
        dst.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"{n:20} {len(data['nodes']):>3} nodes {len(data['edges']):>3} edges "
              f"{int(data['w'])}x{int(data['h'])} -> {dst.stat().st_size / 1024:.1f} KB")
