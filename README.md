# Pipey

> 🚧 **Early beta / work in progress.** This is an ambitious full-stack CRM built as a portfolio project. The architecture and core flows are in place, but it is NOT production-ready — see **Known Limitations** below.

**Pipey** is a lightweight messenger CRM. It brings conversations from Telegram into a single inbox, links them to contacts and deals on a visual pipeline, and adds a layer of automation on top: AI reply suggestions, PDF quotes and invoices, a public booking page, and analytics. The frontend ships as a PWA with an experimental mobile build via Capacitor.

The product is built around one idea: connect a channel, see your conversations, take an action, and reply to the customer — without a steep learning curve.

---

## Known Limitations

Pipey is honest about its current state. Before relying on it for anything serious, be aware that:

- **No automated tests yet.** There is no meaningful test suite. Jest is configured in the backend, but there are zero `*.spec.ts` / test files in either `backend/` or `frontend/`. Treat all behavior as unverified.
- **Telegram is the only finished channel.** Incoming Telegram webhooks are processed end to end (contact upsert, conversation, message persistence). The code also contains adapters for other messengers; their queue handlers in `queues/processors/webhook.processor.ts` are placeholders that only log, so treat them as unfinished.
- **Email magic-link delivery is a TODO.** Authentication itself works (passwordless magic-link tokens are issued and verified), but actually **sending the email is stubbed** — in development the link is returned in the API response (`// TODO: Send email with magic link` in `auth/auth.service.ts`). There is no SMTP/email provider wired up.
- **Observability is wired but not fully integrated.** Prometheus, Grafana, and Sentry/GlitchTip are defined in `docker-compose.monitoring.yml` / `docker-compose.sentry.yml`, and a `/metrics` endpoint plus a Sentry `instrument.ts` exist, but the dashboards, alerting, and end-to-end tracing are not finished. Sentry/GlitchTip is disabled unless `SENTRY_DSN` is set.
- **The mobile (Capacitor) build is experimental and untested.** A `capacitor.config.ts` and `mobile:*` scripts exist and the app can be exported as a static bundle, but native iOS/Android builds have not been validated.
- **Not hardened for production.** Default secrets in example files, in-memory AI response caching, and unfinished infrastructure mean this should be treated as a development/portfolio project, not a deployable product.

---

## Features

