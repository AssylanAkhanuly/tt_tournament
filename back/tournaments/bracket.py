"""
Single-elimination bracket generator + group stage helpers + full consolation bracket.
"""
import math
from .models import Match


def standard_seed_order(bracket_size: int) -> list[int]:
    """
    Return the slot order of seed numbers for a single-elimination bracket
    of size ``bracket_size`` (a power of two), using classic tournament
    seeding so that the top seeds are spread to opposite halves and only
    meet in the latest possible rounds.

    Example (size 8): [1, 8, 4, 5, 2, 7, 3, 6]
      → round-1 matches: (1 vs 8), (4 vs 5), (2 vs 7), (3 vs 6)

    When the bracket is larger than the field, seeds beyond the real player
    count map to ``None`` (a bye), which naturally lands against the top
    seeds (seed 1, 2, …) since they sit opposite the highest seed numbers.
    """
    order = [1, 2]
    while len(order) < bracket_size:
        target = len(order) * 2 + 1
        nxt = []
        for s in order:
            nxt.append(s)
            nxt.append(target - s)
        order = nxt
    return order


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


class _Node:
    """In-memory bracket node used while constructing the RTTF ladder."""
    __slots__ = ("idx", "p", "w_next", "l_next", "w_place", "l_place")

    def __init__(self, idx):
        self.idx = idx
        self.p = [None, None]      # seeded players (User/None) for WB round-1 nodes
        self.w_next = None         # (node, slot) — where the winner goes
        self.l_next = None         # (node, slot) — where the loser goes
        self.w_place = None        # terminal place for the winner (no w_next)
        self.l_place = None        # terminal place for the loser  (no l_next)


