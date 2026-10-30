"""Плей-офф по итогам групп — карта сетки ✳ (30.10.2026, решение владельца
продукта: видеть сетку турнира «группы + плей-офф» до её начала).

Чистая часть — посев (`playoff_draw`): кто из групп в какой позиции сетки.
С базой — `playoff_preview`: позиции, заполненные игроками закончивших группу,
у незакончивших — метки «A1», «B2». Сетка — только карта: матчей плей-офф в
базе она не заводит (это делает `bracket.generate_playoff_from_groups`).

Сколько выходит из группы — открытый вопрос федерации (QUESTIONS 10.2); двое —
наше значение по умолчанию (`ADVANCE`). Правила посева — ENGINE.md.
"""
from __future__ import annotations

from typing import Optional, Sequence

from .bracket import standard_seed_order

# Выходят из группы — наше значение, подлежит утверждению (QUESTIONS 10.2).
ADVANCE = 2


def meet_round(p: int, q: int) -> int:
    """В каком круге (1 — первый) встретятся позиции `p` и `q` сетки, если
    оба будут выигрывать."""
    return (p ^ q).bit_length()


def _outside_in(n: int) -> list:
    """[0, 1, 2, 3] → [0, 3, 1, 2]: победители A и B — в разных концах сетки
    (как у `bracket.generate_playoff_from_groups`)."""
    out, lo, hi = [], 0, n - 1
    while lo <= hi:
        out.append(lo)
        if lo != hi:
            out.append(hi)
        lo, hi = lo + 1, hi - 1
    return out


def playoff_draw(group_sizes: Sequence[int], advance: int = ADVANCE) -> list:
    """Позиции сетки сверху вниз: `(группа, место)` или `None` — пропуск круга.

    - Победители групп — сеяные 1…k (группы «снаружи внутрь»: A, последняя, B…).
    - Остальные места — по очереди мест, каждый — в свободную позицию, где он
      встретится с игроками своей группы **как можно позже**; при равенстве —
      в позицию слабейшего посева (против сильнейшего победителя).
    - Пропуски круга — у старших посевов, то есть у победителей групп.
    """
    entrants = [(g, p) for p in range(1, advance + 1) for g in range(len(group_sizes)) if group_sizes[g] >= p]
    if len(entrants) < 2:
        raise ValueError("Для сетки нужно хотя бы два вышедших из групп.")
    size = 2
    while size < len(entrants):
        size *= 2
    order = standard_seed_order(size)  # позиция → номер посева
    pos_of_seed = {seed: pos for pos, seed in enumerate(order)}
    slots: list[Optional[tuple]] = [None] * size

    groups = [g for g in _outside_in(len(group_sizes)) if group_sizes[g] >= 1]
    for seed, g in enumerate(groups, start=1):
        slots[pos_of_seed[seed]] = (g, 1)
    # Настоящие позиции — посевы до числа вышедших; дальше — пропуски круга.
    real = {pos_of_seed[s] for s in range(1, len(entrants) + 1)}
    for place in range(2, advance + 1):
        for g in groups:
            if group_sizes[g] < place:
                continue
            mates = [pos for pos, s in enumerate(slots) if s and s[0] == g]
            free = [pos for pos in real if slots[pos] is None]
            best = max(free, key=lambda pos: (min(meet_round(pos, m) for m in mates), order[pos]))
            slots[best] = (g, place)
    return slots


# ── С базой ───────────────────────────────────────────────────────────────


def rank_key(m):
    """Порядок мест в группе: очки, победы, разница партий, затем посев.
    Тай-брейка по личной встрече (ITTF) нет — ENGINE.md, открытый вопрос."""
    return (-m.points, -m.wins, -m.diff, m.seed)


def playoff_preview(groups, members, matches, person) -> dict:
    """Карта сетки плей-офф для `schedule.snapshot`: первый круг по посеву
    (`playoff_draw`), дальше — пустые матчи до финала. Игрок стоит в позиции,
    когда его группа сыграна целиком; до того — метка «A1». Пропуск круга
    сразу проводит игрока в следующий круг."""
    by_group = {g.id: sorted((m for m in members if m.group_id == g.id), key=rank_key) for g in groups}
    done = {
        g.id: bool(ms) and all(m.status == "finished" for m in ms)
        for g in groups
        for ms in [[m for m in matches if m.group_id == g.id]]
    }
    try:
        slots = playoff_draw([len(by_group[g.id]) for g in groups], ADVANCE)
    except ValueError:
        return {"advance": ADVANCE, "rounds": 0, "matches": []}

    def side(slot):
        if slot is None:
            return None
        g, place = groups[slot[0]], slot[1]
        player = by_group[g.id][place - 1].user if done[g.id] else None
        return {"label": f"{g.name}{place}", "player": person(player) if player else None}

    rounds = (len(slots) - 1).bit_length()
    sides = [side(s) for s in slots]
    out = []
    for r in range(rounds):
        nxt = [None] * (len(sides) // 2)
        for i in range(0, len(sides), 2):
            a, b = sides[i], sides[i + 1]
            out.append({"round": r, "slot": i // 2, "a": a, "b": b})
            # Пропуск круга (только в первом): соперника нет — игрок проходит дальше.
            if r == 0 and (a is None) != (b is None):
                nxt[i // 2] = a or b
        sides = nxt
    return {"advance": ADVANCE, "rounds": rounds, "matches": out}
