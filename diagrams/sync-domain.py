"""Вставляет доменную модель из domain.d2 внутрь PostgreSQL в architecture.d2.

Модель нужна в двух местах: отдельной схемой (её удобно читать саму по себе) и
внутри блока «Данные» системного дизайна, чтобы было видно, что именно лежит за
словом «данные». Держать две копии руками — гарантированно их разъехать,
поэтому источник один: domain.d2, а сюда он вклеивается.

    python diagrams/sync-domain.py

Скрипт вызывается из build.ps1 перед сборкой.
"""
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
MARK = "# DOMAIN-MODEL-HERE"
INDENT = "    "


def domain_body() -> str:
    """Таблицы из domain.d2 — БЕЗ связей между ними.

    Связи сюда не переносятся намеренно. Пробовал с ними: elk раскладывает
    вложенную ER-схему по логике внешней послойной, таблицы расползаются по
    всей ширине контейнера, а два десятка внешних ключей превращаются в
    паутину через всё полотно. Читать невозможно.

    Здесь показано, ЧТО лежит в базе; КАК таблицы связаны — на отдельной схеме
    доменной модели, которая под это и сделана.
    """
    src = (HERE / "domain.d2").read_text(encoding="utf-8")

    # отрезаем всё до конца блока classes — направление и классы у схемы свои
    head, _, rest = src.partition("classes: {")
    if not rest:
        sys.exit("domain.d2: не найден блок classes")
    depth, i = 1, 0
    while depth and i < len(rest):
        depth += (rest[i] == "{") - (rest[i] == "}")
        i += 1
    body = rest[i:].strip("\n")

    # выкидываем строки связей верхнего уровня: они начинаются без отступа и
    # содержат стрелку. Внутри таблиц стрелок нет, так что не заденем.
    kept = [ln for ln in body.split("\n")
            if not (ln and not ln.startswith(" ") and "->" in ln)]

    # схлопываем пустые хвосты, оставшиеся от вырезанных блоков связей
    out, blank = [], 0
    for ln in kept:
        blank = blank + 1 if not ln.strip() else 0
        if blank < 2:
            out.append(ln)

    return "\n".join(INDENT + ln if ln.strip() else ln for ln in out).rstrip()


def main() -> None:
    p = HERE / "architecture.d2"
    arch = p.read_text(encoding="utf-8")
    if MARK not in arch:
        sys.exit(f"architecture.d2: нет метки {MARK}")

    # метка либо голая, либо уже с ранее вставленным телом под ней
    pattern = re.compile(
        re.escape(MARK) + r".*?(?=\n  \}\n\})", re.DOTALL)
    body = domain_body()
    arch = pattern.sub(MARK + "\n" + body, arch, count=1)
    p.write_text(arch, encoding="utf-8")

    tables = len(re.findall(r"shape: sql_table", body))
    print(f"domain -> architecture: {tables} таблиц")


if __name__ == "__main__":
    main()
