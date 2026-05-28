# SpinCoach Frontend — Claude Context

## Stack
- **Next.js 16** App Router, TypeScript, Tailwind CSS
- API base: `process.env.NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- Run: `npm run dev` (or `node node_modules/next/dist/bin/next dev`)
- Build: `NEXT_TELEMETRY_DISABLED=1 node node_modules/next/dist/bin/next build`
- TypeScript check: `node node_modules/typescript/lib/tsc.js --project tsconfig.json --noEmit`

## Design System
CSS vars in `app/globals.css`:
- `--bg: #09091a` — page background
- `--surface: #111228` — sidebar/panel backgrounds
- `--card: #14162a` — card backgrounds
- `--elevated: #1a1d35` — modals/popovers

Nav height: `h-[52px]` (sticky top). Tournament detail uses `fixed inset-x-0 bottom-0 top-[52px]`.

## Auth
- JWT in `HttpOnly` cookies (set by backend). `credentials: "include"` on all API calls.
- `apiFetch` in `lib/api.ts` auto-refreshes on 401.
- Three roles: `user.is_staff` (superuser), `user.club_ids_admin: string[]` (club admin), player.

## Key Pages / Routes
| Route | Component | Who sees it |
|-------|-----------|-------------|
| `/dashboard` | `DashboardPage` → `ClubAdminDashboardClient` or `DashboardClient` | All |
| `/dashboard/clubs/[id]` | `ClubDetailClient` | All (admin features gated) |
| `/dashboard/tournaments/[id]` | `TournamentDetailClient` | All |

### Dashboard routing (`app/dashboard/page.tsx`)
- `is_staff` → `DashboardClient` (club list, full admin)
- `club_ids_admin.length > 0` → `ClubAdminDashboardClient` (own clubs' tournaments, list+calendar)
- Player → `DashboardClient` (club browser)

## Tournament Detail (`TournamentDetailClient.tsx`)
Tabs: **Обзор** (in_progress), **Сетка** (bracket), **Игроки**, **Столы**, **Настройки**

### Overview panel (`OverviewPanel` component)
Three-column live view when `status === "in_progress"`:
- **Top strip**: stats chips (Идут/Ждут/Готово) + active table pills (click → score modal)
- **Left**: center toggle (Группы ↔ Сетка) for `group_playoff` format
- **Center**: `BracketFlow` (winners bracket) OR group round-robin tables (`GroupRoundRobinTable`)
- **Right** (split 50/50):
  - Top: "Идут сейчас" — live matches with score entry
  - Bottom: "Матчи групп" / "Ожидают стола" — pending matches queue

### Group matches queue logic
Greedy non-conflicting scheduling: walks pending matches in order, each player appears at most once in the callable queue. Blocked matches (player busy) shown dimmed below.

### Score modals
- `ScoreModal` — bracket matches (preset buttons 3:0/3:1/3:2 + steppers)
- `GroupScoreModal` — group matches (same UX: presets + steppers + Освободить/Сохранить/Отмена)

## Tournament Formats
- **`single_elimination`**: standard knockout bracket
- **`group_playoff`**: group stage (round-robin within groups) → full consolation playoff
  - All places determined — no elimination
  - `Match.is_consolation: boolean` differentiates bracket tracks
  - Consolation bracket shown in `ConsolationBracketView` below winners bracket in Сетка tab

## Calendar Feature (`components/TournamentCalendar.tsx`)
FullCalendar v6 with dark theme (CSS class `.fc-dark`). Features:
- Month/Week/Day/List views with Russian locale
- Drag events to reschedule (`api.updateTournament` PATCH)
- Click date → create tournament modal
- Click event → score/detail popover
- `navLinks` + `navLinkDayClick="timeGridDay"` for day drill-down
- Unscheduled tournaments in right sidebar (draggable onto calendar)
- `droppingIds` ref prevents re-render jiggle after drag

## Club Detail (`ClubDetailClient.tsx`)
Sidebar nav hierarchy:
```
← Клубы
Турниры (parent tab)
  Список   (sub-item, URL: ?view=list)
  Календарь (sub-item, URL: ?view=calendar)
Столы
Админы
Настройки
```
URL params: `?tab=tournaments&view=calendar` preserve state on refresh.

## Table Assignment Rules
- `freeTables` excludes BOTH bracket live match tables AND group match live tables
- Backend validates no other in-progress match uses the same table (400 error if conflict)
- Group match tables shown as live pills in the top strip (click → `GroupScoreModal`)

## FullCalendar Dark Theme
Global CSS in `app/globals.css` under `.fc-dark` class. Override key variables:
`--fc-border-color`, `--fc-today-bg-color`, `--fc-event-bg-color`, etc.

## Conventions
- No comments unless WHY is non-obvious
- `var(--bg/surface/card/elevated)` for backgrounds — never hardcode hex
- `[color-scheme:dark]` on all `<select>` / `<input type="datetime-local">`
- Custom `TablePicker` component instead of native `<select>` for table assignment (avoids white dropdown bug on Windows)
- Dynamic imports with `ssr: false` for FullCalendar and BracketFlow
