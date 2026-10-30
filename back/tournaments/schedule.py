"""Расписание турнира «группы + плей-офф» ✳ (30.10.2026, решение владельца
продукта; ТЗ §4.5–4.6, ENGINE.md R3). Ручки (`views.py`) только принимают запрос
и отдают ответ — правила здесь.

Строит и правит только главный судья турнира. Ход: состав собран → главный
судья задаёт параметры (столов, начало и конец игрового дня, длительность
матча) и формирует **черновик**: группы змейкой по рейтингу, внутри группы
пары по кругам (каждый с каждым, в круге игрок играет не больше раза), у
каждого матча — время, стол и судья стола. Черновик он правит: переносит
игрока в другую группу (пары и время этих групп считаются заново), меняет
судью, стол и время матча — сервер отбивает занятых в то же время. Затем
**отправляет**: расписание и состав запираются, турнир начинается. Отправленное
не меняется (решение владельца продукта).

Слот — одно время начала: в нём матчей не больше, чем столов и судей стола
(у каждого матча свой стол и свой судья), игрок и судья — в одном матче слота.
Слоты идут шагом длительности матча от начала игрового дня; не влезло до конца
дня — со следующего дня. Длительность матча — норматив («матч ≈ N минут»),
а не факт: истории фактического времени матчей нет (ENGINE.md R3, QUESTIONS 7.2).

Чего ещё нет: плей-офф по итогам групп (движок есть — `bracket.
generate_playoff_from_groups`, экрана нет), перерывов и отдыха между матчами
игрока, трансляционных столов, расписания на несколько разрядов сразу.
"""
import datetime
import math
from typing import Hashable, Iterable, Optional, Sequence

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from users.models import Role

from . import playoff, roster
from .models import GroupMatch, GroupParticipant, Tournament, TournamentGroup

# ── Чистая часть (без базы) ───────────────────────────────────────────────


def snake_split(items: Sequence, num_groups: int) -> list:
    """Змейка: по порядку посева слева направо, потом справа налево — сильные
    по одному в группу, группы ровные. 16 по 4 → A:[1,8,9,16] B:[2,7,10,15] …"""
    groups = [[] for _ in range(num_groups)]
    for seed, item in enumerate(items):
        row, pos = divmod(seed, num_groups)
        groups[pos if row % 2 == 0 else num_groups - 1 - pos].append(item)
    return groups


