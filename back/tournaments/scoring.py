"""Счёт матча судьёй стола ✳ (22.11.2026, flows/09 Э9.2–Э9.5; главная схема
`flow-tournaments`: «Судья вносит счёт, результат сразу публичный»).

Матч группы, на который главный судья посадил судью (`GroupMatch.referee`,
`schedule.py`), судья стола ведёт со своего телефона **по партиям**: после
каждой партии вносит её счёт, и он сразу виден (матч «идёт», счёт по партиям
обновляется). Когда у одного игрока набралось столько партий, сколько требует
регламент турнира (`games_to_win`), судья подтверждает результат — матч
завершён, таблица группы пересчитана, судья стола счёт больше не правит.
Короткий путь (Э9.3 «записать итог по партиям»): внести только итог матча
(«3 : 1») без партий — такой матч помечен тем, что партий у него нет.

Правила партии (TZ.md §6.1, правила ITTF): партия до 11 очков; при 10 : 10 —
до разрыва в два. То есть у победителя 11, а у проигравшего не больше 9, или
у победителя больше 11 и ровно на два больше.

Правит после подтверждения только главный судья турнира (решение совещания
04.11.2026 `[2:03:04–2:03:33]`) — `correct`: партии или итог заново, пока
турнир не завершён.

Пока результат не подтверждён, судья стола может переключиться на любую
сыгранную партию и поправить её счёт (`set_game`, 23.11.2026): цепочка партий
проверяется заново — правка не может решить матч раньше последней партии.
Очки идущей партии судья набирает на табло «+» / «−»; на сервер они уходят
только партией целиком.

Чего здесь нет: хранения очков идущей партии (они живут на телефоне судьи до
записи партии), счёта по очкам (iScoring, Э9.3 «По очкам»), тайм-аутов и
карточек, неявки со стола, «запросить правку», матчей сетки плей-офф (судей на
них расписание пока не сажает), работы без сети."""
from django.db import transaction
from django.utils import timezone

from .models import GroupMatch, ScoreLog, Tournament


class ScoringError(ValueError):
    """Нельзя; текст — для человека."""


class ScoringDenied(ScoringError):
    """Нет прав на этот матч."""


def valid_game(a, b) -> bool:
    """Счёт одной партии по правилам: до 11, при 10 : 10 — до разрыва в два."""
    if not (isinstance(a, int) and isinstance(b, int)) or a < 0 or b < 0:
        return False
    hi, lo = max(a, b), min(a, b)
    if hi == 11:
        return lo <= 9
    return hi > 11 and hi - lo == 2


def tally(games) -> tuple:
    """Счёт матча по партиям: сколько партий взял каждый."""
    s1 = sum(1 for a, b in games if a > b)
    return s1, len(games) - s1


def _decided(s1: int, s2: int, n: int) -> bool:
    return s1 == n or s2 == n


def _clean_total(score1, score2, n: int) -> tuple:
    try:
        s1, s2 = int(score1), int(score2)
    except (TypeError, ValueError):
        raise ScoringError("Счёт — целые числа.")
    if s1 < 0 or s2 < 0 or max(s1, s2) != n or min(s1, s2) >= n:
        raise ScoringError("Матч до %d побед: у победителя %d, у проигравшего меньше." % (n, n))
    return s1, s2


def _clean_games(games, n: int, finished: bool = True) -> list:
    """Партии целиком: каждая по правилам, лишних партий после решённого матча
    нет. `finished` — матч обязан быть решён последней партией (правка главным
    судьёй); без него — идущий матч (правка партии судьёй стола)."""
    out, s1, s2 = [], 0, 0
    for g in games or []:
        try:
            a, b = int(g[0]), int(g[1])
        except (TypeError, ValueError, IndexError, KeyError):
            raise ScoringError("Партия — два числа.")
        if _decided(s1, s2, n):
            raise ScoringError("Матч уже решён — лишняя партия.")
        if not valid_game(a, b):
            raise ScoringError("Партия %d : %d не по правилам: до 11, при 10 : 10 — до разрыва в два." % (a, b))
        out.append([a, b])
        s1, s2 = tally(out)
    if finished and out and not _decided(s1, s2, n):
        raise ScoringError("Матч до %d побед — не доигран." % n)
    return out


# ── права ────────────────────────────────────────────────────────────────────

def is_table_referee(match: GroupMatch, user) -> bool:
    return bool(user and user.is_authenticated and match.referee_id == user.id)


