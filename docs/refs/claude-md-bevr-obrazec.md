@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Bevr" (package name `bevr`) — jobescape's internal **visual funnel builder**. A Next.js 15 / React 19 app (App Router, Turbopack) for constructing conversion funnels — quizzes, onboardings, upsells, unsubscribe flows, and selling pages — that the separate `funnel` service consumes at runtime. Internal tool: invite-only registration, role-gated (`admin` / `designer` / `content`).

`NEXT_PUBLIC_APP_NAME` switches behavior between two modes: `"constructor"` (the builder) and `"funnel"`.

## Commands

```bash
npm run dev          # Next dev server with Turbopack (localhost:3000)
npm run build        # Production build (ESLint errors are ignored during build — see below)
npm run start        # Serve the production build
npm run lint         # ESLint (Airbnb + TS + Prettier)
npm run lint:fix     # ESLint --fix across .js/.jsx/.ts/.tsx
npm run yws          # Local y-websocket collab server on port 1234

docker compose up -d # Local Postgres 17 on port 5555 (db: funnel_local)
```

- **Testing (adopted from `sart-funnel` on 2026-08-06):** `npm run test` (Vitest watch),
  `npm run test:run` (once), `npm run test:coverage`, `npm run test:e2e` (Playwright),
  `npm run storybook`. Unit tests live next to the code (`*.test.ts(x)`), e2e specs in
  `e2e/` with all config in `e2e/env.ts` — no URL/credential/id literals in specs.
  Authenticated builder specs skip unless `BEVR_E2E_EMAIL` / `BEVR_E2E_PASSWORD` /
  `BEVR_E2E_PAGE_ID` are set, and the skip names the missing variable.
- **Local `DATABASE_URL` must be the docker Postgres above** (`postgresql://postgres:postgres@localhost:5555/funnel_local`), never a shared database. Bring it up with `docker compose up -d`, then `npx prisma migrate deploy` to create the tables. See **Database safety** below — this is not a style preference, it is the guardrail that stops a stray command from wiping a shared DB.
- **Installs require the private GitHub Packages registry.** `.npmrc` points the `@job-escape` scope at `npm.pkg.github.com` (the `@job-escape/fce-lib` dependency lives there).
- **Builds do not fail on lint or type errors.** `next.config.ts` sets `eslint.ignoreDuringBuilds: true`, and `tsc-errors.txt` is a checked-in snapshot of existing type errors. Run `npm run lint` and `tsc` manually to check your own changes; a green `npm run build` does **not** mean the code is type-clean.

## Architecture

### Feature-Sliced Design (FSD)

`src/` is organized in FSD layers; imports flow **downward only**. Path alias `@/*` → `src/*`.

```
app/         Next.js routes, layouts, and API route handlers
widgets/     Self-contained page sections (the "constructors": page/dialog/drawer
             builders, flows, list tables). Many parallel `mobile-*` variants.
features/    Reusable interactive units (flow-editor, content-constructor, AI agents,
             dnd, lexical-editor, preview, rules, ...)
entities/    v1 business entities — effector-based models (store/effects/events)
entities-v2/ Newer entities — plain fetch + clientApi, consumed via TanStack Query.
             Covers quiz/onboarding/upsell/unsubscribe, each split into parallel
             sub-slices: node / page / dialog / condition.
shared/      Cross-cutting: lib (prisma, s3, auth, emotion), providers, ui, types
components/   shadcn/ui (New York style, zinc) primitives + app-level components
lib/, hooks/  Small utilities (cn helper, use-mobile)
```

When adding code, match the layer: entity-level data access goes in `entities-v2/<slice>/api/`, composed UI goes in `widgets/`, the lowest-level shadcn primitives in `components/ui/`.

**`entities/` (v1, effector) and `entities-v2/` (fetch + Query) coexist.** New funnel-data work generally belongs in `entities-v2`. Effector (`createStore`/`createEffect`/`createEvent`, ~128 files) is still the backbone of the flow editor and several widget models — don't rip it out.

### Two data backends

This app reads/writes through **two distinct sources** — know which one a feature uses:

1. **External constructor API** (`process.env.NEXT_PUBLIC_API_URL`) — the source of truth for **funnels** (quizzes, onboarding, upsell, unsubscribe and their nodes/pages). `entities-v2/*/api/*` functions fetch `${NEXT_PUBLIC_API_URL}/constructor/...` directly from the client. A locked object returns **HTTP 423**; handle it via `entities-v2/quiz/lib/locked-response.ts` (`isLockedResponse`, `readLockedError`, `formatLockSources`).

