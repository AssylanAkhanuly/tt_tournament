"""Допуск заявки на турнир ✳ (19.11.2026, ТЗ §4.1, §8.2; ADMISSION.md).

Кто подаёт заявку — не правило вида соревнования, а настройка турнира
(`applicant_kinds`): главный старт засевает в неё «старший тренер региона»,
открытый — «сам спортсмен», и то и другое турнир может поменять, пока заявок
нет. Шаблон (вид соревнования) копирует свои значения в турнир при заведении;
правка шаблона потом заведённые турниры не трогает.

Заявка проходит допуск целиком или не проходит вовсе («форматно-логический
контроль не пропускает заявку»): заявитель разрешён турниром и у него есть
нужная роль → каждый спортсмен «его» (сам он, его регион) → возраст по
категориям → предел участников → квота региона.

Проверяется то, что сломается при поломке: самозапись на главный старт
отбивается, тренер не заявит чужой регион, лишний по квоте или пределу валит
всю заявку и ничего не записывает, возраст вне категории называет спортсмена,
условия допуска замораживаются первой заявкой."""
import datetime

import pytest
from rest_framework.test import APIClient

from rating.models import RatingProfile
from tournaments.models import Tournament, TournamentAgeCategory, TournamentParticipant, TournamentTemplate
from users.models import Role, User

pytestmark = pytest.mark.django_db


def человек(n, name, region="", born=None):
    u = User.objects.create_user(phone="+7700999" + str(n).zfill(4), name=name, password="x")
    if region or born:
        RatingProfile.objects.create(
            user=u, region=region, birth_date=born, birth_year=born.year if born else None,
        )
    return u


def клиент(user):
    api = APIClient()
    api.force_authenticate(user)
    return api


@pytest.fixture
def мир():
    председатель = человек(1, "Председатель")
    Role.objects.create(user=председатель, kind=Role.KIND_GSK_CHAIRMAN)
    тренер = человек(2, "Тренеров Тимур")
    Role.objects.create(user=тренер, kind=Role.KIND_REGIONAL_HEAD_COACH, scope=Role.SCOPE_REGION, region="Алматы")
    алматы = [человек(10 + i, "Алматинец %d" % i, "Алматы", datetime.date(2010, 1, 1 + i)) for i in range(4)]
    астанец = человек(20, "Астанин Арман", "Астана", datetime.date(2010, 5, 5))
    r = клиент(председатель).post(
        "/api/tournaments/", {"name": "Чемпионат РК", "template": "main_start"}, format="json"
    )
    assert r.status_code == 201, r.data
    t = Tournament.objects.get(pk=r.data["id"])
    return {"t": t, "председатель": председатель, "тренер": тренер, "алматы": алматы, "астанец": астанец}


def заявить(user, t, athletes, applicant=Role.KIND_REGIONAL_HEAD_COACH):
    return клиент(user).post(
        f"/api/tournaments/{t.id}/applications/",
        {"as": applicant, "athlete_ids": [str(a.id) for a in athletes]},
        format="json",
    )


def в_турнире(t):
    return set(TournamentParticipant.objects.filter(tournament=t).values_list("user__name", flat=True))


# ── Шаблон: засевает настройки, но не держит их ─────────────────────────────


def test_главный_старт_засевает_заявителя_квоту_и_значок(мир):
    t = мир["t"]
    assert t.template.code == "main_start"
    assert t.category == "main"
    assert t.applicant_kinds == [Role.KIND_REGIONAL_HEAD_COACH]
    assert t.region_quota == 3


def test_правка_шаблона_не_меняет_заведённый_турнир(мир):
    TournamentTemplate.objects.filter(code="main_start").update(region_quota=5, applicant_kinds=["self"])
    мир["t"].refresh_from_db()
    assert мир["t"].region_quota == 3
    assert мир["t"].applicant_kinds == [Role.KIND_REGIONAL_HEAD_COACH]


