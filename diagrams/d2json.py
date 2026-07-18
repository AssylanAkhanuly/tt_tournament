"""D2 SVG -> compact JSON.

D2 нужен нам ради раскладки: он считает координаты узлов и кривые рёбер, а
рисуем мы потом родными объектами Penpot. Скрипт вытаскивает из SVG только
геометрию и подписи, без CSS, шрифтов и прочего веса.

    python diagrams/d2json.py flow-offline     # -> diagrams/out/flow-offline.json
    python diagrams/d2json.py                  # все схемы разом

Разбор идёт через XML-парсер, а не регекспами. Регекспы на этом SVG молча врут:
у вложенных <g> ломается нежадный `(.*?)</g>`, из-за чего терялись рёбра с
подписями, а полигоны наконечников внутри <marker> несут тот же class
"connection", что и настоящие связи, и попадали в выдачу как лишние.
"""

import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

OUT = Path(__file__).parent / "out"
NS = "{http://www.w3.org/2000/svg}"

# Классы из _theme.d2. Список явный, потому что отличить класс от base64-имени
# узла по виду нельзя: «step» — валидный base64, и эвристика по длине его съедала.
KNOWN = {"rbac", "step", "good", "muted", "decide", "block", "engine", "live",
         "start", "client", "data", "audit", "back", "loop", "liveEdge"}


def _cls(el):
    """Осмысленный класс D2 (step/good/decide/block/...) из class-списка."""
    for c in (el.get("class") or "").split():
        if c in KNOWN:
            return c
    return None


def _f(el, name):
    v = el.get(name)
    return float(v) if v is not None else None


def parse(name):
    tree = ET.parse(OUT / f"{name}.svg")
    root = tree.getroot()

    # Внутренний <svg> смещён своим viewBox — приводим координаты к нулю.
    inner = next((e for e in root.iter(NS + "svg") if "d2-svg" in (e.get("class") or "")), root)
    vb = [float(v) for v in inner.get("viewBox").split()]
    ox, oy, W, H = -vb[0], -vb[1], vb[2], vb[3]

    nodes, edges = [], []
    for g in inner:
        if g.tag != NS + "g" or g.get("class") is None:
            continue  # фон, <mask>, <defs> с наконечниками

        conn = next((p for p in g.iter(NS + "path")
                     if "connection" in (p.get("class") or "")), None)
        if conn is not None:
            edges.append({
                "d": _shift(conn.get("d"), ox, oy),
                "stroke": conn.get("stroke") or "#0D32B2",
                "dash": "dash" in (conn.get("style") or ""),
                "labels": _texts(g, ox, oy),
            })
            continue

        node = {"cls": _cls(g), "labels": _texts(g, ox, oy)}
        oval = next(iter(g.iter(NS + "ellipse")), None)
        rect = next(iter(g.iter(NS + "rect")), None)
        path = next(iter(g.iter(NS + "path")), None)
        if oval is not None:
            # class:start рисуется эллипсом; без этой ветки узлы «Вход» пропадали
            cx, cy, rx, ry = (_f(oval, k) for k in ("cx", "cy", "rx", "ry"))
            node.update({"kind": "oval", "x": cx - rx + ox, "y": cy - ry + oy,
                         "w": rx * 2, "h": ry * 2,
                         "fill": oval.get("fill"), "stroke": oval.get("stroke")})
        elif rect is not None:
            node.update({"kind": "rect", "x": _f(rect, "x") + ox, "y": _f(rect, "y") + oy,
                         "w": _f(rect, "width"), "h": _f(rect, "height"),
                         "rx": _f(rect, "rx") or 0,
                         "fill": rect.get("fill"), "stroke": rect.get("stroke")})
        elif path is not None:
            node.update({"kind": "path", "d": _shift(path.get("d"), ox, oy),
                         "fill": path.get("fill"), "stroke": path.get("stroke")})
        else:
            continue
        nodes.append(node)

    return {"name": name, "w": W, "h": H, "nodes": nodes, "edges": edges}


def _texts(g, ox, oy):
    out = []
    for t in g.iter(NS + "text"):
        # Многострочные подписи D2 разбивает на <tspan>: между ними перенос,
        # иначе строки слипаются («по порядкувремя устройства»).
        parts = [(t.text or "")] + [(s.text or "") + (s.tail or "") for s in t]
        chars = html.unescape("\n".join(p for p in parts if p.strip()).strip())
        if not chars:
            continue
        style = t.get("style") or ""
        size = re.search(r"font-size:(\d+)", style)

        # Выравнивание обязательно тащить с собой. У обычных подписей оно
        # middle и x — центр, а внутри sql_table строки идут start (x — левый
        # край), а маркеры PK/FK — end (x — правый край). Без этого поля всё
        # содержимое таблиц уезжает влево на половину ширины, а PK/FK вылезают
        # за рамку. Проверено на живой схеме.
        anchor = re.search(r"text-anchor:(\w+)", style)
        anchor = anchor.group(1) if anchor else "middle"

        out.append({
            "t": chars,
            "x": _f(t, "x") + ox,
            "y": _f(t, "y") + oy,
            "size": int(size.group(1)) if size else 14,
            "fill": t.get("fill") or "#0A0F25",
            "bold": "text-bold" in (t.get("class") or ""),
            "anchor": anchor,
        })
    return out


def _shift(d, ox, oy):
    """Сдвигает абсолютный path на (ox, oy): координаты идут парами."""
    if not d:
        return d
    out, flip = [], 0
    for tok in re.findall(r"[A-Za-z]|-?[\d.]+", d):
        if re.match(r"[A-Za-z]", tok):
            out.append(tok)
            flip = 0
            continue
        # V и H двигают одну ось, но D2 их почти не выдаёт; для C/L/M пары x,y
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
