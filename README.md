# tt_tournament

The table-tennis **tournament** app — QR registration, groups, playoff brackets, self-scoring,
live standings and push notifications.

Split out of the SpinCoach repos on 2026-07-13, code **and** infrastructure. `tt_back` /
`tt_front` are now the AI stroke-analysis product; the two share no code, no repo, no Railway
project, no Vercel project and no database.

```
back/    Django + DRF + Postgres     <- tt_back  archive/main-tournament-2026-07-04  (47 commits)
front/   Next.js (App Router)        <- tt_front archive/main-2026-07-04             (109 commits)
mobile/  Expo (React Native, SDK 57) <- new
```

Both histories are preserved in full — nothing was rewritten except nesting each project under
its own subdirectory, so `git log --follow back/<file>` still reaches the first commit.

## Live

| | where | url |
|---|---|---|
| back | Railway project `tt_tournament`, service `back` | https://back-production-d8c8.up.railway.app |
| db | Railway project `tt_tournament`, service `Postgres` | private; `DATABASE_URL` is a Railway reference |
| front | Vercel project `tt-tournament`, root directory `front` | https://tt-tournament-one.vercel.app |

The database was migrated off the old shared Railway `stage` environment: 1,681 rows across
18 tables (12 tournaments, 490 matches, 231 participants, 31 users), verified row-for-row.

**Railway currently deploys from a source upload, not from GitHub**, because Railway's GitHub
App is only granted access to `tt_back`. To turn on auto-deploy:
<https://github.com/settings/installations> → Railway → Configure → add `tt_tournament`, then
point the `back` service at this repo with **root directory `back`**. Until then:
`cd back && railway up`.

`back/railway.json` pins the **NIXPACKS** builder on purpose — Railway's default RAILPACK
ignores `nixpacks.toml`, which skips `collectstatic` and serves an unstyled Django admin.

### Builds are path-filtered

`mobile/` has no deployment — Expo ships binaries through EAS Build, not a web host. But a
monorepo means every push would otherwise rebuild *everything*, so both web deploys are
scoped to their own folder:

- Railway: `watchPatterns = ["back/**"]`
- Vercel: ignored-build-step `git diff --quiet HEAD^ HEAD -- .` (runs inside `front/`)

A commit that only touches `mobile/` now redeploys nothing.

## mobile/ (Expo)

```bash
cd mobile && npm install && npx expo start        # scan the QR with Expo Go
```

Standalone on purpose: it has its own `package.json` and duplicates the API types in
`mobile/api.ts` rather than importing from `front/lib`. Sharing them means npm workspaces plus
a Metro monorepo config (`watchFolders` / `nodeModulesPaths`), which is a well-known source of
baffling bundler errors — not worth it for one screen. Promote to a shared `packages/api` when
the duplication actually costs something.

`EXPO_PUBLIC_API_URL` selects the backend (see `.env.example`); `api.ts` falls back to
production if it is unset.

**Not done yet: push notifications.** The Django `notifications` app is built on **web-push /
VAPID**, which does not work in a native app — Expo uses Expo push tokens on top of FCM/APNs.
A real mobile release needs a second notification channel in the backend.

## Layout

| path | what |
|---|---|
| `back/tournaments` | tournaments, groups, playoff bracket generation, scoring |
| `back/clubs` | clubs and membership |
| `back/notifications` | web-push / VAPID notifications |
| `back/users` | auth |
| `front/app/(auth)` | login / register |
| `front/app/dashboard` | organiser + player dashboards |
| `front/app/join/[token]` | QR self-registration (dynamic route — bare `/join` is a 404 by design) |

## Backup / restore

A verified dump of the tournament database lives **outside any repo** — it holds real player
names and phone numbers, so it must never be committed:

```
C:/apps/backups/tt_tournament/
  tt_tournament_20260714.dump    pg_dump custom format, 1681 rows / 18 tables
  env_stage_tt_back.json         the 38 service env vars (SECRET_KEY, VAPID, Stripe, R2, Modal)
  env_stage_Postgres.json
```

```bash
pg_restore --no-owner --no-privileges --clean --if-exists \
  -d "$DATABASE_PUBLIC_URL" tt_tournament_20260714.dump
```

## Local dev

```bash
cd back  && cp .env.example .env && pip install -r requirements.txt && python manage.py runserver
cd front && npm install && npm run dev        # needs NEXT_PUBLIC_API_URL
```
