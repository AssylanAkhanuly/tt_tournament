"""Правила национальной команды ✳ (19.11.2026, NATIONAL.md). Ручки
(`views.py`) только переводят их в HTTP.

Кто что может — таблица в NATIONAL.md. Коротко:
- главный тренер и тренер-консультант (роль 19 — полная копия) — «штаб»:
  состав, личные тренеры, календарь подготовки, согласование планов и
  рапортов;
- тренер сборной (20) — читает свою возрастную группу: состав, планы,
  допуск; пишет рапорты;
- личный тренер — свои спортсмены: составляет план и отправляет на
  согласование, отмечает выполнение;
- врач сборной (21) — медкарта целиком; психолог (22) — спортивная карточка,
  её пока не читает никто, кроме психологов ✳;
- старший тренер региона (12) — рапорты на спортсменов своего региона.
"""
from datetime import date
from typing import List, Optional

from django.db import transaction
from django.db.models import ProtectedError
from django.utils import timezone

from rating.models import RatingEntry, RatingProfile
from users.models import Role, User
from users.permissions import has_role

from .models import (
    MedicalRecord, NationalTeamMember, PlanItem, ReportAction, SportRecord, TrainingEvent, TrainingPlan,
    TravelReport,
)


class NationalError(Exception):
    def __init__(self, detail: str, status: int = 400):
        super().__init__(detail)
        self.detail = detail
        self.status = status


# ── Кто есть кто ────────────────────────────────────────────────────────────

def is_head_staff(user) -> bool:
    """Главный тренер или тренер-консультант (его полная копия)."""
    return has_role(user, Role.KIND_NATIONAL_HEAD_COACH, Role.KIND_NATIONAL_CONSULTANT)


# Прежнее имя: главный тренер — значит штаб.
is_head_coach = is_head_staff


def is_doctor(user) -> bool:
    return has_role(user, Role.KIND_NATIONAL_DOCTOR)


def is_psychologist(user) -> bool:
    return has_role(user, Role.KIND_NATIONAL_PSYCHOLOGIST)


def is_personal_coach(user) -> bool:
    return has_role(user, Role.KIND_PERSONAL_COACH)


def team_coach_groups(user) -> List[str]:
    """Возрастные группы, которые ведёт тренер сборной (роль 20)."""
    if not user or not user.is_authenticated:
        return []
    return list(user.roles.filter(kind=Role.KIND_NATIONAL_TEAM_COACH).exclude(age_group="").values_list("age_group", flat=True))


def regional_coach_regions(user) -> List[str]:
    if not user or not user.is_authenticated:
        return []
    return list(user.roles.filter(kind=Role.KIND_REGIONAL_HEAD_COACH).exclude(region="").values_list("region", flat=True))


def is_national_staff(user) -> bool:
    return bool(
        is_head_staff(user) or team_coach_groups(user) or is_personal_coach(user) or is_doctor(user)
        or is_psychologist(user)
    )


def require_staff(user):
    if not is_national_staff(user):
        raise NationalError("Только штаб национальной команды.", 403)


def require_coach(user):
    if not is_head_staff(user):
        raise NationalError("Только главный тренер национальной команды или тренер-консультант.", 403)


def require_doctor(user):
    if not is_doctor(user):
        raise NationalError("Медицинскую карту ведёт врач сборной.", 403)


def require_psychologist(user):
    if not is_psychologist(user):
        raise NationalError("Спортивную карточку ведёт психолог сборной.", 403)


# ── Состав ──────────────────────────────────────────────────────────────────

def _choice(value, choices, label):
    if value not in dict(choices):
        raise NationalError("Неизвестное значение поля «%s»." % label)
    return value


def visible_members(user):
    """Кого видит человек: штаб, врач и психолог — всех; тренер сборной — свои
    возрастные группы; личный тренер — своих спортсменов."""
    require_staff(user)
    qs = NationalTeamMember.objects.select_related("user__rating_profile", "personal_coach")
    if is_head_staff(user) or is_doctor(user) or is_psychologist(user):
        return qs
    from django.db.models import Q

    return qs.filter(Q(age_group__in=team_coach_groups(user)) | Q(personal_coach=user))


