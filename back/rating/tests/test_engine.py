"""Спецификация движка Национального рейтинга.

Источник — Положение о формировании и ведении Национального рейтинга
спортсменов РК (проект 28.08.2026); оригинал и разбор:
docs/refs/polozhenie-reyting-igrokov-2026-08-28.*

Кейсы перенесены один в один из TS-ядра (front/src/entities/rating): пока обе
реализации живы, они обязаны давать одно и то же число, и общий набор кейсов —
единственный способ это удержать. Тесты написаны раньше кода: рейтинг в списке
того, что делается по TDD (TESTING.md).

Движок чистый — ни моделей, ни базы, поэтому доступ к БД тестам не нужен.
"""
from datetime import date

import pytest

from rating.engine import (
    DEFAULT_PARAMS,
    LabMatch,
    LabPlayer,
    LabTournament,
    Params,
    activity_status,
    age_category,
    apply_no_show,
    expected_score,
    from_ittf_position,
    from_legacy_rating,
    match_delta,
    new_player_rating,
    no_show_penalty,
    prize_factor,
    run_series,
)


def п(**over) -> Params:
    return DEFAULT_PARAMS.replace(**over)


# ── E — ожидаемый результат (п. 9.3) ────────────────────────────────


def test_равные_рейтинги_дают_половину():
    assert expected_score(20, 20, 15) == pytest.approx(0.5)


def test_сумма_ожиданий_по_обоим_игрокам_равна_единице():
    assert expected_score(40, 12, 15) + expected_score(12, 40, 15) == pytest.approx(1.0)


def test_разрыв_ровно_в_D_даёт_слабому_одну_одиннадцатую():
    assert expected_score(20, 35, 15) == pytest.approx(1 / 11)
    assert expected_score(35, 20, 15) == pytest.approx(10 / 11)


def test_чем_сильнее_соперник_тем_ниже_ожидание():
    assert expected_score(30, 20, 15) > expected_score(30, 30, 15) > expected_score(30, 45, 15)


def test_широкая_шкала_приближает_к_равенству():
    узкая = expected_score(30, 45, 10)
    широкая = expected_score(30, 45, 40)
    assert узкая < широкая < 0.5


# ── Изменение рейтинга за матч (п. 9.2, п. 12) ──────────────────────

БАЗА = dict(d=15, k=0.6, c=1.0, p=1.0, max_delta=1.0)


def test_считает_произведение_P_K_C_на_разницу_результатов():
    assert match_delta(rating=20, opponent=20, won=True, **БАЗА) == pytest.approx(0.3)
    assert match_delta(rating=20, opponent=20, won=False, **БАЗА) == pytest.approx(-0.3)


def test_победа_над_сильным_весит_больше_победы_над_слабым():
    над_сильным = match_delta(rating=20, opponent=45, won=True, **БАЗА)
    над_слабым = match_delta(rating=20, opponent=5, won=True, **БАЗА)
    assert над_сильным > над_слабым > 0


def test_поражение_от_слабого_бьёт_сильнее_поражения_от_сильного():
    от_слабого = match_delta(rating=45, opponent=20, won=False, **БАЗА)
    от_сильного = match_delta(rating=45, opponent=60, won=False, **БАЗА)
    assert от_слабого < от_сильного < 0


def test_коэффициент_уровня_множит_изменение():
    выс = match_delta(rating=20, opponent=20, won=True, **{**БАЗА, "c": 1.2})
    люб = match_delta(rating=20, opponent=20, won=True, **{**БАЗА, "c": 0.6})
    assert выс == pytest.approx(0.36)
    assert люб == pytest.approx(0.18)


def test_коэффициент_места_множит_изменение():
    assert match_delta(rating=20, opponent=20, won=True, **{**БАЗА, "p": 1.2}) == pytest.approx(0.36)


