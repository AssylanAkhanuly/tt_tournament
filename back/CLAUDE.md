# Бэкенд — Claude Context

## Что это и как соотносится со спекой

Действующий прототип (исторически SpinCoach), на котором стоит платформа ФНТ РК.
**Он описывает то, что есть в коде сейчас, а не то, что должно получиться** —
целевые требования лежат в корне: [TZ.md](../TZ.md), модель —
[ARCHITECTURE.md](../ARCHITECTURE.md) и `diagrams/domain.d2`, сценарии ролей —
[ROLES.md](../ROLES.md) и [flows/](../flows/README.md).

Главные расхождения прототипа с целевой моделью — не ошибки документа, а объём
работы впереди:

- **ролей три** (`is_staff`, `ClubAdmin`, игрок), в ТЗ §2 — **четырнадцать** с
  областью и сроком действия;
- **статусов турнира три** (`open | in_progress | finished`), в ТЗ §4.3 —
  **восемь**, и от них зависят права;
- **форматов три**: два сеточных (`single_elimination`, `group_playoff`) и
  `manual` — турнир протоколом вручную ✳ (11.09.2026, пилот): сетки нет, матчи
  турнира, прошедшего вне системы, вносит председатель ГСК
  ([RATING.md](../RATING.md), раздел 5.1). Перечень сеточных форматов
  уточняется у федерации ([QUESTIONS.md](../QUESTIONS.md) §13);
- политик турнира (кто утверждает, куда идёт рейтинг, модель денег) в модели
  ещё нет — см. `TOURNAMENT_TEMPLATE` в `diagrams/domain.d2`.

## Stack
- **Django 5** + **Django REST Framework** + **SimpleJWT** (cookie-based auth)
- **Python 3.9**, venv at `C:\apps\tt_back\venv\Scripts\python.exe`
- ⚠ **Локально стоит Django 4.2.15, а не 5.x.** `requirements.txt` просит `>=5.0`, но
  Django 5 требует Python 3.10+, и на 3.9 не ставится. Код держим совместимым с обеими
  версиями; возможности Django 5.1+ (например `OPTIONS["transaction_mode"]`) локально
  недоступны.
- **Локальная база — SQLite, запись с `BEGIN IMMEDIATE`** ✳ (10.09.2026). Без
  `DATABASE_URL` настройки подменяют движок на `tt_back.sqlite`: транзакция сразу берёт
  право на запись, и второй писатель ждёт (до 20 с), а не падает с «database is locked».
  С обычным `BEGIN` так падала неявка, записанная в одну секунду с исправлением из
  соседней сквозной проверки. Боевой базы (PostgreSQL) это не касается. Проверка —
  `tt_back/test_sqlite.py`.
- **`openpyxl`** ✳ (01.10.2026) — файлы Excel: выгрузка рейтинг-листа (`rating/export.py`).
  Стоит в `requirements.txt`; в локальный venv (`C:\apps\tt_back\venv`) ставится руками —
  без неё не импортируется `rating/views.py`, то есть не поднимается весь API рейтинга.
- Run server: `venv\Scripts\python.exe manage.py runserver`
- Run migrations: `venv\Scripts\python.exe manage.py makemigrations && venv\Scripts\python.exe manage.py migrate`
- Django check: `venv\Scripts\python.exe manage.py check`

