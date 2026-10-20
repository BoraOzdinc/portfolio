# Portfolio backoffice

`/backoffice` is a Turkish, single-admin operations workspace. The public portfolio keeps its existing routes. Backend source is TypeScript, run with `tsx`; Express serves the frontend output and API in one process. SQLite is accessed through Drizzle. No Convex, Clerk or Supabase account is required.

## Local setup

Use Node.js 24 LTS and pnpm. Install with `pnpm install --frozen-lockfile`. Copy `.env.example` to `.env` and set:

- `BETTER_AUTH_URL`: browser origin, e.g. `http://localhost:5173` locally and `https://ozdinc.dev` in production.
- `BETTER_AUTH_SECRET`: random secret of at least 32 characters.
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: your GitHub OAuth App. Its callback must exactly match `<BETTER_AUTH_URL>/api/auth/callback/github`.
- `ADMIN_GITHUB_ID`: your immutable numeric GitHub user ID, not your username. Other accounts are rejected both during OAuth and at every data API request.
- `DATABASE_PATH` and `BACKUP_PATH`: persistent writable paths outside the release directory in production.
- Existing Resend sender configuration and `BACKOFFICE_TO_EMAIL` for notifications. Set `BACKOFFICE_EMAIL_ENABLED=true` only when ready to send real mail.

No credentials are bundled into the frontend. Missing OAuth settings leave the backoffice API closed with 503; the public portfolio still works. The existing development command uses Vite's `/api` proxy and the TypeScript Express entrypoint. Restart an existing older server when adopting this entrypoint.

## Operator workflow

1. Create a project independently of the public portfolio. The optional portfolio slug is a reference only.
2. Add domain, VPS, mail package, API/SaaS or a custom service. Select one cost owner and any projects sharing it. A mail package can contain multiple addresses; credentials are not stored.
3. From the service, add a billing plan. Free/included services need no plan. Use the Finance tab for independent expenses and customer receivables.
4. Review calendar-generated payment records, then explicitly mark a record paid/received or cancel that individual record. The application records payments; it never initiates a money transfer.
5. Record actual domain renewal with “Yenilendi”. Paying an invoice does not prove that the registrar renewed the domain.
6. Add HTTP/HTTPS monitors, inspect status/history, or pause them. Target URL and success rules are immutable once created; add a new monitor for a changed target.

Monthly/yearly equivalent budget, upcoming liabilities and completed cash movements are separate. Currency totals never combine TRY, USD and EUR. A shared resource is counted once, against its cost owner. Changing that owner after a billing plan exists is rejected to preserve history.

Billing periods use the original calendar anchor, including month-end and leap-year clamping. On creation, the first period is generated; subsequent periods open 30 days in advance, even if an earlier invoice is unpaid. A plan/period unique index prevents duplicates. Catch-up is bounded to 100 periods per plan per tick. Price/frequency changes show and apply at the first ungenerated period; already-created invoices are immutable. Cancelling a plan or service stops generation but retains existing liabilities. Archiving a project does not cancel contracts or pause monitors.

## Monitoring and notifications

A 30-second scheduler picks due work. Each monitor runs approximately every 15 minutes, with at most five concurrent probes across scheduled and manual requests. Manual checks have a one-minute cooldown. GET/HEAD only, standard HTTP(S) ports, no custom credentials. Each connection resolves and validates DNS, rejects private/reserved addresses, pins the selected IP, and revalidates every redirect. A complete probe including DNS and redirects has a 10-second deadline.

Two consecutive failed samples open an incident; recovery closes it. A gap longer than 20 minutes is stale and breaks the consecutive-failure chain. Uptime is the successful fraction of observed checks, accompanied by the sample count. Unobserved time is not classified as successful. Raw samples are retained 90 days. This is single-location sampling, not an SLA measurement or an external watchdog for the VPS itself.