def test_потолок_режет_и_рост_и_падение():
    рост = match_delta(rating=20, opponent=45, won=True, **{**БАЗА, "k": 5, "max_delta": 0.5})
    падение = match_delta(rating=45, opponent=20, won=False, **{**БАЗА, "k": 5, "max_delta": 0.5})
    assert рост == pytest.approx(0.5)
    assert падение == pytest.approx(-0.5)


def test_нулевой_потолок_означает_отсутствие_потолка():
    без = match_delta(rating=20, opponent=45, won=True, **{**БАЗА, "k": 5, "max_delta": 0})
    assert без > 4


# ── P — коэффициент за призовое место (п. 10) ───────────────────────


def test_шкала_призовых_мест_из_положения():
    assert prize_factor(1, DEFAULT_PARAMS) == 1.2
    assert prize_factor(2, DEFAULT_PARAMS) == 1.15
    assert prize_factor(3, DEFAULT_PARAMS) == 1.1


def test_за_четвёртое_место_и_ниже_коэффициент_не_применяется():
    assert prize_factor(4, DEFAULT_PARAMS) == 1.0
    assert prize_factor(17, DEFAULT_PARAMS) == 1.0
    assert prize_factor(None, DEFAULT_PARAMS) == 1.0


def test_без_матча_за_третье_место_бронзовых_двое():
    assert prize_factor(3, DEFAULT_PARAMS, no_third_place_match=True) == 1.1
    assert prize_factor(4, DEFAULT_PARAMS, no_third_place_match=True) == 1.1
    assert prize_factor(5, DEFAULT_PARAMS, no_third_place_match=True) == 1.0


# ── Стартовые значения (п. 6.1, 6.3, 17) ────────────────────────────


def test_новому_спортсмену_единица():
    assert new_player_rating() == 1.0


def test_прежний_рейтинг_переносится_один_к_одному():
    assert from_legacy_rating(40) == 40.0
    assert from_legacy_rating(50) == 50.0
    assert from_legacy_rating(82) == 82.0


def test_перевод_из_ITTF_воспроизводит_все_три_примера_положения():
    # п. 17.12: Rmax = 90, k = 10
    assert from_ittf_position(100, 90, 10) == 43.95
    assert from_ittf_position(50, 90, 10) == 50.88
    assert from_ittf_position(500, 90, 10) == 27.85


def test_первое_место_в_мире_даёт_верхнюю_границу():
    assert from_ittf_position(1, 90, 10) == 90.0


def test_стартовое_из_ITTF_не_опускается_ниже_единицы():
    assert from_ittf_position(10000, 90, 10) == 1.0


# ── Неявка (п. 15.4–15.6, 15.15) ────────────────────────────────────


def test_размер_снижения_за_неявку():
    assert no_show_penalty(1) == 0.2
    assert no_show_penalty(2) == 0.3
    assert no_show_penalty(3) == 0.5
    assert no_show_penalty(7) == 0.5


def test_снижение_применяется_к_рейтингу():
    assert apply_no_show(20, 1) == 19.8
    assert apply_no_show(20, 3) == 19.5


def test_рейтинг_не_уходит_в_минус():
    assert apply_no_show(0.1, 1) == 0.0
    assert apply_no_show(0, 3) == 0.0


# ── Неактивность (п. 18) и возрастная выборка (п. 7.4) ──────────────

СЕЙЧАС = date(2026, 9, 10)


def месяцев_назад(n: int) -> date:
    year = СЕЙЧАС.year + (СЕЙЧАС.month - 1 - n) // 12
    month = (СЕЙЧАС.month - 1 - n) % 12 + 1
    return date(year, month, СЕЙЧАС.day)


def test_до_двадцати_четырёх_месяцев_спортсмен_активен():
    assert activity_status(месяцев_назад(23), СЕЙЧАС).status == "active"


def test_с_двадцати_четырёх_месяцев_неактивен_но_рейтинг_сохраняется():
    s = activity_status(месяцев_назад(24), СЕЙЧАС)
    assert s.status == "inactive"
    assert s.rating_kept is True