## Apps
| App | Purpose |
|-----|---------|
| `users` | Custom phone-based User, JWT cookie auth, user search |
| `tournaments` | Tournaments, participants, bracket/group matches, table management |
| `clubs` | Clubs, club admins (ClubAdmin), club tables (ClubTable) |
| `notifications` | In-app notifications feed |
| `rating` | Национальный рейтинг спортсменов. Движок (`engine.py`) — чистая арифметика Положения ФНТ РК без обращений к базе; сборка (`services.py`) читает протокол турнира, зовёт движок и раскладывает результат по журналу и карточкам; API — лист (**порядок строк считает сервер** ✳ 16.09.2026: `GET /api/rating/?sort=колонка` / `?sort=-колонка`, колонки — по белому списку `views.SORT_FIELDS` — `value`, `name`, `birth_year`, `region`; чужая колонка даёт `DEFAULT_ORDER` — по убыванию значения, и имя поля из запроса в `order_by` не попадает; вторым полем сортировки всегда имя, иначе у равных значений порядок плавал бы между запросами; лист постраничный, и сортировать на клиенте значило бы переставлять сто строк вместо всего листа), **выгрузка листа в Excel** ✳ 01.10.2026 (`GET /api/rating/export/`, `RatingExportView`, `AllowAny`: тот же `_apply_filters` и `_order`, что у листа, но без страниц — в файл идёт весь отбор; сам файл собирает `export.py` на `openpyxl`: пять колонок экрана, рейтинг числом с форматом `0.00`, фамилия прописными — правило `fio()` повторяет фронтовое, пустые год и регион пустыми ячейками; имя `rating-ГГГГ-ММ-ДД.xlsx`, `Cache-Control: no-store`), карточка, заведение спортсмена (старт считает сервер по п. 6.1, 6.3, 17.4), фиксация неявки, исправление значения, объединение дублей, протоколы (список, страница, предпросмотр, утверждение с пересчётом, возврат на доработку) и турниры протоколом вручную ✳ (11.09.2026): `manual.py` заводит турнир формата `manual`, участников и матчи, а утверждение уходит в тот же `set_protocol` → `apply_tournament` — второго расчёта нет. Возрастные категории соревнования ✳ (15.09.2026, решение федерации): турнир вручную заводится со списком `age_categories` (диапазоны дат рождения), а `GET /api/rating/protocols/<id>/candidates/` отдаёт кандидатов из рейтинга, уже отобранных по категориям турнира (`category` — одна из них), полу и поиску; участники на странице протокола несут `sex`, `birth_year`, `birth_date`, `region` и `categories`. Правило «подходит по возрасту» одно — `ages.py`, запросом к базе (без даты — по году, наше допущение, QUESTIONS 5.17). **Регион — из закреплённого списка** ✳ (16.09.2026, замечания федерации): `regions.py` держит единственный список (`CITIES` — три города республиканского значения, `OBLASTS` — семнадцать областей, `REGIONS` — они же вместе, города первыми) и `clean()`, который возвращает регион из списка, пустую строку («не указан») или `None` для чужого; `services.create_athlete` на `None` отвечает 400, и это единственный вход новых карточек — мимо проверки не завести ни через `athletes/`, ни через `new` в участниках турнира. `GET /api/rating/regions/` (`RatingRegionsView`, `AllowAny`) отдаёт список экрану, чтобы он не повторял его у себя. Старые написания («БҚО», «Қарағанды обл.») не трогали — QUESTIONS 5.21, 5.22. Матч может играться до 5 побед ✳ (16.09.2026): `manual.GAMES_TO_WIN = (2, 3, 4, 5)`. Коэффициенты (`RatingParams`) правятся только в Django-админке ✳ (11.09.2026): экран калибровки, выпуски, апелляции и журнал председателя сняты решением владельца продукта вместе с их ручками. **Журнал `RatingEntry` — источник правды:** значение карточки всегда равно сумме неотменённых строк, поэтому откат протокола помечает строки отменёнными и пересобирает карточку, а не «вычитает обратно». Прежняя методика RTTF из прототипа удалена вместе с полем `User.rating`. Устройство целиком — [RATING.md](../RATING.md). Тесты — `pytest rating`. Показательные данные: `manage.py seed_rating_demo --reset` (сносит и заведённое сквозными проверками — турниры и пользователей с «[e2e] » в названии); статусы активности: `manage.py refresh_activity` |
| `scoreboard` | Live score of a streamed table: one row per board, read by the OBS overlay, written by the operator's panel (`front/` → `/scoreboard`). Clients subscribe over SSE (`<key>/stream/`); the stream watches the row's `rev` because gunicorn's two processes share no memory. Holds the discipline (`mode` — single / doubles / team, set by the panel's top tab bar), serve (`first_server` — who served first this game; the current server is derived from the score), the pair's second name (`*_name2`), time-outs, cards, and the team tie's overall score with team names (`team_*`, on air above the players in `mode=team`). Optimistic concurrency on `rev`, ETag/304 on the snapshot GET. **An open stream holds a gunicorn thread** — `nixpacks.toml` runs 12 threads per worker for that. Has tests — `manage.py test scoreboard` |

