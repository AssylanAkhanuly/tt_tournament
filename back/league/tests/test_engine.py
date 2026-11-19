"""Движок Евразийской лиги ✳ (19.11.2026, ТЗ §4.10; LEAGUE.md) — чистая
арифметика без базы, по TDD.

Правила — допущения ТЗ §4.10 (система Свейтлинга): трое на трое, личные
встречи A–X, B–Y, C–Z, A–Y, B–X, командная встреча — до трёх побед, личная —
до трёх партий. Очки в таблицу: победа 2, поражение 1, неявка 0 и
техническое 0 : 3. Тай-брейки: очки → личная встреча команд → разница личных
встреч → разница партий.

Проверяется то, что сломается при поломке: встреча кончается на третьей
победе и не принимает лишних личных встреч, счёт личной встречи проверяется по
«до трёх», таблица ставит выше победителя личной встречи при равных очках, а
неявка даёт 0 очков и 0 : 3."""
import pytest

from league import engine
from league.engine import Rules, RubberError

RULES = Rules()


# ── Порядок личных встреч ──────────────────────────────────────────────────


def test_swaythling_order_by_default():
    assert engine.rubber_order(RULES) == [(0, 0), (1, 1), (2, 2), (0, 1), (1, 0)]


def test_order_is_a_setting():
    rules = Rules(order="A-X,B-Y")
    assert engine.rubber_order(rules) == [(0, 0), (1, 1)]


# ── Счёт командной встречи ─────────────────────────────────────────────────


def test_match_ends_on_third_win():
    result = engine.team_match_result([(3, 1), (3, 0), (3, 2)], RULES)
    assert (result.rubbers_a, result.rubbers_b, result.winner, result.finished) == (3, 0, "a", True)


def test_match_goes_to_fifth_rubber():
    result = engine.team_match_result([(3, 1), (0, 3), (3, 2), (1, 3), (3, 0)], RULES)
    assert (result.rubbers_a, result.rubbers_b, result.winner) == (3, 2, "a")
    assert (result.games_a, result.games_b) == (10, 9)


def test_unfinished_match_has_no_winner():
    result = engine.team_match_result([(3, 1), (0, 3)], RULES)
    assert (result.finished, result.winner) == (False, None)


def test_rubber_after_decision_is_refused():
    with pytest.raises(RubberError):
        engine.team_match_result([(3, 0), (3, 0), (3, 0), (0, 3)], RULES)


@pytest.mark.parametrize("score", [(3, 3), (2, 1), (4, 0), (3, -1)])
def test_rubber_score_must_be_won_to_three(score):
    with pytest.raises(RubberError):
        engine.team_match_result([score], RULES)


def test_no_show_is_technical_zero_three():
    result = engine.no_show_result(absent="b", rules=RULES)
    assert (result.rubbers_a, result.rubbers_b, result.winner, result.no_show) == (3, 0, "a", "b")


# ── Таблица дивизиона ──────────────────────────────────────────────────────


def match(a, b, rubbers, no_show=None):
    return engine.PlayedMatch(team_a=a, team_b=b, rubbers=rubbers, no_show=no_show)


def test_points_win_two_loss_one_no_show_zero():
    rows = engine.standings(
        ["A", "B", "C"],
        [
            match("A", "B", [(3, 0), (3, 0), (3, 0)]),
            match("C", "A", [], no_show="b"),  # A (сторона b) не явился — C победил технически
        ],
        RULES,
    )
    by = {r.team: r for r in rows}
    assert (by["A"].points, by["B"].points, by["C"].points) == (2 + 0, 1, 2)
    assert (by["A"].won, by["A"].lost, by["A"].no_shows) == (1, 1, 1)
    assert (by["C"].rubbers_for, by["C"].rubbers_against) == (3, 0)


def test_head_to_head_breaks_equal_points():
    # A и B по 3 очка; A выиграл у B — A выше, хотя по разнице встреч B лучше.
    rows = engine.standings(
        ["A", "B", "C"],
        [
            match("A", "B", [(3, 2), (2, 3), (3, 2), (2, 3), (3, 2)]),  # A 3:2 B
            match("B", "C", [(3, 0), (3, 0), (3, 0)]),                  # B 3:0 C
            match("C", "A", [(3, 0), (3, 0), (3, 0)]),                  # C 3:0 A
        ],
        RULES,
    )
    order = [r.team for r in rows]
    by = {r.team: r for r in rows}
    assert by["A"].points == by["B"].points == by["C"].points == 3
    # Все трое равны по очкам, и в мини-таблице тоже по очку у каждого — решает разница встреч.
    assert order == ["B", "C", "A"]
    assert [r.place for r in rows] == [1, 2, 3]


def test_head_to_head_between_two_tied_teams():
    rows = engine.standings(
        ["A", "B", "C", "D"],
        [
            match("A", "B", [(3, 2), (2, 3), (3, 2), (2, 3), (3, 2)]),  # A beat B narrowly
            match("B", "C", [(3, 0), (3, 0), (3, 0)]),
            match("A", "D", [(0, 3), (0, 3), (0, 3)]),                  # A lost to D
        ],
        RULES,
    )
    by = {r.team: r for r in rows}
    assert by["A"].points == by["B"].points == 3
    # По разнице встреч B лучше (+2 против −2), но A выиграл личную встречу.
    order = [r.team for r in rows]
    assert order.index("A") < order.index("B")


def test_rubber_then_games_difference():
    rows = engine.standings(
        ["A", "B"],
        [
            match("A", "B", [(3, 0), (0, 3), (3, 0), (0, 3), (3, 1)]),
            match("B", "A", [(3, 0), (0, 3), (3, 0), (0, 3), (3, 2)]),
        ],
        RULES,
    )
    # Очки 3:3, личные встречи 1:1, встречи 5:5 — решают партии: A 17:16.
    assert [r.team for r in rows] == ["A", "B"]


def test_unfinished_matches_do_not_count():
    rows = engine.standings(["A", "B"], [match("A", "B", [(3, 0)])], RULES)
    assert all(r.played == 0 and r.points == 0 for r in rows)


# ── Переходы между лигами ──────────────────────────────────────────────────


def test_two_up_two_down():
    table = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"]
    up, down = engine.movements(table, RULES, top_division=False, bottom_division=False)
    assert (up, down) == (["T1", "T2"], ["T7", "T8"])


def test_no_promotion_from_top_no_relegation_from_bottom():
    table = ["T1", "T2", "T3", "T4"]
    assert engine.movements(table, RULES, top_division=True, bottom_division=False) == ([], ["T3", "T4"])
    assert engine.movements(table, RULES, top_division=False, bottom_division=True) == (["T1", "T2"], [])