2. **Local Postgres via Prisma** — **selling pages, blocks, logic rules, subscriptions, components, event properties**, plus **auth** (better-auth tables) and **AI conversation stores**. Schema is in `prisma/schema.prisma` with migrations in `prisma/migrations/`. The runtime Prisma client is **re-exported from `@job-escape/fce-lib/server`** (`src/shared/lib/prisma.ts`), not generated locally — `next.config.ts` registers `@prisma/nextjs-monorepo-workaround-plugin` to make this work in the server bundle.

3. **AWS S3 / CloudFront** — published funnel and selling-page artifacts (MDX/JSON). Internal route handlers under `src/app/api/{stage,prod}/[quizVersion]/...` and `src/app/api/[quizVersion]/...` read these via `src/shared/lib/s3.ts`. Note the `stage` vs `prod` folder split.

### Database safety

There are **three shared Postgres databases** — stage, draft, prod — and none of them belongs in a local `.env`. Migrations are applied **by CI only**: `.github/workflows/migrate.yml` runs `prisma migrate deploy` against `DATABASE_URL_STAGE` and `DATABASE_URL_DRAFT` on every push to `master`, and `migrate-prod.yml` does the same for `DATABASE_URL_PROD` on push to `prod`. The URLs live in GitHub secrets. Nothing you run locally needs one.

**`--shadow-database-url` names a database Prisma will DROP.** It reads like "a database to compare against"; it is actually a scratch workspace that Prisma resets — every table, and `_prisma_migrations` with them. On 2026-07-17 it was handed the shared `DATABASE_URL` and reset that database. The same applies to `shadowDatabaseUrl` in `schema.prisma`. Point it at a throwaway or leave it unset.

Rules that follow, in order of how much they save you:

- **Local `DATABASE_URL` = the docker Postgres**, never a shared URL. If a command can only ever reach a container you can recreate, none of the rest of this matters.
- **Prefer `prisma migrate diff --from-url` (read-only)** over `--from-migrations`, which needs a shadow database and so needs somewhere destructible.
- **Never run `prisma migrate dev` against a shared database** — it offers to reset on drift, and this schema *is* drifted (see below).
- **Read a `migrate diff` before applying it.** It reports the delta between the migrations folder and `schema.prisma`, which is not the same as "your change" — see drift.

**The schema is drifted from the migrations folder.** `schema.prisma` contains models with no migration (`notifier`, `scheduled_test.trigger`), so a diff taken `--from-migrations` sweeps up other people's unmigrated work alongside yours. When adding a model, hand-author `prisma/migrations/<ts>_<name>/migration.sql` with **only your own** statements rather than committing whatever the diff prints. `/api/notifiers` and the scheduled-runs cron query tables that do not exist in every database as a result.

### Shared funnel library: `@job-escape/fce-lib`

Used in ~95 files. Provides the shared funnel component library, renderers, the Prisma client, and shared types — imported via subpaths `@job-escape/fce-lib`, `/server`, `/client`, `/shared`. This is the contract shared with the runtime `funnel` service; treat its types as the source of truth for funnel data shapes.

### Editor & collaboration stack

- **Flow editor** (`features/flow-editor`): node-graph builder on `@xyflow/react` (React Flow). Workflow state is an effector model (`utils/create-workflow.ts`). Auto-layout via dagre/elk.
- **Real-time collaboration**: Yjs + Hocuspocus. `features/flow-editor/collab/provider.tsx` connects to a hosted collab server (`wss://collab-server-...onrender.com`) and uses Yjs awareness for live cursors/presence. `npm run yws` runs a local `y-websocket` alternative on port 1234.
- **Content/page editor** (`features/content-constructor`): WYSIWYG built on **Lexical** for rich text, with a per-editor effector store. dnd-kit + a custom `features/dnd` drive layout.

### AI subsystem