## Auth
- JWT stored in `HttpOnly` cookies (`access_token`, `refresh_token`)
- `CookieJWTAuthentication` in `users/authentication.py` reads from cookie
- Three roles: `is_staff` (superuser), `ClubAdmin` (club-level), player
- **Роли по модели ТЗ** ✳ (10.09.2026): `users.Role` — «пользователь → роль → область»
  (`ROLE` в `diagrams/domain.d2`). Первая роль — председатель ГСК (`gsk_chairman`),
  проверка — `users/permissions.py` (`IsGskChairman`). Ему принадлежат правки рейтинга;
  `is_staff` без роли их больше не открывает.
- **Администратор федерации** ✳ (28.10.2026): `federation_admin` (роль 1, ROLES.md). Своих
  ручек нет: проходит `IsGskChairman` и получает `is_staff` + `is_superuser` (Django-админка).
  Заводит `manage.py create_federation_admin --email --name --password`; общая часть команд
  ролей — `users/management/commands/_role_account.py`. Кабинет на фронте — `/dashboard`.
- **Спортсмен и судья** ✳ (28.10.2026): `player`, `referee` — роли заведены, прав сверх входа нет,
  кабинет спортсмена на фронте пустой (`/player`); судья (`/referee`) видит календарь турниров,
  сведения о турнире и подаёт заявки на судейство (✳ 29.10.2026, `IsReferee`, раздел «Приём заявок
  судей» ниже); составы турниров ему не отдаются. Заводят `manage.py create_player` /
  `create_referee` (`--email --name --password`).
- **Вход по почте и паролю — временный** (ТЗ §2): `POST /api/auth/login/email/`, только для
  пользователей с ролью. Председателя заводит `manage.py create_gsk_chairman --email --name
  --password`.
- ⚠ **Локальное окружение: `cryptography` 41.0.7, не 42.x.** Сборка 42.0.8 не грузится на
  Python 3.9.0 (`DLL load failed while importing _rust`), а через неё падает `import jwt` —
  то есть любой выпуск токена, любой удачный вход. В `requirements.txt` её нет (нужна
  библиотекам веб-пушей), на прод (Linux) не влияет. Поломка жила давно: тесты входили в
  обход токенов через `force_authenticate`, и выпуск токена не проверял никто.

## Key Models

### User (`users/models.py`)
- `id` (UUID), `phone` (USERNAME_FIELD), `name`, `email` (уникальна, может быть пустой —
  временный вход по почте и паролю, только для пользователей с ролью), `avatar`,
  `is_active`, `is_staff`, `created_at`; роли — `user.roles` (`users.Role`, см. «Auth»)
- Рейтинга на пользователе нет ✳ (10.09.2026): поле `rating` удалено вместе с методикой
  RTTF (миграция `0004_remove_user_rating`), значение живёт в `rating.RatingProfile`.
  `GET /api/auth/me/` по-прежнему отдаёт `rating` — строкой из карточки, `null`, если
  карточки нет (`users/serializers.py`)

### Club (`clubs/models.py`)
- `Club`: name, description, created_by
- `ClubAdmin`: club ↔ user M2M with added_by
- `ClubTable`: club-level physical tables (number, name, is_active)

