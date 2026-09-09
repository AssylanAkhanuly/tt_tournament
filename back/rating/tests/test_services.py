"""Рейтинг внутри платформы: пересчёт по протоколу, откат, неявки, неактивность.

Проверяется не «функция отработала», а конкретные числа и инварианты, которые
обязаны сломаться при поломке: значение карточки равно сумме журнала, повторный
пересчёт не задваивает, откат возвращает ровно то, что было.
"""
from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from rating import engine, services
from rating.models import RatingEntry, RatingParams, RatingProfile
from tournaments.models import Match, Tournament, TournamentParticipant
from users.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def params():
    """Известный набор коэффициентов: числа в тестах должны быть предсказуемы."""
    return RatingParams.objects.create(
        d=15, k_standard=Decimal("0.6"), k_transition=3, max_delta=1,
        cap_in_transition=False, is_active=True,
    )


def карточка(u: User) -> RatingProfile:
    """Свежая карточка из базы.

    Обращение к связанной карточке через объект пользователя кеширует её:
    экземпляр, созданный при заведении, остаётся в памяти, и после пересчёта в
    нём лежит прежнее значение. Тест, читающий кеш, проходит на сломанном
    расчёте — поэтому читаем базу.
    """
    return RatingProfile.objects.get(user=u)


def создать_игрока(phone: str, name: str) -> User:
    return User.objects.create_user(phone=phone, name=name)


def создать_турнир(owner: User, level: str = "republic", **over) -> Tournament:
    return Tournament.objects.create(
        name=over.pop("name", "Чемпионат РК"),
        created_by=owner,
        status=Tournament.STATUS_FINISHED,
        level=level,
        starts_at=timezone.now(),
        **over,
    )


def завести(tournament: Tournament, user: User, place=None) -> TournamentParticipant:
    return TournamentParticipant.objects.create(tournament=tournament, user=user, place=place)


def сыграть(tournament: Tournament, a: User, b: User, s1: int = 3, s2: int = 1, n: int = 1) -> Match:
    return Match.objects.create(
        tournament=tournament, round_number=1, match_number=n,
        player1=a, player2=b, score1=s1, score2=s2,
        winner=a if s1 > s2 else b, status=Match.FINISHED,
    )


# ── Карточка спортсмена (п. 6, 19) ──────────────────────────────────


def test_новая_карточка_заводится_со_старта_1_00(params):
    u = создать_игрока("+7700000001", "Новичок")
    profile = services.get_or_create_profile(u)
    assert profile.value == Decimal("1.00")
    assert profile.origin == engine.ORIGIN_NEW
    # Стартовое значение объяснено строкой журнала, а не взято ниоткуда.
    start = profile.entries.get(kind=RatingEntry.KIND_START)
    assert start.delta == Decimal("1.00")


def test_перенос_прежнего_рейтинга_один_к_одному(params):
    u = создать_игрока("+7700000002", "Мастер")
    profile = services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=50)
    assert profile.value == Decimal("50.00")


def test_старт_легионера_из_позиции_ITTF(params):
    u = создать_игрока("+7700000003", "Легионер")
    profile = services.get_or_create_profile(u, origin=engine.ORIGIN_ITTF, ittf_position=100)
    assert profile.value == Decimal("43.95")  # пример п. 17.12


def test_повторный_вызов_не_заводит_вторую_карточку(params):
    u = создать_игрока("+7700000004", "Игрок")
    assert services.get_or_create_profile(u).pk == services.get_or_create_profile(u).pk
    assert RatingProfile.objects.filter(user=u).count() == 1


# ── Пересчёт по протоколу (п. 8, 9, 13) ─────────────────────────────


def test_считает_матч_по_формуле_с_коэффициентом_уровня(params):
    a = создать_игрока("+7700000010", "А")
    b = создать_игрока("+7700000011", "Б")
    for u in (a, b):
        p = services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=20)
        assert p.value == Decimal("20.00")

    t = создать_турнир(a, level="top")  # C = 1,20
    завести(t, a)
    завести(t, b)
    сыграть(t, a, b)

    assert services.apply_tournament(t) == 2

    # Равные соперники: E = 0,50, K = 0,60, C = 1,20 → 0,60 × 1,20 × 0,50 = 0,36
    assert карточка(a).value == Decimal("20.36")
    assert карточка(b).value == Decimal("19.64")


def test_любительский_турнир_вдвое_дешевле_республиканского(params):
    def прогон(level, phones):
        a = создать_игрока(phones[0], "А")
        b = создать_игрока(phones[1], "Б")
        for u in (a, b):
            services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=20)
        t = создать_турнир(a, level=level)
        завести(t, a)
        завести(t, b)
        сыграть(t, a, b)
        services.apply_tournament(t)
        return карточка(a).value - Decimal("20.00")

    респ = прогон("republic", ["+7700000020", "+7700000021"])
    люб = прогон("amateur", ["+7700000022", "+7700000023"])
    assert респ == Decimal("0.30")
    assert люб == Decimal("0.18")