Anthropic SDK (`@anthropic-ai/sdk`, Claude Opus). Server routes live under `src/app/api/ai/*` — `quiz-flow`, `quiz-builder`, `quiz-skeleton`, `logic`, `quiz-generation`, `quiz-page-content`. Each route folder keeps internals in a `_lib/` subdir (tool definitions, tool executor, conversation store, flow-state summarizers). They run an **agentic tool-use loop** (e.g. `MAX_TOOL_ROUNDS = 60` in `quiz-flow/message/route.ts`). Conversations persist in Prisma (`AiQuizSkeletonConversation`, `AiLogicConversation`, `AiQuizFlowConversation`). Client-side counterparts are the `features/ai-*-agent` slices.

### Auth

better-auth with the Prisma adapter, email+password (`src/shared/lib/auth.ts`). Registration is **invite-only** (`Invite` model + token, validated under `src/app/api/auth/register/...`). Roles `admin | designer | content` gate access. Server pages guard with `getAuthentication()` (from `@/entities/user/lib/get-session`); the `app/(auth)` route group holds protected pages.

## Conventions

- **Prettier** (printWidth 100, double quotes, `trailingComma: "all"`) enforces import ordering via `@trivago/prettier-plugin-sort-imports` with **FSD-ordered groups** (app → widgets → features → entities → components → hooks → lib → shared) plus the tailwind class-sorting plugin. Keep imports grouped/blank-line-separated to match.
- **ESLint** is Airbnb + airbnb-typescript + Prettier. `@typescript-eslint/no-explicit-any` and `ban-ts-comment` are **errors** — avoid `any` and `@ts-ignore`.
- **Styling** is Tailwind v4 first, native CSS for the things Tailwind structurally can't reach. See **Styling** below — the split is a rule, not a preference.
- API/data helpers in `entities-v2` use `clientApi` / `handleClientResponse` (`entities-v2/user/utils/client-api.ts`); a 401 redirects to `/login`.

## Styling

**Tailwind v4, config-less.** There is no `tailwind.config.js`; the theme is CSS in
`src/app/globals.css` — an `@theme inline` block plus `:root` / `.dark` token values,
layered over `@job-escape/fce-lib/styles/variables.css`.

### The rule

**Tailwind styles markup you own. Native CSS handles only what Tailwind structurally
cannot reach.**

Everything below follows from that. It keeps a component's appearance readable at its
call site instead of action-at-a-distance in a stylesheet, and confines the exceptions
to one findable file.

### Practices

Ordered by how much they buy you.

1. **Every visual value resolves to a token.** No raw `#3987e5` or `13px` in a `.tsx`.
   Add it to `@theme inline` + `:root` + `.dark`, then use the generated utility. A
   literal is invisible to dark mode and to the next retheme; a token flips both for
   free.

2. **Semantic tokens beat `dark:` variants.** Name by role (`bg-card`,
   `text-muted-foreground`), not by value (`bg-white dark:bg-zinc-900`). A theme then
   changes in one place instead of at every call site.

3. **Reuse the primitive before styling an element.** `src/components/ui` holds the
   shadcn set. Add a `cva` variant to `<Button>` rather than styling a raw `<button>`
   or wrapping one in corrective classes — that is how a design system splits in two.

4. **Variants go in `cva`, never in prop-driven ternaries.** Two or more visual axes
   (size × tone, say) get a recipe and a single `cn(variants({ ... }), className)`
   call. This is what stops a component growing eleven boolean props.

5. **Always accept and forward `className`.** Pass it last through `cn()` from
   `@/lib/utils` so a caller's class beats the component's default. A component that
   can't be adjusted from its call site gets forked instead of reused.

6. **Merge, never concatenate.** `cn()` is `clsx` + `extendTailwindMerge`. Template-
   literal class strings leave conflicting duplicates that resolve by source order.
   **A custom utility that collides with a Tailwind class group must be registered in
   the `extendTailwindMerge` config** (`rounded-cta` is the existing example) — without
   that, merging keeps both classes and the wrong one wins, silently.

7. **No inline `style={{}}` for static values.** Inline styles outrank every class, so
   `cn()` cannot override them and a caller's `className` does nothing. Reserve them
   for genuinely computed values: a drag transform, a percentage from state, a canvas
   coordinate.

8. **Prefer a scale step to an arbitrary value.** `w-[327px]` opts out of the spacing
   and type scale. Use the nearest step; if the value recurs, promote it to a token.

9. **Responsive and state belong in variants**, not stylesheets — `md:`, `hover:`,
   `focus-visible:`, `disabled:`, `data-[state=open]:`. Writing a media query in CSS
   for app chrome means it is in the wrong place.

