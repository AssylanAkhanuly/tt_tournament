"""Расписание турнира «группы + плей-офф» ✳ (30.10.2026, решение владельца
продукта; ТЗ §4.5–4.6). Строит и правит только главный судья турнира:
формирует черновик (группы змейкой, пары по кругам, время, стол и судья стола
у каждого матча), правит его — переносит игрока в другую группу, меняет судью,
стол и время матча — и отправляет. Отправленное не меняется. Администратор
федерации и председатель ГСК расписание видят, но не правят.

Проверяется то, что сломается при поломке: права (только главный судья),
черновик не начинает турнир, правка отбивает занятых в то же время, отправка
запирает и расписание, и состав."""
import datetime

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from tournaments import roster
from tournaments.models import GroupMatch, Tournament, TournamentGroup, TournamentParticipant
from users.models import Role, User

pytestmark = pytest.mark.django_db


def человек(n, name, *kinds):
    u = User.objects.create_user(phone="+7700666" + str(n).zfill(4), name=name, password="x")
    for k in kinds:
        Role.objects.create(user=u, kind=k)
    return u


def клиент(user):
    api = APIClient()
    api.force_authenticate(user)
    return api


@pytest.fixture
def мир():
    админ = человек(1, "Админ", Role.KIND_FEDERATION_ADMIN)
    председатель = человек(2, "Председатель", Role.KIND_GSK_CHAIRMAN)
    t = Tournament.objects.create(
        name="Кубок",
        created_by=админ,
        format=Tournament.FORMAT_GROUP,
        group_size=4,
        starts_at=timezone.make_aware(datetime.datetime(2026, 11, 14, 12, 0)),
    )
    главный = человек(3, "Главный", Role.KIND_REFEREE)
    roster.add_referee(t, главный, Role.KIND_CHIEF_REFEREE)
    судьи = [человек(10 + i, f"Судья {i}", Role.KIND_REFEREE) for i in range(3)]
    for s in судьи:
        roster.add_referee(t, s, Role.KIND_REFEREE)
    игроки = [человек(20 + i, f"Игрок {i:02}", Role.KIND_PLAYER) for i in range(8)]
    for p in игроки:
        TournamentParticipant.objects.create(tournament=t, user=p)
    return {"t": t, "админ": админ, "председатель": председатель, "главный": главный, "судьи": судьи, "игроки": игроки}


def url(t, tail=""):
    return f"/api/tournaments/{t.id}/schedule/{tail}"


ДЕНЬ = {"date": "2026-11-14", "start": "10:00", "end": "18:00"}
ПАРАМЕТРЫ = {"tables": 2, "days": [ДЕНЬ], "match_minutes": 30}


def собрать(мир, **over):
    return клиент(мир["главный"]).post(url(мир["t"], "build/"), {**ПАРАМЕТРЫ, **over}, format="json")


def test_главный_судья_собирает_черновик(мир):
    r = собрать(мир)
    assert r.status_code == 200, r.data
    t = мир["t"]
    t.refresh_from_db()
    assert t.schedule_status == "draft"
    assert t.status == Tournament.STATUS_OPEN  # черновик турнир не начинает
    assert [g["name"] for g in r.data["groups"]] == ["A", "B"]
    assert sorted(len(g["players"]) for g in r.data["groups"]) == [4, 4]
    assert len(r.data["matches"]) == 2 * 6  # две группы по четыре — по шесть матчей
    for m in r.data["matches"]:
        assert m["referee"] is not None and m["table"] in (1, 2) and m["scheduled_at"]
        assert m["player1"]["avatar"] is None  # фото нет — пусто, экран рисует заглушку
    # Первый матч — в начале дня турнира.
    first = min(datetime.datetime.fromisoformat(m["scheduled_at"]) for m in r.data["matches"])
    assert timezone.localtime(first).time() == datetime.time(10, 0)


def test_судьи_матчей_только_судьи_стола(мир):
    r = собрать(мир)
    stol = {str(s.id) for s in мир["судьи"]}
    assert {m["referee"]["id"] for m in r.data["matches"]} <= stol


def test_собрать_может_только_главный_судья(мир):
    for who in ("админ", "председатель"):
        r = клиент(мир[who]).post(url(мир["t"], "build/"), ПАРАМЕТРЫ, format="json")
        assert r.status_code == 403
    assert not TournamentGroup.objects.filter(tournament=мир["t"]).exists()


