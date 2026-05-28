"""
Single-elimination bracket generator + group stage helpers + full consolation bracket.
"""
import math
from .models import Match


def auto_assign_table(match: Match) -> None:
    """
    Try to assign the lowest-numbered free TournamentTable to this match.
    No-op if the tournament has no tables configured.
    """
    from .models import TournamentTable

    tournament = match.tournament
    active_tables = list(
        TournamentTable.objects.filter(
            tournament=tournament, is_active=True
        ).order_by('number')
    )
    if not active_tables:
        return

    # Tables in use by in-progress matches in THIS tournament
    used = set(
        Match.objects.filter(
            tournament=tournament,
            status=Match.IN_PROGRESS,
        )
        .exclude(pk=match.pk)
        .exclude(table_number__isnull=True)
        .values_list('table_number', flat=True)
    )

    for table in active_tables:
        if table.number not in used:
            match.table_number = table.number
            match.save(update_fields=['table_number'])
            return


def generate_bracket(tournament):
    participants = list(
        tournament.participants.select_related("user").order_by("joined_at")
    )
    n = len(participants)
    if n < 2:
        raise ValueError("Нужно минимум 2 участника для начала турнира.")

    Match.objects.filter(tournament=tournament).delete()

    rounds = math.ceil(math.log2(n))
    bracket_size = 2 ** rounds
    players = [p.user for p in participants] + [None] * (bracket_size - n)

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

    filled: dict[tuple[int, int, int], object] = {}

    def set_slot_and_propagate(r: int, m: int, slot: int, value) -> None:
        rec = match_map[(r, m)]
        if slot == 1:
            rec.player1 = value
        else:
            rec.player2 = value
        rec.save()
        filled[(r, m, slot)] = value

        other_slot = 3 - slot
        if (r, m, other_slot) not in filled:
            return

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
            auto_assign_table(rec)

    def _propagate_up(r: int, m: int, winner) -> None:
        next_r = r + 1
        next_m = math.ceil(m / 2)
        next_slot = 1 if m % 2 == 1 else 2
        set_slot_and_propagate(next_r, next_m, next_slot, winner)

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


