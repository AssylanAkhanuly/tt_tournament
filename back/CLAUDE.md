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
- **форматов два** (`single_elimination`, `group_playoff`), перечень уточняется
  у федерации ([QUESTIONS.md](../QUESTIONS.md) §13);
- политик турнира (кто утверждает, куда идёт рейтинг, модель денег) в модели
  ещё нет — см. `TOURNAMENT_TEMPLATE` в `diagrams/domain.d2`.

## Stack
- **Django 5** + **Django REST Framework** + **SimpleJWT** (cookie-based auth)
- **Python 3.9**, venv at `C:\apps\tt_back\venv\Scripts\python.exe`
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
| `scoreboard` | Live score of a streamed table: one row per board, read by the OBS overlay, written by the operator's panel (`front/` → `/scoreboard`). Clients subscribe over SSE (`<key>/stream/`); the stream watches the row's `rev` because gunicorn's two processes share no memory. Holds serve (`first_server` — who served first this game; the current server is derived from the score), the pair's second name (`*_name2`, non-empty = doubles), time-outs and cards. Optimistic concurrency on `rev`, ETag/304 on the snapshot GET. **An open stream holds a gunicorn thread** — `nixpacks.toml` runs 12 threads per worker for that. Has tests — `manage.py test scoreboard` |

## Auth
- JWT stored in `HttpOnly` cookies (`access_token`, `refresh_token`)
- `CookieJWTAuthentication` in `users/authentication.py` reads from cookie
- Three roles: `is_staff` (superuser), `ClubAdmin` (club-level), player

## Key Models

### User (`users/models.py`)
- `phone` (USERNAME_FIELD), `name`, `is_staff`, `rating` (default 100)

### Club (`clubs/models.py`)
- `Club`: name, description, created_by
- `ClubAdmin`: club ↔ user M2M with added_by
- `ClubTable`: club-level physical tables (number, name, is_active)

### Tournament (`tournaments/models.py`)
- `format`: `single_elimination` | `group_playoff`
- `group_size`: players per group (default 4)
- `status`: `open` | `in_progress` | `finished`
- `TournamentTable`: tournament-specific tables (pre-populated from ClubTable on create)
- `TournamentGroup`, `GroupParticipant`, `GroupMatch`: group stage models
- `Match`: bracket match with `loser_next`/`loser_next_slot` for consolation routing, `is_consolation` flag

## Bracket Engine (`tournaments/bracket.py`)
- `generate_bracket(tournament)` — single elimination (for `single_elimination` format)
- `generate_group_bracket(tournament)` — creates round-robin groups
- `generate_all_places_bracket(tournament, players)` — full consolation bracket (all places determined, no elimination)
- `generate_playoff_from_groups(tournament)` — seeds players from groups into `generate_all_places_bracket`
- `advance_winner_and_loser(match, winner, loser)` — routes winner to next winners match AND loser to consolation match
- `auto_assign_table(match)` — assigns lowest free `TournamentTable` when match starts

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