30/14/7/1-day reminders use Europe/Istanbul calendar dates. Daily reminders are combined after 09:00 into one delivery; reminders added later go in the next digest. Incidents/recoveries use individual deliveries. An outbox stores delivery state, backs off on failure and uses Resend idempotency keys. Provider idempotency is time-limited, so the outbox cannot promise exactly-once external delivery after an arbitrarily long crash. Disabled email leaves notifications and deliveries in the panel until enabled. Expired domains and overdue payments remain visible regardless of email delivery.

## VPS release and backups

Deploy one application process behind an HTTPS reverse proxy. Set `HOST=127.0.0.1`, `PORT=3001`, `DATABASE_PATH=/var/lib/portfolio/backoffice.sqlite`, `BACKUP_PATH=/var/backups/portfolio`, and the production `BETTER_AUTH_URL`. Create these directories owned by the service user with mode 700. Allow the proxy to reach the app, but do not expose port 3001 directly. Origin checks are enforced for all custom API mutations; use the exact same browser origin for frontend and API.

`deploy/portfolio.service` is a systemd template for `/opt/portfolio` and user `portfolio`. Adapt the paths and installed Node location. Do not start a second process against this database: scheduler ownership is single-process. Review and run `pnpm build` as part of an explicitly requested release, then start/restart the service. This implementation does not deploy or change DNS/provider panels. Existing Vercel inquiry endpoint remains available, but the full SQLite backoffice requires the persistent VPS runtime.

Application migrations under `server/backoffice/migrations` run on startup. Better Auth uses its own built-in SQLite migration mechanism when OAuth is configured. Back up the current database before a release that changes either schema; keep both the previous application release and matching database backup for rollback.

`pnpm db:backup` takes a consistent SQLite online backup. The scheduler also creates a daily backup, validates integrity and atomically publishes it. Backups older than 14 days are removed. These local copies do **not** protect against VPS/disk loss; copy them to separate storage before relying on disaster recovery.

Restore into a NEW file; existing files are never overwritten:

```sh
pnpm db:restore /var/backups/portfolio/backoffice-YYYY-MM-DD.sqlite /var/lib/portfolio/restored.sqlite
```

Stop the service before changing `DATABASE_PATH` to the restored file. Retain the original database and its WAL files as a recovery point. Verify the restored application, then restart the service with the chosen database. Never copy only an active SQLite file without its WAL; use the backup command.

## Isolated Docker deployment

`deploy/compose.yaml` runs the application as a non-root user, with a read-only root filesystem, a 512 MiB memory limit, a dedicated network, and host port `127.0.0.1:3100`. It does not use the existing MelsaShopp ports 3000/3001 or its database/network. Only `/var/lib/portfolio` and `/var/backups/portfolio` are writable persistent mounts; create both with owner `1000:1000` and mode 700.

Store production configuration in the ignored, mode-600 `.env.production`. Compose overrides host/port/database/backup paths for the container. Set the public `BETTER_AUTH_URL` and enable notification email explicitly. Build and start from the repository root:

```sh
docker compose -f deploy/compose.yaml build app
docker compose -f deploy/compose.yaml up -d --no-build app
docker compose -f deploy/compose.yaml ps
docker exec portfolio_app node --import tsx server/backoffice/maintenance.ts backup
```

The optional `tunnel` profile reads `TUNNEL_TOKEN` from ignored `.env.tunnel`. Configure its published application origin as `http://app:3001`; then start with `docker compose -f deploy/compose.yaml --profile tunnel up -d tunnel`. Create/authorize the tunnel and DNS cutover separately; a healthy container alone is not proof of public reachability.

Before subsequent releases, back up SQLite and tag the running image as a rollback image. Retain the old image and matching database backup. Before the first VPS cutover, both `ozdinc.dev` and `www.ozdinc.dev` were CNAMEs to `497388760d5c47e6.vercel-dns-017.com`, DNS-only, TTL 600 (observed 2026-09-05). Keep the Vercel deployment available for DNS rollback. Do not change unrelated subdomains or mail DNS records.

