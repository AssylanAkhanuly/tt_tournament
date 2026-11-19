"""Движок Евразийской лиги ✳ (19.11.2026, ТЗ §4.10; LEAGUE.md).

Чистая арифметика, без базы: порядок личных встреч, счёт командной встречи,
таблица дивизиона с тай-брейками, переходы между лигами. Все числа — в
`Rules`; их значения по умолчанию — допущения ТЗ §4.10 (международная
практика, система Свейтлинга), подлежат утверждению федерацией (QUESTIONS
11.1–11.4). В базе они живут в `models.LeagueRules`, сюда приходят готовыми.

Чего здесь нет: разницы **очков** (пятого тай-брейка ТЗ) — счёт по розыгрышам
внутри личной встречи лига не хранит, только партии; парных встреч.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Sequence, Tuple


class RubberError(ValueError):
    """Счёт командной встречи не сходится с правилами; текст — для человека."""


@dataclass(frozen=True)
class Rules:
    # Порядок личных встреч: A, B, C — игроки стороны «a», X, Y, Z — стороны «b».
    order: str = "A-X,B-Y,C-Z,A-Y,B-X"
    players: int = 3            # игроков от команды на встречу
    wins_needed: int = 3        # побед в личных встречах до победы во встрече
    games_to_win: int = 3       # партий до победы в личной встрече
    points_win: int = 2
    points_loss: int = 1
    points_no_show: int = 0
    promote: int = 2            # вверх по итогам сезона
    relegate: int = 2           # вниз по итогам сезона
    squad_max: int = 8          # состав на сезон


def rubber_order(rules: Rules) -> List[Tuple[int, int]]:
    """«A-X,B-Y» → [(0, 0), (1, 1)]: индексы игроков в расстановке сторон."""
    pairs = []
    for pair in rules.order.split(","):
        a, b = (x.strip().upper() for x in pair.split("-"))
        pairs.append((ord(a) - ord("A"), ord(b) - ord("X")))
    return pairs


@dataclass
class MatchResult:
    rubbers_a: int = 0
    rubbers_b: int = 0
    games_a: int = 0
    games_b: int = 0
    finished: bool = False
    winner: Optional[str] = None   # "a" | "b"
    no_show: Optional[str] = None  # кто не явился: "a" | "b"


def _check_rubber(score: Tuple[int, int], rules: Rules, n: int) -> None:
    a, b = score
    need = rules.games_to_win
    if a < 0 or b < 0 or max(a, b) != need or min(a, b) >= need:
        raise RubberError("Личная встреча №%d: счёт %d:%d — у победителя ровно %d партии." % (n, a, b, need))


def team_match_result(rubbers: Sequence[Tuple[int, int]], rules: Rules) -> MatchResult:
    """Счёт командной встречи по сыгранным личным встречам (по порядку).
    Встреча кончается на `wins_needed`-й победе — дальше личные встречи не
    играются и не принимаются."""
    order = rubber_order(rules)
    if len(rubbers) > len(order):
        raise RubberError("Личных встреч во встрече — не больше %d." % len(order))
    r = MatchResult()
    for n, score in enumerate(rubbers, start=1):
        if r.finished:
            raise RubberError("Встреча уже решена — личная встреча №%d лишняя." % n)
        _check_rubber(score, rules, n)
        a, b = score
        r.games_a += a
        r.games_b += b
        if a > b:
            r.rubbers_a += 1
        else:
            r.rubbers_b += 1
        if r.rubbers_a == rules.wins_needed or r.rubbers_b == rules.wins_needed:
            r.finished = True
            r.winner = "a" if r.rubbers_a > r.rubbers_b else "b"
    return r


def no_show_result(absent: str, rules: Rules) -> MatchResult:
    """Неявка — техническое поражение 0 : wins_needed (ТЗ §4.10: 0 : 3)."""
    win = rules.wins_needed
    winner = "b" if absent == "a" else "a"
    return MatchResult(
        rubbers_a=win if winner == "a" else 0,
        rubbers_b=win if winner == "b" else 0,
        finished=True,
        winner=winner,
        no_show=absent,
    )


@dataclass
class PlayedMatch:
    team_a: object
    team_b: object
    rubbers: Sequence[Tuple[int, int]] = ()
    no_show: Optional[str] = None


@dataclass
class Row:
    team: object
    played: int = 0
    won: int = 0
    lost: int = 0
    no_shows: int = 0
    points: int = 0
    rubbers_for: int = 0
    rubbers_against: int = 0
    games_for: int = 0
    games_against: int = 0
    place: int = 0

    @property
    def rubber_diff(self) -> int:
        return self.rubbers_for - self.rubbers_against

    @property
    def game_diff(self) -> int:
        return self.games_for - self.games_against


def _result(m: PlayedMatch, rules: Rules) -> MatchResult:
    return no_show_result(m.no_show, rules) if m.no_show else team_match_result(m.rubbers, rules)


def standings(teams: Iterable, matches: Iterable[PlayedMatch], rules: Rules) -> List[Row]:
    """Таблица дивизиона. Незавершённые встречи не считаются. Тай-брейки ТЗ
    §4.10 по порядку: очки → очки в личных встречах только между равными по
    очкам командами → разница личных встреч → разница партий; дальше — порядок
    заявки (стабильная сортировка)."""
    rows: Dict[object, Row] = {t: Row(team=t) for t in teams}
    finished: List[Tuple[PlayedMatch, MatchResult]] = []
    for m in matches:
        res = _result(m, rules)
        if not res.finished:
            continue
        finished.append((m, res))
        for side, team, other in (("a", m.team_a, m.team_b), ("b", m.team_b, m.team_a)):
            row = rows[team]
            row.played += 1
            won = res.winner == side
            row.won += won
            row.lost += not won
            absent = res.no_show == side
            row.no_shows += absent
            row.points += rules.points_win if won else (rules.points_no_show if absent else rules.points_loss)
            mine, theirs = (res.rubbers_a, res.rubbers_b) if side == "a" else (res.rubbers_b, res.rubbers_a)
            row.rubbers_for += mine
            row.rubbers_against += theirs
            gm, gt = (res.games_a, res.games_b) if side == "a" else (res.games_b, res.games_a)
            row.games_for += gm
            row.games_against += gt

    def head_to_head(group: List[Row]) -> Dict[object, int]:
        """Очки, набранные только во встречах внутри группы равных."""
        inside = {r.team for r in group}
        pts = {r.team: 0 for r in group}
        for m, res in finished:
            if m.team_a in inside and m.team_b in inside:
                for side, team in (("a", m.team_a), ("b", m.team_b)):
                    won = res.winner == side
                    absent = res.no_show == side
                    pts[team] += rules.points_win if won else (rules.points_no_show if absent else rules.points_loss)
        return pts

    ordered = list(rows.values())
    by_points: Dict[int, List[Row]] = {}
    for r in ordered:
        by_points.setdefault(r.points, []).append(r)
    h2h: Dict[object, int] = {}
    for group in by_points.values():
        h2h.update(head_to_head(group) if len(group) > 1 else {group[0].team: 0})
    ordered.sort(key=lambda r: (-r.points, -h2h[r.team], -r.rubber_diff, -r.game_diff))
    for place, r in enumerate(ordered, start=1):
        r.place = place
    return ordered


def movements(table: Sequence, rules: Rules, *, top_division: bool, bottom_division: bool):
    """Кто по итогам сезона идёт вверх и вниз (ТЗ §4.10: двое и двое). Из
    Суперлиги вверх некуда, из нижней лиги — вниз."""
    up = [] if top_division else list(table[: rules.promote])
    down = [] if bottom_division else list(table[len(table) - rules.relegate:]) if rules.relegate else []
    return up, down
