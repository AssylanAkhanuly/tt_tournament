"""
One-off demo seeder for the account +77777777777.

Drives several single-elimination tournaments through the REAL bracket + rating
engine so the player ends up with authentic rating history, placements and a
rich head-to-head record. Safe to re-run: it removes its own previously-seeded
tournaments (those whose name starts with the DEMO_PREFIX) before re-creating.
"""
import os
import random
from datetime import timedelta

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tt_back.settings")
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model

from clubs.models import Club
from tournaments.models import Tournament, TournamentParticipant, Match
from tournaments.bracket import generate_bracket, advance_winner_and_loser
from tournaments.rating import apply_tournament_ratings

U = get_user_model()
random.seed(7)

DEMO_PREFIX = "[demo] "
TARGET_PHONE = "+77777777777"


def get_or_create_opponents(exclude_id, want=7):
    pool = list(U.objects.filter(is_staff=False).exclude(id=exclude_id).order_by("created_at")[:want])
    names = ["Алексей", "Дмитрий", "Сергей", "Иван", "Павел", "Никита", "Артём",
             "Роман", "Максим", "Егор"]
    i = 0
    while len(pool) < want:
        phone = f"+7700000{1000 + i}"
        user, _ = U.objects.get_or_create(
            phone=phone,
            defaults={"name": names[i % len(names)], "rating": random.randint(60, 130)},
        )
        if user.id != exclude_id and user not in pool:
            pool.append(user)
        i += 1
    return pool[:want]


def play_tournament(name, when, players, win_bias, club, admin, target):
    t = Tournament.objects.create(
        name=name, description="Демо-турнир", created_by=admin, club=club,
        starts_at=when, status=Tournament.STATUS_OPEN,
        format="single_elimination", group_size=4,
    )
    for p in players:
        TournamentParticipant.objects.create(tournament=t, user=p)

    generate_bracket(t)
    t.status = Tournament.STATUS_IN_PROGRESS
    t.save()

    for _ in range(500):
        m = (Match.objects
             .filter(tournament=t, player1__isnull=False, player2__isnull=False)
             .exclude(status=Match.FINISHED)
             .order_by("round_number", "match_number")
             .first())
        if m is None:
            break
        target_in = m.player1_id == target.id or m.player2_id == target.id
        if target_in:
            target_wins = random.random() < win_bias
            target_is_p1 = m.player1_id == target.id
            p1_wins = target_wins if target_is_p1 else (not target_wins)
        else:
            p1_wins = random.random() < 0.5
        if p1_wins:
            s1, s2 = 3, random.randint(0, 2)
        else:
            s1, s2 = random.randint(0, 2), 3

        m.score1, m.score2 = s1, s2
        m.winner = m.player1 if s1 > s2 else m.player2
        m.status = Match.FINISHED
        m.table_number = None
        m.save()
        loser = m.player1 if m.winner_id == m.player2_id else m.player2
        advance_winner_and_loser(m, m.winner, loser)

    unresolved = (Match.objects
                  .filter(tournament=t, player1__isnull=False, player2__isnull=False)
                  .exclude(status=Match.FINISHED).exists())
    if not unresolved:
        t.status = Tournament.STATUS_FINISHED
        t.save()
        apply_tournament_ratings(t)
    return t


def main():
    target = U.objects.get(phone=TARGET_PHONE)
    if not target.name or target.name == "adsf":
        target.name = "Асылан А."
    # reset rating to a sensible starting point so the curve is meaningful
    target.rating = 100
    target.save()

    # wipe previous demo tournaments (idempotent re-run)
    old = Tournament.objects.filter(name__startswith=DEMO_PREFIX)
    print("removing", old.count(), "previous demo tournaments")
    old.delete()

    opponents = get_or_create_opponents(target.id, want=7)
    print("opponents:", [o.name for o in opponents])

    club = Club.objects.first()
    admin = U.objects.filter(is_staff=True).first() or target

    now = timezone.now()
    configs = [
        ("Осенний кубок",      210, 0.40),
        ("Открытый турнир",    175, 0.55),
        ("Лига чемпионов",     140, 0.62),
        ("Зимний мастерс",     105, 0.48),
        ("Весенний кубок",      70, 0.72),
        ("Кубок мая",           35, 0.66),
        ("Летний чемпионат",    10, 0.58),
    ]
    for name, days_ago, bias in configs:
        players = [target] + opponents  # 8 players → clean power-of-two bracket
        t = play_tournament(DEMO_PREFIX + name, now - timedelta(days=days_ago),
                            players, bias, club, admin, target)
        tp = TournamentParticipant.objects.filter(tournament=t, user=target).first()
        print(f"  {name}: status={t.status} place={getattr(tp,'placement',None)} "
              f"before={getattr(tp,'rating_before',None)} change={getattr(tp,'rating_change',None)}")

    target.refresh_from_db()
    print("FINAL rating:", target.rating)
    print("participations:", TournamentParticipant.objects.filter(user=target).count())
    print("bracket matches:",
          Match.objects.filter(player1=target).count() + Match.objects.filter(player2=target).count())


if __name__ == "__main__":
    main()
