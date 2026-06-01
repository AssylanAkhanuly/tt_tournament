"""Group standings + absent / walkover handling (group stage AND bracket).

Group points: win = 2, played loss = 1, walkover loss (no-show) = 0.
Standings are recomputed from finished matches so edits/forfeits stay consistent.

Absence is forward-looking: matches already played keep their real results; only
not-yet-finished matches are forfeited. A forfeit is flagged ``is_walkover`` and is
excluded from RTTF rating — the present opponent still advances / takes the win.
"""
from django.db.models import Q

from .models import (GroupMatch, GroupParticipant, Match, TournamentGroup,
                     TournamentParticipant)

# A walkover is a technical win: score stays 0:0, only the winner is recorded.


def absent_user_ids(tournament_id) -> set:
    return set(
        TournamentParticipant.objects
        .filter(tournament_id=tournament_id, is_absent=True)
        .values_list("user_id", flat=True)
    )


def recompute_group_standings(group) -> None:
    """Rebuild wins/losses/points/diff from ``group``'s finished matches.
    A walkover (no-show) loss scores 0; a real loss scores 1; any win scores 2.
    Real, already-played results are preserved."""
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
            gw.wins += 1; gw.diff += margin; gw.points += 2
        if gl:
            gl.losses += 1; gl.diff -= margin
            gl.points += 0 if m.is_walkover else 1  # no-show loss = 0

    if parts:
        GroupParticipant.objects.bulk_update(
            parts.values(), ["wins", "losses", "points", "diff"]
        )


def _forfeit_group_matches(tournament, user_id) -> set:
    """Forfeit a player's not-yet-finished group matches (opponent wins 3:0)."""
    affected = set()
    qs = (
        GroupMatch.objects.filter(group__tournament=tournament)
        .filter(Q(player1_id=user_id) | Q(player2_id=user_id))
        .exclude(status=GroupMatch.FINISHED)
    )
    for m in qs:
        opp_is_p1 = m.player1_id != user_id
        m.score1, m.score2 = 0, 0
        m.winner_id = m.player1_id if opp_is_p1 else m.player2_id
        m.status = GroupMatch.FINISHED
        m.table_number = None
        m.is_walkover = True
        m.save()
        affected.add(m.group_id)
    return affected


def _unforfeit_group_matches(tournament, user_id) -> set:
    """Revert a player's walkover group matches back to pending."""
    affected = set()
    qs = (
        GroupMatch.objects.filter(group__tournament=tournament, is_walkover=True)
        .filter(Q(player1_id=user_id) | Q(player2_id=user_id))
    )
    for m in qs:
        m.score1 = m.score2 = None
        m.winner = None
        m.status = GroupMatch.PENDING
        m.table_number = None
        m.is_walkover = False
        m.save()
        affected.add(m.group_id)
    return affected


def forfeit_ready_bracket_matches(tournament, absent_ids=None) -> bool:
    """Auto-forfeit every *ready* bracket match (both slots filled, not finished)
    where a present player faces an absent one; the present player advances.
    Loops so a cascade (an advanced winner meeting another absent player) resolves.
    Returns True if anything changed. Safe to call after any bracket advance."""
    if absent_ids is None:
        absent_ids = absent_user_ids(tournament.id)
    if not absent_ids:
        return False
    from .bracket import advance_winner_and_loser

    changed_any = False
    while True:
        ready = (
            Match.objects.filter(tournament=tournament)
            .exclude(status=Match.FINISHED)
            .filter(player1__isnull=False, player2__isnull=False)
            .select_related("player1", "player2")
        )
        hit = None
        for m in ready:
            if m.player1_id in absent_ids or m.player2_id in absent_ids:
                hit = m
                break
        if hit is None:
            return changed_any
        p1_absent = hit.player1_id in absent_ids
        p2_absent = hit.player2_id in absent_ids
        # Present player advances; if both absent, player1 advances arbitrarily.
        winner = hit.player2 if (p1_absent and not p2_absent) else hit.player1
        loser = hit.player1 if winner.id == hit.player2_id else hit.player2
        hit.score1, hit.score2 = 0, 0
        hit.winner = winner
        hit.status = Match.FINISHED
        hit.table_number = None
        hit.is_walkover = True
        hit.save()
        advance_winner_and_loser(hit, winner, loser)
        changed_any = True


def _unforfeit_bracket_matches(tournament, user_id) -> None:
    """Best-effort revert of a player's walkover bracket matches: pull the
    propagated opponent back out and reopen the match. Skips any whose
    downstream match was already played (can't be safely unwound)."""
    from .bracket import reset_match
    qs = (
        Match.objects.filter(tournament=tournament, is_walkover=True)
        .filter(Q(player1_id=user_id) | Q(player2_id=user_id))
    )
    for m in qs:
        try:
            reset_match(m)            # sets status back to IN_PROGRESS, un-propagates
        except ValueError:
            continue                  # downstream already played — leave as-is
        m.is_walkover = False
        m.save(update_fields=["is_walkover"])


def apply_absence(tournament, user_id, is_absent: bool) -> None:
    """Mark/unmark a participant absent and reconcile their unfinished matches.

    Absent: forfeit their not-yet-played group + bracket matches (opponent
    advances 3:0, flagged walkover). Present again: revert those walkovers where
    safe. Already-played matches are never touched. Rating is applied at finish
    and simply skips walkover matches.
    """
    TournamentParticipant.objects.filter(
        tournament=tournament, user_id=user_id
    ).update(is_absent=is_absent)

    if is_absent:
        affected = _forfeit_group_matches(tournament, user_id)
        forfeit_ready_bracket_matches(tournament, {user_id} | absent_user_ids(tournament.id))
    else:
        affected = _unforfeit_group_matches(tournament, user_id)
        _unforfeit_bracket_matches(tournament, user_id)

    # Recompute the player's own group too (their walkover losses score 0).
    affected |= set(
        GroupParticipant.objects.filter(
            group__tournament=tournament, user_id=user_id
        ).values_list("group_id", flat=True)
    )
    for g in TournamentGroup.objects.filter(id__in=affected):
        recompute_group_standings(g)