def generate_all_places_bracket(tournament, players):
    """
    Generate a full consolation (all-places) bracket.

    Structure per round r (bracket_size = 2^rounds):
      - Winners bracket matches in round r: wc = bracket_size // 2^r
      - Consolation matches in round r:     cc = bracket_size//2 - wc
      - Total matches per round:            bracket_size // 2

    For N=8 (rounds=3):
      Round 1: 4 W-bracket matches  (M1..M4)
      Round 2: 2 W-bracket (M5,M6) + 2 consolation (M7,M8)
      Round 3: 1 W-bracket final (M9) + 3 consolation (M10=3rd, M11=5th, M12=7th)

    Routing:
      Winners bracket[r][j] ← winner(prev_winners[2j]), winner(prev_winners[2j+1])
      Consolation[r][j] for j<wc_r ← loser(prev_winners[2j]), loser(prev_winners[2j+1])
      Consolation[r][wc_r+j] ← winner(prev_consolation[2j]), winner(prev_consolation[2j+1])
      Consolation[r][wc_r+cc_prev//2+j] ← loser(prev_consolation[2j]), loser(prev_consolation[2j+1])
    """
    n = len(players)
    if n < 2:
        raise ValueError("Нужно минимум 2 участника для плей-офф.")

    Match.objects.filter(tournament=tournament).delete()

    rounds = math.ceil(math.log2(n))
    bracket_size = 2 ** rounds
    padded = list(players) + [None] * (bracket_size - n)

    # ── Create all Match shells ──────────────────────────────────────────────
    # all_rounds[r] = list of Match objects for round r
    # Within each round: [winners_bracket..., consolation...]
    all_rounds: list[list[Match]] = [[]]  # index 0 unused

    match_num = 0
    for r in range(1, rounds + 1):
        wc = bracket_size // (2 ** r)
        cc = (bracket_size // 2) - wc
        r_matches = []
        for _ in range(wc):
            match_num += 1
            m = Match(
                tournament=tournament,
                round_number=r,
                match_number=match_num,
                status=Match.PENDING,
                is_consolation=False,
            )
            m.save()
            r_matches.append(m)
        for _ in range(cc):
            match_num += 1
            m = Match(
                tournament=tournament,
                round_number=r,
                match_number=match_num,
                status=Match.PENDING,
                is_consolation=True,
            )
            m.save()
            r_matches.append(m)
        all_rounds.append(r_matches)

    # ── Wire routing between rounds ──────────────────────────────────────────
    for r in range(2, rounds + 1):
        wc_r    = bracket_size // (2 ** r)
        wc_prev = bracket_size // (2 ** (r - 1))
        cc_prev = (bracket_size // 2) - wc_prev

        prev_winners    = all_rounds[r - 1][:wc_prev]
        prev_consolation = all_rounds[r - 1][wc_prev:]   # length = cc_prev

        curr_winners    = all_rounds[r][:wc_r]
        curr_consolation = all_rounds[r][wc_r:]          # length = cc_r

        # Winners bracket: pair up consecutive prev_winners
        for j, cw in enumerate(curr_winners):
            src1 = prev_winners[2 * j]
            src2 = prev_winners[2 * j + 1]
            src1.winner_next = cw
            src1.winner_next_slot = 1
            src2.winner_next = cw
            src2.winner_next_slot = 2

        # Consolation part 1: losers from prev winners bracket
        # Fills curr_consolation[0..wc_r-1]
        for j in range(wc_r):
            cc_match = curr_consolation[j]
            src1 = prev_winners[2 * j]
            src2 = prev_winners[2 * j + 1]
            src1.loser_next = cc_match
            src1.loser_next_slot = 1
            src2.loser_next = cc_match
            src2.loser_next_slot = 2

        # Consolation part 2: winners from prev consolation
        # Fills curr_consolation[wc_r .. wc_r + cc_prev//2 - 1]
        cc_prev_half = cc_prev // 2
        for j in range(cc_prev_half):
            cc_match = curr_consolation[wc_r + j]
            src1 = prev_consolation[2 * j]
            src2 = prev_consolation[2 * j + 1]
            src1.winner_next = cc_match
            src1.winner_next_slot = 1
            src2.winner_next = cc_match
            src2.winner_next_slot = 2

        # Consolation part 3: losers from prev consolation
        # Fills curr_consolation[wc_r + cc_prev//2 .. cc_r - 1]
        for j in range(cc_prev_half):
            cc_match = curr_consolation[wc_r + cc_prev_half + j]
            src1 = prev_consolation[2 * j]
            src2 = prev_consolation[2 * j + 1]
            src1.loser_next = cc_match
            src1.loser_next_slot = 1
            src2.loser_next = cc_match
            src2.loser_next_slot = 2

        # Save wiring on all round r-1 matches
        for m in all_rounds[r - 1]:
            m.save()

    # Build pk→match map for propagation
    all_matches_flat = {m.pk: m for r in range(1, rounds + 1) for m in all_rounds[r]}

    # ── Helpers for bye propagation ─────────────────────────────────────────
    def _propagate_consolation(m: Match, winner, loser) -> None:
        """Push winner/loser to the next matches (for byes in round 1)."""
        if m.winner_next_id and winner is not None:
            nxt = all_matches_flat.get(m.winner_next_id)
            if nxt:
                if m.winner_next_slot == 1:
                    nxt.player1 = winner
                else:
                    nxt.player2 = winner
                nxt.save()
                _maybe_start(nxt)

        if m.loser_next_id and loser is not None:
            nxt = all_matches_flat.get(m.loser_next_id)
            if nxt:
                if m.loser_next_slot == 1:
                    nxt.player1 = loser
                else:
                    nxt.player2 = loser
                nxt.save()
                _maybe_start(nxt)

    def _maybe_start(m: Match) -> None:
        """Start match if both players are set; handle further byes."""
        if m.player1 is None and m.player2 is None:
            return
        if m.player1 is None:
            m.winner = m.player2
            m.status = Match.FINISHED
            m.save()
            _propagate_consolation(m, winner=m.player2, loser=None)
        elif m.player2 is None:
            m.winner = m.player1
            m.status = Match.FINISHED
            m.save()
            _propagate_consolation(m, winner=m.player1, loser=None)
        else:
            m.status = Match.IN_PROGRESS
            m.save()
            auto_assign_table(m)

    # ── Populate round 1 and propagate byes ─────────────────────────────────
    r1 = all_rounds[1]
    for i, m in enumerate(r1):
        m.player1 = padded[i * 2]
        m.player2 = padded[i * 2 + 1]
        m.save()
        _maybe_start(m)

    return (
        Match.objects.filter(tournament=tournament)
        .select_related("player1", "player2", "winner")
        .order_by("round_number", "match_number")
    )


def generate_group_bracket(tournament):
    """
    Divides tournament participants into round-robin groups.
    """
    from .models import TournamentGroup, GroupParticipant, GroupMatch

    TournamentGroup.objects.filter(tournament=tournament).delete()

    participants = list(
        tournament.participants.select_related("user").order_by("joined_at")
    )
    n = len(participants)
    if n < 2:
        raise ValueError("Нужно минимум 2 участника для начала турнира.")

    group_size = max(2, tournament.group_size)
    group_letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    groups_players = []
    for i in range(0, n, group_size):
        groups_players.append(participants[i:i + group_size])

    created_groups = []
    for idx, players_in_group in enumerate(groups_players):
        letter = group_letters[idx % len(group_letters)]
        group = TournamentGroup.objects.create(
            tournament=tournament,
            name=letter,
            order=idx,
        )
        created_groups.append(group)

        gp_list = []
        for tp in players_in_group:
            gp_list.append(GroupParticipant(group=group, user=tp.user))
        GroupParticipant.objects.bulk_create(gp_list)

        match_num = 1
        users_in_group = [tp.user for tp in players_in_group]
        for i in range(len(users_in_group)):
            for j in range(i + 1, len(users_in_group)):
                GroupMatch.objects.create(
                    group=group,
                    match_number=match_num,
                    player1=users_in_group[i],
                    player2=users_in_group[j],
                    status=GroupMatch.PENDING,
                )
                match_num += 1

    tournament.status = tournament.STATUS_IN_PROGRESS
    tournament.save()

    return TournamentGroup.objects.filter(tournament=tournament).prefetch_related(
        'participants__user', 'matches__player1', 'matches__player2', 'matches__winner'
    )


def generate_playoff_from_groups(tournament, advance_count=2):
    """
    Takes top `advance_count` players from each group and seeds a full consolation bracket.
    """
    from .models import TournamentGroup, GroupParticipant

    groups = list(TournamentGroup.objects.filter(tournament=tournament).order_by('order'))
    if not groups:
        raise ValueError("Нет групп для генерации плей-офф.")

    advancers_by_position = []
    for pos in range(advance_count):
        position_players = []
        for group in groups:
            top = list(
                GroupParticipant.objects.filter(group=group)
                .select_related('user')
                .order_by('-points', '-wins', '-diff')
            )
            if len(top) > pos:
                position_players.append(top[pos].user)
        advancers_by_position.append(position_players)

    seeded_players = []
    for pos_players in advancers_by_position:
        seeded_players.extend(pos_players)

    n = len(seeded_players)
    if n < 2:
        raise ValueError("Недостаточно игроков для плей-офф.")

    return generate_all_places_bracket(tournament, seeded_players)


def advance_winner(tournament, round_number: int, match_number: int, winner) -> None:
    """Legacy single-elimination advance. Kept for backward compatibility."""
    try:
        match = Match.objects.get(
            tournament=tournament,
            round_number=round_number,
            match_number=match_number,
        )
    except Match.DoesNotExist:
        return

    loser = match.player1 if match.winner == match.player2 else match.player2
    advance_winner_and_loser(match, winner, loser)


def advance_winner_and_loser(match: Match, winner, loser) -> None:
    """
    After a match finishes, advance winner to winner_next and loser to loser_next.
    Falls back to round/match-number routing for single-elimination matches
    (which have no winner_next FK set).
    """
    # ── Winner routing ────────────────────────────────────────────────────────
    if match.winner_next_id:
        # Explicit FK routing (consolation bracket)
        try:
            nxt = Match.objects.get(pk=match.winner_next_id)
        except Match.DoesNotExist:
            nxt = None
        if nxt and winner:
            if match.winner_next_slot == 1:
                nxt.player1 = winner
            else:
                nxt.player2 = winner
            if nxt.player1 is not None and nxt.player2 is not None:
                nxt.status = Match.IN_PROGRESS
                nxt.save()
                auto_assign_table(nxt)
            else:
                nxt.save()
    else:
        # Legacy round-number routing (single-elim)
        next_r = match.round_number + 1
        next_m = math.ceil(match.match_number / 2)
        slot = 1 if match.match_number % 2 == 1 else 2
        try:
            nxt = Match.objects.get(
                tournament=match.tournament,
                round_number=next_r,
                match_number=next_m,
            )
        except Match.DoesNotExist:
            nxt = None
        if nxt and winner:
            if slot == 1:
                nxt.player1 = winner
            else:
                nxt.player2 = winner
            if nxt.player1 is not None and nxt.player2 is not None:
                nxt.status = Match.IN_PROGRESS
                nxt.save()
                auto_assign_table(nxt)
            else:
                nxt.save()

    # ── Loser routing ─────────────────────────────────────────────────────────
    if match.loser_next_id and loser:
        try:
            loser_match = Match.objects.get(pk=match.loser_next_id)
        except Match.DoesNotExist:
            loser_match = None
        if loser_match:
            if match.loser_next_slot == 1:
                loser_match.player1 = loser
            else:
                loser_match.player2 = loser
            if loser_match.player1 is not None and loser_match.player2 is not None:
                loser_match.status = Match.IN_PROGRESS
                auto_assign_table(loser_match)
            loser_match.save()
