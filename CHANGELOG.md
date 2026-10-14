# Changelog

All notable changes to the Pipey project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.6.0] - 2026-02-18

### Added

#### Mobile optimization
- **Responsive layout**:
  - Sidebar hides on mobile
  - Bottom Navigation (5 tabs)
  - Touch-friendly elements (min 44px)
  - Safe Area support for iOS
- **"More" page** for the mobile menu

#### PWA (Progressive Web App)
- **manifest.json** with icons and shortcuts
- **Service Worker** with offline caching
- **Offline page** when the network is unavailable
- **Push notifications** (prepared)
- Install to Home Screen

#### Capacitor (iOS/Android)
- **capacitor.config.ts** with settings
- **SplashScreen**, StatusBar, Keyboard plugins
- **Push Notifications** plugin
- **Haptics** for tactile feedback
- Build scripts: `mobile:ios`, `mobile:android`

#### Documentation
- **MOBILE.md** — guide to building the apps
- Icon generation script

#### Styles
- Improved touch targets
- iOS safe-area-inset support
- Disabled zoom on input (iOS)
- Hidden scrollbar on mobile

---

## [0.5.0] - 2026-02-18

### Added

#### RBAC (Roles and teams)
- **Access levels**:
  - 👑 Owner (OWNER) — full access
  - 🛡️ Admin (ADMIN) — invite members
  - 👤 Member (MEMBER) — basic access
- **Team management**:
  - Invite by email
  - Change roles (owner only)
  - Remove members
- **RolesGuard** for endpoint protection
- **"Team" page** in the interface

#### API
- `GET /api/team` — list of members
- `POST /api/team/invite` — invitation
- `PATCH /api/team/:id/role` — change role
- `DELETE /api/team/:id` — remove member

---

## [0.4.0] - 2026-02-18

### Added

#### PDF generation
- **Quotes as PDF**:
  - Professional design
  - Company details from settings
  - Line items with prices and totals
  - Offer validity period
- **Invoices as PDF**:
  - Official invoice format
  - Bank details
  - Spaces for signatures and stamp
- **Download button** in the artifact card

#### Public booking page
- **Online booking form** without authentication:
  - Pick a date from available slots
  - Pick a time from the schedule
  - Client contact details
  - Booking comment
- **Automatic creation**:
  - Contact in the database
  - Deal in the pipeline
- **Responsive design** for mobile
- **URL**: `/book/:publicId`

#### API
- `GET /api/artifacts/:id/pdf` — download PDF
- `GET /api/book/:publicId` — booking information
- `POST /api/book/:publicId` — create a booking

### Dependencies
- Added Puppeteer for PDF generation

---

## [0.3.0] - 2026-02-18

### Added

#### AI assistant (Phase 3)
- **Draft reply generation**:
  - Conversation context analysis
  - Suggested reply with a confidence level
  - Button to insert into the input field
- **Action suggestions**:
  - Recommendations: send a quote, create a deal, etc.
  - Quick action buttons
- **Conversation summary**:
  - Brief summary of the conversation
  - Client needs
  - Sentiment assessment (positive/neutral/negative)
- **OpenRouter integration**:
  - Claude 3 Haiku support (default)
  - Fallback to GPT-3.5 Turbo
  - Result caching
- **AI panel in the Inbox**:
  - Collapsible panel below the messages
  - On-demand generation buttons

#### Organization settings (Phase 4)
- **Choose a workflow scenario**:
  - B2B sales
  - Services
  - Products
- **Company details**:
  - Name, TIN, KPP, OGRN
  - Legal and physical address
  - Director's full name
- **Bank details**:
  - Bank name, BIC
  - Current and correspondent account
- **Schedule settings**:
  - Working days
  - Business hours
  - Slot duration
- **AI settings**:
  - Enable/disable
  - Automatic suggestions

