import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def _players_of(match):
    return [p for p in (match.player1, match.player2) if p is not None]


def notify_match_ready(match, kind):
    """Create in-app notifications + send web-push to both players of a match
    that just became ready (got a table / went IN_PROGRESS).

    Safe to call from inside a request/transition — never raises.
    `kind` is 'bracket' (Match) or 'group' (GroupMatch).
    """
    try:
        from .models import Notification

        if kind == "bracket":
            tournament = match.tournament
        else:
            tournament = match.group.tournament

        table = match.table_number
        for player in _players_of(match):
            opponent = match.player2 if match.player1_id == player.id else match.player1
            opp_name = (opponent.name if opponent else None) or "соперник"
            title = "Ваш матч начинается"
            body = f"Стол {table}: вы против {opp_name}" if table else f"Вы против {opp_name}"

            notif, created = Notification.objects.get_or_create(
                user=player,
                match_kind=kind,
                match_id=match.pk,
                table_number=table,
                defaults={
                    "type": Notification.TYPE_MATCH_READY,
                    "title": title,
                    "body": body,
                    "tournament": tournament,
                },
            )
            if created:
                _web_push(player, {
                    "title": title,
                    "body": body,
                    "tournament_id": str(tournament.id) if tournament else None,
                    "notification_id": notif.id,
                })
    except Exception:
        logger.exception("notify_match_ready failed")


def _score_str(s1, s2):
    a = "0" if s1 is None else str(s1)
    b = "0" if s2 is None else str(s2)
    return f"{a}:{b}"


def notify_score_proposed(match, kind, proposer):
    """Tell the OPPONENT that `proposer` entered a score that needs confirming.

    `match` carries proposed_score1/proposed_score2; `kind` is 'bracket' or
    'group'. Safe to call inside a request — never raises."""
    try:
        from .models import Notification

        tournament = match.tournament if kind == "bracket" else match.group.tournament
        opponent = match.player2 if match.player1_id == proposer.id else match.player1
        if opponent is None:
            return

        prop_name = (proposer.name or "Соперник") if proposer else "Соперник"
        score = _score_str(match.proposed_score1, match.proposed_score2)
        title = "Подтвердите счёт"
        body = f"{prop_name} ввёл счёт {score} — подтвердите или отклоните"

        # One live confirm prompt per (opponent, match): clear any stale ones first.
        Notification.objects.filter(
            user=opponent, match_kind=kind, match_id=match.pk,
            type__in=[Notification.TYPE_SCORE_PROPOSED, Notification.TYPE_SCORE_REJECTED],
        ).delete()
        notif = Notification.objects.create(
            user=opponent, type=Notification.TYPE_SCORE_PROPOSED,
            title=title, body=body, tournament=tournament,
            match_kind=kind, match_id=match.pk, table_number=match.table_number,
        )
        _web_push(opponent, {
            "title": title,
            "body": body,
            "tournament_id": str(tournament.id) if tournament else None,
            "notification_id": notif.id,
        })
    except Exception:
        logger.exception("notify_score_proposed failed")


def notify_score_rejected(match, kind, rejecter):
    """Tell the original proposer that `rejecter` rejected their score, so they
    know to wait for / agree on the corrected score. Never raises."""
    try:
        from .models import Notification

        tournament = match.tournament if kind == "bracket" else match.group.tournament
        # The proposer is whoever is NOT the rejecter.
        target = match.player2 if match.player1_id == rejecter.id else match.player1
        if target is None:
            return

        rej_name = (rejecter.name or "Соперник") if rejecter else "Соперник"
        title = "Счёт отклонён"
        body = f"{rej_name} отклонил счёт — согласуйте результат заново"

        Notification.objects.filter(
            user=target, match_kind=kind, match_id=match.pk,
            type__in=[Notification.TYPE_SCORE_PROPOSED, Notification.TYPE_SCORE_REJECTED],
        ).delete()
        notif = Notification.objects.create(
            user=target, type=Notification.TYPE_SCORE_REJECTED,
            title=title, body=body, tournament=tournament,
            match_kind=kind, match_id=match.pk, table_number=match.table_number,
        )
        _web_push(target, {
            "title": title,
            "body": body,
            "tournament_id": str(tournament.id) if tournament else None,
            "notification_id": notif.id,
        })
    except Exception:
        logger.exception("notify_score_rejected failed")


def clear_score_notifications(user_id, kind, match_id):
    """Remove any confirm/reject prompts for a match once it's resolved or reset."""
    try:
        from .models import Notification
        q = Notification.objects.filter(
            match_kind=kind, match_id=match_id,
            type__in=[Notification.TYPE_SCORE_PROPOSED, Notification.TYPE_SCORE_REJECTED],
        )
        if user_id is not None:
            q = q.filter(user_id=user_id)
        q.delete()
    except Exception:
        logger.exception("clear_score_notifications failed")


def _web_push(user, payload):
    """Best-effort Web Push to all of a user's subscriptions. No-op if VAPID
    keys are not configured or pywebpush is unavailable."""
    private_key = getattr(settings, "VAPID_PRIVATE_KEY", "")
    if not private_key:
        return
    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        return

    from .models import PushSubscription

    admin_email = getattr(settings, "VAPID_ADMIN_EMAIL", "admin@example.com")
    for sub in PushSubscription.objects.filter(user=user):
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=json.dumps(payload),
                vapid_private_key=private_key,
                vapid_claims={"sub": f"mailto:{admin_email}"},
                timeout=5,
            )
        except WebPushException as e:
            status_code = getattr(getattr(e, "response", None), "status_code", None)
            if status_code in (404, 410):       # subscription is gone — prune it
                sub.delete()
            else:
                logger.warning("web-push failed for %s: %s", user, e)
        except Exception:
            logger.exception("web-push error for %s", user)