### Live cutover: 2026-09-05

- Both hostnames now use the proxied `portfolio-backoffice` tunnel (`97ebdc6b-1a55-4717-b5e1-c68db2cad3cf`), with origin `http://app:3001`. The application redirects `www` to the configured HTTPS auth origin, preserving path and query.
- The VPS checkout is `/opt/portfolio`, branch `codex/portfolio-backoffice`. Pull/build/recreate that branch for future releases; Git pushes alone do not deploy to the VPS.
- Vercel's Git repository connection was removed. Its project, configuration and old deployment remain available for rollback; the GitHub repository was not deleted.
- Real GitHub sign-in, desktop/mobile rendering, public unauthenticated API rejection, www redirect, SQLite backup/restore and unchanged MelsaShopp endpoints were verified. Resend accepted a message to its official delivery-simulation address; this does not prove delivery to a personal inbox.
- Application code release: `d6fbfc9`. Local disaster-recovery copies still need separate off-site storage.

## Personal budget

`/backoffice?view=budget` (sidebar: “Kişisel bütçe”) is separate from project finance; nothing here touches project plans or payments. Everything is TRY, stored in kuruş.

- **Gelir ve giderler:** salary, rent and other items, monthly/yearly/once, with optional end date. Card purchases are not entered; the card payment is the expense, so nothing is counted twice.
- **Kredi kartları:** one statement per card per month. Minimum is fixed when the statement is saved: the card's own rate, otherwise BDDK's 20 % (limit ≤ 100.000 TL) / 40 % (above), per the 1 October 2026 rule. Payments are recorded amounts only.
- **Hesaplar ve yatırımlar:** account balances are entered by hand. Each purchase is its own lot; lots with the same asset name are summed with a weighted average cost. USD/EUR prices come from TCMB's ForexBuying every 6 hours (overwriting a manual value); gold and anything else is priced by hand.
- **Ledger:** 12 months, minimum vs full card payment. The projected balance starts from today's account total and adds only cash that has not moved yet: items later this month, future months, and unpaid statements (including overdue ones). Months without a statement show no card payment.

- **Hareketler:** dated actual entries. One linked to a planned item replaces that item's plan for its month (several links are summed); unlinked ones are extras. Month detail shows plan vs actual and “Plana göre” variance. Past-dated entries are assumed to be in the account balance already; only future-dated ones move the projection. Deleting an item keeps its entries as unplanned.

Net worth = accounts + priced investments − unpaid statement balances. Unpriced assets are listed, not guessed.

Migration `0001` only adds tables. Take the usual SQLite backup before deploying it.

## Work log

`/backoffice?view=work` (sidebar: “Mesai”). Office exit is signed on paper at the office; this log is for days that differ from the default 18:00 exit and, mainly, for work outside the office, which has no signature. A day without entries means a normal 18:00 exit.