def is_self(member: NationalTeamMember, user) -> bool:
    """Спортсмен смотрит свою карточку ✳ (22.11.2026, решение владельца
    продукта): член сборной видит свой профиль, план и медкарту (без
    диагнозов), как штаб, — только смотреть."""
    return bool(getattr(user, "id", None)) and member.user_id == user.id


def my_membership(user):
    return NationalTeamMember.objects.filter(user_id=getattr(user, "id", None)).first()


def require_member(member: NationalTeamMember, user):
    if is_self(member, user):
        return
    if not visible_members(user).filter(pk=member.pk).exists():
        raise NationalError("Этот спортсмен вам не виден.", 403)


def add_member(user_id, squad: str, age_group: str, by) -> NationalTeamMember:
    require_coach(by)
    user = User.objects.filter(id=user_id).first()
    if user is None or not RatingProfile.objects.filter(user=user).exists():
        raise NationalError("В сборную вносится спортсмен с рейтинговой карточкой.")
    if NationalTeamMember.objects.filter(user=user).exists():
        raise NationalError("%s уже в сборной." % user.name)
    return NationalTeamMember.objects.create(
        user=user,
        squad=_choice(squad, NationalTeamMember.SQUAD_CHOICES, "Состав"),
        age_group=_choice(age_group, NationalTeamMember.AGE_CHOICES, "Возрастная группа"),
        added_by=by,
    )


def update_member(member: NationalTeamMember, data: dict, by) -> NationalTeamMember:
    require_coach(by)
    if "squad" in data:
        member.squad = _choice(data["squad"], NationalTeamMember.SQUAD_CHOICES, "Состав")
    if "age_group" in data:
        member.age_group = _choice(data["age_group"], NationalTeamMember.AGE_CHOICES, "Возрастная группа")
    if "personal_coach_id" in data:
        coach_id = data["personal_coach_id"]
        if coach_id:
            coach = User.objects.filter(id=coach_id, roles__kind=Role.KIND_PERSONAL_COACH).first()
            if coach is None:
                raise NationalError("Личным тренером назначается учётка с ролью «Личный тренер».")
            member.personal_coach = coach
        else:
            member.personal_coach = None
    member.save()
    return member


def remove_member(member: NationalTeamMember, by):
    require_coach(by)
    member.delete()


def candidates(q: str, by, limit: int = 30):
    require_coach(by)
    taken = NationalTeamMember.objects.values_list("user_id", flat=True)
    qs = RatingProfile.objects.select_related("user").exclude(user_id__in=taken)
    if q.strip():
        qs = qs.filter(user__name__icontains=q.strip())
    return [p.user for p in qs.order_by("-value", "user__name")[:limit]]


def personal_coaches(by):
    """Учётки с ролью «Личный тренер» — для выбора в карточке."""
    require_coach(by)
    return list(User.objects.filter(roles__kind=Role.KIND_PERSONAL_COACH).distinct().order_by("name"))


# ── Медкарта ────────────────────────────────────────────────────────────────

def clearance(member: NationalTeamMember, today: Optional[date] = None) -> dict:
    """Допуск: последний по дате `clearance`. `ok` — срок не истёк, `expired` —
    истёк, `none` — допуска не вносили."""
    today = today or timezone.localdate()
    last = member.medical_records.filter(kind=MedicalRecord.KIND_CLEARANCE).order_by("-date", "-created_at").first()
    if last is None:
        return {"status": "none", "until": None}
    ok = last.until is None or last.until >= today
    return {"status": "ok" if ok else "expired", "until": last.until}


def active_limits(member: NationalTeamMember, today: Optional[date] = None):
    """Действующие ограничения нагрузки: есть `load_limit`, срок не прошёл."""
    today = today or timezone.localdate()
    return [r for r in member.medical_records.exclude(load_limit="") if r.until is None or r.until >= today]


def can_read_medical_summary(member: NationalTeamMember, user) -> bool:
    """Допуск и ограничения нагрузки — тем, кто ведёт подготовку спортсмена."""
    return can_see_plans(member, user)