def test_расписание_видят_администратор_и_председатель_но_не_правят(мир):
    собрать(мир)
    for who in ("админ", "председатель"):
        r = клиент(мир[who]).get(url(мир["t"]))
        assert r.status_code == 200
        assert r.data["can_edit"] is False
    assert клиент(мир["главный"]).get(url(мир["t"])).data["can_edit"] is True
    # Игроку и судье стола — нет.
    assert клиент(мир["игроки"][0]).get(url(мир["t"])).status_code == 403
    assert клиент(мир["судьи"][0]).get(url(мир["t"])).status_code == 403


def test_только_для_групп_с_плей_офф_и_с_судьями_стола(мир):
    t = мир["t"]
    t.format = Tournament.FORMAT_SINGLE
    t.save()
    assert собрать(мир).status_code == 400
    t.format = Tournament.FORMAT_GROUP
    t.save()
    for s in мир["судьи"]:
        roster.referee_role(t, s.id).delete()
    r = собрать(мир)
    assert r.status_code == 400
    assert "судей стола" in r.data["detail"]


def test_параметры_проверяются(мир):
    assert собрать(мир, tables=0).status_code == 400
    assert собрать(мир, match_minutes=0).status_code == 400
    assert собрать(мир, days=[{**ДЕНЬ, "start": "18:00", "end": "10:00"}]).status_code == 400
    assert собрать(мир, days=[{**ДЕНЬ, "date": "14.11"}]).status_code == 400


def test_игровые_дни_со_своими_часами(мир):
    """Главный судья задаёт дни: дата и часы у каждого свои; матчи заполняют
    дни по порядку. 12 матчей на одном столе: 4 слота в первый день, 8 — во второй."""
    дни = [
        {"date": "2026-11-15", "start": "15:00", "end": "19:00"},
        {"date": "2026-11-14", "start": "10:00", "end": "12:00"},
    ]
    r = собрать(мир, tables=1, days=дни)
    assert r.status_code == 200, r.data
    # Дни хранятся по порядку дат.
    assert r.data["settings"]["days"] == [дни[1], дни[0]]
    часы = sorted(timezone.localtime(datetime.datetime.fromisoformat(m["scheduled_at"])) for m in r.data["matches"])
    assert [(h.day, h.strftime("%H:%M")) for h in часы[:5]] == [
        (14, "10:00"), (14, "10:30"), (14, "11:00"), (14, "11:30"), (15, "15:00"),
    ]
    assert (часы[-1].day, часы[-1].strftime("%H:%M")) == (15, "18:30")


def test_без_дней_берутся_даты_турнира(мир):
    t = мир["t"]
    t.ends_at = datetime.date(2026, 11, 15)
    t.save(update_fields=["ends_at"])
    r = клиент(мир["главный"]).post(url(t, "build/"), {"tables": 2, "match_minutes": 30}, format="json")
    assert r.status_code == 200, r.data
    assert r.data["settings"]["days"] == [
        {"date": "2026-11-14", "start": "10:00", "end": "18:00"},
        {"date": "2026-11-15", "start": "10:00", "end": "18:00"},
    ]


def test_матчи_не_поместились_в_дни(мир):
    r = собрать(мир, tables=1, days=[{**ДЕНЬ, "end": "11:00"}])
    assert r.status_code == 400
    assert "не помещаются" in r.data["detail"]
    assert мир["t"].groups.count() == 0  # черновик не записан наполовину


def test_пересобрать_черновик_заменяет_прежний(мир):
    собрать(мир)
    r = собрать(мир, tables=1)
    assert r.status_code == 200
    assert {m["table"] for m in r.data["matches"]} == {1}
    assert GroupMatch.objects.filter(group__tournament=мир["t"]).count() == 12


def test_перенос_игрока_в_другую_группу_пересчитывает_пары(мир):
    d = собрать(мир).data
    a, b = d["groups"]
    who = a["players"][0]["id"]
    r = клиент(мир["главный"]).post(url(мир["t"], "move/"), {"user_id": who, "group_id": b["id"]}, format="json")
    assert r.status_code == 200, r.data
    groups = {g["name"]: [p["id"] for p in g["players"]] for g in r.data["groups"]}
    assert who in groups["B"] and who not in groups["A"]
    assert (len(groups["A"]), len(groups["B"])) == (3, 5)
    # Пары — заново: 3 + 10 матчей, и игрок теперь играет с группой B.
    assert len(r.data["matches"]) == 3 + 10
    mine = [m for m in r.data["matches"] if who in (m["player1"]["id"], m["player2"]["id"])]
    assert len(mine) == 4 and all(m["group"] == b["id"] for m in mine)