def test_коэффициент_места_применяется_к_победителю(params):
    a = создать_игрока("+7700000030", "А")
    b = создать_игрока("+7700000031", "Б")
    for u in (a, b):
        services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=20)
    t = создать_турнир(a, level="top")
    завести(t, a, place=1)
    завести(t, b, place=2)
    сыграть(t, a, b)
    services.apply_tournament(t)

    # P = 1,20: 0,36 × 1,20 = 0,432 → +0,43
    assert карточка(a).value == Decimal("20.43")


def test_значение_карточки_равно_сумме_журнала(params):
    a = создать_игрока("+7700000040", "А")
    b = создать_игрока("+7700000041", "Б")
    for u in (a, b):
        services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=20)
    t = создать_турнир(a)
    завести(t, a)
    завести(t, b)
    сыграть(t, a, b, n=1)
    сыграть(t, b, a, n=2)
    services.apply_tournament(t)

    for u in (a, b):
        profile = карточка(u)
        сумма = sum(e.delta for e in profile.entries.filter(is_reverted=False))
        assert profile.value == сумма


def test_каждая_строка_истории_хранит_свои_коэффициенты(params):
    a = создать_игрока("+7700000050", "А")
    b = создать_игрока("+7700000051", "Б")
    for u in (a, b):
        services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=20)
    t = создать_турнир(a, level="top")
    завести(t, a)
    завести(t, b)
    сыграть(t, a, b)
    services.apply_tournament(t)

    row = карточка(a).entries.get(kind=RatingEntry.KIND_MATCH)
    assert row.d == Decimal("15.00")
    assert row.k == Decimal("0.600")
    assert row.c == Decimal("1.20")
    assert row.p == Decimal("1.00")
    assert row.score == "3:1"
    assert row.won is True
    assert row.before + row.delta == row.after


def test_повторный_пересчёт_не_задваивает(params):
    a = создать_игрока("+7700000060", "А")
    b = создать_игрока("+7700000061", "Б")
    for u in (a, b):
        services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=20)
    t = создать_турнир(a)
    завести(t, a)
    завести(t, b)
    сыграть(t, a, b)

    services.apply_tournament(t)
    значение = карточка(a).value
    assert services.apply_tournament(t) == 0
    assert карточка(a).value == значение


def test_нерейтинговый_турнир_не_считается(params):
    a = создать_игрока("+7700000070", "А")
    b = создать_игрока("+7700000071", "Б")
    for u in (a, b):
        services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=20)
    t = создать_турнир(a, is_rating=False)
    завести(t, a)
    завести(t, b)
    сыграть(t, a, b)

    assert services.apply_tournament(t) == 0
    assert карточка(a).value == Decimal("20.00")


def test_неявка_в_сетке_в_рейтинг_не_идёт(params):
    a = создать_игрока("+7700000080", "А")
    b = создать_игрока("+7700000081", "Б")
    for u in (a, b):
        services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=20)
    t = создать_турнир(a)
    завести(t, a)
    завести(t, b)
    m = сыграть(t, a, b)
    m.is_walkover = True
    m.save(update_fields=["is_walkover"])

    assert services.apply_tournament(t) == 0
    assert карточка(a).value == Decimal("20.00")


def test_переходный_период_новичка_идёт_с_повышенным_K(params):
    новичок = создать_игрока("+7700000090", "Новичок")
    мастер = создать_игрока("+7700000091", "Мастер")
    services.get_or_create_profile(новичок)  # origin = новый, 1,00
    services.get_or_create_profile(мастер, origin=engine.ORIGIN_LEGACY, legacy=40)

    t = создать_турнир(мастер)
    завести(t, новичок)
    завести(t, мастер)
    сыграть(t, новичок, мастер)  # новичок побеждает
    services.apply_tournament(t)

    row = карточка(новичок).entries.get(kind=RatingEntry.KIND_MATCH)
    assert row.transition is True
    assert row.k == Decimal("3.000")
    assert карточка(новичок).matches_played == 1


# ── Откат протокола (п. 21.6) ───────────────────────────────────────


def test_откат_возвращает_рейтинг_и_сохраняет_записи(params):
    a = создать_игрока("+7700000100", "А")
    b = создать_игрока("+7700000101", "Б")
    for u in (a, b):
        services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=20)
    t = создать_турнир(a)
    завести(t, a)
    завести(t, b)
    сыграть(t, a, b)
    services.apply_tournament(t)
    assert карточка(a).value == Decimal("20.30")

    assert services.revert_tournament(t) == 2
    assert карточка(a).value == Decimal("20.00")
    assert карточка(a).matches_played == 0
    # Строки не стёрты — п. 21.6 требует сохранять первоначальную запись.
    assert карточка(a).entries.filter(kind=RatingEntry.KIND_MATCH, is_reverted=True).count() == 1