def add_medical(member: NationalTeamMember, data: dict, by) -> MedicalRecord:
    require_doctor(by)
    kind = _choice(data.get("kind"), MedicalRecord.KIND_CHOICES, "Запись")
    if not data.get("date"):
        raise NationalError("У записи нужна дата.")
    if kind == MedicalRecord.KIND_CLEARANCE and not data.get("until"):
        raise NationalError("У допуска нужен срок.")
    until = data.get("until") or None
    if until and until < data["date"]:
        raise NationalError("«Действует до» раньше даты записи.")
    return MedicalRecord.objects.create(
        member=member, kind=kind, date=data["date"], title=(data.get("title") or "").strip(),
        note=(data.get("note") or "").strip(), load_limit=(data.get("load_limit") or "").strip(),
        until=until, created_by=by,
    )


def delete_medical(record: MedicalRecord, by):
    require_doctor(by)
    record.delete()


# ── Спортивная карточка ─────────────────────────────────────────────────────

def add_sport_record(member: NationalTeamMember, data: dict, by) -> SportRecord:
    require_psychologist(by)
    text = (data.get("text") or "").strip()
    if not data.get("date") or not text:
        raise NationalError("У записи нужны дата и текст.")
    return SportRecord.objects.create(member=member, date=data["date"], text=text, created_by=by)


def delete_sport_record(record: SportRecord, by):
    require_psychologist(by)
    record.delete()


# ── Календарь подготовки ────────────────────────────────────────────────────

def can_read_calendar(user) -> bool:
    return is_national_staff(user) or bool(regional_coach_regions(user))


def events(user):
    if not can_read_calendar(user):
        raise NationalError("Календарь подготовки — штабу сборной и старшим тренерам регионов.", 403)
    return TrainingEvent.objects.select_related("tournament")


def _event_fields(event: TrainingEvent, data: dict):
    if "kind" in data:
        event.kind = _choice(data["kind"], TrainingEvent.KIND_CHOICES, "Вид")
    if "title" in data:
        event.title = (data["title"] or "").strip()
    if "city" in data:
        event.city = (data["city"] or "").strip()
    for f in ("starts_on", "ends_on"):
        if data.get(f):
            setattr(event, f, data[f])
    if "age_group" in data:
        event.age_group = data["age_group"] and _choice(data["age_group"], NationalTeamMember.AGE_CHOICES, "Возрастная группа") or ""
    if "tournament_id" in data:
        from tournaments.models import Tournament

        tid = data["tournament_id"]
        event.tournament = Tournament.objects.filter(id=tid).first() if tid else None
        if tid and event.tournament is None:
            raise NationalError("Турнир не найден.")
        if event.tournament and not event.title:
            event.title = event.tournament.name
    if not event.title:
        raise NationalError("У мероприятия нужно название.")
    if not event.starts_on or not event.ends_on:
        raise NationalError("У мероприятия нужны даты.")
    if event.ends_on < event.starts_on:
        raise NationalError("Окончание раньше начала.")


def create_event(data: dict, by) -> TrainingEvent:
    require_coach(by)
    event = TrainingEvent(kind=data.get("kind") or TrainingEvent.KIND_CAMP, created_by=by)
    _choice(event.kind, TrainingEvent.KIND_CHOICES, "Вид")
    _event_fields(event, {**data, "title": data.get("title") or ""})
    event.save()
    return event


def update_event(event: TrainingEvent, data: dict, by) -> TrainingEvent:
    require_coach(by)
    _event_fields(event, data)
    event.save()
    # Сроки пунктов плана приходят из календаря — двигаются вместе с ним.
    event.plan_items.update(due=event.starts_on)
    return event


def delete_event(event: TrainingEvent, by):
    require_coach(by)
    try:
        event.delete()
    except ProtectedError:
        raise NationalError("По мероприятию есть рапорты — удалить нельзя.")


# ── Планы подготовки ────────────────────────────────────────────────────────

def can_see_plans(member: NationalTeamMember, user) -> bool:
    return bool(
        is_self(member, user)
        or is_head_staff(user) or member.age_group in team_coach_groups(user)
        or (member.personal_coach_id and member.personal_coach_id == getattr(user, "id", None))
    )