def test_смена_судьи_стола_и_времени(мир):
    d = собрать(мир).data
    m = d["matches"][0]
    другой = next(s for s in мир["судьи"] if str(s.id) != m["referee"]["id"])
    busy = {
        x["referee"]["id"] for x in d["matches"] if x["scheduled_at"] == m["scheduled_at"] and x["id"] != m["id"]
    }
    свободный = next((s for s in мир["судьи"] if str(s.id) not in busy and str(s.id) != m["referee"]["id"]), None)
    api = клиент(мир["главный"])
    if свободный:
        r = api.patch(url(мир["t"], f"matches/{m['id']}/"), {"referee_id": str(свободный.id)}, format="json")
        assert r.status_code == 200, r.data
        assert GroupMatch.objects.get(pk=m["id"]).referee_id == свободный.id
    # Судья, занятый в это же время другим матчем, — 400.
    занятый = next(x for x in d["matches"] if x["scheduled_at"] == m["scheduled_at"] and x["id"] != m["id"])
    r = api.patch(url(мир["t"], f"matches/{m['id']}/"), {"referee_id": занятый["referee"]["id"]}, format="json")
    assert r.status_code == 400
    assert другой  # судей стола больше одного


def test_правка_отбивает_занятый_стол_и_занятого_игрока(мир):
    d = собрать(мир).data
    api = клиент(мир["главный"])
    m = d["matches"][0]
    # Другой матч в то же время — стол занят.
    сосед = next(x for x in d["matches"] if x["scheduled_at"] == m["scheduled_at"] and x["id"] != m["id"])
    r = api.patch(url(мир["t"], f"matches/{m['id']}/"), {"table": сосед["table"]}, format="json")
    assert r.status_code == 400
    # Матч того же игрока — на его время: игрок занят.
    p = m["player1"]["id"]
    свой = next(x for x in d["matches"] if x["id"] != m["id"] and p in (x["player1"]["id"], x["player2"]["id"]))
    r = api.patch(url(мир["t"], f"matches/{свой['id']}/"), {"scheduled_at": m["scheduled_at"], "table": 2 if m["table"] == 1 else 1}, format="json")
    assert r.status_code == 400


def test_отправить_запирает_расписание_и_состав_и_начинает_турнир(мир):
    d = собрать(мир).data
    api = клиент(мир["главный"])
    r = api.post(url(мир["t"], "finalize/"))
    assert r.status_code == 200, r.data
    t = мир["t"]
    t.refresh_from_db()
    assert (t.schedule_status, t.status) == ("final", Tournament.STATUS_IN_PROGRESS)
    assert r.data["can_edit"] is False
    m = d["matches"][0]
    assert api.patch(url(t, f"matches/{m['id']}/"), {"table": 1}, format="json").status_code == 400
    assert собрать(мир).status_code == 400
    assert api.post(url(t, "move/"), {"user_id": m["player1"]["id"], "group_id": d["groups"][1]["id"]}, format="json").status_code == 400
    assert api.post(url(t, "finalize/")).status_code == 400
    # Состав после отправки не меняется — группы уже сложены.
    новый = человек(99, "Опоздавший", Role.KIND_PLAYER)
    r = клиент(мир["админ"]).post(f"/api/tournaments/{t.id}/participants/", {"user_id": str(новый.id)}, format="json")
    assert r.status_code == 400


def test_отправить_без_черновика_нельзя(мир):
    assert клиент(мир["главный"]).post(url(мир["t"], "finalize/")).status_code == 400


def test_главный_судья_ведёт_состав_и_сведения_своего_турнира(мир):
    t = мир["t"]
    api = клиент(мир["главный"])
    assert api.get(f"/api/tournaments/{t.id}/participants/").status_code == 200
    новый = человек(98, "Новичок", Role.KIND_PLAYER)
    assert api.post(f"/api/tournaments/{t.id}/participants/", {"user_id": str(новый.id)}, format="json").status_code == 201
    assert api.patch(f"/api/tournaments/{t.id}/update/", {"city": "Шымкент"}, format="json").status_code == 200
    # Чужого турнира — нет.
    чужой = Tournament.objects.create(name="Чужой", created_by=мир["админ"])
    assert api.get(f"/api/tournaments/{чужой.id}/participants/").status_code == 403
    assert api.patch(f"/api/tournaments/{чужой.id}/update/", {"city": "Шымкент"}, format="json").status_code == 403