def is_chief(t: Tournament, user) -> bool:
    from . import schedule

    return schedule.is_chief(t, user)


def _tournament(match: GroupMatch) -> Tournament:
    return match.group.tournament


def _check_live(t: Tournament) -> None:
    from . import schedule

    if t.schedule_status != schedule.FINAL:
        raise ScoringError("Расписание ещё не отправлено.")
    if t.status == Tournament.STATUS_FINISHED:
        raise ScoringError("Турнир завершён — счёт не меняется.")


def _check_referee(match: GroupMatch, user) -> Tournament:
    """Судья стола этого матча, матч ещё не завершён."""
    t = _tournament(match)
    if not is_table_referee(match, user):
        raise ScoringDenied("Счёт вносит судья, назначенный на этот матч.")
    _check_live(t)
    if match.status == GroupMatch.FINISHED:
        raise ScoringError("Результат подтверждён — правит только главный судья.")
    return t


# ── что видит судья ──────────────────────────────────────────────────────────

def my_matches(user):
    """Матчи, на которые судья посажен, в турнирах с отправленным расписанием,
    которые ещё идут. По времени."""
    from . import schedule

    return (
        GroupMatch.objects.filter(
            referee=user,
            group__tournament__schedule_status=schedule.FINAL,
        )
        .exclude(group__tournament__status=Tournament.STATUS_FINISHED)
        .select_related("group__tournament", "player1", "player2", "winner", "result_by")
        .order_by("scheduled_at", "table_number", "match_number")
    )


def _person(u, extras):
    if not u:
        return None
    x = extras.get(u.id, {})
    return {
        "id": str(u.id),
        "name": u.name,
        "avatar": u.avatar.url if u.avatar else None,
        "region": x.get("region", ""),
        # Табло в духе эфирной заставки ✳ (22.11.2026, решение владельца
        # продукта): по краям — фигура игрока из профиля сборной (снимок по
        # пояс); нет снимка — экран рисует заглушку своего пола (`sex`).
        "sex": x.get("sex", ""),
        "figure": x.get("figure"),
    }


def people_extras(user_ids) -> dict:
    """Регион и пол — из рейтинговой карточки, фигура — из профиля сборной."""
    from national.models import NationalTeamMember
    from rating.models import RatingProfile

    out = {
        uid: {"region": region, "sex": sex}
        for uid, region, sex in RatingProfile.objects.filter(user_id__in=user_ids).values_list("user_id", "region", "sex")
    }
    for m in NationalTeamMember.objects.filter(user_id__in=user_ids).exclude(figure=""):
        out.setdefault(m.user_id, {})["figure"] = m.figure.url
    return out


def serialize(match: GroupMatch, user, extras=None) -> dict:
    t = _tournament(match)
    if extras is None:
        extras = people_extras([match.player1_id, match.player2_id])
    finished = match.status == GroupMatch.FINISHED
    live = t.schedule_status == "final" and t.status != Tournament.STATUS_FINISHED
    return {
        "id": match.id,
        "tournament": {"id": str(t.id), "name": t.name},
        "group": match.group.name,
        "round": match.round_number,
        "table": match.table_number,
        "scheduled_at": match.scheduled_at.isoformat() if match.scheduled_at else None,
        "status": match.status,
        "games_to_win": t.games_to_win,
        "player1": _person(match.player1, extras),
        "player2": _person(match.player2, extras),
        "games": match.games or [],
        "score1": match.score1,
        "score2": match.score2,
        "winner_id": str(match.winner_id) if match.winner_id else None,
        "is_walkover": match.is_walkover,
        "result_by": match.result_by.name if match.result_by_id else "",
        "result_at": match.result_at.isoformat() if match.result_at else None,
        "can_score": live and not finished and is_table_referee(match, user),
        "can_correct": live and finished and not match.is_walkover and is_chief(t, user),
    }


# ── действия судьи стола ─────────────────────────────────────────────────────

def _log(t, user, match, action=ScoreLog.ACTION_SCORE):
    ScoreLog.objects.create(
        tournament=t,
        entered_by=user,
        entered_by_name=user.name or "",
        kind="group",
        match_label="%s · М%d" % (match.group.name, match.match_number),
        player1_name=match.player1.name,
        player2_name=match.player2.name,
        score1=match.score1,
        score2=match.score2,
        winner_name=match.winner.name if match.winner_id else "",
        action=action,
    )