def require_plans(member: NationalTeamMember, user):
    if not can_see_plans(member, user):
        raise NationalError("Планы подготовки видят тренерский штаб и личный тренер.", 403)


def _is_personal_coach_of(member: NationalTeamMember, user) -> bool:
    return bool(member.personal_coach_id and member.personal_coach_id == getattr(user, "id", None))


def require_plan_editor(plan: TrainingPlan, user):
    """Правит план личный тренер, пока план у него (черновик или возвращён);
    штаб — всегда."""
    if is_head_staff(user):
        return
    if _is_personal_coach_of(plan.member, user):
        if plan.status in (TrainingPlan.STATUS_DRAFT, TrainingPlan.STATUS_RETURNED):
            return
        raise NationalError("План на согласовании или согласован — правка закрыта.", 403)
    raise NationalError("План правят личный тренер спортсмена и тренерский штаб.", 403)


def can_edit_plan(plan: TrainingPlan, user) -> bool:
    try:
        require_plan_editor(plan, user)
    except NationalError:
        return False
    return True


def create_plan(member: NationalTeamMember, data: dict, by) -> TrainingPlan:
    if not (is_head_staff(by) or _is_personal_coach_of(member, by)):
        raise NationalError("План составляют личный тренер спортсмена и тренерский штаб.", 403)
    starts, ends = data.get("starts_on"), data.get("ends_on")
    if not starts or not ends:
        raise NationalError("У плана нужен период: начало и окончание.")
    if ends < starts:
        raise NationalError("Окончание периода раньше начала.")
    return TrainingPlan.objects.create(
        member=member, starts_on=starts, ends_on=ends, goal=(data.get("goal") or "").strip(), created_by=by,
    )


def update_plan(plan: TrainingPlan, data: dict, by) -> TrainingPlan:
    require_plan_editor(plan, by)
    for f in ("starts_on", "ends_on"):
        if data.get(f):
            setattr(plan, f, data[f])
    if "goal" in data:
        plan.goal = (data["goal"] or "").strip()
    if plan.ends_on < plan.starts_on:
        raise NationalError("Окончание периода раньше начала.")
    plan.save()
    return plan


def delete_plan(plan: TrainingPlan, by):
    require_plan_editor(plan, by)
    plan.delete()


def submit_plan(plan: TrainingPlan, by) -> TrainingPlan:
    if not _is_personal_coach_of(plan.member, by):
        raise NationalError("На согласование план отправляет личный тренер спортсмена.", 403)
    if plan.status not in (TrainingPlan.STATUS_DRAFT, TrainingPlan.STATUS_RETURNED):
        raise NationalError("План уже на согласовании или согласован.")
    if not plan.items.exists():
        raise NationalError("В плане нет ни одного пункта.")
    plan.status = TrainingPlan.STATUS_SUBMITTED
    plan.save(update_fields=["status", "updated_at"])
    return plan


def review_plan(plan: TrainingPlan, approve: bool, comment: str, by) -> TrainingPlan:
    require_coach(by)
    if plan.status != TrainingPlan.STATUS_SUBMITTED:
        raise NationalError("План не ждёт согласования.")
    comment = (comment or "").strip()
    if not approve and not comment:
        raise NationalError("Вернуть план можно только с комментарием — иначе неясно, что править.")
    plan.status = TrainingPlan.STATUS_APPROVED if approve else TrainingPlan.STATUS_RETURNED
    plan.review_comment = "" if approve else comment
    plan.reviewed_by = by
    plan.reviewed_at = timezone.now()
    plan.save()
    return plan


def add_item(plan: TrainingPlan, data: dict, by) -> PlanItem:
    require_plan_editor(plan, by)
    kind = _choice(data.get("kind") or PlanItem.KIND_WORK, PlanItem.KIND_CHOICES, "Тип")
    if kind == PlanItem.KIND_WORK:
        title = (data.get("title") or "").strip()
        if not title:
            raise NationalError("Пункт плана без содержания.")
        due, starts_on = _work_dates(data.get("starts_on"), data.get("due"))
        return PlanItem.objects.create(plan=plan, kind=kind, title=title, due=due, starts_on=starts_on)
    # Сбор и старт — только из календаря подготовки: сроки приходят оттуда (Э11.5).
    event = TrainingEvent.objects.filter(id=data.get("event_id") or None).first()
    if event is None or event.kind != kind:
        raise NationalError("Сбор и старт выбираются из календаря подготовки.")
    return PlanItem.objects.create(
        plan=plan, kind=kind, event=event, title=(data.get("title") or "").strip() or event.title, due=event.starts_on,
    )