### Tournament (`tournaments/models.py`)
- `format`: `single_elimination` | `group_playoff` | `manual` («Протокол вручную» ✳ 11.09.2026: сетки нет, участников и матчи вносит председатель ГСК через `rating/manual.py`; миграция `0017`)
- `games_to_win`: партий до победы в матче (default 3). Турнир вручную заводится с 2, 3, 4 или 5 (`rating/manual.py::GAMES_TO_WIN`; пять ✳ 16.09.2026 по замечанию федерации), и `manual.add_match` принимает только счёт «у победителя ровно N, у проигравшего меньше» ✳ 11.09.2026; миграция `0018`
- `age_categories` → `TournamentAgeCategory` ✳ 15.09.2026 (решение федерации, ТЗ §4.1): возрастная категория — `name` (≤ 80, можно пусто; тогда `label` — «ДД.ММ.ГГГГ — ДД.ММ.ГГГГ»), `born_from`, `born_to` (даты рождения, включительно), `order`. Несколько на турнир; заводятся в `rating/manual.py::create_tournament` одной транзакцией с турниром (обе даты обязательны, «от» ≤ «до», не больше `MAX_AGE_CATEGORIES` = 12 — предел наш). Участник в категорию не записывается — это фильтр ([RATING.md](../RATING.md), раздел 3.10); миграция `0019`
- `group_size`: players per group (default 4)
- `status`: `open` | `in_progress` | `finished`
- `referee_recruitment_open`, `referee_recruitment_until` ✳ 29.10.2026: приём заявок судей — переключатель и необязательный срок (день включительно); `referee_recruitment_active()` — идёт ли сегодня, сериализатор отдаёт все три; миграция `0020`
- `ends_at`, `city`, `venue`, `age_min`, `age_max` ✳ 29.10.2026: сведения о турнире — окончание (день), где, возраст участников в годах (пусто — без границы; отдельно от возрастных категорий протокола); миграция `0021`. Правка — `PATCH /api/tournaments/<pk>/update/` (`TournamentUpdateSerializer`): ещё `name`, `description`, `starts_at`, `format`, `group_size`, `games_to_win` (2–5), `level`, `is_rating`; окончание не раньше дня начала (сверяется и с новым началом из того же запроса), «от» не больше «до», возраст 1–99 (границы наши), формат после старта (не `open`, есть матчи или группы) и у протокола вручную не меняется. Правят `is_staff`, админ клуба турнира и ✳ председатель ГСК / администратор федерации. Тесты — `tournaments/tests/test_tournament_info.py`
- `TournamentTable`: tournament-specific tables (pre-populated from ClubTable on create)
- `TournamentGroup`, `GroupParticipant`, `GroupMatch`: group stage models
- `Match`: bracket match with `loser_next`/`loser_next_slot` for consolation routing, `is_consolation` flag

### RatingProfile (`rating/models.py`)
- Рейтинговая карточка, одна на пользователя: значение, происхождение старта, счётчики, статус активности; для выборок — `sex`, `birth_year`, `region`
- `region` — **значение из закреплённого списка** ✳ 16.09.2026 (`rating/regions.py`): три города республиканского значения и семнадцать областей или пусто. Поле осталось `CharField`, а не ссылкой на справочник, и миграции не потребовало: проверка стоит в `services.create_athlete`, поэтому у карточек, заведённых раньше, прежние написания сохранились ([QUESTIONS.md](../QUESTIONS.md) 5.21, 5.22)
- `birth_date` ✳ 15.09.2026 (миграция `rating/0006`): по ней спортсмен сверяется с возрастной категорией соревнования (`rating/ages.py`). `services.create_athlete(birth_date=…)` принимает настоящую дату не раньше 1920 года (граница наша) и не позже сегодняшней и выводит из неё `birth_year`; один год без даты по-прежнему принимается. `POST /api/rating/athletes/` и `new` в участниках турнира принимают `birth_date`, сериализатор карточки его отдаёт

## Bracket Engine (`tournaments/bracket.py`)
- `generate_bracket(tournament)` — single elimination (for `single_elimination` format)
- `generate_group_bracket(tournament)` — creates round-robin groups
- `generate_all_places_bracket(tournament, players)` — full consolation bracket (all places determined, no elimination)
- `generate_playoff_from_groups(tournament)` — seeds players from groups into `generate_all_places_bracket`
- `advance_winner_and_loser(match, winner, loser)` — routes winner to next winners match AND loser to consolation match
- `auto_assign_table(match)` — assigns lowest free `TournamentTable` when match starts

## Состав турнира ✳ (28.10.2026)
- Судейская коллегия турнира — роли с областью «турнир» (`scope="tournament"`, `scope_id` — турнир), отдельной
  таблицы нет: `chief_referee` (главный судья), `deputy_chief_referee` (заместитель), `chief_secretary` (главный
  секретарь) — по одному на турнир, `referee` (судья стола) — сколько угодно; у человека в турнире одна должность
  (TZ, решение 28.10.2026). `roster.POSITIONS` — старшинство, в нём же порядок списка судей.