def round_robin_rounds(players: Sequence) -> list:
    """Круговая по кругам — «многоугольник»: первый на месте, остальные по
    кругу. В круге игрок играет не больше раза; при нечётном числе каждый круг
    кто-то отдыхает. Возвращает круги — списки пар."""
    ring = list(players)
    if len(ring) < 2:
        return []
    if len(ring) % 2:
        ring.append(None)  # отдых
    n = len(ring)
    rounds = []
    for _ in range(n - 1):
        pairs = [(ring[i], ring[n - 1 - i]) for i in range(n // 2)]
        rounds.append([(a, b) for a, b in pairs if a is not None and b is not None])
        ring = [ring[0], ring[-1]] + ring[1:-1]
    return rounds


def assign_slots(matches: Iterable[tuple], tables: int, referees: Sequence[Hashable]) -> list:
    """Раскладка матчей `(ключ, игрок1, игрок2)` по слотам, столам и судьям.

    Жадно по порядку: в слот берётся следующий матч, если оба игрока в этом слоте
    свободны и их более ранние матчи уже разложены — так игрок играет свои матчи в
    том порядке, в каком их отдали. В слоте не больше `min(столы, судьи)` матчей.
    Судья — наименее загруженный из свободных, и не тот, кто в этом слоте играет
    сам (один человек бывает и игроком, и судьёй стола): не хватает таких судей —
    лишние матчи слота уходят в следующий. Нагрузка ровная. Возвращает
    `(ключ, слот, стол, судья)`."""
    if not referees:
        raise ValueError("Нет судей стола — матчи некому судить.")
    capacity = min(tables, len(referees))
    if capacity < 1:
        raise ValueError("Нужен хотя бы один стол.")
    queue = list(matches)
    load = {r: 0 for r in referees}
    order = {r: i for i, r in enumerate(referees)}
    out, slot = [], 0
    while queue:
        busy, blocked, picked = set(), set(), []
        for m in queue:
            if len(picked) == capacity:
                break
            _, a, b = m
            if {a, b} & (busy | blocked):
                blocked |= {a, b}  # их следующие матчи — не раньше этого
                continue
            picked.append(m)
            busy |= {a, b}
        # Судит тот, кто в этом слоте не играет; не хватает — последние матчи ждут.
        free = [r for r in sorted(referees, key=lambda r: (load[r], order[r])) if r not in busy]
        while len(free) < len(picked):
            picked.pop()
            if not picked:
                raise ValueError("Все судьи стола играют в одно время — матч некому судить.")
            busy = {x for m in picked for x in m[1:]}
            free = [r for r in sorted(referees, key=lambda r: (load[r], order[r])) if r not in busy]
        refs = free[: len(picked)]
        for table, (m, ref) in enumerate(zip(picked, refs), start=1):
            out.append((m[0], slot, table, ref))
            load[ref] += 1
        taken = {id(m) for m in picked}
        queue = [m for m in queue if id(m) not in taken]
        slot += 1
    return out


def play_slots(days: Sequence[tuple], minutes: int, count: int) -> list:
    """Начала первых `count` слотов по игровым дням ✳ (30.10.2026, решение
    владельца продукта): день — `(дата, начало, конец)`, часы у каждого свои.
    Дни идут по порядку дат, слоты — шагом матча от начала дня; матч целиком
    укладывается в день. Не поместились — ошибка с числами: дней сами не
    добавляем, их задаёт главный судья."""
    if not days:
        raise ValueError("Нужен хотя бы один игровой день.")
    if minutes < 1:
        raise ValueError("Длительность матча — хотя бы минута.")
    dates = [d for d, _, _ in days]
    if len(set(dates)) != len(dates):
        raise ValueError("Один и тот же день указан дважды.")
    slots = []
    for day, start, end in sorted(days, key=lambda d: d[0]):
        first = datetime.datetime.combine(day, start)
        span = datetime.datetime.combine(day, end) - first
        per_day = int(span.total_seconds() // (minutes * 60))
        if per_day < 1:
            raise ValueError(f"Игровой день {day:%d.%m} короче матча.")
        slots += [first + datetime.timedelta(minutes=k * minutes) for k in range(per_day)]
    if len(slots) < count:
        raise ValueError(
            f"Матчи не помещаются в игровые дни: слотов нужно {count}, есть {len(slots)} — добавьте день, часы или столы."
        )
    return slots[:count]


# ── С базой ───────────────────────────────────────────────────────────────

LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
DRAFT, FINAL = "draft", "final"


class ScheduleError(Exception):
    """Нельзя; текст — для человека."""


def is_chief(tournament: Tournament, user) -> bool:
    """Главный судья этого турнира (роль с областью «турнир»)."""
    if not user or not user.is_authenticated:
        return False
    role = roster.referee_role(tournament, user.id)
    return role is not None and role.kind == Role.KIND_CHIEF_REFEREE


def table_referees(tournament: Tournament) -> list:
    """Судьи стола турнира — они и судят матчи."""
    return [r.user for r in roster.referees(tournament) if r.kind == Role.KIND_REFEREE]


def _draft_only(t: Tournament):
    if t.schedule_status == FINAL:
        raise ScheduleError("Расписание отправлено — его уже не изменить.")
    if t.schedule_status != DRAFT:
        raise ScheduleError("Черновика расписания ещё нет.")


def _rebuild_matches(group: TournamentGroup) -> None:
    """Пары группы заново — по кругам, по посеву внутри группы."""
    GroupMatch.objects.filter(group=group).delete()
    players = [gp.user for gp in GroupParticipant.objects.filter(group=group).order_by("seed", "id").select_related("user")]
    number = 1
    for r, pairs in enumerate(round_robin_rounds(players), start=1):
        for a, b in pairs:
            GroupMatch.objects.create(
                group=group, match_number=number, round_number=r, player1=a, player2=b, status=GroupMatch.PENDING
            )
            number += 1


def _timetable(t: Tournament) -> None:
    """Время, стол и судья каждому матчу: круг за кругом, группы вперемешку."""
    matches = list(
        GroupMatch.objects.filter(group__tournament=t).select_related("group").order_by(
            "round_number", "group__order", "match_number"
        )
    )
    refs = table_referees(t)
    if not matches:
        return
    by_id = {m.id: m for m in matches}
    ref_by_id = {r.id: r for r in refs}
    try:
        placed = assign_slots([(m.id, m.player1_id, m.player2_id) for m in matches], t.schedule_tables, [r.id for r in refs])
        starts = play_slots(_days(t.schedule_days), t.schedule_match_minutes, max(slot for _, slot, _, _ in placed) + 1)
        for key, slot, table, ref in placed:
            m = by_id[key]
            m.table_number = table
            m.referee = ref_by_id[ref]
            m.scheduled_at = timezone.make_aware(starts[slot])
    except ValueError as e:
        raise ScheduleError(str(e))
    GroupMatch.objects.bulk_update(matches, ["table_number", "referee", "scheduled_at"])


def _parse_time(value, name):
    try:
        return datetime.time.fromisoformat(str(value))
    except (TypeError, ValueError):
        raise ScheduleError(f"{name} — время ЧЧ:ММ.")


def _days(stored) -> list:
    """Игровые дни из записи турнира: `[{date, start, end}]` → кортежи."""
    return [
        (datetime.date.fromisoformat(d["date"]), datetime.time.fromisoformat(d["start"]), datetime.time.fromisoformat(d["end"]))
        for d in stored
    ]


# Часы нового игрового дня, если их не задали, — наши, подлежат утверждению.
DEFAULT_DAY = ("10:00", "18:00")


def tournament_days(t: Tournament) -> list:
    """Игровые дни по умолчанию — даты турнира (начало … окончание) с часами
    `DEFAULT_DAY`; без дат — сегодня."""
    first = timezone.localdate(t.starts_at) if t.starts_at else timezone.localdate()
    last = max(t.ends_at, first) if t.ends_at else first  # окончание — дата
    count = max(1, (last - first).days + 1)
    return [
        {"date": (first + datetime.timedelta(days=i)).isoformat(), "start": DEFAULT_DAY[0], "end": DEFAULT_DAY[1]}
        for i in range(count)
    ]


def _clean_days(days) -> list:
    """Дни с экрана → запись: дата ГГГГ-ММ-ДД, часы ЧЧ:ММ, конец позже начала,
    без повторов, по порядку дат."""
    if not isinstance(days, list) or not days:
        raise ScheduleError("Нужен хотя бы один игровой день.")
    out = []
    for d in days:
        if not isinstance(d, dict):
            raise ScheduleError("Игровой день — дата и часы.")
        try:
            date = datetime.date.fromisoformat(str(d.get("date")))
        except ValueError:
            raise ScheduleError("Дата игрового дня — ГГГГ-ММ-ДД.")
        start, end = _parse_time(d.get("start"), "Начало дня"), _parse_time(d.get("end"), "Конец дня")
        if end <= start:
            raise ScheduleError(f"{date:%d.%m}: конец игрового дня — позже начала.")
        out.append({"date": date.isoformat(), "start": start.strftime("%H:%M"), "end": end.strftime("%H:%M")})
    if len({d["date"] for d in out}) != len(out):
        raise ScheduleError("Один и тот же день указан дважды.")
    return sorted(out, key=lambda d: d["date"])


@transaction.atomic
def build(t: Tournament, *, tables, match_minutes, days=None) -> None:
    """Черновик заново: группы, пары, время, столы, судьи. Прежний черновик — прочь."""
    if t.schedule_status == FINAL:
        raise ScheduleError("Расписание отправлено — его уже не изменить.")
    if t.format != Tournament.FORMAT_GROUP:
        raise ScheduleError("Расписание пока строится только для формата «Группы и плей-офф».")
    if t.status != Tournament.STATUS_OPEN:
        raise ScheduleError("Турнир уже начат.")
    try:
        tables, match_minutes = int(tables), int(match_minutes)
    except (TypeError, ValueError):
        raise ScheduleError("Столов и длительность матча — числами.")
    if tables < 1:
        raise ScheduleError("Нужен хотя бы один стол.")
    if match_minutes < 1:
        raise ScheduleError("Длительность матча — хотя бы минута.")
    # Дни не пришли — даты турнира с часами по умолчанию.
    days = _clean_days(days) if days is not None else tournament_days(t)
    if not table_referees(t):
        raise ScheduleError("В коллегии нет судей стола — матчи некому судить.")

    # Посев — по рейтингу, как у сеток (`bracket.generate_group_bracket`).
    participants = list(
        t.participants.select_related("user").order_by(F("user__rating_profile__value").desc(nulls_last=True), "joined_at")
    )
    if len(participants) < 2:
        raise ScheduleError("Нужно хотя бы два участника.")

    t.schedule_tables, t.schedule_match_minutes = tables, match_minutes
    t.schedule_days = days
    TournamentGroup.objects.filter(tournament=t).delete()
    size = max(2, t.group_size)
    for idx, members in enumerate(snake_split(participants, math.ceil(len(participants) / size))):
        group = TournamentGroup.objects.create(tournament=t, name=LETTERS[idx % len(LETTERS)], order=idx)
        GroupParticipant.objects.bulk_create(
            [GroupParticipant(group=group, user=tp.user, seed=s) for s, tp in enumerate(members)]
        )
        _rebuild_matches(group)
    _timetable(t)
    t.schedule_status = DRAFT
    t.save(update_fields=["schedule_tables", "schedule_match_minutes", "schedule_days", "schedule_status"])


@transaction.atomic
def move(t: Tournament, user_id, group_id) -> None:
    """Перенести игрока в другую группу: пары обеих групп и всё время — заново."""
    _draft_only(t)
    gp = GroupParticipant.objects.filter(group__tournament=t, user_id=user_id).select_related("group").first()
    target = TournamentGroup.objects.filter(tournament=t, pk=group_id).first()
    if gp is None or target is None:
        raise ScheduleError("Нет такого игрока или группы в турнире.")
    if gp.group_id == target.id:
        return
    source = gp.group
    gp.group = target
    gp.seed = (GroupParticipant.objects.filter(group=target).order_by("-seed").values_list("seed", flat=True).first() or 0) + 1
    gp.save(update_fields=["group", "seed"])
    _rebuild_matches(source)
    _rebuild_matches(target)
    _timetable(t)


@transaction.atomic
def edit_match(t: Tournament, match: GroupMatch, *, referee_id=None, table=None, scheduled_at=None) -> GroupMatch:
    """Судья, стол, время матча вручную. В то же время — ни занятого судьи,
    ни занятого стола, ни занятого игрока."""
    _draft_only(t)
    if referee_id is not None:
        ref = next((r for r in table_referees(t) if str(r.id) == str(referee_id)), None)
        if ref is None:
            raise ScheduleError("Матч судит только судья стола этого турнира.")
        match.referee = ref
    if table is not None:
        try:
            table = int(table)
        except (TypeError, ValueError):
            raise ScheduleError("Стол — числом.")
        if not 1 <= table <= t.schedule_tables:
            raise ScheduleError(f"Стол — от 1 до {t.schedule_tables}.")
        match.table_number = table
    if scheduled_at is not None:
        try:
            when = datetime.datetime.fromisoformat(str(scheduled_at).replace("Z", "+00:00"))
        except ValueError:
            raise ScheduleError("Время — дата и время.")
        match.scheduled_at = when if timezone.is_aware(when) else timezone.make_aware(when)

    same = GroupMatch.objects.filter(group__tournament=t, scheduled_at=match.scheduled_at).exclude(pk=match.pk)
    if same.filter(referee_id=match.referee_id).exists():
        raise ScheduleError("Этот судья в это время судит другой матч.")
    if same.filter(table_number=match.table_number).exists():
        raise ScheduleError("Этот стол в это время занят.")
    players = {match.player1_id, match.player2_id}
    if any({a, b} & players for a, b in same.values_list("player1_id", "player2_id")):
        raise ScheduleError("У игрока в это время другой матч.")
    # Судья, который в это время играет сам (свой матч или соседний), не судит.
    if match.referee_id in players or any(
        match.referee_id in (a, b) for a, b in same.values_list("player1_id", "player2_id")
    ):
        raise ScheduleError("Судья в это время играет сам.")
    match.save(update_fields=["referee", "table_number", "scheduled_at"])
    return match


@transaction.atomic
def finalize(t: Tournament) -> None:
    """Отправить: расписание и состав запираются, турнир начинается."""
    _draft_only(t)
    if GroupMatch.objects.filter(group__tournament=t).filter(
        referee__isnull=True
    ).exists() or GroupMatch.objects.filter(group__tournament=t, scheduled_at__isnull=True).exists():
        raise ScheduleError("Не у всех матчей есть время и судья.")
    t.schedule_status = FINAL
    t.status = Tournament.STATUS_IN_PROGRESS
    t.save(update_fields=["schedule_status", "status"])
    # Отмеченные неявкой до отправки — их матчи сразу неявкой, как при старте групп.
    from .models import TournamentParticipant
    from .standings import apply_absence

    for uid in list(TournamentParticipant.objects.filter(tournament=t, is_absent=True).values_list("user_id", flat=True)):
        apply_absence(t, uid, True)


def _person(u: Optional[object]):
    # Фото — у игроков матча рядом с фамилией ✳ (30.10.2026); нет — заглушка на экране.
    return {"id": str(u.id), "name": u.name, "avatar": u.avatar.url if u.avatar else None} if u else None


def snapshot(t: Tournament, user) -> dict:
    """Расписание для экрана: состояние, параметры, группы, матчи, судьи стола."""
    groups = list(TournamentGroup.objects.filter(tournament=t).order_by("order"))
    members = GroupParticipant.objects.filter(group__in=groups).select_related("user").order_by("seed", "id")
    matches = (
        GroupMatch.objects.filter(group__tournament=t)
        .select_related("player1", "player2", "referee", "group")
        .order_by("scheduled_at", "table_number", "group__order", "match_number")
    )
    # Итог игрока в группе (`standings.recompute_group_standings`: победа 2 очка,
    # поражение 1, поражение неявкой 0) и место: очки, затем победы, затем разница
    # партий. Тай-брейк по личной встрече (правила ITTF) пока не считается —
    # ENGINE.md, «Круговая», открытый вопрос.
    standing = {}
    for g in groups:
        ranked = sorted((m for m in members if m.group_id == g.id), key=playoff.rank_key)
        for place, m in enumerate(ranked, start=1):
            standing[m.id] = {"place": place, "points": m.points, "wins": m.wins, "losses": m.losses, "diff": m.diff}
    members, matches = list(members), list(matches)
    return {
        "status": t.schedule_status,
        "can_edit": t.schedule_status != FINAL and is_chief(t, user),
        # Карта плей-офф по итогам групп ✳ (30.10.2026) — только смотреть.
        "playoff": playoff.playoff_preview(groups, members, matches, _person),
        "settings": {
            "tables": t.schedule_tables,
            # Нет черновика — дни по умолчанию (даты турнира): с них начинают.
            "days": t.schedule_days or tournament_days(t),
            "match_minutes": t.schedule_match_minutes,
        },
        "groups": [
            {
                "id": g.id,
                "name": g.name,
                # По посеву (номер строки и столбца таблицы группы), у каждого — его итог.
                "players": [
                    {**_person(m.user), "standing": standing[m.id]} for m in members if m.group_id == g.id
                ],
            }
            for g in groups
        ],
        "matches": [
            {
                "id": m.id,
                "group": m.group_id,
                "group_name": m.group.name,
                "round": m.round_number,
                "number": m.match_number,
                "player1": _person(m.player1),
                "player2": _person(m.player2),
                "referee": _person(m.referee),
                "table": m.table_number,
                "scheduled_at": m.scheduled_at.isoformat() if m.scheduled_at else None,
                "status": m.status,
                # Счёт — партии, со стороны игрока 1; у неявки победитель есть, счёт условный.
                "score1": m.score1,
                "score2": m.score2,
                "winner": str(m.winner_id) if m.winner_id else None,
                "is_walkover": m.is_walkover,
            }
            for m in matches
        ],
        "referees": [_person(r) for r in table_referees(t)],
    }
