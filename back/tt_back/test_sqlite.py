"""Локальный SQLite начинает транзакцию с BEGIN IMMEDIATE — см. tt_back/sqlite/base.py.

С обычным BEGIN две транзакции «прочитал — записал» в одну секунду роняли
вторую с «database is locked» (неявка рядом с исправлением, 10.09.2026).
Проверка краснеет, если настройки перестанут подменять движок SQLite.
"""

import pytest
from django.db import connection, transaction
from django.test.utils import CaptureQueriesContext

from users.models import User


@pytest.mark.django_db(transaction=True)
def test_транзакция_sqlite_сразу_берёт_право_на_запись():
    if connection.vendor != "sqlite":
        pytest.skip("проверка локального SQLite; у PostgreSQL блокировки устроены иначе")

    with CaptureQueriesContext(connection) as q:
        with transaction.atomic():
            User.objects.exists()

    assert q.captured_queries[0]["sql"] == "BEGIN IMMEDIATE"