- `GET/PATCH/DELETE /api/tournaments/<pk>/referees/<user_id>/` — карточка судьи (должность здесь, другие турниры,
  где он судит), смена должности (`{"position"}`, занятую единственную — 400) и «убрать из коллегии турнира»
  (в других турнирах он остаётся).
- **Удалили турнир — роли в его области ушли тоже**: у роли нет внешнего ключа на турнир (`scope_id`), поэтому
  `tournaments/signals.py` (`post_delete`) сносит их сам; иначе у людей копились должности несуществующих турниров.
- `GET /api/auth/people/<id>/` ✳ (28.10.2026) — профиль человека: имя, почта, телефон, роли (у ролей турнира —
  `{id, name}` турнира). Телефон — персональные данные: только председатель ГСК и администратор федерации.
  Служебную метку вместо номера («feder-…», учётки по почте) отдаёт как `null`. Тесты — `users/tests/test_people.py`.
- Правила — `tournaments/roster.py` (`candidates`, `add_participant`, `add_referee`, `RosterError`), ручки
  только переводят их в HTTP. `GET /api/tournaments/<pk>/participants/` и `…/referees/` — тоже только
  председатель ГСК и администратор федерации ✳ (29.10.2026, решение владельца продукта: судье составы не
  видны; до этого — любой вошедший); `POST` туда же (`{"user_id"}`, у судей ещё `"position"`) и `GET …/candidates/?role=player|referee&q=` (учётки, которых в списке
  ещё нет; поиск по имени, почте, телефону; 20 строк) — председатель ГСК и администратор федерации
  (`IsGskChairman`). В завершённый турнир и в идущий плей-офф спортсмена не добавить, дубль — 400.
  Тесты — `tournaments/tests/test_roster.py`, `test_referees.py`.

## Приём заявок судей ✳ (29.10.2026)
- Правила — `tournaments/recruitment.py` (`apply`, `withdraw`, `accept`, `reject`, `RecruitmentError`), модель —
  `RefereeApplication` (одна на судью и турнир: `positions` — отмеченные должности по старшинству `roster.POSITIONS`,
  `status` `pending | accepted | rejected`, назначенная `position`, `decided_by/at`). Ручки только переводят правила в HTTP.
- `PATCH /api/tournaments/<pk>/referee-recruitment/` `{open, until}` (`until: null` — без срока) — председатель ГСК и
  администратор федерации (`IsGskChairman`).
- `GET|POST|DELETE …/referee-applications/my/` — судья (`IsReferee`): своя заявка `{application: … | null}`, подать
  `{positions}`, отозвать (только без решения). Подать можно, пока приём идёт, хотя бы с одной должностью, если ты ещё не
  в коллегии турнира и ждущей заявки нет; после отказа (или снятия из коллегии) та же строка становится ждущей заново.
- `GET …/referee-applications/` и `POST …/referee-applications/<id>/accept/` `{position}` | `…/reject/` — председатель ГСК
  и администратор. Назначение — только на должность из заявки, через `roster.add_referee` в одной транзакции: занятая
  единственная должность даёт 400, и заявка остаётся ждущей.
- **Приём заявок игроков** ✳ (29.10.2026): `player_recruitment_open` (по умолчанию `True` — так записывались и до него,
  розданные ссылки не сломались) и `player_recruitment_until`, `Tournament.player_recruitment_active()` (общее правило —
  `models._active`); `PATCH …/player-recruitment/` `{open, until}` — тот же `RecruitmentView`, что у судей (`who` из
  адреса). Закрытый приём отбивает все три пути самозаписи: `participants/join/`, `join/<token>/`,
  `join/<token>/register/` — 400 «Приём заявок игроков закрыт.» (`PLAYERS_CLOSED`). Миграция `0022`.
- `DELETE …/participants/<id>/remove/` — ещё и председатель ГСК / администратор федерации ✳ (29.10.2026, карточка
  спортсмена); из начатого турнира по-прежнему 400.
- **Чего ещё нет:** резерва с очередью и авто-отказа по закрытию приёма (ТЗ §4.4, QUESTIONS 3.3), причины отказа,
  уведомлений о решении, допуска к подаче по категории (QUESTIONS 3).