def test_вернуться_с_сохранённым_рейтингом_можно_до_шестидесяти_месяцев():
    s = activity_status(месяцев_назад(59), СЕЙЧАС)
    assert s.status == "inactive"
    assert s.rating_kept is True


def test_после_шестидесяти_месяцев_рейтинг_аннулируется():
    s = activity_status(месяцев_назад(60), СЕЙЧАС)
    assert s.status == "void"
    assert s.rating_kept is False


def test_без_единого_матча_статус_особый():
    assert activity_status(None, СЕЙЧАС).status == "no_matches"


def test_возрастные_ступени():
    assert age_category(2026, 2016) == "U11"
    assert age_category(2026, 2014) == "U13"
    assert age_category(2026, 2012) == "U15"
    assert age_category(2026, 2010) == "U17"
    assert age_category(2026, 2008) == "U19"
    assert age_category(2026, 2006) == "U21"
    assert age_category(2026, 2000) is None


def test_переход_между_ступенями_по_году_соревнования():
    assert age_category(2026, 2012) == "U15"
    assert age_category(2027, 2012) == "U17"
    # ⚠ Порог «Un = разница не больше n−1» взят по правилу ITTF: в Положении
    # задана только сама разность, границы ступеней в нём не написаны.
    assert age_category(2026, 2011) == "U17"


# ── Прогон серии (п. 8, 9, 11, 20) ──────────────────────────────────


def игрок(pid: str, start: float, origin: str = "legacy", played: int = 0) -> LabPlayer:
    return LabPlayer(id=pid, name=pid, origin=origin, start=start, played=played)


def матч(mid: str, a: str, b: str, games=(3, 1), tournament: str = "t1") -> LabMatch:
    return LabMatch(id=mid, tournament=tournament, a=a, b=b, games=games)


def турнир(level: str = "republic", places=None, no_third_place_match: bool = False) -> LabTournament:
    return LabTournament(
        id="t1",
        name="Чемпионат РК",
        level=level,
        places=places or {},
        no_third_place_match=no_third_place_match,
    )


def test_победитель_растёт_проигравший_падает_зеркально():
    r = run_series([игрок("А", 20), игрок("Б", 20)], [турнир()], [матч("m1", "А", "Б")], п())
    а = next(x for x in r.table if x.id == "А")
    б = next(x for x in r.table if x.id == "Б")
    assert а.rating > 20 > б.rating
    assert а.rating - 20 == pytest.approx(20 - б.rating)


def test_в_истории_рейтинг_до_плюс_изменение_равен_рейтингу_после():
    r = run_series(
        [игрок("А", 20), игрок("Б", 31)],
        [турнир()],
        [матч("m1", "А", "Б"), матч("m2", "Б", "А", games=(3, 2))],
        п(),
    )
    assert len(r.history) == 4  # по строке каждому участнику матча
    for h in r.history:
        assert h.before + h.delta == pytest.approx(h.after)
        assert h.after == round(h.after, 2)


def test_счёт_попадает_в_историю_но_на_размер_изменения_не_влияет():
    общее = ([игрок("А", 20), игрок("Б", 20)], [турнир()])
    сухой = run_series(*общее, [матч("m1", "А", "Б", games=(3, 0))], п())
    впятой = run_series(*общее, [матч("m1", "А", "Б", games=(3, 2))], п())
    assert сухой.history[0].score == "3:0"
    assert впятой.history[0].score == "3:2"
    # ⚠ S в формуле п. 9.2 знает только победу и поражение
    assert сухой.table[0].rating == впятой.table[0].rating


def test_уровень_соревнования_множит_изменение():
    def прогон(level):
        return run_series(
            [игрок("А", 20), игрок("Б", 20)], [турнир(level)], [матч("m1", "А", "Б")], п()
        ).history[0].delta

    assert прогон("top") == pytest.approx(прогон("republic") * 1.2, abs=0.005)
    assert прогон("amateur") == pytest.approx(прогон("republic") * 0.6, abs=0.005)


