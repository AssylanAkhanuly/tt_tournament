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

COACH = Role.KIND_REGIONAL_HEAD_COACH


def make_person(n, name, region="", born=None):
    user = User.objects.create_user(phone="+7700999" + str(n).zfill(4), name=name, password="x")
    if region or born:
        RatingProfile.objects.create(
            user=user, region=region, birth_date=born, birth_year=born.year if born else None,
        )
    return user


def client_for(user):
    api = APIClient()
    api.force_authenticate(user)
    return api


@pytest.fixture
def world():
    chairman = make_person(1, "Председатель")
    Role.objects.create(user=chairman, kind=Role.KIND_GSK_CHAIRMAN)
    coach = make_person(2, "Тренеров Тимур")
    Role.objects.create(user=coach, kind=COACH, scope=Role.SCOPE_REGION, region="Алматы")
    almaty = [make_person(10 + i, "Алматинец %d" % i, "Алматы", datetime.date(2010, 1, 1 + i)) for i in range(4)]
    astana = make_person(20, "Астанин Арман", "Астана", datetime.date(2010, 5, 5))
    response = client_for(chairman).post(
        "/api/tournaments/", {"name": "Чемпионат РК", "template": "main_start"}, format="json"
    )
    assert response.status_code == 201, response.data
    tournament = Tournament.objects.get(pk=response.data["id"])
    return {"t": tournament, "chairman": chairman, "coach": coach, "almaty": almaty, "astana": astana}


def submit(user, tournament, athletes, applicant=COACH):
    return client_for(user).post(
        f"/api/tournaments/{tournament.id}/applications/",
        {"as": applicant, "athlete_ids": [str(a.id) for a in athletes]},
        format="json",
    )


def entered_names(tournament):
    return set(TournamentParticipant.objects.filter(tournament=tournament).values_list("user__name", flat=True))


def update(world, payload):
    return client_for(world["chairman"]).patch(f"/api/tournaments/{world['t'].id}/update/", payload, format="json")


# ── Шаблон: засевает настройки, но не держит их ─────────────────────────────


def test_main_start_seeds_applicant_quota_and_badge(world):
    t = world["t"]
    assert t.template.code == "main_start"
    assert t.category == "main"
    assert t.applicant_kinds == [COACH]
    assert t.region_quota == 3


def test_editing_template_does_not_change_existing_tournament(world):
    TournamentTemplate.objects.filter(code="main_start").update(region_quota=5, applicant_kinds=["self"])
    world["t"].refresh_from_db()
    assert world["t"].region_quota == 3
    assert world["t"].applicant_kinds == [COACH]


def test_without_template_athlete_applies_alone(world):
    response = client_for(world["chairman"]).post("/api/tournaments/", {"name": "Турнир"}, format="json")
    t = Tournament.objects.get(pk=response.data["id"])
    assert t.applicant_kinds == ["self"]
    assert t.template is None and t.category == ""


def test_team_template_is_not_created_yet(world):
    response = client_for(world["chairman"]).post(
        "/api/tournaments/", {"name": "ЕЛНТ, 1 тур", "template": "eurasian_league"}, format="json"
    )
    assert response.status_code == 400
    assert "Командн" in str(response.data)


def test_unknown_template_400(world):
    response = client_for(world["chairman"]).post("/api/tournaments/", {"name": "X", "template": "nope"}, format="json")
    assert response.status_code == 400


def test_template_list_for_new_tournament_excludes_team():
    response = APIClient().get("/api/tournaments/templates/")
    assert response.status_code == 200
    assert [t["code"] for t in response.data] == ["main_start", "open"]
    assert response.data[0] == {"code": "main_start", "name": "Главный республиканский старт", "category": "main"}


# ── Кто подаёт ──────────────────────────────────────────────────────────────


def test_coach_enters_own_region_as_list(world):
    t, coach = world["t"], world["coach"]
    response = submit(coach, t, world["almaty"][:2])
    assert response.status_code == 201, response.data
    assert entered_names(t) == {"Алматинец 0", "Алматинец 1"}
    participant = TournamentParticipant.objects.get(tournament=t, user=world["almaty"][0])
    assert participant.entered_by == coach
    assert participant.entered_as == COACH


def test_self_join_on_main_start_is_refused(world):
    t, player = world["t"], world["almaty"][0]
    response = client_for(player).post(f"/api/tournaments/{t.id}/participants/join/")
    assert response.status_code == 400
    assert "старший тренер региона" in response.data["detail"].lower()
    assert entered_names(t) == set()


def test_without_coach_role_cannot_apply_as_coach(world):
    response = submit(world["almaty"][0], world["t"], world["almaty"][:1])
    assert response.status_code == 403
    assert entered_names(world["t"]) == set()


def test_foreign_region_rejects_whole_application(world):
    t = world["t"]
    response = submit(world["coach"], t, [world["almaty"][0], world["astana"]])
    assert response.status_code == 400
    assert [e["athlete_id"] for e in response.data["errors"]] == [str(world["astana"].id)]
    assert entered_names(t) == set()