- Тесты — `tournaments/tests/test_recruitment.py`.

## Расписание «группы + плей-офф» ✳ (30.10.2026)
- Правила — `tournaments/schedule.py`: чистая часть (`snake_split`, `round_robin_rounds`, `assign_slots`, `slot_time`) и
  операции с базой (`build`, `move`, `edit_match`, `finalize`, `snapshot`, `ScheduleError`). Устройство и чего ещё нет —
  [ENGINE.md](../ENGINE.md), «Сделано: расписание групп». Тесты — `test_schedule_engine.py` (TDD, без базы) и
  `test_schedule.py`.
- Поля: у турнира `schedule_status` (`none | draft | final`), `schedule_tables`, `schedule_match_minutes` (4 и 30 — наши),
  `schedule_days` ✳ (30.10.2026, миграция `0024`; прежние `schedule_day_start/end` переведены в дни по датам матчей) —
  `[{date, start, end}]` по порядку дат, у каждого дня свои часы; у `GroupMatch` — `round_number`, `scheduled_at`,
  `referee` (судья стола). Миграция `0023`.
- `GET /api/tournaments/<pk>/schedule/` — главному судье турнира, председателю ГСК и администратору (`can_edit` — только
  главному судье, пока не отправлено); `POST …/schedule/build/` `{tables, match_minutes, days: [{date, start, end}]}` (без `days` — даты
  турнира, 10:00–18:00; не поместились — 400 с числами),
  `…/move/` `{user_id, group_id}`, `…/finalize/`, `PATCH …/schedule/matches/<id>/` `{referee_id, table, scheduled_at}` —
  **только главный судья** (решение владельца продукта; администратору — 403). Отправленное — 400 на любую правку.
- **Главный судья ведёт и состав, и сведения своего турнира**: `IsGskChairmanOrChief` (`views.py`) пускает его к
  `participants/` (смотреть, добавить), `candidates/?role=player`, `participants/<id>/remove/` и `update/`. Судей ему не
  добавить (`candidates/?role=referee` — 403). После отправки расписания состав не меняется ни у кого:
  `roster.add_participant` и самозапись — 400 «Расписание отправлено — состав не меняется.»
- В ответе расписания у матча — `score1`, `score2`, `winner`, `is_walkover`; у игрока группы — `standing`
  (`place`, `points`, `wins`, `losses`, `diff`): место — по очкам, победам, разнице партий (тай-брейка по личной
  встрече нет, ENGINE.md).
- `GET /api/auth/me/` у ролей отдаёт `scope_id` ✳ (30.10.2026): у ролей турнира — какого (кабинет главного судьи).

## Permissions
- `_can_manage_tournament(user, tournament)` — True if `is_staff` OR `ClubAdmin` of tournament's club
- `_can_create_tournament(user, club)` — True if `is_staff` OR `ClubAdmin` of that club

## Key Endpoints
```
POST /api/auth/login/         → sets JWT cookies
GET  /api/auth/me/            → current user (includes club_ids_admin, rating)
GET  /api/clubs/              → all clubs
GET  /api/clubs/my/           → clubs where user is admin
GET  /api/tournaments/        → list (filterable by ?club_id=)
POST /api/tournaments/<pk>/start/        → starts bracket or group stage
POST /api/tournaments/<pk>/playoff/      → generates all-places playoff from groups
GET  /api/tournaments/<pk>/groups/       → group stage data
POST /api/tournaments/<pk>/groups/<gid>/matches/<mid>/score/  → submit group score
PATCH /api/tournaments/<pk>/groups/<gid>/matches/<mid>/table/ → assign table to group match
PATCH /api/tournaments/<pk>/matches/<mid>/table/              → assign table to bracket match
POST /api/tournaments/<pk>/matches/<mid>/score/               → submit bracket score
```

## Important Conventions
- Club table numbers must be unique per club; tournament table numbers unique per tournament
- Table assignment validates no other in-progress match (group or bracket) uses that table
- Group match status: `pending` → `in_progress` (on table assign) → `finished` (on score submit)
- Bracket match status same pattern; `advance_winner_and_loser` auto-starts next matches
- `GroupMatch` initial status is always `pending` (not `in_progress`)