def серия_новичка(n: int, params: Params):
    players = [игрок("Н", 1, origin="new")]
    matches = []
    for i in range(n):
        players.append(игрок("С%d" % i, 40))
        matches.append(матч("m%d" % i, "Н", "С%d" % i))
    return run_series(players, [турнир()], matches, params)


def test_первые_двадцать_матчей_идут_с_переходным_K():
    r = серия_новичка(21, п(k_transition=3, k_standard=0.6, max_delta=0))
    свои = [h for h in r.history if h.player == "Н"]
    assert all(h.transition for h in свои[:20])
    assert свои[20].transition is False
    assert свои[19].k == 3
    assert свои[20].k == 0.6


def test_за_переходный_период_новичок_подтягивается_к_уровню_соперников():
    r = серия_новичка(20, п(k_transition=3, k_standard=0.6, max_delta=0))
    assert next(x for x in r.table if x.id == "Н").rating > 30


def test_потолок_не_даёт_новичку_дойти_до_своего_уровня():
    r = серия_новичка(20, п(k_transition=3, k_standard=0.6, max_delta=1, cap_in_transition=True))
    assert next(x for x in r.table if x.id == "Н").rating <= 21


def test_на_перенесённый_рейтинг_переходный_период_не_распространяется():
    r = run_series(
        [игрок("П", 40, origin="legacy"), игрок("С", 40)],
        [турнир()],
        [матч("m1", "П", "С")],
        п(k_transition=3, k_standard=0.6),
    )
    assert next(h for h in r.history if h.player == "П").k == 0.6


def test_уже_сыгранные_матчи_засчитываются_в_переходный_период():
    r = run_series(
        [игрок("Н", 12, origin="new", played=19), игрок("С", 40)],
        [турнир()],
        [матч("m1", "Н", "С"), матч("m2", "Н", "С")],
        п(k_transition=3, k_standard=0.6),
    )
    свои = [h for h in r.history if h.player == "Н"]
    assert свои[0].transition is True   # двадцатый матч
    assert свои[1].transition is False  # двадцать первый


ПРИЗОВОЙ_ВХОД = (
    [игрок("А", 20), игрок("Б", 20), игрок("В", 20)],
    [турнир(places={"А": 1, "Б": 2, "В": 3})],
    [матч("m1", "А", "Б"), матч("m2", "А", "В"), матч("m3", "Б", "В")],
)


def test_режим_за_матч_ставит_P_в_формулу_каждого_матча():
    r = run_series(*ПРИЗОВОЙ_ВХОД, п(prize_mode="match"))
    assert next(h for h in r.history if h.player == "А").p == 1.2


def test_режим_за_турнир_множит_итог_а_в_матчах_P_равен_единице():
    r = run_series(*ПРИЗОВОЙ_ВХОД, п(prize_mode="tournament"))
    assert all(h.p == 1.0 for h in r.history if h.player == "А")
    а = next(x for x in r.table if x.id == "А")
    без_p = next(x for x in run_series(*ПРИЗОВОЙ_ВХОД, п(prize_mode="none")).table if x.id == "А")
    assert а.rating - 20 == pytest.approx((без_p.rating - 20) * 1.2, abs=0.01)


def test_без_потолка_два_прочтения_дают_одно_и_то_же_число():
    # P входит множителем, а умножение линейно: P × Σδ = Σ(P × δ).
    общее = dict(baseline="pre_tournament", max_delta=0)
    за_матч = run_series(*ПРИЗОВОЙ_ВХОД, п(prize_mode="match", **общее))
    за_турнир = run_series(*ПРИЗОВОЙ_ВХОД, п(prize_mode="tournament", **общее))
    for pid in ("А", "Б", "В"):
        a = next(x for x in за_матч.table if x.id == pid).rating
        b = next(x for x in за_турнир.table if x.id == pid).rating
        assert a == pytest.approx(b, abs=0.05)