10. **Don't hand-order classes.** The Prettier Tailwind plugin sorts `className`.

### When native CSS is correct

Four cases, all of which live in `globals.css`. Anything outside them belongs in a
`className`.

1. **Theme tokens** — the `@theme inline`, `:root` and `.dark` blocks. Definitions,
   never usage.
2. **DOM you don't own.** Third-party markup you cannot put a class on (React Flow's
   minimap and controls, react-day-picker's `.rdp-root`) has to be reached by
   descendant selector from the app's `.dark` class. **Leave a comment saying why the
   library's own API was insufficient** — without it the next person deletes the
   override as dead weight.
3. **Keyframes, pseudo-elements, vendor resets.** `@keyframes`, `::before` / `::after`
   decoration, `::-webkit-scrollbar`, the `input[type=number]` spinner. Tailwind can
   trigger an animation; it cannot define one.
4. **Base resets** — the `@layer base` block and nothing more. A global element
   selector you are tempted to add here is almost always a component concern in
   disguise.

Two things not to do. **Don't reach for `!important`**: if a class isn't winning, the
cause is an inline style or an unmerged duplicate, and both have fixes above. And
**don't use `@apply` to build component classes** — it recreates the stylesheet
indirection utilities exist to remove. It is legitimate only inside the four cases
above, to keep an un-ownable selector on the token vocabulary.

### Scope theming, don't leak it

The constructor renders end-user funnel content inside the admin app, and that content
must **not** inherit admin theming. `.funnel-preview` pins the original light-theme
token values for that subtree — including an explicit `color:` reset, since pinning
tokens alone does not undo an already-inherited color.

**Any token added to `:root` and `.dark` must also be pinned in `.funnel-preview`,** or
the app theme leaks into the preview and it stops showing what the customer will
actually see — the one job it has.

### Emotion is a runtime pipeline, not a styling option

Funnel designers author CSS in the Lexical editor. It arrives as `style` /
`desktop-style` / `mobile-style` attributes on funnel content, and
`widgets/quiz-constructor/common/utils/parser/get-css.ts` turns those strings into an
Emotion `css` object at runtime, wrapping the responsive halves in the `MOBILE` /
`DESKTOP` queries from `@/shared/lib/emotion`.

Tailwind cannot do this — it is a compile-time scanner with no knowledge of what a user
will type next week. So: **Emotion for user-authored funnel content, Tailwind for app
chrome.** Never introduce Emotion to style a constructor UI component. Don't add Sass
or new CSS Modules either — the `features/dnd` modules are a legacy island, and the
`sass` dependency is vestigial and imported by nothing.

## Working discipline (shared with `sart-funnel`)

These rules are adopted from the sibling repo `sart-funnel` (`c:\apps\sart-funnel`)
because they are about *how to work*, not about its stack. Apply them to new features
here. **Read "What does not carry over" at the end before importing anything else from
that file** — some of its rules are the exact opposite of this repo's.

### Verification — what "done" actually means

**Never report work as done, working, or verified without having run it and read the
output.** "The build passed" is not evidence the feature works — and in this repo it is
weaker still, because `next.config.ts` sets `eslint.ignoreDuringBuilds: true` and
`tsc-errors.txt` is a checked-in snapshot of pre-existing type errors. A green
`npm run build` proves almost nothing on its own.

Report `npm run lint`, `npx tsc --noEmit`, and the manual check **separately**, and
distinguish new failures from pre-existing ones.

### UI changes require looking at the UI

For any change that renders something, take a screenshot and **actually read the image**
before claiming it works. Check that text is legible, controls have their labels and real
dimensions, and nothing is blank, faded, collapsed, or overlapping. There is no test suite
here, so this *is* the verification step, not a supplement to it.

Two things specific to this repo make the screenshot mandatory rather than nice-to-have:

- **Funnel content renders inside admin chrome.** A component that looks right in the
  editor can still be leaking app theming into `.funnel-preview`, and only the picture
  shows it.
- **New top-level routes are swallowed by `src/middleware.ts`.** A first path segment that
  is not listed in `APP_ROUTES` is treated as a *project slug*, silently rewritten, and
  written into the `bevr_project` cookie — poisoning it for later requests. Add the segment
  to `APP_ROUTES` in the same change that adds the route, then load the URL to confirm.
  (Next.js also treats an `_`-prefixed folder as private and unroutable.)

### Tests, where they exist, must be able to fail