#### API
- `POST /api/ai/conversations/:id/draft-reply` — draft reply
- `POST /api/ai/conversations/:id/action-suggestions` — action suggestions
- `POST /api/ai/conversations/:id/summary` — conversation summary
- `GET /api/settings` — get settings
- `PATCH /api/settings` — update settings

#### UI
- "Settings" page with tabs
- AI panel in the Inbox

### Changed
- Added a "Settings" item to the side navigation
- Prisma schema: added the OrgSettings model

---

## [0.2.0] - 2026-02-18

### Added

#### Integrations (Phase 1 completed)
- Adapters for additional messengers: incoming webhooks, outgoing replies, attachments and automatic contact linking (experimental, see Known Limitations in the README)

#### Artifacts (Phase 2 — Documents)
- **Quotes**:
  - Create quotes with line items
  - Automatic total calculation
  - Linking to a client
  - Formatting for sending to chat
- **Invoices**:
  - Create invoices with a number and line items
  - Payment due date
  - Formatting for messengers
- **Booking links (Services)**:
  - Generate unique public links
  - Configure duration
  - Service description
- **Product cards**:
  - Name, description, price
  - Features
  - Product link

#### Artifacts UI
- "Documents" page in the navigation
- Tabs by artifact type
- Creation modals for each type
- Send artifacts to any chat
- Accompanying message when sending

#### API
- `POST /api/artifacts/quotes` — create a quote
- `POST /api/artifacts/invoices` — create an invoice
- `POST /api/artifacts/calendar-links` — booking link
- `POST /api/artifacts/product-cards` — product card
- `POST /api/artifacts/send` — send to chat
- `GET /api/artifacts` — list of artifacts
- `DELETE /api/artifacts/:id` — deletion

### Changed
- Additional messenger adapters moved from placeholders to experimental
- Added a "Documents" item to the side navigation

---

## [0.1.0] - 2026-01-20

### Added

#### Authentication
- Magic link authorization via email
- JWT tokens for sessions
- Automatic organization creation on first sign-in

#### Contacts
- CRUD operations for contacts
- Search contacts by name, email, phone
- Tags for contacts
- Notes on contacts

#### Sales pipelines
- Create and edit pipelines
- Customizable stages with color coding
- Drag & drop to move deals between stages

#### Deals
- Create deals linked to contacts
- Edit deals via a modal window
- Move deals between stages
- Comments on deals
- Display of the deal total at each stage

#### Integrations
- **Telegram Bot API**:
  - Connect Telegram bots by token
  - Support for multiple bots of the same type
  - Webhook for receiving incoming messages
  - Sending outgoing messages
  - Saving attachments (photos, documents, voice messages, video)
  - Automatic contact linking by name/username
- Prepared placeholders for additional messengers (coming soon)

#### Inbox
- Unified interface for all communication channels
- Conversation list with filtering by channel
- View message history
- Send replies to clients
- Unread message counter
- Mark conversations as read

#### Dashboard
- Summary of contacts, deals, messages
- Filtering by period (today, week, month, all time)
- Conversion funnel
- Recent activity

#### Infrastructure
- Docker Compose for local development:
  - PostgreSQL database
  - Redis for caching
  - MinIO for file storage
- Prisma ORM with migrations
- Encryption of integration credentials

#### UI/UX
- Modern glassmorphism design
- Fully Russian-language interface
- Responsive layout
- Skeleton loading
- Modal windows for editing

### Tech stack

#### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

#### Backend
- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- JWT authentication

### Known limitations

- The Telegram webhook requires ngrok in local development
- Integrations beyond Telegram are not yet implemented
- AI suggestions and auto-replies are in development
- Email campaigns are not implemented

### Configuration

You need to configure a `.env` file in the `backend/` folder:

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-32-byte-encryption-key
BACKEND_URL=https://your-ngrok-url.ngrok.io  # For the Telegram webhook
```

---

[0.1.0]: https://github.com/your-repo/pipey/releases/tag/v0.1.0