def test_без_шаблона_спортсмен_записывается_сам(мир):
    r = клиент(мир["председатель"]).post("/api/tournaments/", {"name": "Турнир"}, format="json")
    t = Tournament.objects.get(pk=r.data["id"])
    assert t.applicant_kinds == ["self"]
    assert t.template is None and t.category == ""


def test_командный_вид_пока_не_заводится(мир):
    r = клиент(мир["председатель"]).post(
        "/api/tournaments/", {"name": "ЕЛНТ, 1 тур", "template": "eurasian_league"}, format="json"
    )
    assert r.status_code == 400
    assert "Командн" in str(r.data)


def test_неизвестный_шаблон_400(мир):
    r = клиент(мир["председатель"]).post("/api/tournaments/", {"name": "X", "template": "nope"}, format="json")
    assert r.status_code == 400


# ── Кто подаёт ──────────────────────────────────────────────────────────────


def test_тренер_заявляет_свой_регион_списком(мир):
    t, тренер = мир["t"], мир["тренер"]
    r = заявить(тренер, t, мир["алматы"][:2])
    assert r.status_code == 201, r.data
    assert в_турнире(t) == {"Алматинец 0", "Алматинец 1"}
    p = TournamentParticipant.objects.get(tournament=t, user=мир["алматы"][0])
    assert p.entered_by == тренер
    assert p.entered_as == Role.KIND_REGIONAL_HEAD_COACH


def test_самозапись_на_главный_старт_отбивается(мир):
    t, игрок = мир["t"], мир["алматы"][0]
    r = клиент(игрок).post(f"/api/tournaments/{t.id}/participants/join/")
    assert r.status_code == 400
    assert "старший тренер региона" in r.data["detail"].lower()
    assert в_турнире(t) == set()


def test_без_роли_тренера_как_тренер_не_подать(мир):
    r = заявить(мир["алматы"][0], мир["t"], мир["алматы"][:1])
    assert r.status_code == 403
    assert в_турнире(мир["t"]) == set()


def test_чужой_регион_валит_всю_заявку(мир):
    t = мир["t"]
    r = заявить(мир["тренер"], t, [мир["алматы"][0], мир["астанец"]])
    assert r.status_code == 400
    assert [e["athlete_id"] for e in r.data["errors"]] == [str(мир["астанец"].id)]
    assert в_турнире(t) == set()


def test_турнир_может_разрешить_и_самозапись(мир):
    t = мир["t"]
    r = клиент(мир["председатель"]).patch(
        f"/api/tournaments/{t.id}/update/",
        {"applicant_kinds": ["self", Role.KIND_REGIONAL_HEAD_COACH]},
        format="json",
    )
    assert r.status_code == 200, r.data
    r = клиент(мир["астанец"]).post(f"/api/tournaments/{t.id}/participants/join/")
    assert r.status_code == 201, r.data
    assert в_турнире(t) == {"Астанин Арман"}


def test_самозапись_только_за_себя(мир):
    t = мир["t"]
    t.applicant_kinds = ["self"]
    t.save()
    r = заявить(мир["астанец"], t, [мир["алматы"][0]], applicant="self")
    assert r.status_code == 400
    assert в_турнире(t) == set()


# ── Квота, предел, возраст ──────────────────────────────────────────────────


def test_квота_региона_валит_лишнего(мир):
    t = мир["t"]
    r = заявить(мир["тренер"], t, мир["алматы"])  # 4 при квоте 3
    assert r.status_code == 400
    assert "Квота" in str(r.data["errors"])
    assert в_турнире(t) == set()


def test_квота_считает_уже_заявленных(мир):
    t, тренер, алматы = мир["t"], мир["тренер"], мир["алматы"]
    assert заявить(тренер, t, алматы[:2]).status_code == 201
    r = заявить(тренер, t, алматы[2:])
    assert r.status_code == 400
    assert len(в_турнире(t)) == 2


def test_предел_участников(мир):
    t = мир["t"]
    t.region_quota = None
    t.participant_limit = 2
    t.save()
    r = заявить(мир["тренер"], t, мир["алматы"][:3])
    assert r.status_code == 400
    assert "Предел" in str(r.data["errors"])
    assert заявить(мир["тренер"], t, мир["алматы"][:2]).status_code == 201