- **Unified inbox** — one place for your Telegram conversations, linked to contacts and deals.
- **Contacts** — a lightweight contact database, automatically populated from incoming conversations and the booking form.
- **Deals & pipeline** — a visual, customizable pipeline with stages; drag deals through your sales process.
- **AI reply suggestions** — draft replies, suggested next actions (send quote, send invoice, send booking link, create deal, etc.), and conversation summaries, powered by [OpenRouter](https://openrouter.ai). The default product model is `anthropic/claude-3-haiku` with an automatic fallback model. When no API key is configured, the service degrades gracefully to mock responses.
- **PDF artifacts** — generate quotes and invoices as PDFs, plus reusable product cards and calendar links.
- **Public booking page** — share a public link; customers pick a slot from your configured working hours, and a contact + deal are created automatically. No authentication required for the customer.
- **Analytics** — dashboards over conversations, deals, and pipeline performance.
- **Team & RBAC** — organizations, memberships, and roles (`OWNER`, plus additional roles) with an audit log.
- **PWA + mobile** — installable progressive web app, with an experimental Capacitor wrapper for iOS/Android and web push notifications (VAPID).

---

## Architecture

Pipey is a monorepo with a NestJS backend and a Next.js frontend, backed by PostgreSQL, Redis, and MinIO, and orchestrated with Docker Compose.

```
                  ┌──────────────────────────────┐
                  │                              │
   Telegram ─────▶│   NestJS API (backend)       │
                  │   webhooks → BullMQ queues   │
                  │                              │
                  │   Auth · Channels · Inbox    │
                  │   Contacts · Deals/Pipeline  │
   Next.js  ◀────▶│   AI · Artifacts · Booking   │
   (PWA/    REST  │   Analytics · Team/RBAC      │
   Capacitor)     │                              │
                  └───┬──────────┬──────────┬────┘
                      │          │          │
                 PostgreSQL    Redis      MinIO
                 (Prisma)    (BullMQ)   (S3 files)
```

- **Incoming messages** arrive via per-channel webhook endpoints, which enqueue jobs onto a Redis-backed **BullMQ** queue (`webhook-processing`). Workers process them asynchronously with retries and backoff.
- **AI and PDF generation** are designed to run as background jobs as well, keeping request latency low.
- **Files** (generated PDFs, attachments) are stored in **MinIO** (S3-compatible).
- **Data** is modeled in **Prisma** over **PostgreSQL** (organizations, users, memberships, channels, conversations, messages, contacts, pipelines, stages, deals, artifacts, AI suggestions, audit logs, push subscriptions).

---

## Tech stack

### Backend
- **NestJS** (TypeScript)
- **Prisma** ORM over **PostgreSQL**
- **Redis** + **BullMQ** for queues and background jobs
- **MinIO** (S3-compatible object storage) for files
- JWT auth with passwordless magic links
- Optional **Sentry** / **GlitchTip** error tracking and a Prometheus `/metrics` endpoint

### Frontend
- **Next.js** (App Router, TypeScript)
- **Tailwind** CSS
- Zustand for state management
- PWA support, with an experimental **Capacitor** build for iOS/Android

### AI
- **OpenRouter** as the model gateway (default model `anthropic/claude-3-haiku`)

### Infrastructure
- **Docker** & **Docker Compose**
- Optional **Prometheus** + **Grafana** monitoring stack
- Optional **Sentry** / **GlitchTip** for error tracking

---

## Quick start

### Requirements
- Node.js >= 18
- npm >= 9
- Docker & Docker Compose

### 1. Configure environment

```bash
cp .env.example .env
```

Then edit `.env` and set real values — at minimum `POSTGRES_PASSWORD`, `JWT_SECRET`, `MAGIC_LINK_SECRET`, `ENCRYPTION_KEY`, and `MINIO_SECRET_KEY`. The channel token (`TELEGRAM_BOT_TOKEN`) and `OPENROUTER_API_KEY` are optional — the app runs without them, and AI features fall back to mock responses when no key is set.

### 2. Run the full stack with Docker Compose (recommended)

Builds and runs the entire stack (frontend, backend, PostgreSQL, Redis, MinIO) from local code:

```bash
./docker.sh start
# or
make start
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **MinIO Console**: http://localhost:9001

Useful commands:

```bash
./docker.sh dev       # infrastructure only (PostgreSQL, Redis, MinIO)
./docker.sh stop      # stop everything
./docker.sh status    # service status
./docker.sh logs-f    # follow logs
./docker.sh help      # full command list
```

See [DOCKER.md](DOCKER.md) for details.

### 3. Local development (with hot reload)

Run the infrastructure in Docker and the app processes locally:

```bash
# 1. Start infrastructure only
./docker.sh dev        # or: make dev

# 2. Backend (in a separate terminal)
cd backend
npm install
npx prisma migrate dev
npm run start:dev

# 3. Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MinIO Console: http://localhost:9001

### Database

```bash
make db-migrate      # apply migrations
make prisma-studio   # open Prisma Studio
make db-reset        # reset the database (destructive!)
```

### Optional: monitoring & error tracking

```bash
docker compose -f docker-compose.monitoring.yml up -d   # Prometheus + Grafana
docker compose -f docker-compose.sentry.yml up -d       # GlitchTip (Sentry-compatible)
```

Note: these are wired into Compose but not fully integrated — see **Known Limitations**.

### Mobile (experimental)

```bash
cd frontend
npm run mobile:build      # static export + Capacitor sync
npm run mobile:ios        # open the iOS project
npm run mobile:android    # open the Android project
```

See [frontend/MOBILE.md](frontend/MOBILE.md). The mobile build is experimental and untested.

---

## Project structure

```
pipey/
├── backend/                  # NestJS API
│   ├── prisma/               # Prisma schema & migrations
│   └── src/
│       ├── auth/             # passwordless magic-link auth, JWT
│       ├── channels/         # messenger integrations
│       ├── conversations/    # unified inbox
│       ├── contacts/         # contact database
│       ├── deals/            # deals
│       ├── pipelines/        # pipelines & stages
│       ├── ai/               # OpenRouter-backed AI suggestions
│       ├── artifacts/        # PDF quotes/invoices, product cards, calendar links
│       ├── booking/          # public booking page endpoints
│       ├── analytics/        # dashboards & metrics
│       ├── team/             # organizations, memberships, RBAC
│       ├── settings/         # org settings
│       ├── push/             # web push notifications
│       ├── queues/           # BullMQ processors (webhook, ai, pdf, message)
│       └── common/           # guards, interceptors, health, metrics, logger
├── frontend/                 # Next.js (App Router) PWA
│   ├── app/
│   │   ├── (dashboard)/      # inbox, pipeline, contacts, analytics, team, settings…
│   │   ├── auth/             # magic-link sign-in / verify
│   │   ├── book/             # public booking page
│   │   └── onboarding/       # first-run onboarding
│   ├── components/           # shared UI (AiPanel, MobileNav, pipeline, analytics…)
│   ├── lib/                  # API client & helpers
│   └── capacitor.config.ts   # experimental mobile config
├── docker/                   # Docker service configs (postgres, redis, minio, nginx)
├── docker-compose.yml        # main stack
├── docker-compose.monitoring.yml  # Prometheus + Grafana (optional)
├── docker-compose.sentry.yml      # GlitchTip / Sentry (optional)
├── docker.sh                 # convenience CLI
└── Makefile                  # convenience targets
```

---

## License

[MIT](LICENSE) © 2026 Alexander Zabrodin
