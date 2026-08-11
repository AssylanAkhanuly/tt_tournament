"""Сжимает out/<name>.json в out/<name>.min.json для переноса в Penpot.

Переносить схему в Penpot приходится через переписку: плагин Penpot не имеет
доступа к сети, поэтому JSON целиком идёт в контекст модели. Полный d2json
на большой схеме — под 35 КБ, и почти вся эта масса это длинные имена ключей
и десятичные хвосты координат, которые Penpot всё равно округлит.

Ключи сокращаются до одной буквы, координаты до целых. Схема min-файла:

    node   k kind · f fill · s stroke · d path · x y w h · r rx · L labels
    edge   d path · s stroke · z dash · L labels
    label  t text · x y · z size · b bold

    python diagrams/minify.py flow-tournaments
"""
import json
import re
import sys
from pathlib import Path

OUT = Path(__file__).parent / "out"

NODE = {"kind": "k", "fill": "f", "stroke": "s", "labels": "L", "rx": "r"}
EDGE = {"stroke": "s", "dash": "z", "labels": "L"}
LABEL = {"size": "z", "bold": "b", "anchor": "a"}

# Цвет подписи один на всю схему и задан темой — в Penpot он выставляется
# из builder-а, поэтому в min-файле не нужен.
LABEL_DROP = {"fill"}


def num(v):
    return round(v) if isinstance(v, float) else v


def path(d):
    """Округляет координаты и схлопывает прямые пробеги.

    Длинная сквозная стрелка через всю схему приходит из d2 как три десятка
    кубических сегментов подряд, у которых все контрольные точки лежат на
    одной вертикали. Геометрически это отрезок, а places в JSON занимает
    больше килобайта. Такие пробеги сливаются в одно L.
    """
    d = re.sub(r"-?\d+\.\d+", lambda m: str(round(float(m.group()))), d)

    tokens = re.findall(r"[MLCZ]|-?\d+", d)
    out, i = [], 0
    cur = None
    while i < len(tokens):
        t = tokens[i]
        if t == "M":
            cur = (int(tokens[i + 1]), int(tokens[i + 2]))
            out.append(f"M {cur[0]} {cur[1]}")
            i += 3
        elif t == "C":
            # собрать максимальный прямой пробег из подряд идущих C
            run_end, straight = cur, False
            j = i
            while j < len(tokens) and tokens[j] == "C":
                pts = [(int(tokens[j + 1 + 2 * k]), int(tokens[j + 2 + 2 * k])) for k in range(3)]
                same_x = all(p[0] == run_end[0] for p in pts)
                same_y = all(p[1] == run_end[1] for p in pts)
                if not (same_x or same_y):
                    break
                run_end, straight, j = pts[2], True, j + 7
            if straight:
                out.append(f"L {run_end[0]} {run_end[1]}")
                cur, i = run_end, j
            else:
                pts = [(int(tokens[i + 1 + 2 * k]), int(tokens[i + 2 + 2 * k])) for k in range(3)]
                out.append("C " + " ".join(f"{x} {y}" for x, y in pts))
                cur, i = pts[2], i + 7
        elif t == "L":
            cur = (int(tokens[i + 1]), int(tokens[i + 2]))
            out.append(f"L {cur[0]} {cur[1]}")
            i += 3
        elif t == "Z":
            out.append("Z")
            i += 1
        else:
            i += 1
    return " ".join(out)


def label(l):
    out = {}
    for k, v in l.items():
        if k in LABEL_DROP:
            continue
        # middle — умолчание, его не пишем: подписей тысячи, а поле лишнее.
        # Остаются s (левый край) и e (правый) из таблиц sql_table.
        if k == "anchor":
            if v == "middle":
                continue
            v = v[0]
        out[LABEL.get(k, k)] = int(v) if k == "bold" else num(v)
    return out


def shape(s, names):
    out = {}
    for k, v in s.items():
        if v is None or (k == "cls"):
            continue
        key = names.get(k, k)
        if k == "labels":
            v = [label(l) for l in v]
        elif k == "d":
            v = path(v)
        elif k == "dash":
            v = int(v)
        else:
            v = num(v)
        out[key] = v
    return out


def main(name):
    src = OUT / f"{name}.json"
    d = json.loads(src.read_text(encoding="utf-8"))
    m = {
        "name": d["name"],
        "w": num(d["w"]),
        "h": num(d["h"]),
        "nodes": [shape(n, NODE) for n in d["nodes"]],
        "edges": [shape(e, EDGE) for e in d["edges"]],
    }
    dst = OUT / f"{name}.min.json"
    dst.write_text(json.dumps(m, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{name}  {len(m['nodes'])} nodes  {len(m['edges'])} edges  "
          f"{src.stat().st_size / 1024:.1f} -> {dst.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for n in sys.argv[1:]:
        main(n)