This repo has **no test framework** — do not assume Jest/Vitest/Playwright specs exist.
When you do add a check, every assertion has to be one a broken implementation would fail.
Before adding it, ask: *what change would make this red?* If the answer is "almost
nothing", it is worthless. Banned, because each passes on a blank page:

```ts
expect(hasFallback || hasContent).toBe(true);            // ✗ passes on anything
await expect(page.locator("body")).not.toContainText("Application error"); // ✗ "didn't crash"
expect(response.status()).toBe(200);                     // ✗ responded ≠ correct
```

Assert the real thing: the specific heading text, the expected number of options, that
clicking an option advances the funnel.

### Verify where it runs

`localhost` passing does not mean stage or prod works — they differ in env vars, build
mode, and remote data. After deploying, exercise the deployed URL the way a user would.
Vercel's immutable `*-<hash>.vercel.app` URLs are SSO-gated; test the project alias.

### Honesty rules

- Distinguish *"it typechecks"* from *"I verified the feature works"*. Say which you did.
- If something is unverified, blocked, or only partially checked, say so plainly instead
  of rounding up to success.
- If a check was written to accommodate a broken state, that is a bug report, not a pass.

### SOLID, applied to this codebase

- **Single responsibility** — `entities-v2/*/api/*` owns transport, widgets own
  composition, route handlers own HTTP and validation. Don't fetch directly from a
  component. When a file starts doing two jobs, split it before adding a third.
- **Open/closed** — extend by adding. New funnel blocks are entries in a registry
  (`widgets/quiz-page-constructor/const/registry.ts`); adding one must not mean editing
  every existing one.
- **Liskov substitution** — anything behind a shared contract must be interchangeable,
  including on hidden or pre-rendered surfaces.
- **Interface segregation** — components take the props they use, not a god-object.
  Prefer `option` / `selected` / `onSelect` over passing a whole model down.
- **Dependency inversion** — depend on the lower layer's abstraction. Features call
  `clientApi` / `handleClientResponse`, not raw `fetch`.

### A feature that can fail should be able to be seen failing

Shipping a flow that can fail in a way a user notices — a publish, a lock/unlock, an
external API call — means shipping a **log line on the failure path with a stable event
name**, not a `catch` that swallows. That name is an API: alerting selects on it, so
renaming it silently breaks whatever watches it.

Note the difference from `sart-funnel`: this repo has **no `src/shared/logger/` and no
`observability/alerts.yaml`**. Alert rules for this app live in the separate
`observability` repo. Do not copy that repo's `apply.sh --check` workflow or its
`sart-`-prefixed rule uids into this one without first checking what exists here.

**Set any threshold from measured data, never a guess** — and when measuring, never use a
window that touches `now` (log lines arrive late, so a trailing window always undercounts),
and remember Loki returns *no point* for an empty window rather than a zero.

### What does NOT carry over from `sart-funnel`

Its `CLAUDE.md` contains rules that are correct there and **wrong here**. Do not import:

| `sart-funnel` rule | Why it does not apply here |
|---|---|
| "Author in CSS Modules. **Never author a Tailwind class**." | Exactly inverted. This repo is **Tailwind v4 first** — see **Styling** above. Its CSS-Modules rule exists because its funnel engine ships Tailwind classes in its own dist; that constraint does not exist here. |
| TDD is non-negotiable; Vitest + RTL + Playwright; `npm run test:e2e` | No test framework is configured here and there is no `npm test`. The e2e tags (`@payment`, `@sandbox-payment`) and `e2e/env.ts` profiles are that repo's. |
| Every new component gets a Storybook story | No Storybook here. |
| `src/screens/` FSD layer | This repo uses `widgets/` for page compositions, plus the `entities/` (effector) and `entities-v2/` (fetch + Query) split, which sart-funnel has no equivalent of. |
| Each slice exposes a public API via `index.ts`; never deep-import | Only partially true here — most slices are deep-imported (`@/widgets/x/ui/y`). Follow the local convention of the slice you are editing rather than mass-adding barrels. |
| `service="sart-funnel"` selectors, `sart-` uid prefix, `observability/alerts.yaml` | Repo-specific identifiers. |
| "This is NOT the Next.js you know" (its `AGENTS.md`) | That banner is about its own pinned Next version. This repo's constraints are in `AGENTS.md` here. |

When the two guides disagree, **this file wins for this repo.**
