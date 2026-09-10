"""SQLite для локальной разработки и сквозных проверок: запись — с BEGIN IMMEDIATE.

Почему. Django открывает транзакцию SQLite обычным (отложенным) BEGIN: право на
запись берётся только при первой записи. Если две транзакции успели прочитать,
а потом обе пишут, SQLite разрывает взаимную блокировку тем, что одна из них
сразу получает «database is locked» — таймаут ожидания тут не срабатывает.
Так 10.09.2026 упала неявка, записанная в ту же секунду, что исправление из
соседней сквозной проверки: сервис сначала читает карточку, потом пишет.

BEGIN IMMEDIATE берёт право на запись в начале транзакции, и второй писатель
ждёт своей очереди (`timeout` в настройках), а не падает. В Django 5.1+ то же
делает штатная настройка `OPTIONS["transaction_mode"] = "IMMEDIATE"`, но
локальное окружение сидит на Django 4.2 (Python 3.9), поэтому здесь
переопределение. Боевой базы не касается: там PostgreSQL (`DATABASE_URL`).
"""

from django.db.backends.sqlite3 import base


class DatabaseWrapper(base.DatabaseWrapper):
    def _start_transaction_under_autocommit(self):
        self.cursor().execute("BEGIN IMMEDIATE")
