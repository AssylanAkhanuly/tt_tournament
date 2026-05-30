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
