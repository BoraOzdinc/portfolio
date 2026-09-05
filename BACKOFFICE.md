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

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test` (SQLite/domain/API tests and React interaction tests)

Tests use temporary databases, mocked mail/probes and mock frontend transport. No live payments, email or GitHub login are performed. Real GitHub OAuth round-trip, real Resend delivery and desktop/mobile browser layout remain release checks requiring configured services and an available frontend server. Development servers and production builds are not launched by tests.