def _build_rttf_ladder(inputs, lo, nodes):
    """
    Build a full RTTF-style all-places bracket over ``inputs`` (length m = 2^j;
    each item is a seeded player/None for a round-1 slot, or an output tuple
    ``(node, 'W'|'L')`` feeding this sub-bracket), ranking everyone into places
    ``[lo, lo+m-1]``.

    The losers of every winners-bracket round MERGE into one climbing
    consolation ladder (3..N → … → 3..4); drop-groups at each ladder step are
    ranked recursively. A round-1 loser can climb back up — matching RTTF.
    """
    import math as _math

    def mk():
        nd = _Node(len(nodes))
        nodes.append(nd)
        return nd

    def out(src_out, dst, slot):
        src, kind = src_out
        if kind == "W":
            src.w_next = (dst, slot)
        else:
            src.l_next = (dst, slot)

    def place(src_out, pl):
        src, kind = src_out
        if kind == "W":
            src.w_place = pl
        else:
            src.l_place = pl

    def feed(node, slot, inp):
        if isinstance(inp, tuple):
            out(inp, node, slot)
        else:
            node.p[slot] = inp

    m = len(inputs)
    if m == 1:
        place(inputs[0], lo)
        return
    if m == 2:
        dm = mk()
        feed(dm, 0, inputs[0]); feed(dm, 1, inputs[1])
        dm.w_place = lo; dm.l_place = lo + 1
        return

    j = int(round(_math.log2(m)))

    # ── Winners bracket ──────────────────────────────────────────────────────
    wb = [[mk() for _ in range(m // (2 ** r))] for r in range(1, j + 1)]
    for i in range(m // 2):
        feed(wb[0][i], 0, inputs[2 * i])
        feed(wb[0][i], 1, inputs[2 * i + 1])
    for r in range(2, j + 1):
        for i in range(m // (2 ** r)):
            out((wb[r - 2][2 * i], "W"), wb[r - 1][i], 0)
            out((wb[r - 2][2 * i + 1], "W"), wb[r - 1][i], 1)
    final = wb[j - 1][0]
    final.w_place = lo; final.l_place = lo + 1

    # ── Losers ladder (place bands fill from the worst place upward) ─────────
    band_hi = [lo + m - 1]

    def drop(louts):
        s = len(louts)
        blo = band_hi[0] - s + 1
        if s == 1:
            place(louts[0], blo)
        else:
            _build_rttf_ladder(louts, blo, nodes)
        band_hi[0] = blo - 1

    def minor(pool):
        wins, lous, mats = [], [], []
        for i in range(len(pool) // 2):
            dm = mk()
            out(pool[2 * i], dm, 0); out(pool[2 * i + 1], dm, 1)
            wins.append((dm, "W")); lous.append((dm, "L")); mats.append(dm)
        return wins, lous, mats

    pool = [(wb[0][i], "L") for i in range(m // 2)]
    wb_round = 1
    while True:
        wins, lous, mats = minor(pool)
        if len(mats) == 1:                       # LB final → 3rd / 4th
            mats[0].w_place = lo + 2
            mats[0].l_place = lo + 3
            break
        drop(lous); pool = wins
        wb_round += 1                            # merge next WB round's losers
        wbl = [(wb[wb_round - 1][i], "L") for i in range(m // (2 ** wb_round))]
        nwins, nlous = [], []
        for i in range(len(pool)):
            dm = mk()
            out(pool[i], dm, 0); out(wbl[i], dm, 1)
            nwins.append((dm, "W")); nlous.append((dm, "L"))
        drop(nlous); pool = nwins


def generate_all_places_bracket(tournament, players):
    """
    Generate a full RTTF-style all-places bracket: a single-elimination main
    bracket plus a double-elimination "losers ladder" that ranks every player.
    Losers from successive rounds merge into one climbing consolation chain, so
    a player eliminated early can still climb (розыгрыш всех мест).

    Players arrive in seed order (best first) and are placed into standard
    seeding slots, with byes landing on the top seeds.

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

    # ``players`` arrives in seed order (best first). Place each seed into its
    # standard-seeding slot so top seeds are split to opposite halves and byes
    # (seeds beyond the real field) land against the top seeds.
    seed_order = standard_seed_order(bracket_size)
    padded = [players[s - 1] if (s - 1) < n else None for s in seed_order]

    # ── Build the ladder structure in memory ─────────────────────────────────
    nodes: list[_Node] = []
    _build_rttf_ladder(padded, 1, nodes)

    # Place range (min/max reachable place) per node. Winner/loser branches now
    # overlap (climbing), so use min/max — not a sum.
    pmin: dict[int, int] = {}
    pmax: dict[int, int] = {}

    def _range(nd: _Node) -> tuple[int, int]:
        if nd.idx in pmin:
            return pmin[nd.idx], pmax[nd.idx]
        pmin[nd.idx], pmax[nd.idx] = 1, bracket_size      # guard (no cycles expected)

        def out_range(pl, nxt):
            if pl is not None:
                return pl, pl
            return _range(nxt[0])

        wa, wb = out_range(nd.w_place, nd.w_next)
        la, lb = out_range(nd.l_place, nd.l_next)
        pmin[nd.idx], pmax[nd.idx] = min(wa, la), max(wb, lb)
        return pmin[nd.idx], pmax[nd.idx]

    for nd in nodes:
        _range(nd)

    # Column (round_number) = longest path from a seeded node.
    feeders: dict[int, list[_Node]] = {}
    for nd in nodes:
        if nd.w_next:
            feeders.setdefault(nd.w_next[0].idx, []).append(nd)
        if nd.l_next:
            feeders.setdefault(nd.l_next[0].idx, []).append(nd)
    col: dict[int, int] = {}

    def _col(nd: _Node) -> int:
        if nd.idx in col:
            return col[nd.idx]
        col[nd.idx] = 1
        fs = feeders.get(nd.idx, [])
        col[nd.idx] = 1 if not fs else max(_col(f) for f in fs) + 1
        return col[nd.idx]

    for nd in nodes:
        _col(nd)

    # ── Create Match rows (column order → topological) ────────────────────────
    ordered = sorted(nodes, key=lambda nd: (col[nd.idx], nd.idx))
    idx_to_match: dict[int, Match] = {}
    for num, nd in enumerate(ordered, start=1):
        m = Match(
            tournament=tournament,
            round_number=col[nd.idx],
            match_number=num,
            status=Match.PENDING,
            is_consolation=pmin[nd.idx] > 2,
            place_lo=pmin[nd.idx],
            place_hi=pmax[nd.idx],
            player1=nd.p[0],
            player2=nd.p[1],
        )
        m.save()
        idx_to_match[nd.idx] = m

    # Wire winner_next / loser_next FKs.
    for nd in nodes:
        m = idx_to_match[nd.idx]
        if nd.w_next:
            m.winner_next = idx_to_match[nd.w_next[0].idx]
            m.winner_next_slot = nd.w_next[1] + 1
        if nd.l_next:
            m.loser_next = idx_to_match[nd.l_next[0].idx]
            m.loser_next_slot = nd.l_next[1] + 1
        if nd.w_next or nd.l_next:
            m.save(update_fields=["winner_next", "winner_next_slot", "loser_next", "loser_next_slot"])

    # Feeder map: which source match (and edge type) fills each (match, slot).
    all_matches = list(idx_to_match.values())
    slot_feeder: dict[tuple[int, int], tuple[Match, str]] = {}
    for s in all_matches:
        if s.winner_next_id:
            slot_feeder[(s.winner_next_id, s.winner_next_slot)] = (s, "W")
        if s.loser_next_id:
            slot_feeder[(s.loser_next_id, s.loser_next_slot)] = (s, "L")

    # ── Resolve byes in column (topological) order ────────────────────────────
    # A match is auto-won by "bye" only when the empty slot is PERMANENTLY empty
    # (its feeder is finished and will never deliver a player) — never just
    # because the opponent's feeder has not been played yet.
    def _perm_empty(m: Match, slot: int) -> bool:
        cur = m.player1 if slot == 1 else m.player2
        if cur is not None:
            return False
        fdr = slot_feeder.get((m.id, slot))
        if fdr is None:
            return True                        # seeded round-1 padding slot
        src, _etype = fdr
        return src.status == Match.FINISHED    # finished feeder yields nothing further

    for m in sorted(all_matches, key=lambda x: (x.round_number, x.match_number)):
        # Pull in winners already decided by upstream byes.
        for slot in (1, 2):
            cur = m.player1 if slot == 1 else m.player2
            if cur is not None:
                continue
            fdr = slot_feeder.get((m.id, slot))
            if fdr and fdr[1] == "W" and fdr[0].status == Match.FINISHED and fdr[0].winner_id:
                if slot == 1:
                    m.player1 = fdr[0].winner
                else:
                    m.player2 = fdr[0].winner

        e1, e2 = m.player1 is None, m.player2 is None
        pe1, pe2 = _perm_empty(m, 1), _perm_empty(m, 2)

        if e1 and e2:
            m.status = Match.FINISHED if (pe1 and pe2) else Match.PENDING
            m.save()
        elif (e1 and not pe1) or (e2 and not pe2):
            m.status = Match.PENDING
            m.save()
        elif e1:
            m.winner = m.player2
            m.status = Match.FINISHED
            m.save()
        elif e2:
            m.winner = m.player1
            m.status = Match.FINISHED
            m.save()
        else:
            m.status = Match.IN_PROGRESS
            m.save()
            auto_assign_table(m)

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


def generate_playoff_from_groups(tournament, advance_count=None):
    """
    Seeds ALL players from groups into a full consolation bracket.
    Players are seeded by position across groups:
      A1, B1, C1, A2, B2, C2, A3, B3, A4, B4 ...
    If advance_count is given, only top N per group advance.
    """
    from .models import TournamentGroup, GroupParticipant

    groups = list(TournamentGroup.objects.filter(tournament=tournament).order_by('order'))
    if not groups:
        raise ValueError("Нет групп для генерации плей-офф.")

    # Determine how many positions to iterate (max group size = advance all)
    if advance_count is None:
        advance_count = max(
            GroupParticipant.objects.filter(group=g).count()
            for g in groups
        )

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
        if position_players:
            advancers_by_position.append(position_players)

    pool = []
    for pos_players in advancers_by_position:
        pool.extend(pos_players)

    # RTTF seeding: order the qualifying pool by rating (best first) so the
    # standard-seeding placement in generate_all_places_bracket spreads the
    # strongest players to opposite halves of the draw.
    seeded_players = sorted(pool, key=lambda u: (-(u.rating or 0), u.id))

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


def _slot_feeder(match: Match, slot: int):
    """The source match (if any) that feeds the given slot of ``match``."""
    from django.db.models import Q
    return (
        Match.objects.filter(
            Q(winner_next=match, winner_next_slot=slot)
            | Q(loser_next=match, loser_next_slot=slot)
        )
        .exclude(pk=match.pk)
        .first()
    )


def _perm_empty_live(nxt: Match, slot: int) -> bool:
    """A slot is permanently empty if it has no player and its feeder is finished
    (a bye/ghost that will never deliver) or there is no feeder at all."""
    cur = nxt.player1 if slot == 1 else nxt.player2
    if cur is not None:
        return False
    feeder = _slot_feeder(nxt, slot)
    return feeder is None or feeder.status == Match.FINISHED


def _resolve_after_fill(nxt: Match) -> None:
    """
    Re-evaluate a match after one of its feeders finished (whether or not it
    delivered a player). Resolves to: started (both players), a bye (one player
    + permanently-empty opponent), a ghost (both permanently empty), or waiting.
    Cascades downstream so byes/ghosts propagate correctly.
    """
    if nxt.status == Match.FINISHED:
        return

    p1, p2 = nxt.player1, nxt.player2
    if p1 is not None and p2 is not None:
        if nxt.status != Match.IN_PROGRESS:
            nxt.status = Match.IN_PROGRESS
            nxt.save()
            auto_assign_table(nxt)
        else:
            nxt.save()
        return

    pe1, pe2 = _perm_empty_live(nxt, 1), _perm_empty_live(nxt, 2)
    e1, e2 = p1 is None, p2 is None

    if e1 and e2:
        if pe1 and pe2:                      # ghost — nobody will ever arrive
            nxt.status = Match.FINISHED
            nxt.save()
            advance_winner_and_loser(nxt, None, None)
        else:
            nxt.save()                        # still waiting
        return

    if (e1 and not pe1) or (e2 and not pe2):
        nxt.save()                            # real player waiting for a live opponent
        return

    # one real player, opponent permanently empty → bye
    bye_winner = p2 if e1 else p1
    nxt.winner = bye_winner
    nxt.status = Match.FINISHED
    nxt.save()
    advance_winner_and_loser(nxt, bye_winner, None)


def advance_winner_and_loser(match: Match, winner, loser) -> None:
    """
    After a match finishes, route winner → winner_next and loser → loser_next.
    Targets are ALWAYS re-resolved (even when winner/loser is None, e.g. a bye or
    a ghost) so that a feeder finishing without delivering a player still lets a
    dependent match bye/ghost out instead of waiting forever.
    Falls back to round/match-number routing for single-elimination matches.
    """
    # ── Winner routing ────────────────────────────────────────────────────────
    if match.winner_next_id:
        nxt = Match.objects.filter(pk=match.winner_next_id).first()
        slot = match.winner_next_slot
    elif match.place_lo is not None:
        nxt = None                            # all-places terminal — winner is ranked here
    else:
        next_r = match.round_number + 1       # legacy single-elimination routing
        next_m = math.ceil(match.match_number / 2)
        slot = 1 if match.match_number % 2 == 1 else 2
        nxt = Match.objects.filter(
            tournament=match.tournament, round_number=next_r, match_number=next_m,
        ).first()

    if nxt:
        if winner:
            if slot == 1:
                nxt.player1 = winner
            else:
                nxt.player2 = winner
        _resolve_after_fill(nxt)

    # ── Loser routing ─────────────────────────────────────────────────────────
    if match.loser_next_id:
        loser_match = Match.objects.filter(pk=match.loser_next_id).first()
        if loser_match:
            if loser:
                if match.loser_next_slot == 1:
                    loser_match.player1 = loser
                else:
                    loser_match.player2 = loser
            _resolve_after_fill(loser_match)
