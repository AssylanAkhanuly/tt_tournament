# tt_tournament

The table-tennis **tournament** app — QR registration, groups, playoff brackets, self-scoring,
live standings and push notifications.

Extracted 2026-07-13 into its own repo. It used to live on archived branches inside the
SpinCoach repos, which have since moved on to AI stroke analysis and coaching; the two
products no longer share code, so they no longer share a repo.

```
back/    Django + DRF + Postgres     <- tt_back  archive/main-tournament-2026-07-04  (47 commits)
front/   Next.js (App Router)        <- tt_front archive/main-2026-07-04             (109 commits)
```

Both histories are preserved in full. Nothing was rewritten except nesting each project under
its own subdirectory, so `git log --follow back/<file>` still works back to the first commit.

## Layout

| path | what |
|---|---|
| `back/tournaments` | tournaments, groups, playoff bracket generation, scoring |
| `back/clubs` | clubs and membership |
| `back/notifications` | web-push / VAPID notifications |
| `back/users` | auth |
| `front/app/(auth)` | login / register |
| `front/app/dashboard` | organiser + player dashboards |
| `front/app/join` | QR self-registration |

## Deploying

Each half deployed as its own Railway service from the repo root. **Now that they are nested,
each service needs its root directory set** (`back` / `front`) or the build will not find
`requirements.txt` / `package.json`:

- `back/railway.json` pins the **NIXPACKS** builder on purpose. Railway's default RAILPACK
  ignores `nixpacks.toml`, which skips `collectstatic` and serves an unstyled Django admin.
- Production and stage previously pointed at different Postgres instances; check
  `DATABASE_URL` per environment before the first deploy from this repo.

Copy `back/.env.example` to `.env` and fill it in.