- **Entry:** a clock range (office: planned exit → actual exit, early exit counts 0; remote: start → end, wraps midnight) or a declared duration only (travel, unclear hours). Any number per day, editable later.
- **Payment status:** each entry is “Bekliyor” until marked paid against a payslip month (bulk select → “Ödendi işaretle”). Unpaid hours across all months are shown with expected net pay = net salary ÷ 225 × 1,5 per hour, matching the August 2026 payslip (65.000 → 433,33 TL/h). BES (~3 % of gross) is not subtracted. Net salary lives in `settings.netSalary` (kuruş).
- **Excel’e aktar:** `GET /api/backoffice/work/export?month=YYYY-MM` returns `mesai-YYYY-MM.xlsx` in the employer declaration layout: title row, Tarih (date cell), Gün, Fazla Mesai Süresi (`[h]:mm` duration cell), Birim, Nedeni, Saat Aralığı, and a `SUM` total. Written by the dependency-free `server/backoffice/xlsx.ts` (single sheet, stored zip, inline strings, so text is never evaluated as a formula); checked with openpyxl and `unzip -t`.
- Migration `0004` rebuilds `workSessions` to make times nullable. drizzle-kit generated an INSERT selecting the new columns from the old table; it was corrected by hand to select `NULL` and checked against a populated database.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test` (SQLite/domain/API tests and React interaction tests)

Tests use temporary databases, mocked mail/probes and mock frontend transport. No live payments, email or GitHub login are performed. Real GitHub OAuth round-trip, real Resend delivery and desktop/mobile browser layout remain release checks requiring configured services and an available frontend server. Development servers and production builds are not launched by tests.

### Homepage release: 2026-09-12

- The deployed checkout now tracks `codex/homepage-redesign-release`. Homepage code commit: `ba180d5`. This branch includes the existing backoffice; do not deploy the older `main` checkout over it.
- Validation passed: typecheck, lint, 14 backend tests, 4 React tests, and the production build. Public JS/CSS hashes matched the local build. Desktop and 390 px mobile rendering, menu/contact navigation, required-field validation, and project navigation were exercised in a browser.
- To avoid a dependency rebuild on the space-constrained VPS, the frontend was built locally from this branch. Image `portfolio-backoffice:home-ba180d5` layers only the resulting `dist` over the previous runtime; backend code, dependencies, environment, and data mounts remain unchanged. The standard repository Dockerfile remains valid for a future full build.
- Deployed image is also tagged `portfolio-backoffice:latest`. Release files and the small image recipe are retained at `/opt/portfolio-releases/home-ba180d5`.
- Rollback image: `portfolio-backoffice:rollback-20260912-before-home`. Pre-release SQLite backup: `/var/backups/portfolio/backoffice-2026-09-12.sqlite`. This release contains no database changes.
- To roll back the UI, tag that rollback image as `portfolio-backoffice:latest`, then run `docker compose -f deploy/compose.yaml up -d --no-build --no-deps app` from `/opt/portfolio`. No database restore is needed for this frontend-only release.
- After deployment the container was healthy with zero restarts, public routes returned 200, unauthenticated backoffice API requests returned 401, and the www redirect preserved path/query with 308. Existing MelsaShopp containers and endpoints remained available. Authenticated OAuth and live email delivery were not re-exercised.

### Dark homepage revision: 2026-09-12

- Supersedes the light homepage above. Code commit `68c08ce` restores the `ozdinc.dev_` wordmark, original typeface, and dark palette; removes the portrait; reduces the headline/gallery scale; adds restrained entrance, glow, cursor, menu, and hover effects.
- Image `portfolio-backoffice:dark-68c08ce` is tagged `latest`. Release files: `/opt/portfolio-releases/dark-68c08ce`. Immediate rollback image: `portfolio-backoffice:rollback-before-dark-68c08ce`; the original pre-redesign rollback is also retained. Use the same tag-and-compose rollback procedure above.
- Backend/runtime/data are unchanged. Build, typecheck, lint, and all 18 tests passed. Public asset hashes matched the build; desktop and 390 px mobile rendering, photo removal, menu/contact navigation, sticky header, and reduced-motion suppression were verified. The container is healthy with zero restarts; public project, backoffice API authorization, and both MelsaShopp endpoints passed checks.

### Public project pages: 2026-09-12

- Commits `728f475` and `050e92f` extend the dark theme to the project index and detail routes, add shared public navigation/footer, and use a native modal screenshot viewer with Escape dismissal and focus restoration. Backoffice remains outside the public layout.
- Current image: `portfolio-backoffice:projects-050e92f` (also `latest`); release files: `/opt/portfolio-releases/projects-050e92f`. Rollback to the preceding dark homepage: `portfolio-backoffice:rollback-before-projects-728f475`, using the same tag-and-compose procedure. Backend, dependencies, and data mounts are unchanged.
- Typecheck, lint, production build, and the existing 18 tests passed. Public index, all five project routes, business-card, and backoffice HTML returned 200; public asset hashes matched the build. Browser checks covered desktop/mobile layout, screenshot opening and Escape/focus behavior, next-project navigation, project-to-home contact anchors, and projects with and without screenshots. Print emulation confirmed the unchanged 89 x 57 mm bleed dimensions and hidden header/footer. No physical print or new OAuth/email flow was performed.

### Personal budget release: 2026-10-20

- Commit `06c8474` (branch `codex/personal-budget`, now the `/opt/portfolio` checkout). Adds migration `0001` (new tables only) and backend code; no dependency changes.
- Image `portfolio-backoffice:budget-06c8474` (also `latest`) layers the local `dist`, `server` and `shared` over `homepage-eb8e15f`. Release files: `/opt/portfolio-releases/budget-06c8474`.
- Rollback image: `portfolio-backoffice:rollback-before-budget-06c8474`, same tag-and-compose procedure. The older code ignores the extra tables, so no database restore is needed. Backups: `/var/backups/portfolio/backoffice-2026-10-20.sqlite` (before migration, taken at 00:00) and `after-budget-06c8474.sqlite`.
- Verified: container healthy, migration applied, TCMB USD/EUR prices fetched on first tick, public routes 200, unauthenticated budget API 401, public asset hash matches the build, MelsaShopp containers untouched. Authenticated UI was not exercised.

### Actuals release: 2026-10-20

- Commit `a943bc2`. Migration `0002` adds the `transactions` table only. Image `portfolio-backoffice:actuals-a943bc2` (also `latest`) layers over `budget-06c8474`; release files `/opt/portfolio-releases/actuals-a943bc2`.
- Pre-migration backup: `/var/backups/portfolio/pre-actuals-a943bc2.sqlite`. Rollback image: `portfolio-backoffice:rollback-before-actuals-a943bc2`; older code ignores the extra table.
- Verified: healthy container, table created, existing budget rows intact, public routes 200, unauthenticated budget API 401, asset hash matches. Authenticated UI not exercised.

### Work log release: 2026-10-20

- Commit `8f86a4a`. Migration `0003` adds `workSessions` only. Image `portfolio-backoffice:work-8f86a4a` (also `latest`) layers over `actuals-a943bc2`; release files `/opt/portfolio-releases/work-8f86a4a`.
- Pre-migration backup `/var/backups/portfolio/pre-work-8f86a4a.sqlite`; rollback image `portfolio-backoffice:rollback-before-work-8f86a4a` (older code ignores the table).
- Verified: healthy container, table created, existing rows intact, public routes 200, unauthenticated work API and export 401, asset hash matches. Authenticated UI and a real Excel open were not exercised.

### Work log revision: 2026-10-20

- Commit `0cc3d7d`. Image `portfolio-backoffice:work2-0cc3d7d` (also `latest`) over `work-8f86a4a`; release files `/opt/portfolio-releases/work2-0cc3d7d`. Pre-migration backup `/var/backups/portfolio/pre-work2-0cc3d7d.sqlite`; rollback image `portfolio-backoffice:rollback-before-work2-0cc3d7d`. Rolling back needs the backup restored, because the old code requires non-null times.
- Imported the 15 declared entries (52,5 h, Aug–Oct) from the owner's declaration sheet as unpaid durations, and set net salary 65.000 TL. The August export rendered on production matches the original sheet.

### xlsx export: 2026-10-20

- Commit `3ae6659`, code only. Image `portfolio-backoffice:xlsx-3ae6659` (also `latest`) over `work2-0cc3d7d`; rollback image `portfolio-backoffice:rollback-before-xlsx-3ae6659`, no database step. September exported from production opened in openpyxl with typed dates, durations and the SUM formula.
