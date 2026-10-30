"""Расписание групп — чистая часть движка ✳ (30.10.2026, решение владельца
продукта; ТЗ §4.5–4.6, ENGINE.md R3). Без базы: круги внутри группы и раскладка
матчей по времени, столам и судьям стола.

Проверяется то, что сломается при поломке: каждая пара ровно один раз, в круге
игрок играет не больше одного матча, в слоте никто — ни игрок, ни судья — не
занят дважды, столов и судей в слоте не больше, чем есть, нагрузка судей
ровная, время идёт шагом матча и переносится на следующий день."""
import datetime
import itertools

import pytest

from tournaments.schedule import assign_slots, play_slots, round_robin_rounds, snake_split


@pytest.mark.parametrize("n", [2, 3, 4, 5, 6, 7])
def test_круговая_каждая_пара_ровно_раз_и_в_круге_игрок_один_раз(n):
    players = list(range(n))
    rounds = round_robin_rounds(players)
    pairs = [frozenset(p) for r in rounds for p in r]
    assert len(pairs) == n * (n - 1) // 2
    assert set(pairs) == {frozenset(p) for p in itertools.combinations(players, 2)}
    for r in rounds:
        flat = [x for p in r for x in p]
        assert len(flat) == len(set(flat))
    # Кругов — n−1 у чётного, n у нечётного (каждый раз кто-то отдыхает).
    assert len(rounds) == (n - 1 if n % 2 == 0 else n)


def test_змейка_разводит_сильных_по_группам():
    assert snake_split(list(range(1, 17)), 4) == [
        [1, 8, 9, 16],
        [2, 7, 10, 15],
        [3, 6, 11, 14],
        [4, 5, 12, 13],
    ]


def матчи(n_groups=2, size=4):
    """Матчи двух групп по четыре — по кругам, как их отдаёт движок."""
    out = []
    for g in range(n_groups):
        players = [f"{g}-{i}" for i in range(size)]
        for r, rnd in enumerate(round_robin_rounds(players)):
            for a, b in rnd:
                out.append((f"{g}:{a}:{b}", a, b, r))
    return out


def test_в_слоте_никто_не_занят_дважды_и_столов_не_больше():
    ms = матчи()
    res = assign_slots([(k, a, b) for k, a, b, _ in ms], tables=3, referees=["R1", "R2", "R3", "R4"])
    assert {k for k, *_ in res} == {k for k, *_ in ms}  # разложены все
    by_slot = {}
    for key, slot, table, ref in res:
        by_slot.setdefault(slot, []).append((key, table, ref))
    players = {k: (a, b) for k, a, b, _ in ms}
    for slot, items in by_slot.items():
        assert len(items) <= 3
        assert len({t for _, t, _ in items}) == len(items)  # столы разные
        assert all(1 <= t <= 3 for _, t, _ in items)
        assert len({r for *_, r in items}) == len(items)  # судьи разные
        busy = [p for k, *_ in items for p in players[k]]
        assert len(busy) == len(set(busy))  # игрок — в одном матче слота


def test_судей_меньше_столов_матчей_в_слоте_не_больше_судей():
    ms = матчи()
    res = assign_slots([(k, a, b) for k, a, b, _ in ms], tables=4, referees=["R1", "R2"])
    per_slot = {}
    for _, slot, _, _ in res:
        per_slot[slot] = per_slot.get(slot, 0) + 1
    assert max(per_slot.values()) <= 2


def test_нагрузка_судей_ровная():
    ms = матчи(n_groups=3)
    refs = ["R1", "R2", "R3"]
    res = assign_slots([(k, a, b) for k, a, b, _ in ms], tables=3, referees=refs)
    load = [sum(1 for *_, r in res if r == ref) for ref in refs]
    assert max(load) - min(load) <= 1


def test_порядок_игрока_сохраняется():
    """Свои матчи игрок играет в том порядке, в каком их отдали (по кругам)."""
    ms = матчи()
    res = assign_slots([(k, a, b) for k, a, b, _ in ms], tables=2, referees=["R1", "R2"])
    slot_of = {k: s for k, s, *_ in res}
    for p in {x for _, a, b, _ in ms for x in (a, b)}:
        mine = [k for k, a, b, _ in ms if p in (a, b)]
        assert [slot_of[k] for k in mine] == sorted(slot_of[k] for k in mine)


def test_без_судей_стола_разложить_нельзя():
    with pytest.raises(ValueError):
        assign_slots([("m", "a", "b")], tables=2, referees=[])


def _день(d, start, end):
    return (datetime.date(2026, 11, d), datetime.time(*start), datetime.time(*end))


def test_слоты_идут_шагом_матча_по_дням_у_каждого_дня_свои_часы():
    """Игровые дни задаёт главный судья: дата и часы у каждого свои. Матчи
    заполняют дни по порядку, шагом матча от начала дня."""
    дни = [_день(14, (10, 0), (11, 30)), _день(15, (15, 0), (16, 0))]  # три слота и два
    слоты = play_slots(дни, 30, 5)
    assert [(s.day, s.hour, s.minute) for s in слоты] == [
        (14, 10, 0), (14, 10, 30), (14, 11, 0), (15, 15, 0), (15, 15, 30),
    ]


def test_дни_по_порядку_даты_а_не_ввода():
    дни = [_день(16, (10, 0), (10, 30)), _день(14, (12, 0), (12, 30))]
    assert [s.day for s in play_slots(дни, 30, 2)] == [14, 16]


def test_не_поместились_в_дни_отбивается_с_числами():
    with pytest.raises(ValueError, match="нужно 4, есть 3"):
        play_slots([_день(14, (10, 0), (11, 30))], 30, 4)


def test_день_короче_матча_и_день_дважды_отбиваются():
    with pytest.raises(ValueError, match="14.11"):
        play_slots([_день(14, (10, 0), (10, 20))], 30, 1)
    with pytest.raises(ValueError, match="дважды"):
        play_slots([_день(14, (10, 0), (12, 0)), _день(14, (13, 0), (15, 0))], 30, 1)
    with pytest.raises(ValueError):
        play_slots([], 30, 1)


def test_судья_не_судит_в_слоте_где_играет_сам():
    """Один человек бывает и игроком, и судьёй стола (так собрали состав): в
    слоте, где он играет, он не судит — ни свой матч, ни чужой."""
    ms = матчи()
    играет = ms[0][1]  # игрок первого матча — он же судья
    res = assign_slots([(k, a, b) for k, a, b, _ in ms], tables=2, referees=[играет, "R2", "R3"])
    players = {k: (a, b) for k, a, b, _ in ms}
    by_slot = {}
    for key, slot, _, ref in res:
        by_slot.setdefault(slot, []).append((key, ref))
    for items in by_slot.values():
        busy = {p for k, _ in items for p in players[k]}
        assert all(ref not in busy for _, ref in items)
    assert {k for k, *_ in res} == {k for k, *_ in ms}
