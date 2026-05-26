"""
Single-elimination bracket generator.

generate_bracket(tournament)  — called on tournament start, creates all Match records
advance_winner(tournament, round_number, match_number, winner)  — called after score submission
"""
import math

from .models import Match


def generate_bracket(tournament):
    """
    Build a single-elimination bracket for `tournament`.

    Algorithm:
    1. Pad participant list to the next power-of-2 with None (bye slots).
    2. Create all Match stubs for every round.
    3. Fill round-1 slots one-by-one via set_slot_and_propagate(), which
       detects when both slots of a match are decided and recursively
       auto-advances bye winners up the bracket.

    Returns a QuerySet of all newly-created Match objects.
    """
    participants = list(
        tournament.participants.select_related("user").order_by("joined_at")
    )
    n = len(participants)
    if n < 2:
        raise ValueError("Нужно минимум 2 участника для начала турнира.")

    # Remove any stale bracket
    Match.objects.filter(tournament=tournament).delete()

    rounds = math.ceil(math.log2(n))
    bracket_size = 2 ** rounds
    players = [p.user for p in participants] + [None] * (bracket_size - n)

    # ── Create all match stubs ────────────────────────────────────────────────
    match_map: dict[tuple[int, int], Match] = {}
    for r in range(1, rounds + 1):
        for m in range(1, bracket_size // (2 ** r) + 1):
            rec = Match.objects.create(
                tournament=tournament,
                round_number=r,
                match_number=m,
                status=Match.PENDING,
            )
            match_map[(r, m)] = rec

    # ── Slot-filling with recursive bye propagation ───────────────────────────
    # filled[(r, m, slot)] is set once that slot has been explicitly assigned
    # (even if the value is None — distinguishes "bye decided" from "not yet set").
    filled: dict[tuple[int, int, int], object] = {}

    def set_slot_and_propagate(r: int, m: int, slot: int, value) -> None:
        """
        Assign `value` (User or None) to `slot` (1 or 2) of match (r, m).
        If both slots are now decided, resolve the match:
          - both None      → FINISHED, no winner, propagate None upward
          - one None       → FINISHED, real player wins, propagate winner upward
          - both real      → IN_PROGRESS (needs a real game)
        """
        rec = match_map[(r, m)]
        if slot == 1:
            rec.player1 = value
        else:
            rec.player2 = value
        rec.save()
        filled[(r, m, slot)] = value

        other_slot = 3 - slot  # 1→2, 2→1
        if (r, m, other_slot) not in filled:
            return  # other slot not yet assigned, wait

        # Both slots decided — resolve this match
        p1, p2 = rec.player1, rec.player2
        if p1 is None and p2 is None:
            rec.status = Match.FINISHED
            rec.save()
            if r < rounds:
                _propagate_up(r, m, None)
        elif p1 is None:
            rec.winner = p2
            rec.status = Match.FINISHED
            rec.save()
            if r < rounds:
                _propagate_up(r, m, p2)
        elif p2 is None:
            rec.winner = p1
            rec.status = Match.FINISHED
            rec.save()
            if r < rounds:
                _propagate_up(r, m, p1)
        else:
            rec.status = Match.IN_PROGRESS
            rec.save()

    def _propagate_up(r: int, m: int, winner) -> None:
        next_r = r + 1
        next_m = math.ceil(m / 2)
        next_slot = 1 if m % 2 == 1 else 2
        set_slot_and_propagate(next_r, next_m, next_slot, winner)

    # ── Fill round 1 ─────────────────────────────────────────────────────────
    for m in range(1, bracket_size // 2 + 1):
        p1 = players[(m - 1) * 2]
        p2 = players[(m - 1) * 2 + 1]
        set_slot_and_propagate(1, m, 1, p1)
        set_slot_and_propagate(1, m, 2, p2)

    return (
        Match.objects.filter(tournament=tournament)
        .select_related("player1", "player2", "winner")
        .order_by("round_number", "match_number")
    )


def advance_winner(tournament, round_number: int, match_number: int, winner) -> None:
    """
    Called after a real match finishes to place the winner in the next round.
    If both slots of the next-round match are now filled, sets it to IN_PROGRESS.
    """
    next_r = round_number + 1
    next_m = math.ceil(match_number / 2)
    slot = 1 if match_number % 2 == 1 else 2

    try:
        nxt = Match.objects.get(
            tournament=tournament,
            round_number=next_r,
            match_number=next_m,
        )
    except Match.DoesNotExist:
        return  # was the final — no further advancement

    if slot == 1:
        nxt.player1 = winner
    else:
        nxt.player2 = winner

    if nxt.player1 is not None and nxt.player2 is not None:
        nxt.status = Match.IN_PROGRESS

    nxt.save()