def test_tournament_can_also_allow_self_join(world):
    t = world["t"]
    response = update(world, {"applicant_kinds": ["self", COACH]})
    assert response.status_code == 200, response.data
    response = client_for(world["astana"]).post(f"/api/tournaments/{t.id}/participants/join/")
    assert response.status_code == 201, response.data
    assert entered_names(t) == {"Астанин Арман"}


def test_self_applicant_enters_only_themselves(world):
    t = world["t"]
    t.applicant_kinds = ["self"]
    t.save()
    response = submit(world["astana"], t, [world["almaty"][0]], applicant="self")
    assert response.status_code == 400
    assert entered_names(t) == set()


# ── Квота, предел, возраст ──────────────────────────────────────────────────


def test_region_quota_rejects_extra_athlete(world):
    t = world["t"]
    response = submit(world["coach"], t, world["almaty"])  # 4 при квоте 3
    assert response.status_code == 400
    assert "Квота" in str(response.data["errors"])
    assert entered_names(t) == set()


def test_region_quota_counts_already_entered(world):
    t, coach, almaty = world["t"], world["coach"], world["almaty"]
    assert submit(coach, t, almaty[:2]).status_code == 201
    response = submit(coach, t, almaty[2:])
    assert response.status_code == 400
    assert len(entered_names(t)) == 2


def test_participant_limit(world):
    t = world["t"]
    t.region_quota = None
    t.participant_limit = 2
    t.save()
    response = submit(world["coach"], t, world["almaty"][:3])
    assert response.status_code == 400
    assert "Предел" in str(response.data["errors"])
    assert submit(world["coach"], t, world["almaty"][:2]).status_code == 201


def test_age_outside_categories_names_the_athlete(world):
    t, almaty = world["t"], world["almaty"]
    TournamentAgeCategory.objects.create(
        tournament=t, name="2010 г.р. и моложе",
        born_from=datetime.date(2010, 1, 2), born_to=datetime.date(2026, 12, 31),
    )
    response = submit(world["coach"], t, almaty[:2])  # Алматинец 0 — 01.01.2010, на день старше
    assert response.status_code == 400
    assert [e["athlete_id"] for e in response.data["errors"]] == [str(almaty[0].id)]
    assert entered_names(t) == set()


def test_already_entered_athlete_is_not_entered_twice(world):
    t, coach, almaty = world["t"], world["coach"], world["almaty"]
    assert submit(coach, t, almaty[:1]).status_code == 201
    response = submit(coach, t, almaty[:1])
    assert response.status_code == 400
    assert len(entered_names(t)) == 1


def test_closed_recruitment_refuses(world):
    t = world["t"]
    t.player_recruitment_open = False
    t.save()
    response = submit(world["coach"], t, world["almaty"][:1])
    assert response.status_code == 400
    assert entered_names(t) == set()


# ── Условия допуска замораживаются первой заявкой ───────────────────────────


def test_unknown_applicant_in_settings_400(world):
    assert update(world, {"applicant_kinds": ["director"]}).status_code == 400


def test_settings_locked_after_first_application(world):
    t = world["t"]
    assert submit(world["coach"], t, world["almaty"][:1]).status_code == 201
    assert update(world, {"region_quota": 5}).status_code == 400
    t.refresh_from_db()
    assert t.region_quota == 3
    # Остальные сведения править можно.
    response = update(world, {"venue": "Дворец спорта"})
    assert response.status_code == 200, response.data


# ── Что видит заявитель ─────────────────────────────────────────────────────


def test_tournament_tells_coach_how_they_can_apply(world):
    response = client_for(world["coach"]).get(f"/api/tournaments/{world['t'].id}/")
    assert response.data["can_apply_as"] == [COACH]
    assert response.data["category"] == "main"
    response = client_for(world["astana"]).get(f"/api/tournaments/{world['t'].id}/")
    assert response.data["can_apply_as"] == []


def test_coach_candidates_only_own_region_not_yet_entered(world):
    t, coach, almaty = world["t"], world["coach"], world["almaty"]
    submit(coach, t, almaty[:1])
    response = client_for(coach).get(f"/api/tournaments/{t.id}/applications/candidates/?as={COACH}")
    assert response.status_code == 200
    assert sorted(a["name"] for a in response.data) == ["Алматинец 1", "Алматинец 2", "Алматинец 3"]


def test_command_creates_coach_with_region_and_rejects_unknown():
    from django.core.management import call_command
    from django.core.management.base import CommandError

    call_command("create_regional_head_coach", email="coach@fnt.kz", name="Тренер", password="x", region="Алматы")
    role = Role.objects.get(user__email="coach@fnt.kz")
    assert (role.kind, role.scope, role.region) == (COACH, Role.SCOPE_REGION, "Алматы")
    with pytest.raises(CommandError):
        call_command("create_regional_head_coach", email="c2@fnt.kz", name="Тренер 2", password="x", region="Марс")