def test_возраст_вне_категорий_называет_спортсмена(мир):
    t, алматы = мир["t"], мир["алматы"]
    TournamentAgeCategory.objects.create(
        tournament=t, name="2010 г.р. и моложе",
        born_from=datetime.date(2010, 1, 2), born_to=datetime.date(2026, 12, 31),
    )
    r = заявить(мир["тренер"], t, алматы[:2])  # Алматинец 0 — 01.01.2010, на день старше
    assert r.status_code == 400
    assert [e["athlete_id"] for e in r.data["errors"]] == [str(алматы[0].id)]
    assert в_турнире(t) == set()


def test_уже_заявленный_второй_раз_не_идёт(мир):
    t, тренер, алматы = мир["t"], мир["тренер"], мир["алматы"]
    assert заявить(тренер, t, алматы[:1]).status_code == 201
    r = заявить(тренер, t, алматы[:1])
    assert r.status_code == 400
    assert len(в_турнире(t)) == 1


def test_закрытый_приём_не_пускает(мир):
    t = мир["t"]
    t.player_recruitment_open = False
    t.save()
    r = заявить(мир["тренер"], t, мир["алматы"][:1])
    assert r.status_code == 400
    assert в_турнире(t) == set()


# ── Условия допуска замораживаются первой заявкой ───────────────────────────


def test_неизвестный_заявитель_в_настройках_400(мир):
    r = клиент(мир["председатель"]).patch(
        f"/api/tournaments/{мир['t'].id}/update/", {"applicant_kinds": ["director"]}, format="json"
    )
    assert r.status_code == 400


def test_после_первой_заявки_условия_не_меняются(мир):
    t = мир["t"]
    assert заявить(мир["тренер"], t, мир["алматы"][:1]).status_code == 201
    r = клиент(мир["председатель"]).patch(f"/api/tournaments/{t.id}/update/", {"region_quota": 5}, format="json")
    assert r.status_code == 400
    t.refresh_from_db()
    assert t.region_quota == 3
    # Остальные сведения править можно.
    r = клиент(мир["председатель"]).patch(f"/api/tournaments/{t.id}/update/", {"venue": "Дворец спорта"}, format="json")
    assert r.status_code == 200, r.data


# ── Что видит заявитель ─────────────────────────────────────────────────────


def test_турнир_говорит_тренеру_как_он_может_подать(мир):
    r = клиент(мир["тренер"]).get(f"/api/tournaments/{мир['t'].id}/")
    assert r.data["can_apply_as"] == [Role.KIND_REGIONAL_HEAD_COACH]
    assert r.data["category"] == "main"
    r = клиент(мир["астанец"]).get(f"/api/tournaments/{мир['t'].id}/")
    assert r.data["can_apply_as"] == []


def test_кандидаты_тренера_только_свой_регион_и_ещё_не_заявленные(мир):
    t, тренер, алматы = мир["t"], мир["тренер"], мир["алматы"]
    заявить(тренер, t, алматы[:1])
    r = клиент(тренер).get(f"/api/tournaments/{t.id}/applications/candidates/?as=regional_head_coach")
    assert r.status_code == 200
    assert sorted(a["name"] for a in r.data) == ["Алматинец 1", "Алматинец 2", "Алматинец 3"]


def test_команда_заводит_тренера_с_регионом_и_отбивает_чужой():
    from django.core.management import call_command
    from django.core.management.base import CommandError

    call_command(
        "create_regional_head_coach", email="coach@fnt.kz", name="Тренер", password="x", region="Алматы",
    )
    role = Role.objects.get(user__email="coach@fnt.kz")
    assert (role.kind, role.scope, role.region) == (Role.KIND_REGIONAL_HEAD_COACH, Role.SCOPE_REGION, "Алматы")
    with pytest.raises(CommandError):
        call_command(
            "create_regional_head_coach", email="c2@fnt.kz", name="Тренер 2", password="x", region="Марс",
        )
