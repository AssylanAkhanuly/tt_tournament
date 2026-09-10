"""Движок Национального рейтинга спортсменов РК.

Правила — Положение о формировании и ведении Национального рейтинга (проект
28.08.2026), разделы 6–20. Оригинал и разбор: docs/refs/
polozhenie-reyting-igrokov-2026-08-28.*

Слой чистый: ни моделей, ни базы, ни запросов. Сервис (`services.py`) достаёт
данные и складывает результат, движок только считает. Значит замена методики —
это замена одного файла, а не правка сохранения и экранов.

Порт TS-ядра (`front/src/entities/rating`) один в один, включая округление:
пока обе реализации живы, они обязаны давать одинаковое число до второго знака.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field, replace as _replace
from datetime import date
from typing import Dict, List, Optional, Sequence, Tuple

# ── Округление ──────────────────────────────────────────────────────

# JS-совместимое округление до двух знаков (п. 6.4, 17.5).
#
# Половина уходит ОТ нуля в обе стороны: падение и рост обязаны считаться
# одинаково (п. 12.3), а `round()` в Python округляет половину к чётному.
# Decimal тут не годится: `Decimal('0.345')` даёт 0,35, а двоичное 0.345 на
# самом деле чуть меньше — TS-ядро округляет его в 0,34. Пока обе реализации
# живы, расхождение в один сотый разъедет числа, поэтому арифметика та же:
# floor(|x| * 100 + EPSILON + 0.5).
_EPSILON = 2.220446049250313e-16


def round2(x: float) -> float:
    sign = -1.0 if x < 0 else 1.0
    return sign * math.floor(abs(float(x)) * 100 + _EPSILON + 0.5) / 100


# ── Уровни соревнований (таблица п. 13) ─────────────────────────────

LEVEL_TOP = "top"
LEVEL_REPUBLIC = "republic"
LEVEL_REGION = "region"
LEVEL_AMATEUR = "amateur"

LEVELS = (LEVEL_TOP, LEVEL_REPUBLIC, LEVEL_REGION, LEVEL_AMATEUR)

LEVEL_LABELS = {
    LEVEL_TOP: "Чемпионат и кубок РК, спартакиада, молодёжные игры, ТОП-12",
    LEVEL_REPUBLIC: "Чемпионаты РК по возрастам, ЕЛНТ, республиканские",
    LEVEL_REGION: "Областные и городские",
    LEVEL_AMATEUR: "Любительские турниры",
}

DEFAULT_LEVEL_C = {
    LEVEL_TOP: 1.2,
    LEVEL_REPUBLIC: 1.0,
    LEVEL_REGION: 0.8,
    LEVEL_AMATEUR: 0.6,
}

# Происхождение стартового значения. Переходный период (п. 11.2) положен только
# тому, кто вошёл с 1,00, — отсюда и различение.
ORIGIN_NEW = "new"
ORIGIN_LEGACY = "legacy"
ORIGIN_ITTF = "ittf"

# Как применяется коэффициент места: п. 9.2 ставит P внутрь формулы матча,
# п. 10.6 — после итога турнира. Расхождение читается двояко (QUESTIONS 5.8).
PRIZE_MATCH = "match"
PRIZE_TOURNAMENT = "tournament"
PRIZE_NONE = "none"

# От какого значения считаются матчи одного турнира (QUESTIONS 5.10).
BASELINE_SEQUENTIAL = "sequential"
BASELINE_PRE_TOURNAMENT = "pre_tournament"


@dataclass(frozen=True)
class Params:
    """Коэффициенты расчёта.

    Шесть из них в Положении названы, но не заданы (D, оба K, потолок, Rmax и k
    перевода из ITTF) — значения ниже наши, подбираются калибровкой и вводятся
    федерацией через настройки. Что из документа, а что нет — в PARAM_SOURCES.
    """

    d: float = 15.0
    k_standard: float = 0.6
    k_transition: float = 3.0
    transition_matches: int = 20
    max_delta: float = 1.0
    cap_in_transition: bool = False
    level_c: Dict[str, float] = field(default_factory=lambda: dict(DEFAULT_LEVEL_C))
    prize_p: Dict[int, float] = field(default_factory=lambda: {1: 1.2, 2: 1.15, 3: 1.1})
    prize_mode: str = PRIZE_MATCH
    baseline: str = BASELINE_SEQUENTIAL
    min_rating: float = 0.0
    ittf_r_max: float = 90.0
    ittf_k: float = 10.0

    def replace(self, **over) -> "Params":
        return _replace(self, **over)

    def c_for(self, level: str) -> float:
        return self.level_c.get(level, 1.0)


DEFAULT_PARAMS = Params()

#: Происхождение каждого числа: True — задано Положением, False — наше
#: допущение, требующее решения федерации. Экран обязан это показывать.
PARAM_SOURCES = {
    "d": (False, "п. 9.4"),
    "k_standard": (False, "п. 11.4"),
    "k_transition": (False, "п. 11.2"),
    "transition_matches": (True, "п. 11.2–11.3"),
    "max_delta": (False, "п. 12.1"),
    "cap_in_transition": (False, "п. 12.1 + п. 11.2"),
    "level_c": (True, "п. 13"),
    "prize_p": (True, "п. 10.3"),
    "prize_mode": (False, "п. 9.2 против п. 10.6"),
    "baseline": (False, "п. 8.1–8.2 против п. 20"),
    "min_rating": (True, "п. 15.15"),
    "ittf_r_max": (False, "п. 17.4"),
    "ittf_k": (False, "п. 17.4"),
}


# ── Основная формула (п. 9) ─────────────────────────────────────────


def expected_score(rating: float, opponent: float, d: float) -> float:
    """E = 1 / (1 + 10^((Rсоперника − Rспортсмена) / D)) — п. 9.3."""
    return 1.0 / (1.0 + math.pow(10.0, (opponent - rating) / d))


def match_delta(
    rating: float,
    opponent: float,
    won: bool,
    d: float,
    k: float,
    c: float,
    p: float,
    max_delta: float,
) -> float:
    """Изменение рейтинга за матч: P × K × C × (S − E) — п. 9.2.

    `max_delta` = 0 означает «без потолка»: величины ограничения в Положении
    нет (п. 12.1), и ноль честнее выдуманного числа.
    """
    s = 1.0 if won else 0.0
    raw = p * k * c * (s - expected_score(rating, opponent, d))
    if not max_delta:
        return raw
    # п. 12.3: ограничение действует одинаково на рост и на падение.
    sign = -1.0 if raw < 0 else 1.0
    return sign * min(abs(raw), max_delta)


# ── Коэффициент за призовое место (п. 10) ───────────────────────────


def prize_factor(
    place: Optional[int], params: Params, no_third_place_match: bool = False
) -> float:
    """п. 10.3–10.5; без матча за 3-е место бронзовых двое (п. 10.4)."""
    if not place:
        return 1.0
    if no_third_place_match and place == 4:
        return params.prize_p.get(3, 1.0)
    return params.prize_p.get(place, 1.0)


# ── Стартовые значения (п. 6.1, 6.3, 17) ────────────────────────────


def new_player_rating() -> float:
    """п. 6.1: спортсмену без подтверждённой рейтинговой истории — 1,00."""
    return 1.0


def from_legacy_rating(legacy: float) -> float:
    """п. 6.3: прежнее значение переносится один к одному, без коэффициентов."""
    return round2(legacy)


def from_ittf_position(position: int, r_max: float, k: float) -> float:
    """п. 17.4: R = Rmax − k × ln(N), два знака (п. 17.5), не ниже 1,00 (п. 17.6)."""
    if not position or position < 1:
        return 1.0
    return max(1.0, round2(r_max - k * math.log(position)))


def start_rating(player: "LabPlayer", params: Params) -> float:
    if player.origin == ORIGIN_NEW:
        return new_player_rating()
    if player.origin == ORIGIN_ITTF:
        return from_ittf_position(player.ittf_position or 0, params.ittf_r_max, params.ittf_k)
    return from_legacy_rating(player.start)


# ── Неявка (п. 15.4–15.6, 15.15) ────────────────────────────────────


def no_show_penalty(occurrence: int) -> float:
    """Первая неявка −0,20, повторная −0,30, каждая последующая −0,50."""
    if occurrence <= 0:
        return 0.0
    if occurrence == 1:
        return 0.2
    if occurrence == 2:
        return 0.3
    return 0.5


def apply_no_show(rating: float, occurrence: int, min_rating: float = 0.0) -> float:
    """п. 15.15: рейтинговое значение не может быть отрицательным."""
    return max(min_rating, round2(rating - no_show_penalty(occurrence)))


# ── Неактивность (п. 18) и возрастная выборка (п. 7.4) ──────────────

STATUS_NO_MATCHES = "no_matches"
STATUS_ACTIVE = "active"
STATUS_INACTIVE = "inactive"
STATUS_VOID = "void"


@dataclass(frozen=True)
class Activity:
    status: str
    months: int
    rating_kept: bool


def _months_between(start: date, end: date) -> int:
    months = (end.year - start.year) * 12 + (end.month - start.month)
    return months - 1 if end.day < start.day else months


def activity_status(last_match: Optional[date], now: Optional[date] = None) -> Activity:
    """п. 18.1 — 24 месяца без матчей дают «неактивен», рейтинг сохраняется
    (п. 18.2) и возвращается при возобновлении в пределах 60 месяцев (п. 18.3).
    п. 18.4 — после 60 месяцев рейтинг аннулируется.

    ⚠ Границу «ровно 60 месяцев» Положение не разводит: п. 18.3 даёт право
    вернуться «в течение 60 месяцев», п. 18.4 обнуляет «в течение 60 месяцев»
    без матчей. Здесь ровно 60 — уже обнуление.
    """
    if last_match is None:
        return Activity(STATUS_NO_MATCHES, 0, True)
    now = now or date.today()
    months = _months_between(last_match, now)
    if months >= 60:
        return Activity(STATUS_VOID, months, False)
    if months >= 24:
        return Activity(STATUS_INACTIVE, months, True)
    return Activity(STATUS_ACTIVE, months, True)


# ── Сроки апелляции (п. 21.2–21.3) ──────────────────────────────────

#: Подать апелляцию — 5 рабочих дней с официального опубликования (п. 21.2).
APPEAL_WORKING_DAYS = 5
#: Рассмотреть — 10 рабочих дней с получения (п. 21.3).
APPEAL_REVIEW_WORKING_DAYS = 10


def add_working_days(start: date, days: int) -> date:
    """День, в который истекают `days` рабочих дней, считая со следующего.

    ⚠ Рабочий день здесь — понедельник–пятница. Праздники РК не учитываются:
    календаря в Положении нет, и какой брать — решение федерации. Значение наше.
    """
    current = start
    left = days
    while left > 0:
        current = date.fromordinal(current.toordinal() + 1)
        if current.weekday() < 5:
            left -= 1
    return current


# Порог «Un = разница не больше n−1» взят по правилу ITTF: п. 7.4 задаёт только
# саму разность «год соревнования минус год рождения», границы ступеней в
# Положении не написаны. ⚠ Требует подтверждения федерации (QUESTIONS 5.12).
_AGE_STEPS = (("U11", 10), ("U13", 12), ("U15", 14), ("U17", 16), ("U19", 18), ("U21", 20))


def age_category(competition_year: int, birth_year: int) -> Optional[str]:
    diff = competition_year - birth_year
    for name, top in _AGE_STEPS:
        if diff <= top:
            return name
    return None


# ── Прогон серии турниров ───────────────────────────────────────────


@dataclass
class LabPlayer:
    id: str
    name: str
    origin: str
    start: float
    played: int = 0
    ittf_position: Optional[int] = None


@dataclass
class LabTournament:
    id: str
    name: str
    level: str = LEVEL_REPUBLIC
    places: Dict[str, int] = field(default_factory=dict)
    no_third_place_match: bool = False
    date: Optional[date] = None


@dataclass
class LabMatch:
    id: str
    tournament: str
    a: str
    b: str
    games: Tuple[int, int] = (3, 1)
    date: Optional[date] = None


@dataclass
class HistoryRow:
    """Строка рейтинговой истории — колонки таблицы п. 20 плюс слагаемые
    изменения: без них «прозрачность» п. 4.6 остаётся словом."""

    match_id: str
    tournament: str
    tournament_name: str
    player: str
    player_name: str
    opponent: str
    opponent_name: str
    score: str
    won: bool
    before: float
    delta: float
    after: float
    expected: float
    k: float
    c: float
    p: float
    capped: bool
    transition: bool
    date: Optional[date] = None


@dataclass
class Standing:
    id: str
    name: str
    origin: str
    start: float
    rating: float
    delta: float
    matches: int
    wins: int
    losses: int
    transition_left: int
    prize_bonus: float


@dataclass
class RunResult:
    history: List[HistoryRow]
    table: List[Standing]
    #: Сколько баллов шкала создала из ниоткуда. У строгой модели Эло сумма не
    #: меняется; здесь меняется — у сторон разный K (п. 11), а P > 1 добавляет
    #: призёрам (п. 10). Показатель инфляции шкалы.
    injected: float
    skipped: List[Dict[str, str]]


class _State:
    __slots__ = ("player", "rating", "played", "wins", "losses", "matches", "in_tournament")

    def __init__(self, player: LabPlayer, rating: float) -> None:
        self.player = player
        self.rating = rating
        self.played = player.played or 0
        self.wins = 0
        self.losses = 0
        self.matches = 0
        self.in_tournament = 0.0


def run_series(
    players: Sequence[LabPlayer],
    tournaments: Sequence[LabTournament],
    matches: Sequence[LabMatch],
    params: Params,
) -> RunResult:
    """Превращает список спортсменов и матчей в рейтинговую историю и таблицу."""
    # Стартом берётся `player.start` как есть — это ТЕКУЩЕЕ значение игрока.
    # Выводить его из происхождения здесь нельзя: у действующего спортсмена с
    # origin = «новый» и рейтингом 12,50 это обнуляло бы его до 1,00 на каждом
    # турнире. `start_rating()` нужен один раз — при заведении карточки.
    state: Dict[str, _State] = {p.id: _State(p, round2(p.start)) for p in players}
    history: List[HistoryRow] = []
    skipped: List[Dict[str, str]] = []
    bonus: Dict[str, float] = {}

    by_tournament: Dict[str, List[LabMatch]] = {}
    tournaments_by_id = {t.id: t for t in tournaments}
    for m in matches:
        if m.tournament not in tournaments_by_id:
            skipped.append({"match_id": m.id, "reason": "соревнование не найдено"})
            continue
        if m.a not in state or m.b not in state:
            skipped.append({"match_id": m.id, "reason": "участника нет в списке спортсменов"})
            continue
        if m.a == m.b:
            skipped.append({"match_id": m.id, "reason": "соперник совпадает со спортсменом"})
            continue
        if m.games[0] == m.games[1]:
            skipped.append({"match_id": m.id, "reason": "ничейный счёт — победитель не определён"})
            continue
        by_tournament.setdefault(m.tournament, []).append(m)

    for t in tournaments:
        rows = by_tournament.get(t.id)
        if not rows:
            continue

        c = params.c_for(t.level)
        # Рейтинги на начало турнира — база режима «от рейтинга до турнира».
        opening = {pid: s.rating for pid, s in state.items()}
        for s in state.values():
            s.in_tournament = 0.0

        def base(pid: str) -> float:
            if params.baseline == BASELINE_PRE_TOURNAMENT:
                return opening[pid]
            return state[pid].rating

        for m in rows:
            a_won = m.games[0] > m.games[1]
            score = "%d:%d" % (m.games[0], m.games[1])

            def side(pid: str, other_id: str, won: bool) -> HistoryRow:
                s = state[pid]
                before = base(pid)
                opponent = base(other_id)

                # п. 11.2: переходный период — только у стартовавшего с 1,00.
                transition = (
                    s.player.origin == ORIGIN_NEW and s.played < params.transition_matches
                )
                k = params.k_transition if transition else params.k_standard
                p = (
                    prize_factor(t.places.get(pid), params, t.no_third_place_match)
                    if params.prize_mode == PRIZE_MATCH
                    else 1.0
                )
                # Потолок действует на матч; переходный период режем по настройке.
                cap = (
                    0.0
                    if (not params.max_delta or (transition and not params.cap_in_transition))
                    else params.max_delta
                )

                raw = match_delta(
                    rating=before, opponent=opponent, won=won,
                    d=params.d, k=k, c=c, p=p, max_delta=0.0,
                )
                capped = bool(cap) and abs(raw) > cap
                delta = round2((-cap if raw < 0 else cap) if capped else raw)
                after = round2(before + delta)
                if after < params.min_rating:
                    after = params.min_rating
                    delta = round2(after - before)

                return HistoryRow(
                    match_id=m.id,
                    tournament=t.id,
                    tournament_name=t.name,
                    player=pid,
                    player_name=s.player.name,
                    opponent=other_id,
                    opponent_name=state[other_id].player.name,
                    score=score if pid == m.a else "%d:%d" % (m.games[1], m.games[0]),
                    won=won,
                    before=before,
                    delta=delta,
                    after=after,
                    expected=expected_score(before, opponent, params.d),
                    k=k,
                    c=c,
                    p=p,
                    capped=capped,
                    transition=transition,
                    date=m.date or t.date,
                )

            # Обе строки считаются от одного среза состояния: иначе второй игрок
            # увидел бы соперника уже изменившимся этим же матчем.
            row_a = side(m.a, m.b, a_won)
            row_b = side(m.b, m.a, not a_won)

            for row in (row_a, row_b):
                s = state[row.player]
                if params.baseline == BASELINE_PRE_TOURNAMENT:
                    s.rating = round2(s.rating + row.delta)
                else:
                    s.rating = row.after
                s.in_tournament = round2(s.in_tournament + row.delta)
                s.played += 1
                s.matches += 1
                if row.won:
                    s.wins += 1
                else:
                    s.losses += 1
                history.append(row)

        # п. 10.6 во втором прочтении: P множит итог турнира, а не каждый матч.
        if params.prize_mode == PRIZE_TOURNAMENT:
            for pid, s in state.items():
                p = prize_factor(t.places.get(pid), params, t.no_third_place_match)
                if p == 1.0 or not s.in_tournament:
                    continue
                add = round2(s.in_tournament * (p - 1.0))
                s.rating = max(params.min_rating, round2(s.rating + add))
                bonus[pid] = round2(bonus.get(pid, 0.0) + add)

        for s in state.values():
            s.rating = max(params.min_rating, round2(s.rating))

    table: List[Standing] = []
    for p in players:
        s = state[p.id]
        start = round2(p.start)
        table.append(
            Standing(
                id=p.id,
                name=p.name,
                origin=p.origin,
                start=start,
                rating=s.rating,
                delta=round2(s.rating - start),
                matches=s.matches,
                wins=s.wins,
                losses=s.losses,
                transition_left=(
                    max(0, params.transition_matches - s.played) if p.origin == ORIGIN_NEW else 0
                ),
                prize_bonus=bonus.get(p.id, 0.0),
            )
        )

    injected = round2(sum(r.delta for r in table))
    return RunResult(history=history, table=table, injected=injected, skipped=skipped)
