"""Правила национальной команды ✳ (19.11.2026, NATIONAL.md). Ручки
(`views.py`) только переводят их в HTTP.

Кто что может (ROLES.md, роли 11 и 21; флоу Э11.2):
- главный тренер — состав сборной и планы подготовки; из медкарты видит только
  допуск и действующие ограничения нагрузки, без диагнозов;
- врач сборной — видит состав, ведёт медкарту целиком; планов не видит ✳ (наше:
  совещание не сказало, кто читает карточки — QUESTIONS §20.1).
"""
from datetime import date
from typing import Optional

from django.utils import timezone

from rating.models import RatingProfile
from users.models import Role, User
from users.permissions import has_role

from .models import MedicalRecord, NationalTeamMember, PlanItem, TrainingPlan


class NationalError(Exception):
    def __init__(self, detail: str, status: int = 400):
        super().__init__(detail)
        self.detail = detail
        self.status = status


def is_head_coach(user) -> bool:
    return has_role(user, Role.KIND_NATIONAL_HEAD_COACH)


def is_doctor(user) -> bool:
    return has_role(user, Role.KIND_NATIONAL_DOCTOR)


def require_staff(user):
    if not (is_head_coach(user) or is_doctor(user)):
        raise NationalError("Только главный тренер и врач сборной.", 403)


def require_coach(user):
    if not is_head_coach(user):
        raise NationalError("Только главный тренер национальной команды.", 403)


def require_doctor(user):
    if not is_doctor(user):
        raise NationalError("Медицинскую карту ведёт врач сборной.", 403)


# ── Состав ──────────────────────────────────────────────────────────────────

def _choice(value, choices, label):
    if value not in dict(choices):
        raise NationalError("Неизвестное значение поля «%s»." % label)
    return value


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


# ── Планы подготовки ────────────────────────────────────────────────────────

def create_plan(member: NationalTeamMember, data: dict, by) -> TrainingPlan:
    require_coach(by)
    starts, ends = data.get("starts_on"), data.get("ends_on")
    if not starts or not ends:
        raise NationalError("У плана нужен период: начало и окончание.")
    if ends < starts:
        raise NationalError("Окончание периода раньше начала.")
    return TrainingPlan.objects.create(
        member=member, starts_on=starts, ends_on=ends, goal=(data.get("goal") or "").strip(), created_by=by,
    )


def update_plan(plan: TrainingPlan, data: dict, by) -> TrainingPlan:
    require_coach(by)
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
    require_coach(by)
    plan.delete()


def add_item(plan: TrainingPlan, data: dict, by) -> PlanItem:
    require_coach(by)
    title = (data.get("title") or "").strip()
    if not title:
        raise NationalError("Пункт плана без содержания.")
    return PlanItem.objects.create(
        plan=plan, kind=_choice(data.get("kind") or PlanItem.KIND_WORK, PlanItem.KIND_CHOICES, "Тип"),
        title=title, due=data.get("due") or None,
    )


def set_item_done(item: PlanItem, done: bool, by) -> PlanItem:
    require_coach(by)
    item.done = bool(done)
    item.done_at = timezone.now() if item.done else None
    item.save(update_fields=["done", "done_at"])
    return item


def delete_item(item: PlanItem, by):
    require_coach(by)
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
    return {"plan_id": str(plan.id), "done": sum(i.done for i in items), "total": len(items)}