def _work_dates(starts_on, due):
    """Даты работы: начало не позже срока; начало без срока не бывает; начало,
    равное сроку, не хранится — работа на одном дне."""
    if starts_on and not due:
        raise NationalError("У работы с началом должен быть срок.")
    if starts_on and starts_on > due:
        raise NationalError("Начало работы позже срока.")
    return due or None, (starts_on if starts_on and starts_on != due else None)


def move_item(item: PlanItem, starts_on, due, by) -> PlanItem:
    """Новые даты пункта — растягивание и сдвиг на доске ✳ (22.11.2026). Права —
    те же, что на правку плана. Сроки сбора и старта — даты мероприятия
    календаря подготовки, общие для всей команды: с пункта их не поменять."""
    require_plan_editor(item.plan, by)
    if item.kind != PlanItem.KIND_WORK:
        raise NationalError("Сроки сбора и старта меняются в календаре подготовки.")
    if not due:
        raise NationalError("Срок обязателен.")
    item.due, item.starts_on = _work_dates(starts_on, due)
    item.save(update_fields=["due", "starts_on"])
    return item


def set_item_done(item: PlanItem, done: bool, by) -> PlanItem:
    if not (is_head_staff(by) or _is_personal_coach_of(item.plan.member, by)):
        raise NationalError("Выполнение отмечают личный тренер и тренерский штаб.", 403)
    item.done = bool(done)
    item.done_at = timezone.now() if item.done else None
    item.save(update_fields=["done", "done_at"])
    return item


def delete_item(item: PlanItem, by):
    require_plan_editor(item.plan, by)
    item.delete()


def current_plan(member: NationalTeamMember) -> Optional[TrainingPlan]:
    """Текущий план: период включает сегодня, иначе последний по началу."""
    today = timezone.localdate()
    return member.plans.filter(starts_on__lte=today, ends_on__gte=today).first() or member.plans.first()


def plan_progress(member: NationalTeamMember) -> Optional[dict]:
    """«7 из 9» по текущему плану (флоу Э11.1: доля, а не признак)."""
    plan = current_plan(member)
    if plan is None:
        return None
    items = list(plan.items.all())
    return {"plan_id": str(plan.id), "done": sum(i.done for i in items), "total": len(items), "status": plan.status}


# ── Рапорты на командирование ───────────────────────────────────────────────

def can_write_reports(user) -> bool:
    return bool(regional_coach_regions(user) or is_head_staff(user) or team_coach_groups(user))


def visible_reports(user):
    from django.db.models import Q

    if not (can_write_reports(user)):
        raise NationalError("Рапорты — тренерскому штабу и старшим тренерам регионов.", 403)
    qs = TravelReport.objects.select_related("event", "author").prefetch_related("athletes", "actions__by")
    if is_head_staff(user):
        return qs
    return qs.filter(Q(author=user) | Q(age_group__in=team_coach_groups(user))).distinct()


def report_candidates(q: str, by, limit: int = 30):
    """Кого можно вписать в рапорт: старшему тренеру региона — спортсменов его
    региона, штабу — любого с рейтинговой карточкой."""
    if not can_write_reports(by):
        raise NationalError("Рапорты — тренерскому штабу и старшим тренерам регионов.", 403)
    qs = RatingProfile.objects.select_related("user")
    if not (is_head_staff(by) or team_coach_groups(by)):
        qs = qs.filter(region__in=regional_coach_regions(by))
    if q.strip():
        qs = qs.filter(user__name__icontains=q.strip())
    return [p.user for p in qs.order_by("-value", "user__name")[:limit]]