def test_после_отката_турнир_можно_посчитать_заново(params):
    a = создать_игрока("+7700000110", "А")
    b = создать_игрока("+7700000111", "Б")
    for u in (a, b):
        services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=20)
    t = создать_турнир(a)
    завести(t, a)
    завести(t, b)
    m = сыграть(t, a, b)
    services.apply_tournament(t)
    services.revert_tournament(t)

    # Судья исправил счёт: победил другой.
    m.score1, m.score2, m.winner = 1, 3, b
    m.save(update_fields=["score1", "score2", "winner"])
    assert services.apply_tournament(t) == 2

    assert карточка(a).value == Decimal("19.70")


# ── Неявка (п. 15.4–15.6, 15.15) ────────────────────────────────────


def test_снижение_за_неявки_идёт_по_возрастающей(params):
    u = создать_игрока("+7700000120", "Прогульщик")
    services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=20)

    services.register_no_show(u, reason="не явился без причины")
    assert карточка(u).value == Decimal("19.80")
    services.register_no_show(u, reason="повторно")
    assert карточка(u).value == Decimal("19.50")
    services.register_no_show(u, reason="снова")
    assert карточка(u).value == Decimal("19.00")


def test_рейтинг_не_уходит_в_минус_от_неявок(params):
    u = создать_игрока("+7700000130", "Ноль")
    profile = services.get_or_create_profile(u)  # 1,00
    for _ in range(6):
        services.register_no_show(u)
    profile.refresh_from_db()
    assert profile.value == Decimal("0.00")


def test_неявка_записывается_с_основанием(params):
    u = создать_игрока("+7700000140", "Игрок")
    services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=20)
    entry = services.register_no_show(u, reason="уведомление не направлено")
    assert entry.kind == RatingEntry.KIND_NO_SHOW
    assert entry.reason == "уведомление не направлено"
    assert entry.delta == Decimal("-0.20")


# ── Неактивность (п. 18) ────────────────────────────────────────────


def test_статусы_активности_по_срокам(params):
    свежий = создать_игрока("+7700000150", "Свежий")
    давний = создать_игрока("+7700000151", "Давний")
    забытый = создать_игрока("+7700000152", "Забытый")

    сегодня = timezone.localdate()
    for u, месяцев in ((свежий, 1), (давний, 30), (забытый, 70)):
        p = services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=30)
        p.last_match_at = сегодня - timedelta(days=int(месяцев * 30.5))
        p.save(update_fields=["last_match_at"])

    services.refresh_activity(сегодня)

    assert карточка(свежий).status == engine.STATUS_ACTIVE
    assert карточка(давний).status == engine.STATUS_INACTIVE
    # п. 18.4: после 60 месяцев рейтинг аннулируется, и это видно в журнале.
    assert карточка(забытый).status == engine.STATUS_VOID
    assert карточка(забытый).value == Decimal("0.00")
    assert карточка(забытый).entries.filter(kind=RatingEntry.KIND_VOID).exists()


def test_неактивный_сохраняет_рейтинг(params):
    u = создать_игрока("+7700000160", "Пауза")
    p = services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=42)
    p.last_match_at = timezone.localdate() - timedelta(days=int(30 * 30.5))
    p.save(update_fields=["last_match_at"])

    services.refresh_activity()
    p.refresh_from_db()
    assert p.status == engine.STATUS_INACTIVE
    assert p.value == Decimal("42.00")  # п. 18.2 — сохраняется в полном объёме


# ── Предпросчёт для калибровки ──────────────────────────────────────


def test_предпросчёт_ничего_не_сохраняет(params):
    result = services.preview(
        players=[
            {"id": "a", "name": "А", "origin": "legacy", "start": 20},
            {"id": "b", "name": "Б", "origin": "legacy", "start": 20},
        ],
        tournaments=[{"id": "t", "name": "Тест", "level": "top"}],
        matches=[{"id": "m", "tournament": "t", "a": "a", "b": "b", "games": [3, 1]}],
    )
    assert next(x for x in result.table if x.id == "a").rating == 20.36
    assert RatingProfile.objects.count() == 0
    assert RatingEntry.objects.count() == 0


def test_предпросчёт_принимает_свои_коэффициенты(params):
    вход = dict(
        players=[
            {"id": "a", "name": "А", "origin": "legacy", "start": 20},
            {"id": "b", "name": "Б", "origin": "legacy", "start": 20},
        ],
        tournaments=[{"id": "t", "name": "Тест", "level": "top"}],
        matches=[{"id": "m", "tournament": "t", "a": "a", "b": "b", "games": [3, 1]}],
    )
    свой = services.preview(**вход, params={"k_standard": 1.2})
    assert next(x for x in свой.table if x.id == "a").rating == 20.72
