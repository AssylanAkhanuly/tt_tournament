"""Посев плей-офф из групп — чистая часть, без базы (TDD).

Сколько выходит из группы — открытый вопрос федерации (QUESTIONS 10.2); по
умолчанию двое, значение наше. Правила посева — ENGINE.md, «Группы + плей-офф».
"""
import itertools

import pytest

from tournaments.playoff import meet_round, playoff_draw

ГРУППЫ = "ABCDEFGH"


def пары(slots):
    """Матчи первого круга: (верх, низ) с именами «A1», «D2»; пусто — None."""
    name = lambda s: None if s is None else ГРУППЫ[s[0]] + str(s[1])  # noqa: E731
    return [(name(slots[i]), name(slots[i + 1])) for i in range(0, len(slots), 2)]


def test_четыре_группы_по_двое_перекрёстно():
    """Победители — сеяные 1–4, вторые места — в противоположной половине от
    своей группы и против чужого победителя."""
    assert пары(playoff_draw([4, 4, 4, 4], advance=2)) == [
        ("A1", "D2"),
        ("C1", "B2"),
        ("D1", "A2"),
        ("B1", "C2"),
    ]


def test_две_группы_A1_против_B2():
    assert пары(playoff_draw([4, 4], advance=2)) == [("A1", "B2"), ("B1", "A2")]


def test_нечётное_число_групп_свободные_места_у_победителей():
    """Три группы по двое — 6 игроков в сетке на 8: пропуск круга достаётся
    победителям групп, а не вторым местам."""
    slots = playoff_draw([4, 4, 4], advance=2)
    assert len(slots) == 8
    for a, b in zip(slots[::2], slots[1::2]):
        if a is None or b is None:
            assert (a or b)[1] == 1


def test_из_малой_группы_выходит_сколько_есть():
    slots = playoff_draw([4, 1], advance=2)
    assert sorted(s for s in slots if s) == [(0, 1), (0, 2), (1, 1)]


@pytest.mark.parametrize("groups, advance", itertools.product(range(2, 9), (1, 2, 3)))
def test_инварианты_посева(groups, advance):
    slots = playoff_draw([4] * groups, advance=advance)
    players = [s for s in slots if s]
    # Каждый вышедший — ровно один раз; сетка — степень двойки.
    assert sorted(players) == sorted((g, p) for g in range(groups) for p in range(1, advance + 1))
    assert len(slots) & (len(slots) - 1) == 0
    # В первом круге игроки одной группы не встречаются.
    for a, b in zip(slots[::2], slots[1::2]):
        if a and b:
            assert a[0] != b[0], (a, b)
    # Двое из группы — в разных половинах: встречаются только в финале.
    if advance == 2:
        half = len(slots) // 2
        for g in range(groups):
            first, second = (slots.index((g, 1)), slots.index((g, 2)))
            assert (first < half) != (second < half), (g, slots)


def test_встреча_в_круге():
    assert meet_round(0, 1) == 1  # соседи — первый круг
    assert meet_round(0, 3) == 2
    assert meet_round(0, 7) == 3  # разные половины сетки на 8 — финал


def test_пустой_посев_отбивается():
    with pytest.raises(ValueError):
        playoff_draw([], advance=2)
    with pytest.raises(ValueError):
        playoff_draw([1], advance=2)  # один игрок — сетки нет