def _report_athletes(ids, by) -> List[User]:
    ids = [str(i) for i in (ids or [])]
    if not ids:
        return []
    allowed = {str(u.id): u for u in report_candidates("", by, limit=100000)}
    missing = [i for i in ids if i not in allowed]
    if missing:
        raise NationalError("В рапорт можно вписать только спортсменов своего региона с рейтинговой карточкой.")
    return [allowed[i] for i in ids]


def create_report(data: dict, file, by) -> TravelReport:
    if not can_write_reports(by):
        raise NationalError("Рапорты пишут тренерский штаб и старшие тренеры регионов.", 403)
    event = TrainingEvent.objects.filter(id=data.get("event_id") or None).first()
    if event is None:
        raise NationalError("Рапорт подаётся по мероприятию календаря подготовки.")
    age_group = _choice(data.get("age_group"), NationalTeamMember.AGE_CHOICES, "Возрастная группа")
    text = (data.get("text") or "").strip()
    if not text and not file:
        raise NationalError("В рапорте нужен текст или файл.")
    athletes = _report_athletes(data.get("athlete_ids"), by)
    with transaction.atomic():
        report = TravelReport.objects.create(event=event, age_group=age_group, author=by, text=text)
        if file:
            report.file.save(file.name, file, save=True)
        report.athletes.set(athletes)
        ReportAction.objects.create(report=report, action=ReportAction.ACTION_SUBMITTED, by=by)
    return report


def resubmit_report(report: TravelReport, data: dict, file, by) -> TravelReport:
    if report.author_id != by.id:
        raise NationalError("Доработать рапорт может только его автор.", 403)
    if report.status != TravelReport.STATUS_RETURNED:
        raise NationalError("Рапорт не на доработке.")
    with transaction.atomic():
        if "text" in data:
            report.text = (data.get("text") or "").strip()
        if "athlete_ids" in data:
            report.athletes.set(_report_athletes(data.get("athlete_ids"), by))
        if file:
            report.file.save(file.name, file, save=False)
        if not report.text and not report.file:
            raise NationalError("В рапорте нужен текст или файл.")
        report.status = TravelReport.STATUS_SUBMITTED
        report.save()
        ReportAction.objects.create(report=report, action=ReportAction.ACTION_RESUBMITTED, by=by,
                                    comment=(data.get("comment") or "").strip())
    return report


DECISIONS = {
    "approve": (TravelReport.STATUS_APPROVED, ReportAction.ACTION_APPROVED),
    "return": (TravelReport.STATUS_RETURNED, ReportAction.ACTION_RETURNED),
    "reject": (TravelReport.STATUS_REJECTED, ReportAction.ACTION_REJECTED),
}


def decide_report(report: TravelReport, decision: str, comment: str, by) -> TravelReport:
    require_coach(by)
    if decision not in DECISIONS:
        raise NationalError("Неизвестное решение.")
    if report.status != TravelReport.STATUS_SUBMITTED:
        raise NationalError("Рапорт не ждёт решения.")
    comment = (comment or "").strip()
    if decision != "approve" and not comment:
        raise NationalError("Вернуть или отклонить рапорт можно только с комментарием.")
    status, action = DECISIONS[decision]
    with transaction.atomic():
        report.status = status
        report.save(update_fields=["status", "updated_at"])
        ReportAction.objects.create(report=report, action=action, by=by, comment=comment)
    return report


# ── История подготовки ──────────────────────────────────────────────────────

def history(member: NationalTeamMember, by) -> List[dict]:
    """Сборы и старты из согласованных рапортов и турниры с изменением
    рейтинга — одной лентой, новые первыми (флоу Э11.2, «История подготовки»)."""
    require_plans(member, by)
    rows = []
    reports = TravelReport.objects.filter(status=TravelReport.STATUS_APPROVED, athletes=member.user).select_related("event")
    seen = set()
    for r in reports:
        if r.event_id in seen:
            continue
        seen.add(r.event_id)
        e = r.event
        rows.append({"kind": e.kind, "date": e.starts_on, "ends_on": e.ends_on, "title": e.title, "city": e.city, "delta": None})
    entries = (
        RatingEntry.objects.filter(profile__user=member.user, is_reverted=False, tournament__isnull=False)
        .select_related("tournament")
    )
    by_tournament = {}
    for x in entries:
        row = by_tournament.setdefault(x.tournament_id, {
            "kind": "tournament", "date": x.occurred_at, "ends_on": None, "title": x.tournament.name,
            "city": getattr(x.tournament, "city", "") or "", "delta": 0, "wins": 0, "losses": 0,
        })
        row["delta"] += x.delta
        row["date"] = min(row["date"], x.occurred_at)
        if x.won is True:
            row["wins"] += 1
        elif x.won is False:
            row["losses"] += 1
    rows.extend(by_tournament.values())
    rows.sort(key=lambda r: r["date"], reverse=True)
    return rows


