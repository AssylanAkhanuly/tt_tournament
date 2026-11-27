"""Полномочия главного судьи ✳ (24.11.2026, flows/07 «Главный секретарь»,
flows/08 «Заместитель главного судьи»; решения совещания 04.11.2026
`[1:31:43–1:34:21]`, `[1:58:22]`).

- Ход турнира (ввод и исправление счёта) ведёт **один** человек — держатель
  полномочий. По умолчанию это главный судья.
- Передаёт только главный судья — главному секретарю или заместителю своего
  турнира; пока переданы, главный судья всё видит, но не правит.
- Вернуть может держатель («закончил — нажимает обратно» `[1:32:37]`, наше
  чтение) или сам главный судья.
- Итоговый протокол и завершение турнира не переходят — они остаются у
  главного судьи (`manual_results`, протокол).
- Держатель, которого сняли с должности, полномочий не держит — они снова у
  главного судьи (строку в базе не трогаем: снятие пишет журнал состава).

Чего ещё нет: уведомления «вам передали полномочия», передачи председателем
ГСК, когда главный судья не явился (flows/08 ⚠ — совещание не разобрало).
"""
from typing import Optional

from django.db import transaction
from django.utils import timezone

from users.models import Role

from . import roster
from .models import AuthorityLog, Tournament

# Кому можно передать — должности бригады турнира.
DELEGATES = (Role.KIND_CHIEF_SECRETARY, Role.KIND_DEPUTY_CHIEF_REFEREE)
POSITION_LABEL = {
    Role.KIND_CHIEF_REFEREE: "Главный судья",
    Role.KIND_CHIEF_SECRETARY: "Главный секретарь",
    Role.KIND_DEPUTY_CHIEF_REFEREE: "Заместитель главного судьи",
}


class AuthorityError(Exception):
    """Нельзя; текст — для человека."""


class AuthorityDenied(AuthorityError):
    """Нет права на действие."""


def position(t: Tournament, user) -> Optional[str]:
    """Должность человека в коллегии этого турнира; не в коллегии — `None`."""
    if not user or not getattr(user, "is_authenticated", False):
        return None
    role = roster.referee_role(t, user.id)
    return role.kind if role else None


def chief(t: Tournament):
    return next((r.user for r in roster.referees(t) if r.kind == Role.KIND_CHIEF_REFEREE), None)


def _active_holder_id(t: Tournament):
    """Держатель, если он всё ещё секретарь или заместитель турнира; иначе `None`."""
    if not t.authority_holder_id:
        return None
    role = roster.referee_role(t, t.authority_holder_id)
    return t.authority_holder_id if role and role.kind in DELEGATES else None


def transferred(t: Tournament) -> bool:
    return _active_holder_id(t) is not None


def can_run(t: Tournament, user) -> bool:
    """Ведёт ли человек ход турнира сейчас (правит счёт)."""
    if not user or not getattr(user, "is_authenticated", False):
        return False
    holder = _active_holder_id(t)
    if holder:
        return str(holder) == str(user.id)
    return position(t, user) == Role.KIND_CHIEF_REFEREE


@transaction.atomic
def transfer(t: Tournament, by, user_id) -> None:
    if position(t, by) != Role.KIND_CHIEF_REFEREE:
        raise AuthorityDenied("Передать полномочия может только главный судья турнира.")
    if transferred(t):
        raise AuthorityError("Полномочия уже переданы — сначала верните их.")
    role = roster.referee_role(t, user_id)
    if role is None or role.kind not in DELEGATES:
        raise AuthorityError("Полномочия передаются главному секретарю или заместителю этого турнира.")
    t.authority_holder_id = role.user_id
    t.authority_since = timezone.now()
    t.save(update_fields=["authority_holder", "authority_since"])
    AuthorityLog.objects.create(tournament=t, action=AuthorityLog.ACTION_TRANSFER, holder_id=role.user_id, by=by)


@transaction.atomic
def take_back(t: Tournament, by) -> None:
    holder = _active_holder_id(t)
    if not holder:
        raise AuthorityError("Полномочия и так у главного судьи.")
    if str(by.id) != str(holder) and position(t, by) != Role.KIND_CHIEF_REFEREE:
        raise AuthorityDenied("Вернуть полномочия может тот, у кого они, или главный судья.")
    t.authority_holder = None
    t.authority_since = timezone.now()
    t.save(update_fields=["authority_holder", "authority_since"])
    AuthorityLog.objects.create(tournament=t, action=AuthorityLog.ACTION_RETURN, holder_id=holder, by=by)


def can_see(t: Tournament, user) -> bool:
    """Кто видит полосу полномочий: бригада турнира, председатель ГСК, администратор."""
    from users.permissions import has_role

    return position(t, user) in (Role.KIND_CHIEF_REFEREE, *DELEGATES) or has_role(
        user, Role.KIND_GSK_CHAIRMAN, Role.KIND_FEDERATION_ADMIN
    )


def _who(user, kind):
    return {"id": str(user.id), "name": user.name, "position": kind, "position_label": POSITION_LABEL.get(kind, "")} if user else None


def snapshot(t: Tournament, user) -> dict:
    holder_id = _active_holder_id(t)
    me = position(t, user)
    if holder_id:
        role = roster.referee_role(t, holder_id)
        holder = _who(role.user, role.kind)
    else:
        holder = _who(chief(t), Role.KIND_CHIEF_REFEREE)
    log = t.authority_log.select_related("holder", "by")[:20]
    return {
        "holder": holder,
        "transferred": bool(holder_id),
        "since": t.authority_since.isoformat() if (holder_id and t.authority_since) else None,
        "can_run": can_run(t, user),
        "can_transfer": me == Role.KIND_CHIEF_REFEREE and not holder_id,
        "can_return": bool(holder_id) and (me == Role.KIND_CHIEF_REFEREE or str(holder_id) == str(user.id)),
        "candidates": (
            [_who(r.user, r.kind) for r in roster.referees(t) if r.kind in DELEGATES]
            if me == Role.KIND_CHIEF_REFEREE and not holder_id
            else []
        ),
        "log": [
            {
                "action": e.action,
                "holder": e.holder.name if e.holder_id else "",
                "by": e.by.name if e.by_id else "",
                "at": e.at.isoformat(),
            }
            for e in log
        ],
    }
