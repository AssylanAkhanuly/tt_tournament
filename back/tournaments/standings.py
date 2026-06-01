"""Group-stage standings + absent / walkover handling.

Group points: win = 2, played loss = 1, no-show (absent) = 0.
Standings are recomputed from the finished matches rather than tracked
incrementally, so edits, resets and absences all stay consistent.
"""
from django.db.models import Q

from .models import GroupMatch, GroupParticipant, TournamentGroup, TournamentParticipant

WALKOVER_SCORE = 3  # the present opponent wins 3:0 when a player is absent


def absent_user_ids(tournament_id) -> set:
    return set(
        TournamentParticipant.objects
        .filter(tournament_id=tournament_id, is_absent=True)
        .values_list("user_id", flat=True)
    )


def recompute_group_standings(group, absent_ids=None) -> None:
    """Rebuild wins/losses/points/diff for every participant of ``group`` from
    its finished matches. A player who is absent scores 0 for their matches."""
    if absent_ids is None:
        absent_ids = absent_user_ids(group.tournament_id)

    parts = {gp.user_id: gp for gp in group.participants.all()}
    for gp in parts.values():
        gp.wins = gp.losses = gp.points = gp.diff = 0

    for m in group.matches.filter(status=GroupMatch.FINISHED, winner__isnull=False):
        if m.score1 is None or m.score2 is None:
            continue
        w = m.winner_id
        l = m.player2_id if w == m.player1_id else m.player1_id
        ws, ls = (m.score1, m.score2) if w == m.player1_id else (m.score2, m.score1)
        margin = ws - ls
        gw, gl = parts.get(w), parts.get(l)
        if gw:
            gw.wins += 1
            gw.diff += margin
            gw.points += 0 if w in absent_ids else 2
        if gl:
            gl.losses += 1
            gl.diff -= margin
            gl.points += 0 if l in absent_ids else 1

    if parts:
        GroupParticipant.objects.bulk_update(
            parts.values(), ["wins", "losses", "points", "diff"]
        )


def apply_absence(tournament, user_id, is_absent: bool) -> None:
    """Set a participant's absent flag and reconcile their group matches.

    Marking absent: every not-yet-finished group match they're in becomes a
    walkover (the present opponent wins 3:0). Clearing it: those walkovers
    revert to pending. Affected group standings are recomputed. Rating is left
    alone here — absent players' matches are simply excluded when the
    tournament finishes (see ``rating.apply_tournament_ratings``).
    """
    TournamentParticipant.objects.filter(
        tournament=tournament, user_id=user_id
    ).update(is_absent=is_absent)

    matches = GroupMatch.objects.filter(group__tournament=tournament).filter(
        Q(player1_id=user_id) | Q(player2_id=user_id)
    )

    affected = set()
    if is_absent:
        for m in matches.exclude(status=GroupMatch.FINISHED):
            opp_is_p1 = m.player1_id != user_id
            m.score1, m.score2 = (WALKOVER_SCORE, 0) if opp_is_p1 else (0, WALKOVER_SCORE)
            m.winner_id = m.player1_id if opp_is_p1 else m.player2_id
            m.status = GroupMatch.FINISHED
            m.table_number = None
            m.is_walkover = True
            m.save()
            affected.add(m.group_id)
    else:
        for m in matches.filter(is_walkover=True):
            m.score1 = m.score2 = None
            m.winner = None
            m.status = GroupMatch.PENDING
            m.table_number = None
            m.is_walkover = False
            m.save()
            affected.add(m.group_id)

    # Also recompute the group(s) the player belongs to — their own points drop
    # to 0 even for matches they had already played before being marked absent.
    affected |= set(
        GroupParticipant.objects.filter(
            group__tournament=tournament, user_id=user_id
        ).values_list("group_id", flat=True)
    )
    absent_ids = absent_user_ids(tournament.id)
    for g in TournamentGroup.objects.filter(id__in=affected):
        recompute_group_standings(g, absent_ids)