# ── УМО ✳ (22.11.2026) — ведёт врач сборной ─────────────────────────────────

def can_read_umo(user, member: "NationalTeamMember | None" = None) -> bool:
    """УМО читают врач и штаб сборной (главный тренер, консультант), а сам
    спортсмен — своё; кроме врача — только смотреть ✳ (22.11.2026, решения
    владельца продукта)."""
    return is_doctor(user) or is_head_staff(user) or (member is not None and is_self(member, user))

UMO_TEXT = ("stage", "load_note", "illnesses", "conditions", "supplements", "note")


def _umo_context(exam, data: dict):
    from decimal import Decimal, InvalidOperation

    for f in UMO_TEXT:
        if f in data:
            setattr(exam, f, (data.get(f) or "").strip())
    if "height_cm" in data:
        raw = str(data.get("height_cm") or "").strip().replace(",", ".")
        try:
            h = Decimal(raw) if raw else None
        except InvalidOperation:
            raise NationalError("Рост — числом, в сантиметрах.")
        if h is not None and not (Decimal(80) <= h <= Decimal(250)):  # границы наши
            raise NationalError("Рост — от 80 до 250 см.")
        exam.height_cm = h


def _umo_values(exam, values):
    from . import umo
    from .models import UmoValue

    try:
        clean = umo.clean_values(values or {})
    except umo.UmoError as e:
        raise NationalError(str(e))
    for code, text in clean.items():
        if text:
            UmoValue.objects.update_or_create(exam=exam, code=code, defaults={"value": text})
        else:
            UmoValue.objects.filter(exam=exam, code=code).delete()


@transaction.atomic
def add_umo_exam(member: NationalTeamMember, data: dict, by):
    from .models import UmoExam

    require_doctor(by)
    if not data.get("date"):
        raise NationalError("У осмотра нужна дата.")
    exam = UmoExam(member=member, date=data["date"], created_by=by)
    _umo_context(exam, data)
    exam.save()
    _umo_values(exam, data.get("values"))
    return exam


@transaction.atomic
def update_umo_exam(exam, data: dict, by):
    require_doctor(by)
    if data.get("date"):
        exam.date = data["date"]
    _umo_context(exam, data)
    exam.save()
    _umo_values(exam, data.get("values"))
    return exam


def delete_umo_exam(exam, by):
    require_doctor(by)
    exam.delete()


# ── Изображения карточки ✳ (22.11.2026) — аватар и фигура для баннера ───────

IMAGE_KINDS = ("avatar", "figure")
IMAGE_MAX = 8 * 1024 * 1024  # 8 МБ — предел наш


def set_member_image(member: NationalTeamMember, kind: str, file, by):
    """Загрузить или снять (`file=None`) снимок. Меняет тот, кто ведёт состав."""
    if not is_head_staff(by):
        raise NationalError("Снимки меняет штаб сборной.", 403)
    if kind not in IMAGE_KINDS:
        raise NationalError("Снимок — аватар или фигура.")
    field = getattr(member, kind)
    if file is None:
        if field:
            field.delete(save=False)
        setattr(member, kind, "")
        member.save(update_fields=[kind])
        return member
    if file.size > IMAGE_MAX:
        raise NationalError("Снимок — не больше 8 МБ.")
    if (getattr(file, "content_type", "") or "").split("/")[0] != "image":
        raise NationalError("Нужен снимок: JPG, PNG или WebP.")
    if field:
        field.delete(save=False)
    field.save(file.name, file, save=False)
    member.save(update_fields=[kind])
    return member