@transaction.atomic
def start(match: GroupMatch, user) -> GroupMatch:
    """«Старт матча» (Э9.2): матч идёт."""
    _check_referee(match, user)
    if match.status == GroupMatch.PENDING:
        match.status = GroupMatch.IN_PROGRESS
        match.score1, match.score2 = 0, 0
        match.save(update_fields=["status", "score1", "score2"])
    return match


@transaction.atomic
def record_game(match: GroupMatch, user, a, b) -> GroupMatch:
    """«Записать партию» (Э9.3): счёт партии сразу виден, счёт матча — из партий."""
    t = _check_referee(match, user)
    try:
        a, b = int(a), int(b)
    except (TypeError, ValueError):
        raise ScoringError("Счёт партии — два числа.")
    games = list(match.games or [])
    if _decided(*tally(games), t.games_to_win):
        raise ScoringError("Матч уже решён — подтвердите результат.")
    if not valid_game(a, b):
        raise ScoringError("Партия %d : %d не по правилам: до 11, при 10 : 10 — до разрыва в два." % (a, b))
    games.append([a, b])
    match.games = games
    match.score1, match.score2 = tally(games)
    match.status = GroupMatch.IN_PROGRESS
    match.save(update_fields=["games", "score1", "score2", "status"])
    return match


@transaction.atomic
def set_game(match: GroupMatch, user, index, a, b) -> GroupMatch:
    """Счёт партии по номеру ✳ (23.11.2026, табло судьи: переключиться на
    сыгранную партию и поправить её). Номер следующей партии — то же, что
    «записать партию». Пока результат не подтверждён; вся цепочка партий —
    снова по правилам (правка не может решить матч раньше последней партии)."""
    t = _check_referee(match, user)
    games = list(match.games or [])
    try:
        i = int(index)
    except (TypeError, ValueError):
        raise ScoringError("Номер партии — число.")
    if not 0 <= i <= len(games):
        raise ScoringError("Такой партии нет.")
    if i == len(games):
        games.append([a, b])
    else:
        games[i] = [a, b]
    games = _clean_games(games, t.games_to_win, finished=False)
    match.games = games
    match.score1, match.score2 = tally(games)
    match.status = GroupMatch.IN_PROGRESS
    match.save(update_fields=["games", "score1", "score2", "status"])
    return match


@transaction.atomic
def undo_game(match: GroupMatch, user) -> GroupMatch:
    """Снять последнюю записанную партию — пока результат не подтверждён."""
    _check_referee(match, user)
    games = list(match.games or [])
    if not games:
        raise ScoringError("Партий нет.")
    games.pop()
    match.games = games
    match.score1, match.score2 = tally(games)
    match.save(update_fields=["games", "score1", "score2"])
    return match


def _finish(match: GroupMatch, user, s1: int, s2: int, games: list) -> None:
    from .standings import recompute_group_standings

    match.games = games
    match.score1, match.score2 = s1, s2
    match.winner = match.player1 if s1 > s2 else match.player2
    match.status = GroupMatch.FINISHED
    match.result_by = user
    match.result_at = timezone.now()
    match.save(update_fields=["games", "score1", "score2", "winner", "status", "result_by", "result_at"])
    recompute_group_standings(match.group)


@transaction.atomic
def submit(match: GroupMatch, user, score1=None, score2=None) -> GroupMatch:
    """«Подтвердить результат» (Э9.3 → Э9.5). Партии записаны — итог из них, и
    матч должен быть решён; партий нет — нужен итог матча (короткий путь)."""
    t = _check_referee(match, user)
    n = t.games_to_win
    games = list(match.games or [])
    if games:
        s1, s2 = tally(games)
        if not _decided(s1, s2, n):
            raise ScoringError("Матч до %d побед, сейчас %d : %d." % (n, s1, s2))
    else:
        s1, s2 = _clean_total(score1, score2, n)
    _finish(match, user, s1, s2, games)
    _log(t, user, match)
    return match


@transaction.atomic
def correct(match: GroupMatch, user, games=None, score1=None, score2=None) -> GroupMatch:
    """Правка подтверждённого результата — только главный судья турнира."""
    t = _tournament(match)
    if not is_chief(t, user):
        raise ScoringDenied("Подтверждённый результат правит только главный судья.")
    _check_live(t)
    if match.status != GroupMatch.FINISHED or match.is_walkover:
        raise ScoringError("Править можно только подтверждённый результат.")
    n = t.games_to_win
    clean = _clean_games(games, n)
    s1, s2 = tally(clean) if clean else _clean_total(score1, score2, n)
    _finish(match, user, s1, s2, clean)
    _log(t, user, match)
    return match
