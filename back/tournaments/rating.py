"""
RTTF rating calculation (https://rttf.ru/content/2).

Change after one match:
    Δ = [(100 - (Rwinner - Rloser)) / 10] * k * D

  k — tournament coefficient by the average rating of participants:
        <250 → 0.2 | 250–350 → 0.25 | 350–450 → 0.3 | 450–550 → 0.35 | >550 → 0.4
  D — set-difference coefficient: 1 set → 0.8 | 2 → 1.0 | 3+ → 1.2
  • If the winner outrates the loser by ≥100, Δ = 0.
  • A rating can never fall below 1.
  • Beginners (≤5 tournaments): D = 1 always, k = 1 on a win / 0.5 on a loss.

The winner gains Δ; the loser loses Δ (each side may use its own k/D via the
beginner rule). All matches are scored against the players' pre-tournament
ratings, then applied once when the tournament finishes.
"""
from .models import Match, GroupMatch, TournamentParticipant


def _k_for_avg(avg: float) -> float:
    if avg < 250:
        return 0.2
    if avg < 350:
        return 0.25
    if avg < 450:
        return 0.3
    if avg < 550:
        return 0.35
    return 0.4


def _set_coeff(s1, s2) -> float:
    d = abs((s1 or 0) - (s2 or 0))
    if d <= 1:
        return 0.8
    if d == 2:
        return 1.0
    return 1.2


def apply_tournament_ratings(tournament) -> None:
    """Compute and persist RTTF rating changes for a finished tournament. Idempotent."""
    parts = list(tournament.participants.select_related("user"))
    if not parts:
        return
    if any(p.rating_change is not None for p in parts):
        return  # already applied

    before = {p.user_id: (p.user.rating or 0) for p in parts}
    avg = sum(before.values()) / len(before)
    k_t = _k_for_avg(avg)
    tcount = {
        p.user_id: TournamentParticipant.objects.filter(user_id=p.user_id).count()
        for p in parts
    }
    delta = {uid: 0.0 for uid in before}

    def process(p1, p2, s1, s2, winner_id, walkover=False):
        if not p1 or not p2 or not winner_id:
            return
        if walkover:
            return  # no-show forfeit — excluded from rating (real games still count)
        loser_id = p2 if winner_id == p1 else p1
        rw, rl = before.get(winner_id), before.get(loser_id)
        if rw is None or rl is None:
            return
        if rw - rl >= 100:
            return  # expected win → no change
        base = (100 - (rw - rl)) / 10
        D = _set_coeff(s1, s2)
        w_beg = tcount.get(winner_id, 99) <= 5
        l_beg = tcount.get(loser_id, 99) <= 5
        kw, Dw = (1.0, 1.0) if w_beg else (k_t, D)
        kl, Dl = (0.5, 1.0) if l_beg else (k_t, D)
        delta[winner_id] += base * kw * Dw
        delta[loser_id] -= base * kl * Dl

    for m in tournament.matches.filter(status=Match.FINISHED, winner__isnull=False):
        if m.score1 is None or m.score2 is None:
            continue
        process(m.player1_id, m.player2_id, m.score1, m.score2, m.winner_id, m.is_walkover)
    for m in GroupMatch.objects.filter(
        group__tournament=tournament, status=GroupMatch.FINISHED, winner__isnull=False
    ):
        process(m.player1_id, m.player2_id, m.score1, m.score2, m.winner_id, m.is_walkover)

    for p in parts:
        change = int(round(delta.get(p.user_id, 0.0)))
        p.rating_before = before[p.user_id]
        p.rating_change = change
        p.user.rating = max(1, before[p.user_id] + change)
        p.user.save(update_fields=["rating"])
        p.save(update_fields=["rating_before", "rating_change"])


def revert_tournament_ratings(tournament) -> None:
    """Roll back the rating changes applied at finish (used when an admin reopens
    a finished tournament by correcting a score)."""
    for p in tournament.participants.select_related("user"):
        if p.rating_change is not None and p.rating_before is not None:
            p.user.rating = p.rating_before
            p.user.save(update_fields=["rating"])
        p.rating_before = None
        p.rating_change = None
        p.save(update_fields=["rating_before", "rating_change"])