def test_с_потолком_два_прочтения_расходятся():
    общее = dict(baseline="pre_tournament", max_delta=0.25)
    за_матч = next(
        x for x in run_series(*ПРИЗОВОЙ_ВХОД, п(prize_mode="match", **общее)).table if x.id == "А"
    )
    за_турнир = next(
        x for x in run_series(*ПРИЗОВОЙ_ВХОД, п(prize_mode="tournament", **общее)).table if x.id == "А"
    )
    assert за_турнир.rating > за_матч.rating


БАЗА_ВХОД = (
    [игрок("А", 20), игрок("Б", 20), игрок("В", 20)],
    [турнир()],
    [матч("m1", "А", "Б"), матч("m2", "А", "В")],
)


def test_поматчево_второй_матч_считается_от_рейтинга_после_первого():
    r = run_series(*БАЗА_ВХОД, п(baseline="sequential"))
    свои = [h for h in r.history if h.player == "А"]
    assert свои[1].before == свои[0].after


def test_от_рейтинга_до_турнира_оба_матча_считаются_от_значения_на_начало():
    r = run_series(*БАЗА_ВХОД, п(baseline="pre_tournament"))
    свои = [h for h in r.history if h.player == "А"]
    assert свои[0].before == 20
    assert свои[1].before == 20
    итог = next(x for x in r.table if x.id == "А").rating
    assert итог == pytest.approx(20 + свои[0].delta + свои[1].delta)


def test_рейтинг_не_опускается_ниже_нуля():
    players = [игрок("Н", 0.1), игрок("С", 3)]
    matches = [матч("m%d" % i, "С", "Н") for i in range(3)]
    r = run_series(players, [турнир()], matches, п(k_standard=5, max_delta=0))
    assert next(x for x in r.table if x.id == "Н").rating == 0
    for h in (x for x in r.history if x.player == "Н"):
        assert h.before + h.delta == pytest.approx(h.after)


def test_через_поражения_нижняя_граница_недостижима():
    # E при разрыве в 60 баллов — тысячные доли, изменение округляется в ноль.
    players = [игрок("Н", 0.1), игрок("С", 60)]
    matches = [матч("m%d" % i, "С", "Н") for i in range(10)]
    r = run_series(players, [турнир()], matches, п(k_standard=5, max_delta=0))
    assert next(x for x in r.table if x.id == "Н").rating == 0.1


def test_повторный_прогон_даёт_тот_же_результат():
    вход = (
        [игрок("А", 20), игрок("Б", 25)],
        [турнир()],
        [матч("m1", "А", "Б"), матч("m2", "Б", "А")],
        п(),
    )
    assert run_series(*вход).table == run_series(*вход).table


def test_считает_победы_и_поражения():
    r = run_series(
        [игрок("А", 20), игрок("Б", 20)],
        [турнир()],
        [матч("m1", "А", "Б"), матч("m2", "А", "Б"), матч("m3", "Б", "А")],
        п(),
    )
    а = next(x for x in r.table if x.id == "А")
    assert (а.wins, а.losses, а.matches) == (2, 1, 3)


def test_показывает_сколько_баллов_шкала_создала():
    r = run_series(
        [игрок("Н", 1, origin="new"), игрок("С", 40)],
        [турнир()],
        [матч("m1", "Н", "С")],
        п(k_transition=3, k_standard=0.6, max_delta=0),
    )
    assert r.injected > 1


def test_матч_игрока_которого_нет_в_списке_помечается_а_не_роняет_расчёт():
    r = run_series([игрок("А", 20)], [турнир()], [матч("m1", "А", "Икс")], п())
    assert r.history == []
    assert len(r.skipped) == 1