def test_расписание_отдаёт_счёт_матча_и_таблицу_группы(мир):
    """Сыгранный матч — со счётом и победителем, неявка — отметкой; у игрока в
    группе — победы, поражения, очки (победа 2, поражение 1, неявка 0) и место."""
    from tournaments.standings import recompute_group_standings

    собрать(мир)
    клиент(мир["главный"]).post(url(мир["t"], "finalize/"))
    group = TournamentGroup.objects.filter(tournament=мир["t"]).order_by("order").first()
    m1, m2 = GroupMatch.objects.filter(group=group).order_by("match_number")[:2]
    m1.score1, m1.score2, m1.winner, m1.status = 3, 1, m1.player1, GroupMatch.FINISHED
    m1.save()
    m2.score1, m2.score2, m2.winner, m2.status, m2.is_walkover = 0, 3, m2.player2, GroupMatch.FINISHED, True
    m2.save()
    recompute_group_standings(group)

    d = клиент(мир["админ"]).get(url(мир["t"])).data
    by_id = {m["id"]: m for m in d["matches"]}
    assert (by_id[m1.id]["score1"], by_id[m1.id]["score2"], by_id[m1.id]["winner"]) == (3, 1, str(m1.player1_id))
    assert by_id[m2.id]["is_walkover"] is True and by_id[m2.id]["winner"] == str(m2.player2_id)
    g = next(x for x in d["groups"] if x["id"] == group.id)
    st = {p["id"]: p["standing"] for p in g["players"]}
    assert (st[str(m1.player1_id)]["wins"], st[str(m1.player1_id)]["points"]) == (1, 2)
    assert (st[str(m1.player2_id)]["losses"], st[str(m1.player2_id)]["points"]) == (1, 1)
    assert st[str(m2.player1_id)]["points"] == 0  # поражение неявкой — 0
    # Места — 1..N без пропусков, у лидера по очкам — первое.
    assert sorted(s["place"] for s in st.values()) == list(range(1, len(st) + 1))
    leader = max(st, key=lambda k: (st[k]["points"], st[k]["wins"], st[k]["diff"]))
    assert st[leader]["place"] == 1


def test_карта_плей_офф_метки_до_итогов_игроки_после(мир):
    """Две группы по четыре, выходят двое (наше значение, QUESTIONS 10.2):
    полуфиналы A1–B2 и B1–A2, затем финал. Пока группа не сыграна — метки;
    сыграна целиком — её игроки по местам, у соседней группы метки остаются."""
    d = собрать(мир).data
    po = d["playoff"]
    assert (po["advance"], po["rounds"], len(po["matches"])) == (2, 2, 3)
    первый = [(m["a"]["label"], m["b"]["label"]) for m in po["matches"] if m["round"] == 0]
    assert первый == [("A1", "B2"), ("B1", "A2")]
    assert all(m["a"]["player"] is None and m["b"]["player"] is None for m in po["matches"] if m["round"] == 0)
    финал = next(m for m in po["matches"] if m["round"] == 1)
    assert финал["a"] is None and финал["b"] is None

    # Группа A сыграна целиком: первый номер посева выигрывает всё, и так далее.
    группа = next(g for g in d["groups"] if g["name"] == "A")
    порядок = [p["id"] for p in группа["players"]]
    # Счёт пишет организатор (`_can_manage_tournament`: is_staff или админ клуба).
    мир["админ"].is_staff = True
    мир["админ"].save(update_fields=["is_staff"])
    админ = клиент(мир["админ"])
    for m in (x for x in d["matches"] if x["group"] == группа["id"]):
        сильнее_первый = порядок.index(m["player1"]["id"]) < порядок.index(m["player2"]["id"])
        r = админ.post(
            f"/api/tournaments/{мир['t'].id}/groups/{группа['id']}/matches/{m['id']}/score/",
            {"score1": 3 if сильнее_первый else 0, "score2": 0 if сильнее_первый else 3},
            format="json",
        )
        assert r.status_code == 200, r.data
    po = клиент(мир["главный"]).get(url(мир["t"])).data["playoff"]
    первый = [m for m in po["matches"] if m["round"] == 0]
    assert первый[0]["a"]["player"]["id"] == порядок[0]  # A1 — победитель группы
    assert первый[1]["b"]["player"]["id"] == порядок[1]  # A2
    assert первый[0]["b"]["player"] is None and первый[0]["b"]["label"] == "B2"
