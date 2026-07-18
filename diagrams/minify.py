"""Сжимает out/<name>.json в out/<name>.min.json для переноса в Penpot.

Переносить схему в Penpot приходится через переписку: плагин Penpot не имеет
доступа к сети, поэтому JSON целиком идёт в контекст модели. Полный d2json
на большой схеме — под 35 КБ, и почти вся эта масса это длинные имена ключей
и десятичные хвосты координат, которые Penpot всё равно округлит.

Ключи сокращаются до одной буквы, координаты до целых. Схема min-файла:

    node   k kind · f fill · s stroke · d path · x y w h · r rx · L labels
    edge   d path · s stroke · z dash · L labels
    label  t text · x y · z size · b bold

    python diagrams/minify.py flow-tournament-full
"""
import json
import re
import sys
from pathlib import Path

OUT = Path(__file__).parent / "out"

NODE = {"kind": "k", "fill": "f", "stroke": "s", "labels": "L", "rx": "r"}
EDGE = {"stroke": "s", "dash": "z", "labels": "L"}
LABEL = {"size": "z", "bold": "b"}

# Цвет подписи один на всю схему и задан темой — в Penpot он выставляется
# из builder-а, поэтому в min-файле не нужен.
LABEL_DROP = {"fill"}


def num(v):
    return round(v) if isinstance(v, float) else v


def path(d):
    return re.sub(r"-?\d+\.\d+", lambda m: str(round(float(m.group()))), d)


def label(l):
    out = {}
    for k, v in l.items():
        if k in LABEL_DROP:
            continue
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
