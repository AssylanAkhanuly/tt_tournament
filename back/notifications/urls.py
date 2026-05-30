from django.urls import path

from .views import (
    MarkReadView,
    NotificationListView,
    PushSubscribeView,
    PushUnsubscribeView,
    VapidPublicKeyView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("read/", MarkReadView.as_view(), name="notification-read"),
    path("subscribe/", PushSubscribeView.as_view(), name="notification-subscribe"),
    path("unsubscribe/", PushUnsubscribeView.as_view(), name="notification-unsubscribe"),
    path("vapid-public-key/", VapidPublicKeyView.as_view(), name="notification-vapid-key"),
]
